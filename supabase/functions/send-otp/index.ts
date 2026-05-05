import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function sha256(input: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: "Valid email required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // Rate limit: max 5 OTPs / email / 10 min
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("email_otps")
      .select("id", { count: "exact", head: true })
      .eq("email", email)
      .gte("created_at", tenMinAgo);
    if ((count ?? 0) >= 5) return json({ error: "Too many requests, please wait" }, 429);

    // Generate cryptographically secure 6-digit code
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    const code = (buf[0] % 1_000_000).toString().padStart(6, "0");
    const code_hash = await sha256(`${email}:${code}`);
    const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabase.from("email_otps").insert({ email, code_hash, expires_at });

    const smtpEmail = Deno.env.get("SMTP_EMAIL");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    if (!smtpEmail || !smtpPassword) return json({ error: "SMTP not configured" }, 500);

    const { SMTPClient } = await import("https://deno.land/x/denomailer@1.6.0/mod.ts");
    const client = new SMTPClient({
      connection: { hostname: "smtp.gmail.com", port: 465, tls: true, auth: { username: smtpEmail, password: smtpPassword } },
    });
    await client.send({
      from: `AudenaHub <${smtpEmail}>`,
      to: email,
      subject: "Your AudenaHub Verification Code",
      html: `
        <div style="font-family: 'Georgia', serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #0a0a0a; color: #f5f5f5; border-radius: 16px;">
          <h1 style="text-align: center; font-size: 24px; color: #d4a843; margin-bottom: 8px;">AudenaHub</h1>
          <p style="text-align: center; font-size: 12px; color: #888; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 32px;">Verification Code</p>
          <div style="text-align: center; padding: 24px; background: #1a1a1a; border-radius: 12px; border: 1px solid #333;">
            <p style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #d4a843; margin: 0;">${code}</p>
          </div>
          <p style="text-align: center; font-size: 13px; color: #888; margin-top: 24px;">This code expires in 10 minutes.</p>
        </div>`,
    });
    await client.close();

    return json({ success: true });
  } catch (e: any) {
    console.error("OTP send error:", e);
    return json({ error: "Failed to send email" }, 500);
  }
});
