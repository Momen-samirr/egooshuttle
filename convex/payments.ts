import { v } from "convex/values";
import { action, mutation, internalMutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal, api } from "./_generated/api";

export const initiatePayment = action({
  args: {
    bookingIds: v.array(v.id("bookings")),
    method: v.union(v.literal("card"), v.literal("instapay"), v.literal("cash")),
    totalAmount: v.number(),
  },
  handler: async (ctx, args) => {
    // We only process via Paymob now (Online Card). Cash / InstaPay can be bypassed or just rejected if strict.
    // For now, if someone passes cash we bypass, otherwise Paymob.
    if (args.method === "cash" || args.method === "instapay") {
      return { success: true, transactionId: `${args.method.toUpperCase()}-${Date.now()}` };
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
    const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID;

    if (!PAYMOB_API_KEY || !PAYMOB_INTEGRATION_ID) {
      console.warn("Paymob environment variables missing. Falling back to simulation.");
      return {
        success: true,
        transactionId: `TXN-CARD-${Math.floor(Math.random() * 1000000)}`,
        paymentKey: "SIMULATED_KEY",
      };
    }

    // Step 1: Authentication
    const authRes = await fetch("https://accept.paymob.com/api/auth/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: PAYMOB_API_KEY }),
    });
    if (!authRes.ok) {
      const errorText = await authRes.text();
      console.error("Paymob Auth Failed:", errorText);
      if (authRes.status === 429) {
        console.warn("Falling back to simulation due to Paymob 429 Rate Limit.");
        return {
          success: true,
          transactionId: `TXN-CARD-SIM-${Math.floor(Math.random() * 1000000)}`,
          paymentKey: "SIMULATED_KEY",
          iframeId: "SIMULATED_IFRAME_ID",
        };
      }
      throw new Error(`Paymob auth failed: ${authRes.status} ${errorText}`);
    }
    const authData = await authRes.json();
    const authToken = authData.token;

    // Step 2: Order Registration
    const amountCents = Math.round(args.totalAmount * 100).toString();
    const orderRes = await fetch("https://accept.paymob.com/api/ecommerce/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: authToken,
        delivery_needed: "false",
        amount_cents: amountCents,
        currency: "EGP",
        merchant_order_id: `BOOK-${args.bookingIds[0]}-${Date.now()}`,
        items: [],
      }),
    });
    if (!orderRes.ok) {
      const errorText = await orderRes.text();
      console.error("Paymob Order Failed:", errorText);
      throw new Error(`Paymob order registration failed: ${orderRes.status} ${errorText}`);
    }
    const orderData = await orderRes.json();
    const orderId = orderData.id;

    // Step 3: Payment Key Request
    const firstName = identity.name?.split(" ")[0] || "NA";
    const lastName = identity.name?.split(" ").slice(1).join(" ") || "NA";
    const email = identity.email || "NA";

    const paymentKeyRes = await fetch("https://accept.paymob.com/api/acceptance/payment_keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: authToken,
        amount_cents: amountCents,
        expiration: 3600,
        order_id: orderId,
        billing_data: {
          apartment: "NA",
          email: email,
          floor: "NA",
          first_name: firstName,
          street: "NA",
          building: "NA",
          phone_number: "NA",
          shipping_method: "NA",
          postal_code: "NA",
          city: "NA",
          country: "EG",
          last_name: lastName || "NA",
          state: "NA",
        },
        currency: "EGP",
        integration_id: PAYMOB_INTEGRATION_ID,
      }),
    });
    if (!paymentKeyRes.ok) {
      const errorText = await paymentKeyRes.text();
      console.error("Paymob Payment Key Failed:", errorText);
      throw new Error(`Paymob payment key request failed: ${paymentKeyRes.status} ${errorText}`);
    }
    const paymentKeyData = await paymentKeyRes.json();

    const rawIframeId = process.env.PAYMOB_IFRAME_ID || "";
    // If user pasted the whole URL like https://accept.paymob.com/api/acceptance/iframes/1004785?payment_token=...
    // extract just the numeric ID, e.g., 1004785
    let iframeId = rawIframeId;
    const match = rawIframeId.match(/\/iframes\/(\d+)/);
    if (match) {
      iframeId = match[1];
    } else if (rawIframeId.includes("=")) {
      // rough fallback if they just pasted gibberish
      iframeId = rawIframeId.replace(/\D/g, "");
    }

    return {
      success: true,
      transactionId: orderId.toString(),
      paymentKey: paymentKeyData.token, // Used for iframe!
      iframeId: iframeId || "", // Frontend uses this to build the URL
    };
  },
});

