import {
  generateOtp,
  hashOtp,
  normalizeIsraeliMobile,
  verifyOtpHash,
} from "./otp.ts";

function assertEquals(actual: unknown, expected: unknown): void {
  if (actual !== expected) {
    throw new Error(`Expected ${String(expected)}, received ${String(actual)}`);
  }
}

Deno.test("normalizes supported Israeli mobile formats", () => {
  assertEquals(normalizeIsraeliMobile("050-123-4567"), "+972501234567");
  assertEquals(normalizeIsraeliMobile("972 50 123 4567"), "+972501234567");
  assertEquals(normalizeIsraeliMobile("+972501234567"), "+972501234567");
  assertEquals(normalizeIsraeliMobile("03-123-4567"), null);
});

Deno.test("generates a six-digit OTP", () => {
  const code = generateOtp();
  assertEquals(/^\d{6}$/.test(code), true);
});

Deno.test("verifies only the matching challenge, phone, and code", async () => {
  const secret = "a-test-secret-that-is-at-least-32-characters";
  const challengeId = "11111111-1111-4111-8111-111111111111";
  const phone = "+972501234567";
  const hash = await hashOtp(secret, challengeId, phone, "123456");

  assertEquals(
    await verifyOtpHash(secret, challengeId, phone, "123456", hash),
    true,
  );
  assertEquals(
    await verifyOtpHash(secret, challengeId, phone, "654321", hash),
    false,
  );
});
