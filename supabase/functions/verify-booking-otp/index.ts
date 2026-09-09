import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import type { Database } from "../_shared/database.types.ts";
import { corsHeaders, json } from "../_shared/http.ts";
import { verifyOtpHash } from "../_shared/otp.ts";

const MAX_ATTEMPTS = 5;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
    const code = typeof body === "object" && body !== null
      ? Reflect.get(body, "code")
      : undefined;

    if (
      typeof challengeId !== "string" ||
      !UUID_PATTERN.test(challengeId) ||
      typeof code !== "string" ||
      !/^\d{6}$/.test(code)
    ) {
      return json({ error: "Invalid challenge or code" }, 400);
    }

    const hmacSecret = Deno.env.get("OTP_HMAC_SECRET");
    if (!hmacSecret) {
      console.error("OTP_HMAC_SECRET is missing");
      return json({ error: "OTP service unavailable" }, 503);
    }

    const { data: challenge, error: challengeError } = await context
      .supabaseAdmin
      .from("otp_challenges")
      .select(
        "id, phone_e164, code_hash, attempt_count, expires_at, verified_at, consumed_at, created_at",
      )
      .eq("id", challengeId)
      .maybeSingle();

    if (challengeError) {
      console.error("Failed to load OTP challenge", challengeError);
      return json({ error: "OTP service unavailable" }, 503);
    }

    if (!challenge) {
      return json({ error: "Invalid challenge or code" }, 400);
    }

    if (challenge.consumed_at) {
      return json({ error: "Verification code has already been used" }, 409);
    }

    if (challenge.verified_at) {
      return json({ verified: true });
    }

    if (new Date(challenge.expires_at).getTime() <= Date.now()) {
      return json({ error: "Verification code has expired" }, 410);
    }

    if (challenge.attempt_count >= MAX_ATTEMPTS) {
      return json({ error: "Too many incorrect attempts" }, 429);
    }

    const { data: latestChallenge, error: latestError } = await context
      .supabaseAdmin
      .from("otp_challenges")
      .select("id")
      .eq("phone_e164", challenge.phone_e164)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestError) {
      console.error("Failed to inspect latest OTP challenge", latestError);
      return json({ error: "OTP service unavailable" }, 503);
    }

    if (latestChallenge?.id !== challenge.id) {
      return json({ error: "A newer verification code was requested" }, 409);
    }

    const valid = await verifyOtpHash(
      hmacSecret,
      challenge.id,
      challenge.phone_e164,
      code,
      challenge.code_hash,
    );

    if (!valid) {
      const { data: attemptCount, error: attemptError } = await context
        .supabaseAdmin
        .rpc("record_otp_failure", { p_challenge_id: challenge.id });

      if (attemptError) {
        console.error("Failed to record OTP attempt", attemptError);
        return json({ error: "OTP service unavailable" }, 503);
      }

      const attemptsRemaining = Math.max(
        0,
        MAX_ATTEMPTS -
          (typeof attemptCount === "number"
            ? attemptCount
            : challenge.attempt_count + 1),
      );

      return json({
        error: "Incorrect verification code",
        attemptsRemaining,
      }, 400);
    }

    const { data: verifiedAt, error: verifyError } = await context.supabaseAdmin
      .rpc("mark_otp_verified", { p_challenge_id: challenge.id });

    if (verifyError) {
      console.error("Failed to mark OTP verified", verifyError);
      return json({ error: "OTP service unavailable" }, 503);
    }

    if (!verifiedAt) {
      return json({ error: "Verification code is no longer valid" }, 409);
    }

    return json({ verified: true });
  }),
};
