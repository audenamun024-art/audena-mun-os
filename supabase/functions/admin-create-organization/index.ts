// Admin endpoint to provision an organization auth account + organizations row.
// Requires the caller to be an authenticated admin (verified via JWT + user_roles).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // ---- Auth check: must be a signed-in admin ----
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Unauthorized" }, 401);

    const { data: userRes, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userRes?.user) return json({ error: "Unauthorized" }, 401);

    const { data: roleRows } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userRes.user.id);
    const isAdmin = (roleRows || []).some((r: any) => r.role === "admin");
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const body = await req.json();
    const {
      name,
      email,
      password,
      description,
      website,
      logo_url,
      contact_person,
      phone,
    } = body || {};

    if (!name || !email || !password) {
      return json({ error: "name, email and password are required" }, 400);
    }
    if (String(password).length < 8) {
      return json({ error: "Password must be at least 8 characters" }, 400);
    }

    // 1) Create the auth user (auto-confirmed)
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name, account_type: "organization" },
    });
    if (createErr || !created.user) {
      return json({ error: createErr?.message || "Failed to create auth user" }, 400);
    }
    const newUserId = created.user.id;

    await supabaseAdmin.from("profiles").upsert(
      { user_id: newUserId, full_name: name, institution: name },
      { onConflict: "user_id" },
    );

    await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newUserId, role: "organization" })
      .select();

    const { data: orgRow, error: orgErr } = await supabaseAdmin
      .from("organizations")
      .insert({
        name,
        email,
        description: description ?? null,
        website: website ?? null,
        logo_url: logo_url ?? null,
        contact_person: contact_person ?? null,
        phone: phone ?? null,
        owner_user_id: newUserId,
      })
      .select()
      .maybeSingle();

    if (orgErr) {
      return json({ error: orgErr.message, partial: { user_id: newUserId } }, 400);
    }

    return json({ ok: true, user_id: newUserId, organization: orgRow }, 200);
  } catch (e: any) {
    return json({ error: e?.message || "Unexpected error" }, 500);
  }
});
