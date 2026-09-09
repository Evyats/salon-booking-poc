function maskedPhone(phone: string): string {
  return `${phone.slice(0, 4)}*****${phone.slice(-4)}`;
}

export async function sendBookingOtp(
  phone: string,
  code: string,
): Promise<void> {
  const mode = Deno.env.get("OTP_DELIVERY_MODE");

  if (mode !== "mock") {
    throw new Error("OTP delivery is not configured");
  }

  console.info(JSON.stringify({
    event: "mock_booking_otp",
    phone: maskedPhone(phone),
    code,
  }));

  await Promise.resolve();
}
