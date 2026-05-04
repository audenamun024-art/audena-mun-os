// Cashfree: create order + persist payment row.
// Public function (no JWT) — uses server-side secrets only.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const APP_ID = Deno.env.get("CASHFREE_APP_ID");
    const SECRET = Deno.env.get("CASHFREE_SECRET_KEY");
    const ENV = (Deno.env.get("CASHFREE_ENV") || "production").toLowerCase();
    if (!APP_ID || !SECRET) {
      return new Response(JSON.stringify({ error: "Cashfree credentials not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      user_id, event_id = null, amount, currency = "INR",
      customer_name, customer_email, customer_phone, purpose = "event",
      return_url,
    } = body || {};

    if (!user_id || !amount || !customer_email || !customer_phone) {
      return new Response(JSON.stringify({ error: "user_id, amount, customer_email, customer_phone required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const baseUrl = ENV === "sandbox"
      ? "https://sandbox.cashfree.com/pg"
      : "https://api.cashfree.com/pg";

    const orderId = `audena_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const cfRes = await fetch(`${baseUrl}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": "2023-08-01",
        "x-client-id": APP_ID,
        "x-client-secret": SECRET,
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: Number(amount),
        order_currency: currency,
        customer_details: {
          customer_id: user_id,
          customer_name: customer_name || "Audena Delegate",
          customer_email,
          customer_phone: String(customer_phone).replace(/\D/g, "").slice(-10) || "9999999999",
        },
        order_meta: {
          return_url: return_url || `${req.headers.get("origin") || ""}/profile?payment=success&order_id={order_id}`,
        },
        order_note: purpose,
      }),
    });
    const cfData = await cfRes.json();
    if (!cfRes.ok) {
      return new Response(JSON.stringify({ error: cfData?.message || "Cashfree order failed", details: cfData }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );
    const platformFee = 29; // ₹29 platform fee per transaction
    const orgAmount = Math.max(0, Number(amount) - platformFee);
    await supabase.from("payments").insert({
      user_id, event_id, provider: "cashfree", order_id: orderId,
      payment_session_id: cfData.payment_session_id, amount, currency,
      status: "created", purpose, raw: cfData,
      platform_fee: platformFee, org_amount: orgAmount,
    });

    return new Response(JSON.stringify({
      ok: true,
      order_id: orderId,
      payment_session_id: cfData.payment_session_id,
      env: ENV,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Unexpected error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
