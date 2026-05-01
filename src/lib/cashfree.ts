// Cashfree Hosted Checkout helper.
// Loads Cashfree JS SDK on demand and triggers the drop-in checkout.
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

declare global {
  interface Window {
    Cashfree?: any;
  }
}

let sdkPromise: Promise<void> | null = null;

const loadSdk = (mode: "sandbox" | "production") => {
  if (window.Cashfree) return Promise.resolve();
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Cashfree SDK"));
    document.body.appendChild(s);
  });
  return sdkPromise;
};

export type CashfreeCheckoutInput = {
  user_id: string;
  amount: number;
  customer_email: string;
  customer_name?: string;
  customer_phone: string;
  event_id?: string | null;
  purpose?: string;
};

/**
 * Starts a Cashfree Hosted Checkout session.
 * Returns the order_id once the popup is dismissed (success or otherwise).
 */
export const startCashfreePayment = async (
  input: CashfreeCheckoutInput
): Promise<{ order_id: string; status: string } | null> => {
  try {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const res = await fetch(
      `https://${projectId}.supabase.co/functions/v1/cashfree-create-order`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          ...input,
          return_url: `${window.location.origin}/profile?payment=success&order_id={order_id}`,
        }),
      }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to create order");

    const mode: "sandbox" | "production" = data.env === "sandbox" ? "sandbox" : "production";
    await loadSdk(mode);

    const cashfree = window.Cashfree({ mode });
    await cashfree.checkout({
      paymentSessionId: data.payment_session_id,
      redirectTarget: "_modal",
    });

    // Verify result
    const verifyRes = await fetch(
      `https://${projectId}.supabase.co/functions/v1/cashfree-verify-order`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ order_id: data.order_id }),
      }
    );
    const verify = await verifyRes.json();
    const status = verify?.status || "unknown";

    if (status === "paid") {
      toast.success("Payment successful — thank you!");
    } else if (status === "pending") {
      toast.message("Payment pending — we will confirm soon.");
    } else {
      toast.error(`Payment ${status}`);
    }
    return { order_id: data.order_id, status };
  } catch (e: any) {
    toast.error(e?.message || "Payment failed");
    return null;
  }
};
