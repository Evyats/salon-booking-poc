import "@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, json } from "../_shared/http.ts";

Deno.serve((request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }

  return json({
    ok: true,
    service: "kav-api",
    timestamp: new Date().toISOString(),
  });
});
