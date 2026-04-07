import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { totalAmount, paymentIntentId, billingData } = await request.json();

    const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
    const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID;

    if (!PAYMOB_API_KEY || !PAYMOB_INTEGRATION_ID) {
      throw new Error("Paymob API Keys are not configured in the environment (.env.local).");
    }

    // Step 1: Authentication
    const authRes = await fetch("https://accept.paymob.com/api/auth/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: PAYMOB_API_KEY }),
    });

    if (!authRes.ok) {
      const errorText = await authRes.text();
      console.error("Paymob API Route Auth Failed:", errorText);
      throw new Error(`Paymob auth failed: ${authRes.status} ${errorText}`);
    }
    const authData = await authRes.json();
    const authToken = authData.token;

    // Step 2: Order Registration
    const amountCents = Math.round(totalAmount * 100).toString();
    const orderRes = await fetch("https://accept.paymob.com/api/ecommerce/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: authToken,
        delivery_needed: "false",
        amount_cents: amountCents,
        currency: "EGP",
        merchant_order_id: `intent_${paymentIntentId}_${Date.now()}`,
        items: [],
      }),
    });

    if (!orderRes.ok) {
      const errorText = await orderRes.text();
      throw new Error(`Paymob order registration failed: ${orderRes.status} ${errorText}`);
    }
    const orderData = await orderRes.json();
    const orderId = orderData.id;

    // Step 3: Payment Key Request
    const paymentKeyRes = await fetch("https://accept.paymob.com/api/acceptance/payment_keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: authToken,
        amount_cents: amountCents,
        expiration: 3600,
        order_id: orderId,
        billing_data: billingData || {
          apartment: "NA",
          email: "test@example.com",
          floor: "NA",
          first_name: "Customer",
          street: "NA",
          building: "NA",
          phone_number: "NA",
          shipping_method: "NA",
          postal_code: "NA",
          city: "NA",
          country: "EG",
          last_name: "Customer",
          state: "NA",
        },
        currency: "EGP",
        integration_id: PAYMOB_INTEGRATION_ID,
      }),
    });

    if (!paymentKeyRes.ok) {
      const errorText = await paymentKeyRes.text();
      throw new Error(`Paymob payment key request failed: ${paymentKeyRes.status} ${errorText}`);
    }
    const paymentKeyData = await paymentKeyRes.json();

    const rawIframeId = process.env.PAYMOB_IFRAME_ID || "";
    let iframeId = rawIframeId;
    const match = rawIframeId.match(/\/iframes\/(\d+)/);
    if (match) {
      iframeId = match[1];
    } else if (rawIframeId.includes("=")) {
      iframeId = rawIframeId.replace(/\D/g, "");
    }

    return NextResponse.json({
      success: true,
      transactionId: orderId.toString(),
      paymentKey: paymentKeyData.token, // Used for iframe!
      iframeId: iframeId || "", // Frontend uses this to build the URL
    });

  } catch (error) {
    console.error("Paymob API Route Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