export const getIntentStatus = query({
  args: { intentId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.intentId) return null;
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const intent = await ctx.db.get(args.intentId as Id<"paymentHistory">);
    if (!intent) return null;

    // Security check: only the user who created it can view it
    if (intent.userId !== (await ctx.db.query("appUsers").withIndex("by_tokenIdentifier", q => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique())?._id) return null;

    return {
      status: intent.status,
      failureReason: intent.failureReason,
    };
  },
});


export const processWebhookCallback = internalMutation({
  args: {
    orderId: v.string(),
    success: v.boolean(),
    merchantOrderId: v.string(),
  },
  handler: async (ctx, args) => {
    // merchantOrderId is formatted as intent_<intentId>_<timestamp>
    const parts = args.merchantOrderId.split("_");
    if (parts.length >= 2 && parts[0] === "intent") {
      const intentId = parts[1] as Id<"paymentHistory">;
      
      const intent = await ctx.db.get(intentId);
      if (!intent) return;
      
      if (args.success) {
         // Handoff to bookingDays logic to finalize creation
         await ctx.db.patch(intentId, { paymobOrderId: args.orderId, updatedAt: new Date().toISOString() });
         const { executePaymentConfirmation } = await import("./bookingDays");
         await executePaymentConfirmation(ctx, intentId, args.orderId);
      } else {
         await ctx.db.patch(intentId, { status: "failed", failureReason: "Paymob declined or failed", updatedAt: new Date().toISOString() });
      }
    }
  },
});

export const processClientFailsafe = action({
  args: {
    hmac: v.string(),
    queryData: v.any(), // Record<string, string>
  },
  handler: async (ctx, args) => {
    // Manually reconstruct query parameters for HMAC validation as per Paymob Docs
    const secret = process.env.PAYMOB_HMAC_SECRET;
    if (!secret) throw new Error("Missing HMAC SECRET");

    const keys = [
      "amount_cents", "created_at", "currency", "error_occured", "has_parent_transaction",
      "id", "integration_id", "is_3d_secure", "is_auth", "is_capture", "is_refunded",
      "is_standalone_payment", "is_voided", "order", "owner", "pending",
      "source_data.pan", "source_data.sub_type", "source_data.type", "success"
    ];

    const concatenatedString = keys.map((key) => args.queryData[key] || "").join("");
    
    // Note: Since browsers + frontend might distort URL params, this is a best-effort failsafe.
    const encoder = new TextEncoder();
    const keyBuf = encoder.encode(secret);
    const dataBuf = encoder.encode(concatenatedString);
    const cryptoKey = await crypto.subtle.importKey("raw", keyBuf, { name: "HMAC", hash: "SHA-512" }, false, ["sign"]);
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, dataBuf);
    const calculatedHmac = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, "0")).join("");

    if (calculatedHmac.toLowerCase() !== args.hmac.toLowerCase()) {
      return { success: false, message: "Invalid Failsafe HMAC" };
    }

    const merchantOrderId = args.queryData["order"] || "";
    if (merchantOrderId) {
      await ctx.runMutation(internal.payments.processWebhookCallback, {
        orderId: args.queryData["id"]?.toString() || "",
        success: args.queryData["success"] === "true",
        merchantOrderId: merchantOrderId.toString(),
      });
      return { success: true };
    }
    return { success: false };
  }
});
