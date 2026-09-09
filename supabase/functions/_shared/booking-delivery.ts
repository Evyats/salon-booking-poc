function maskedPhone(phone: string): string {
  return `${phone.slice(0, 4)}*****${phone.slice(-4)}`;
}

export function sendBookingConfirmation(
  phone: string,
  appointmentId: string,
  startsAt: string,
): void {
  const mode = Deno.env.get("OTP_DELIVERY_MODE");

  if (mode !== "mock") {
    throw new Error("Booking confirmation delivery is not configured");
  }

  console.info(JSON.stringify({
    event: "mock_booking_confirmation",
    phone: maskedPhone(phone),
    appointmentId,
    startsAt,
  }));
}
