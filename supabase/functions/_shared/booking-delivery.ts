function maskedPhone(phone: string): string {
  return `${phone.slice(0, 4)}*****${phone.slice(-4)}`;
}

export function sendBookingConfirmation(
  phone: string,
  appointmentId: string,
  startsAt: string,
  cancellationToken: string,
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
    cancellationPath: `/cancel#${cancellationToken}`,
  }));
}

type BookingConfirmationDelivery = (
  phone: string,
  appointmentId: string,
  startsAt: string,
  cancellationToken: string,
) => void | Promise<void>;

export async function deliverBookingConfirmationSafely(
  phone: string,
  appointmentId: string,
  startsAt: string,
  cancellationToken: string,
  deliver: BookingConfirmationDelivery = sendBookingConfirmation,
  reportError: (error: unknown) => void = (error) =>
    console.error("Failed to deliver booking confirmation", error),
): Promise<boolean> {
  try {
    await deliver(phone, appointmentId, startsAt, cancellationToken);
    return true;
  } catch (error) {
    reportError(error);
    return false;
  }
}
