import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import type { Database } from "../_shared/database.types.ts";
import { corsHeaders, json } from "../_shared/http.ts";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export default {
  fetch: withSupabase<Database>({ auth: "none" }, async (request, context) => {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "GET") {
      return json({ error: "Method not allowed" }, 405);
    }

    const url = new URL(request.url);
    const from = url.searchParams.get("from");
    const requestedDays = Number(url.searchParams.get("days") ?? "28");

    if (
      !from ||
      !DATE_PATTERN.test(from) ||
      !Number.isInteger(requestedDays) ||
      requestedDays < 1 ||
      requestedDays > 28
    ) {
      return json({ error: "Invalid date range" }, 400);
    }

    const { data, error } = await context.supabaseAdmin.rpc(
      "list_booked_slots",
      { p_from: from, p_days: requestedDays },
    );

    if (error) {
      console.error("Failed to list booked slots", error);
      return json({ error: "Could not load availability" }, 503);
    }

    return json({
      bookedSlots: (data ?? []).map((slot) => ({
        date: slot.booking_date,
        time: slot.booking_time.slice(0, 5),
      })),
    });
  }),
};
