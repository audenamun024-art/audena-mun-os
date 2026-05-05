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
    const { email, otp, password, full_name } = await req.json();
    if (!email || !otp || !password) return json({ error: "Missing fields" }, 400);
    if (!/^\d{6}$/.test(String(otp))) return json({ error: "Invalid code format" }, 400);
    if (String(password).length < 8) return json({ error: "Password must be at least 8 characters" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const code_hash = await sha256(`${email}:${otp}`);

    const { data: rows } = await supabase
      .from("email_otps")
      .select("*")
      .eq("email", email)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1);
    const rec = rows?.[0];
    if (!rec) return json({ error: "No active code" }, 400);
    if (new Date(rec.expires_at).getTime() < Date.now()) return json({ error: "Code expired" }, 400);
    if ((rec.attempts ?? 0) >= 5) return json({ error: "Too many attempts" }, 429);

    if (rec.code_hash !== code_hash) {
      await supabase.from("email_otps").update({ attempts: (rec.attempts ?? 0) + 1 }).eq("id", rec.id);
      return json({ error: "Invalid code" }, 400);
    }

    await supabase.from("email_otps").update({ consumed_at: new Date().toISOString() }).eq("id", rec.id);

    // Create the auth user (auto-confirmed since OTP verified)
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name ?? null },
    });
    if (createErr || !created.user) return json({ error: createErr?.message || "Signup failed" }, 400);

    // Seed profile + default role
    await supabase.from("profiles").upsert(
      { user_id: created.user.id, full_name: full_name ?? null },
      { onConflict: "user_id" },
    );
    await supabase.from("user_roles").insert({ user_id: created.user.id, role: "user" });

    return json({ success: true });
  } catch (e: any) {
    console.error("verify-otp error:", e);
    return json({ error: e?.message || "Unexpected error" }, 500);
  }
});
