import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

function parseEnv(source) {
  return Object.fromEntries(
    source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const separator = line.indexOf("=");
        return [line.slice(0, separator), line.slice(separator + 1)];
      }),
  );
}

const localEnv = parseEnv(
  await readFile(resolve("frontend/.env.local"), "utf8").catch(() => ""),
);
const supabaseUrl = (
  process.env.VITE_SUPABASE_URL ?? localEnv.VITE_SUPABASE_URL ?? ""
).replace(/\/$/, "");
const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  localEnv.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";

if (!supabaseUrl || !publishableKey) {
  console.error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in frontend/.env.local",
  );
  process.exit(1);
}

const functionUrl = (name) => `${supabaseUrl}/functions/v1/${name}`;
const restUrl = (path) => `${supabaseUrl}/rest/v1/${path}`;
const jsonRequest = (body, extra = {}) => ({
  method: "POST",
  ...extra,
  headers: { "Content-Type": "application/json", ...(extra.headers ?? {}) },
  body: JSON.stringify(body),
});

const tests = [];
function test(name, run) {
  tests.push({ name, run });
}

async function expectStatus(responsePromise, expected) {
  const response = await responsePromise;
  const statuses = Array.isArray(expected) ? expected : [expected];
  if (!statuses.includes(response.status)) {
    const body = await response.text();
    throw new Error(
      `expected HTTP ${statuses.join("/")}, received ${response.status}: ${body.slice(0, 180)}`,
    );
  }
  return response;
}

test("public health endpoint", async () => {
  const response = await expectStatus(fetch(functionUrl("health")), 200);
  const body = await response.json();
  if (body.ok !== true || body.service !== "kav-api") {
    throw new Error("unexpected health response");
  }
});

test("availability returns only its public shape", async () => {
  const from = new Date().toISOString().slice(0, 10);
  const response = await expectStatus(
    fetch(functionUrl(`booking-slots?from=${from}&days=28`)),
    200,
  );
  const body = await response.json();
  if (!Array.isArray(body.bookedSlots)) {
    throw new Error("bookedSlots is not an array");
  }
  for (const slot of body.bookedSlots) {
    if (
      Object.keys(slot).sort().join(",") !== "date,time" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(slot.date) ||
      !/^\d{2}:\d{2}$/.test(slot.time)
    ) {
      throw new Error("availability exposed an unexpected field or value");
    }
  }
});

test("availability rejects oversized ranges", () =>
  expectStatus(
    fetch(functionUrl("booking-slots?from=2026-09-09&days=29")),
    400,
  ));

test("CORS preflight is handled", async () => {
  const response = await expectStatus(
    fetch(functionUrl("booking-slots"), {
      method: "OPTIONS",
      headers: {
        Origin: "https://example.invalid",
        "Access-Control-Request-Method": "GET",
      },
    }),
    204,
  );
  if (!response.headers.get("access-control-allow-origin")) {
    throw new Error("missing CORS allow-origin response header");
  }
});

test("OTP request rejects the wrong HTTP method", () =>
  expectStatus(fetch(functionUrl("request-booking-otp")), 405));

test("OTP request rejects invalid phones", () =>
  expectStatus(
    fetch(
      functionUrl("request-booking-otp"),
      jsonRequest({ phone: "not-a-phone" }),
    ),
    400,
  ));

test("OTP verification rejects malformed input", () =>
  expectStatus(
    fetch(
      functionUrl("verify-booking-otp"),
      jsonRequest({ challengeId: "not-a-uuid", code: "123" }),
    ),
    400,
  ));

test("booking rejects malformed input", () =>
  expectStatus(
    fetch(
      functionUrl("create-booking"),
      jsonRequest({ challengeId: "not-a-uuid" }),
    ),
    400,
  ));

test("cancellation rejects malformed tokens", () =>
  expectStatus(
    fetch(
      functionUrl("appointment-cancellation"),
      jsonRequest({ action: "cancel", token: "guessable" }),
    ),
    400,
  ));

test("owner endpoint rejects missing authentication", () =>
  expectStatus(fetch(functionUrl("owner-health")), [401, 403]));

const anonHeaders = { apikey: publishableKey };

for (const table of ["customers", "appointments", "otp_challenges"]) {
  test(`anonymous role cannot read ${table}`, () =>
    expectStatus(
      fetch(restUrl(`${table}?select=*&limit=1`), { headers: anonHeaders }),
      [401, 403],
    ));
}

test("anonymous role cannot call customer-booking SQL function", () =>
  expectStatus(
    fetch(
      restUrl("rpc/create_customer_booking"),
      jsonRequest(
        {
          p_challenge_id: "00000000-0000-4000-8000-000000000000",
          p_full_name: "Stage Nine Probe",
          p_booking_date: "2099-01-01",
          p_booking_time: "09:00",
          p_cancellation_token_hash: "0".repeat(64),
        },
        { headers: anonHeaders },
      ),
    ),
    [401, 403, 404],
  ));

test("anonymous role cannot call cancellation SQL function", () =>
  expectStatus(
    fetch(
      restUrl("rpc/cancel_customer_appointment"),
      jsonRequest(
        { p_cancellation_token_hash: "0".repeat(64) },
        { headers: anonHeaders },
      ),
    ),
    [401, 403, 404],
  ));

let failures = 0;
for (const { name, run } of tests) {
  try {
    await run();
    console.log(`PASS  ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL  ${name}`);
    console.error(`      ${error instanceof Error ? error.message : error}`);
  }
}

console.log(`\n${tests.length - failures}/${tests.length} deployed smoke tests passed.`);
if (failures) process.exit(1);
