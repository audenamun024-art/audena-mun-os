import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, otp } = await req.json();
    if (!email || !otp) {
      return new Response(JSON.stringify({ error: "Missing email or otp" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const smtpEmail = Deno.env.get("SMTP_EMAIL");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");

    if (!smtpEmail || !smtpPassword) {
      return new Response(JSON.stringify({ error: "SMTP not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use Deno's built-in SMTP via denopkg
    const { SMTPClient } = await import("https://deno.land/x/denomailer@1.6.0/mod.ts");

    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: smtpEmail,
          password: smtpPassword,
        },
      },
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
            <p style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #d4a843; margin: 0;">${otp}</p>
          </div>
          <p style="text-align: center; font-size: 13px; color: #888; margin-top: 24px;">This code expires in 10 minutes.</p>
          <p style="text-align: center; font-size: 11px; color: #555; margin-top: 16px;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    await client.close();

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("OTP send error:", error);
    return new Response(JSON.stringify({ error: "Failed to send email" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
