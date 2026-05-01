// Cashfree: verify order status, update payments + event_registrations.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const APP_ID = Deno.env.get("CASHFREE_APP_ID")!;
    const SECRET = Deno.env.get("CASHFREE_SECRET_KEY")!;
    const ENV = (Deno.env.get("CASHFREE_ENV") || "production").toLowerCase();
    const baseUrl = ENV === "sandbox" ? "https://sandbox.cashfree.com/pg" : "https://api.cashfree.com/pg";

    const { order_id } = await req.json();
    if (!order_id) {
      return new Response(JSON.stringify({ error: "order_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const cfRes = await fetch(`${baseUrl}/orders/${order_id}`, {
      headers: {
        "x-api-version": "2023-08-01",
        "x-client-id": APP_ID,
        "x-client-secret": SECRET,
      },
    });
    const cfData = await cfRes.json();
    const status = (cfData?.order_status || "").toUpperCase();
    const mapped = status === "PAID" ? "paid"
      : status === "ACTIVE" ? "pending"
      : status === "EXPIRED" ? "expired"
      : status === "TERMINATED" ? "failed"
      : status.toLowerCase() || "unknown";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const { data: pay } = await supabase.from("payments")
      .update({ status: mapped, raw: cfData, cf_payment_id: cfData?.cf_order_id?.toString() ?? null })
      .eq("order_id", order_id).select().maybeSingle();

    if (pay && mapped === "paid" && pay.event_id) {
      await supabase.from("event_registrations").upsert({
        event_id: pay.event_id, user_id: pay.user_id,
        payment_status: "paid", payment_id: pay.id, amount: pay.amount,
      }, { onConflict: "event_id,user_id" });
    }

    return new Response(JSON.stringify({ ok: true, status: mapped, payment: pay }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
