# KAV / קו - Salon Booking POC

Hebrew, RTL, mobile-first React/Vite frontend for one fictional barbershop.

## Run locally

Requires Node.js 22.12+ (or a compatible current LTS release).

```sh
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite (normally http://localhost:5173).

```sh
npm run build
npm run preview
```

## Try the demo

Set `VITE_SUPABASE_URL`, choose a day and time, and enter a name plus Israeli
mobile number. Until WhatsApp is connected, read the six-digit code from the
`request-booking-otp` Edge Function logs in Supabase. A successful verification
creates a real appointment in the hosted POC database.

The browser stores the returned appointment display details and its cancellation
credential for the current tab/session. The phone is stored in the protected
database; plaintext OTPs appear only in temporary protected function logs and are
never stored in a table.

## Project structure

- `frontend/`: React/Vite app and local stock photography.
- `frontend/src/api.js`: browser calls to the public booking Edge Functions.
- `frontend/src/demo.js`: fixed opening hours and local display helpers.
- `frontend/src/cancel/`: appointment-specific customer cancellation page.
- `frontend/src/owner/`: authenticated owner login and scheduling dashboard.
- `scripts/smoke-test.mjs`: non-destructive checks against the deployed API.
- `supabase/`: local configuration, migrations, seed data, and Edge Functions.
- `supabase/tests/database/`: transactional pgTAP tests for permissions and booking rules.
- `supabase/functions/health/`: public backend health-check endpoint.
- `supabase/functions/owner-health/`: authenticated owner-role check endpoint.
- `supabase/functions/request-booking-otp/`: creates rate-limited OTP challenges.
- `supabase/functions/verify-booking-otp/`: verifies OTP challenges and counts failures.
- `supabase/functions/booking-slots/`: returns occupied slots without customer data.
- `supabase/functions/create-booking/`: atomically creates a verified booking.
- `supabase/functions/appointment-cancellation/`: loads or cancels the one
  appointment authorized by a secure token.
- `SETUP.md`: local commands and hosted Supabase/Vercel linking instructions.
- `docs/design/DESIGN.md`: reference synthesis, design tokens, and image sources.
- `docs/design/design-previews/`: desktop/mobile screenshots from the visual review.
- `PLAN.md`: implementation stages and current progress.
- `docs/design/inspirations/`: user-supplied design references.

The linked Supabase project has the database schema, access rules, customer
booking endpoints, and owner booking function. OTP and confirmation delivery are
temporarily mocked in protected function logs. The customer site is served at `/`,
secure appointment links open `/cancel`, and the authenticated owner dashboard is
at `/owner`. Vercel uses `frontend/` as its project root.

See `SETUP.md` for the current Supabase and Vercel setup.
