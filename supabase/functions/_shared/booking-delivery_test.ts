import { deliverBookingConfirmationSafely } from "./booking-delivery.ts";

const args = [
  "+972500000000",
  "00000000-0000-4000-8000-000000000000",
  "2026-09-10T09:00:00+03:00",
  "a".repeat(43),
] as const;

Deno.test("contains confirmation delivery failures", async () => {
  let reportedError: unknown;
  const delivered = await deliverBookingConfirmationSafely(
    ...args,
    () => {
      throw new Error("simulated WhatsApp failure");
    },
    (error) => {
      reportedError = error;
    },
  );

  if (delivered) throw new Error("failed delivery was reported as successful");
  if (!(reportedError instanceof Error)) {
    throw new Error("delivery failure was not reported");
  }
});

Deno.test("reports successful confirmation delivery", async () => {
  let calls = 0;
  const delivered = await deliverBookingConfirmationSafely(
    ...args,
    () => {
      calls += 1;
    },
  );

  if (!delivered || calls !== 1) {
    throw new Error("successful delivery was not recorded once");
  }
});
