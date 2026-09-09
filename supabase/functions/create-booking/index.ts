import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { sendBookingConfirmation } from "../_shared/booking-delivery.ts";
import type { Database } from "../_shared/database.types.ts";
import { corsHeaders, json } from "../_shared/http.ts";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}$/;

const bookingErrors: Record<string, { status: number; message: string }> = {
  INVALID_NAME: { status: 400, message: "Enter a valid name" },
  INVALID_SLOT: { status: 400, message: "Invalid appointment slot" },
  OTP_NOT_FOUND: { status: 400, message: "Invalid verification challenge" },
  OTP_NOT_VERIFIED: { status: 401, message: "Verify the phone number first" },
  OTP_ALREADY_USED: {
    status: 409,
    message: "Verification code was already used",
  },
  OTP_EXPIRED: { status: 410, message: "Verification code has expired" },
  CUSTOMER_BLOCKED: { status: 403, message: "Booking is unavailable" },
};

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

    const challengeId = typeof body === "object" && body !== null
      ? Reflect.get(body, "challengeId")
      : undefined;
    const fullName = typeof body === "object" && body !== null
      ? Reflect.get(body, "fullName")
      : undefined;
    const date = typeof body === "object" && body !== null
      ? Reflect.get(body, "date")
      : undefined;
    const time = typeof body === "object" && body !== null
      ? Reflect.get(body, "time")
      : undefined;

    if (
      typeof challengeId !== "string" ||
      !UUID_PATTERN.test(challengeId) ||
      typeof fullName !== "string" ||
      fullName.trim().length < 2 ||
      fullName.trim().length > 100 ||
      typeof date !== "string" ||
      !DATE_PATTERN.test(date) ||
      typeof time !== "string" ||
      !TIME_PATTERN.test(time)
    ) {
      return json({ error: "Invalid booking details" }, 400);
    }

    const { data, error } = await context.supabaseAdmin.rpc(
      "create_customer_booking",
      {
        p_challenge_id: challengeId,
        p_full_name: fullName.trim(),
        p_booking_date: date,
        p_booking_time: time,
      },
    );

    if (error) {
      if (error.code === "23505") {
        return json({ error: "Appointment slot is no longer available" }, 409);
      }

      const knownError = bookingErrors[error.message];
      if (knownError) {
        return json({ error: knownError.message }, knownError.status);
      }

      console.error("Failed to create customer booking", error);
      return json({ error: "Could not create appointment" }, 503);
    }

    const appointment = data?.[0];
    if (!appointment) {
      console.error("Booking RPC returned no appointment");
      return json({ error: "Could not create appointment" }, 503);
    }

    const { data: challenge, error: challengeError } = await context
      .supabaseAdmin
      .from("otp_challenges")
      .select("phone_e164")
      .eq("id", challengeId)
      .single();

    if (!challengeError && challenge) {
      try {
        sendBookingConfirmation(
          challenge.phone_e164,
          appointment.appointment_id,
          appointment.starts_at,
        );
      } catch (deliveryError) {
        console.error("Failed to deliver booking confirmation", deliveryError);
      }
    } else {
      console.error("Failed to load confirmation destination", challengeError);
    }

    return json({
      appointment: {
        id: appointment.appointment_id,
        startsAt: appointment.starts_at,
        name: appointment.customer_name,
        date,
        time,
      },
    }, 201);
  }),
};
