import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({
  path: "/paymob-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const passedHmac = url.searchParams.get("hmac");
      if (!passedHmac) {
        return new Response("Missing HMAC", { status: 400 });
      }

      const body = await request.json();
      const obj = body.obj; // Paymob nests the payload inside `obj`

      const secret = process.env.PAYMOB_HMAC_SECRET;
      if (!secret) {
        console.error("Missing PAYMOB_HMAC_SECRET");
        return new Response("Internal Error", { status: 500 });
      }

      const keys = [
        "amount_cents", "created_at", "currency", "error_occured",
        "has_parent_transaction", "id", "integration_id", "is_3d_secure",
        "is_auth", "is_capture", "is_refunded", "is_standalone_payment",
        "is_voided", "order.id", "owner", "pending", "source_data.pan",
        "source_data.sub_type", "source_data.type", "success"
      ];

      const concatenatedString = keys.map((key) => {
        const keyParts = key.split(".");
        let val = obj;
        for (const part of keyParts) {
          val = val !== undefined && val !== null ? val[part] : "";
        }
        if (typeof val === "boolean") return val ? "true" : "false";
        return val !== undefined && val !== null ? val.toString() : "";
      }).join("");

      const encoder = new TextEncoder();
      const keyBuf = encoder.encode(secret);
      const dataBuf = encoder.encode(concatenatedString);

      const cryptoKey = await crypto.subtle.importKey(
        "raw", keyBuf, { name: "HMAC", hash: "SHA-512" }, false, ["sign"]
      );

      const signature = await crypto.subtle.sign("HMAC", cryptoKey, dataBuf);
      const calculatedHmac = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");

      if (calculatedHmac.toLowerCase() !== passedHmac.toLowerCase()) {
        console.error("Invalid HMAC signature received from Paymob");
        console.debug("Passed HMAC:", passedHmac);
        console.debug("Calculated HMAC:", calculatedHmac);
        return new Response("Invalid HMAC", { status: 401 }); // Unauthorized
      }

      // Valid webhook payload! Call our internal mutation.
      await ctx.runMutation(internal.payments.processWebhookCallback, {
        orderId: obj.order.id.toString(),
        success: obj.success === true,
        merchantOrderId: obj.order.merchant_order_id,
      });

      return new Response("OK", { status: 200 });
    } catch (e) {
      console.error("Webhook processing error:", e);
      return new Response("Error", { status: 500 });
    }
  }),
});

export default http;
