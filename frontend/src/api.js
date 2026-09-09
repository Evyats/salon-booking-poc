const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? "").replace(
  /\/$/,
  "",
);

export class ApiError extends Error {
  constructor(message, status, details = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function callFunction(name, options = {}) {
  if (!supabaseUrl) {
    throw new ApiError("Frontend backend URL is not configured", 0);
  }

  let response;
  try {
    response = await fetch(`${supabaseUrl}/functions/v1/${name}`, options);
  } catch {
    throw new ApiError("Could not reach the booking service", 0);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(
      data.error ?? "Booking request failed",
      response.status,
      data,
    );
  }

  return data;
}

export async function getBookedSlots(from, days = 28) {
  const query = new URLSearchParams({ from, days: String(days) });
  const data = await callFunction(`booking-slots?${query}`);
  return data.bookedSlots ?? [];
}

export function requestBookingOtp(phone) {
  return callFunction("request-booking-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
}

export function verifyBookingOtp(challengeId, code) {
  return callFunction("verify-booking-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ challengeId, code }),
  });
}

export function createBooking({ challengeId, fullName, date, time }) {
  return callFunction("create-booking", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ challengeId, fullName, date, time }),
  });
}
