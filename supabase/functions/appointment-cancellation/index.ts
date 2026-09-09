import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import {
  hashCancellationToken,
  isCancellationToken,
} from "../_shared/cancellation.ts";
import type { Database } from "../_shared/database.types.ts";
import { corsHeaders, json } from "../_shared/http.ts";

export default {
  fetch: withSupabase<Database>({ auth: "none" }, async (request, context) => {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const action = typeof body === "object" && body !== null
      ? Reflect.get(body, "action")
      : undefined;
    const token = typeof body === "object" && body !== null
      ? Reflect.get(body, "token")
      : undefined;

    if (
      (action !== "details" && action !== "cancel") ||
      !isCancellationToken(token)
    ) {
      return json({ error: "Invalid cancellation request" }, 400);
    }

    const secret = Deno.env.get("CANCELLATION_TOKEN_SECRET");
    if (!secret) {
      console.error("CANCELLATION_TOKEN_SECRET is missing");
      return json({ error: "Cancellation service unavailable" }, 503);
    }

    const tokenHash = await hashCancellationToken(secret, token);

    if (action === "details") {
      const { data: appointment, error } = await context.supabaseAdmin
        .from("appointments")
        .select(
          "id, starts_at, status, cancelled_at, customer:customers(full_name)",
        )
        .eq("cancellation_token_hash", tokenHash)
        .maybeSingle();

      if (error) {
        console.error("Failed to load cancellation appointment", error);
        return json({ error: "Cancellation service unavailable" }, 503);
      }

      if (!appointment) {
        return json({ error: "Cancellation link is invalid" }, 404);
      }

      return json({
        appointment: {
          id: appointment.id,
          startsAt: appointment.starts_at,
          status: appointment.status,
          cancelledAt: appointment.cancelled_at,
          name: appointment.customer.full_name,
        },
      });
    }

    const { data, error } = await context.supabaseAdmin.rpc(
      "cancel_customer_appointment",
      { p_cancellation_token_hash: tokenHash },
    );

    if (error) {
      console.error("Failed to cancel customer appointment", error);
      return json({ error: "Cancellation service unavailable" }, 503);
    }

    const appointment = data?.[0];
    if (!appointment) {
      return json({ error: "Cancellation link is invalid" }, 404);
    }

    return json({
      appointment: {
        id: appointment.appointment_id,
        startsAt: appointment.starts_at,
        status: appointment.status,
        cancelledAt: appointment.cancelled_at,
      },
    });
  }),
};
