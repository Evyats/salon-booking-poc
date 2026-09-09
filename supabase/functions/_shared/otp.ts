const encoder = new TextEncoder();
const OTP_DIGITS = 6;
const OTP_LIMIT = 10 ** OTP_DIGITS;
const RANDOM_UINT32_RANGE = 2 ** 32;
const UNBIASED_RANDOM_LIMIT = Math.floor(RANDOM_UINT32_RANGE / OTP_LIMIT) *
  OTP_LIMIT;

export function normalizeIsraeliMobile(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const compact = value.trim().replace(/[\s()-]/g, "");

  if (/^05\d{8}$/.test(compact)) {
    return `+972${compact.slice(1)}`;
  }

  if (/^9725\d{8}$/.test(compact)) {
    return `+${compact}`;
  }

  return /^\+9725\d{8}$/.test(compact) ? compact : null;
}

export function generateOtp(): string {
  const random = new Uint32Array(1);

  do {
    crypto.getRandomValues(random);
  } while (random[0] >= UNBIASED_RANDOM_LIMIT);

  return String(random[0] % OTP_LIMIT).padStart(OTP_DIGITS, "0");
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  if (secret.length < 32) {
    throw new Error("OTP_HMAC_SECRET must contain at least 32 characters");
  }

  return await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function message(
  challengeId: string,
  phone: string,
  code: string,
): ArrayBuffer {
  return encoder.encode(`booking-otp:v1:${challengeId}:${phone}:${code}`)
    .buffer;
}

function bytesToHex(bytes: ArrayBuffer): string {
  return Array.from(
    new Uint8Array(bytes),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("");
}

function hexToBytes(hex: string): ArrayBuffer | null {
  if (!/^[0-9a-f]{64}$/.test(hex)) return null;

  return Uint8Array.from(
    hex.match(/.{2}/g) ?? [],
    (pair) => Number.parseInt(pair, 16),
  ).buffer;
}

export async function hashOtp(
  secret: string,
  challengeId: string,
  phone: string,
  code: string,
): Promise<string> {
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    message(challengeId, phone, code),
  );

  return bytesToHex(signature);
}

export async function verifyOtpHash(
  secret: string,
  challengeId: string,
  phone: string,
  code: string,
  storedHash: string,
): Promise<boolean> {
  const signature = hexToBytes(storedHash);
  if (!signature) return false;

  const key = await importHmacKey(secret);
  return await crypto.subtle.verify(
    "HMAC",
    key,
    signature,
    message(challengeId, phone, code),
  );
}
