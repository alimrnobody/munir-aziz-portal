import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type CreateMemberPayload = {
  email?: string;
  password?: string;
  name?: string;
  role?: "user" | "admin";
  teamId?: string;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Missing Supabase environment variables" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing authorization header" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const serviceClient = createClient(supabaseUrl, serviceRoleKey);

  const {
    data: { user: callerUser },
    error: callerError,
  } = await callerClient.auth.getUser();

  if (callerError || !callerUser) {
    return new Response(JSON.stringify({ error: callerError?.message || "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: callerProfile, error: callerProfileError } = await serviceClient
    .from("profiles")
    .select("role, status")
    .eq("id", callerUser.id)
    .maybeSingle();

  if (callerProfileError || !callerProfile) {
    return new Response(JSON.stringify({ error: callerProfileError?.message || "Caller profile not found" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (callerProfile.status !== "active" || !["owner", "admin"].includes(callerProfile.role ?? "")) {
    return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const payload = (await request.json()) as CreateMemberPayload;
  const email = payload.email?.trim().toLowerCase() ?? "";
  const password = payload.password ?? "";
  const name = payload.name?.trim() || email.split("@")[0] || "User";
  const role = payload.role === "admin" && callerProfile.role === "owner" ? "admin" : "user";

  if (!email || !password) {
    return new Response(JSON.stringify({ error: "Email and password are required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (password.length < 8) {
    return new Response(JSON.stringify({ error: "Password must be at least 8 characters long" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: createdUserData, error: createUserError } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (createUserError || !createdUserData.user) {
    return new Response(JSON.stringify({ error: createUserError?.message || "Unable to create user" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const createdUser = createdUserData.user;

  const { error: profileUpsertError } = await serviceClient.from("profiles").upsert(
    {
      id: createdUser.id,
      email,
      name,
      role,
      status: "active",
      session_version: 0,
    },
    { onConflict: "id" },
  );

  if (profileUpsertError) {
    await serviceClient.auth.admin.deleteUser(createdUser.id);
    return new Response(JSON.stringify({ error: profileUpsertError.message || "Unable to create profile" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (payload.teamId) {
    const { error: teamAssignError } = await serviceClient.from("team_members").insert({
      team_id: payload.teamId,
      user_id: createdUser.id,
    });

    if (teamAssignError) {
      await serviceClient.auth.admin.deleteUser(createdUser.id);
      await serviceClient.from("profiles").delete().eq("id", createdUser.id);
      return new Response(JSON.stringify({ error: teamAssignError.message || "Unable to assign team" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response(
    JSON.stringify({
      userId: createdUser.id,
      email,
      name,
      role,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
