// Admin endpoint to provision an organization auth account + organizations row.
// PUBLIC by request: the project's /admin route is openly accessible, so this
// function does not require a JWT. It uses the SERVICE ROLE key server-side.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
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
      return new Response(
        JSON.stringify({ error: "name, email and password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (String(password).length < 8) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 8 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // 1) Create the auth user (auto-confirmed)
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name, account_type: "organization" },
    });
    if (createErr || !created.user) {
      return new Response(
        JSON.stringify({ error: createErr?.message || "Failed to create auth user" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const newUserId = created.user.id;

    // 2) Profile row
    await supabaseAdmin.from("profiles").upsert(
      { user_id: newUserId, full_name: name, institution: name },
      { onConflict: "user_id" },
    );

    // 3) Role: organization
    await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newUserId, role: "organization" })
      .select();

    // 4) Organization row
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
      return new Response(
        JSON.stringify({ error: orgErr.message, partial: { user_id: newUserId } }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ ok: true, user_id: newUserId, organization: orgRow }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e?.message || "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
