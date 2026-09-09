import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import type { Database } from "../_shared/database.types.ts";
import { corsHeaders, json } from "../_shared/http.ts";
import { sendBookingOtp } from "../_shared/otp-delivery.ts";
import {
  generateOtp,
  hashOtp,
  normalizeIsraeliMobile,
} from "../_shared/otp.ts";

const OTP_LIFETIME_MS = 5 * 60 * 1000;
const RESEND_DELAY_MS = 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 3;

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

    const phone = normalizeIsraeliMobile(
      typeof body === "object" && body !== null
        ? Reflect.get(body, "phone")
        : undefined,
    );

    if (!phone) {
      return json({ error: "Enter a valid Israeli mobile number" }, 400);
    }

    const hmacSecret = Deno.env.get("OTP_HMAC_SECRET");
    if (!hmacSecret) {
      console.error("OTP_HMAC_SECRET is missing");
      return json({ error: "OTP service unavailable" }, 503);
    }

    const now = Date.now();
    const windowStart = new Date(now - RATE_LIMIT_WINDOW_MS).toISOString();
    const { data: recentChallenges, error: recentError } = await context
      .supabaseAdmin
      .from("otp_challenges")
      .select("id, created_at")
      .eq("phone_e164", phone)
      .gte("created_at", windowStart)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });

    if (recentError) {
      console.error("Failed to inspect OTP rate limit", recentError);
      return json({ error: "OTP service unavailable" }, 503);
    }

    const latestCreatedAt = recentChallenges?.[0]?.created_at;
    if (latestCreatedAt) {
      const elapsed = now - new Date(latestCreatedAt).getTime();
      if (elapsed < RESEND_DELAY_MS) {
        return json({
          error: "Please wait before requesting another code",
          retryAfterSeconds: Math.ceil((RESEND_DELAY_MS - elapsed) / 1000),
        }, 429);
      }
    }

    if ((recentChallenges?.length ?? 0) >= MAX_REQUESTS_PER_WINDOW) {
      return json({ error: "Too many code requests. Try again later" }, 429);
    }

    const challengeId = crypto.randomUUID();
    const code = generateOtp();
    const codeHash = await hashOtp(
      hmacSecret,
      challengeId,
      phone,
      code,
    );
    const expiresAt = new Date(now + OTP_LIFETIME_MS).toISOString();

    const { error: insertError } = await context.supabaseAdmin
      .from("otp_challenges")
      .insert({
        id: challengeId,
        phone_e164: phone,
        code_hash: codeHash,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error("Failed to create OTP challenge", insertError);
      return json({ error: "OTP service unavailable" }, 503);
    }

    try {
      await sendBookingOtp(phone, code);
    } catch (error) {
      console.error("Failed to deliver OTP", error);
      await context.supabaseAdmin
        .from("otp_challenges")
        .delete()
        .eq("id", challengeId);
      return json({ error: "Could not send verification code" }, 503);
    }

    return json({
      challengeId,
      expiresInSeconds: OTP_LIFETIME_MS / 1000,
      resendAfterSeconds: RESEND_DELAY_MS / 1000,
    }, 201);
  }),
};
