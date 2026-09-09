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

Choose a day and time, enter a name and an Israeli mobile number, then enter the
displayed demo code `123456`. No WhatsApp message is sent and no real appointment
is made. The header's "התור שלי" button opens your mock appointment, where you
can download a clearly labeled demo calendar event or cancel after confirmation.

Only the mock name, date, and time are stored for the current browser tab/session.
Phone numbers and verification codes are not persisted. This is not real auth.

## Project structure

- `frontend/`: React/Vite app and local stock photography.
- `frontend/src/demo.js`: mock availability and demo appointment storage.
- `supabase/`: local configuration, migrations, seed data, and Edge Functions.
- `supabase/functions/health/`: public backend health-check endpoint.
- `supabase/functions/owner-health/`: authenticated owner-role check endpoint.
- `supabase/functions/request-booking-otp/`: creates rate-limited OTP challenges.
- `supabase/functions/verify-booking-otp/`: verifies OTP challenges and counts failures.
- `SETUP.md`: local commands and hosted Supabase/Vercel linking instructions.
- `docs/design/DESIGN.md`: reference synthesis, design tokens, and image sources.
- `docs/design/design-previews/`: desktop/mobile screenshots from the visual review.
- `PLAN.md`: implementation stages and current progress.
- `docs/design/inspirations/`: user-supplied design references.

The frontend is deployed through Vercel. The linked Supabase project has the
database schema, access rules, and deployed OTP Edge Functions. OTP delivery is
temporarily mocked in protected function logs; the frontend still uses its
displayed demo code until Stage 6 connects it to the backend. The owner dashboard
remains for a later stage. Vercel uses `frontend/` as its project root.

See `SETUP.md` for the current Supabase and Vercel setup.
