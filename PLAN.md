# Salon Booking POC

## Scope

One fake salon, one barber, one service: Haircut — 30 minutes.
Use fixed time slots. No businesses table or business_id.

Stack: React + Vite frontend hosted on Vercel; Supabase for PostgreSQL,
owner authentication, and backend Edge Functions; Meta WhatsApp Cloud API.
Keep everything in one Git repository.

Skip multiple businesses, employees, multiple services, advanced calendars,
recurring schedules, payments, and customer account dashboards.

## Progress

The React/Vite customer prototype is implemented with mock data. See
`docs/design/DESIGN.md` for the visual direction and README.md for local startup.

Stage 1 is complete. The hosted Supabase project is linked, the public health
function is deployed and verified, and the frontend is deployed on Vercel.
Docker Desktop is only needed for the local Supabase stack. See SETUP.md.

Stage 2 is temporarily paused because Meta's developer-account SMS verification
is not delivering its code. Stage 3 is complete: the hosted database has the
customers, appointments, and otp_challenges tables with RLS enabled.

Stage 4 database rules are applied: authenticated users need protected owner
metadata to access customer and appointment rows, and the database rejects two
confirmed appointments for the same half-hour slot. The owner Auth user now has
the protected owner role. A protected owner-health function rejects requests
without authentication; its owner-token success path will be tested with login.

Stages 5 through 7 are complete. The deployed customer flow creates verified
bookings, and `/owner` authenticates through Supabase Auth before reading or
changing data under owner RLS policies. Next: add appointment-specific customer
cancellation links.

- [x] Review all supplied references and define one Hebrew, mobile-first identity.
- [x] Implement the customer frontend with stock images and mock booking flow.
- [x] Verify desktop/mobile layouts and the interactive demo flow.

Frontend verification (2026-09-07): production build passed; no horizontal
overflow at 320, 360, 390, 768, 1024, and 1440px; no browser errors/warnings.
Checked date/week navigation, invalid details, wrong/correct demo codes,
confirmation, calendar download, reload persistence, cancellation confirmation,
mobile navigation, FAQ expansion, and dialog keyboard focus/Escape.
Automated axe WCAG A/AA checks reported no violations on the final desktop/mobile
page and details dialog. Preview screenshots are in `docs/design/design-previews/`.

Update this checklist after completing and verifying each stage. Record partial
progress or blockers under its stage, and update the next-stage line above.

## Stages

- [x] 1. Setup
  - [x] Initialize the Git repository and React/Vite frontend.
  - [x] Add the project-scoped Supabase CLI and local configuration.
  - [x] Add the Edge Functions structure and a public health endpoint.
  - [x] Add Vercel frontend-only build/routing configuration.
  - [x] Keep secrets out of Git and provide frontend/backend env examples.
  - [x] Link a hosted Supabase project and deploy the health function.
  - [x] Confirm that real backend secrets are deferred until WhatsApp and OTP.
  - [x] Link Vercel and create a frontend deployment.

- [ ] 2. WhatsApp proof
  - Set up Meta developer/business accounts and the provided test sender.
  - Add and verify your personal phone as a test recipient.
  - Send a test message, then prove OTP delivery to your phone.
  - Blocked for now: Meta developer-account SMS verification is not arriving.

- [x] 3. Database
  - [x] Create migrations for customers, appointments, and otp_challenges.
  - [x] Include a customer blocked flag.
  - [x] Apply the migrations to Supabase.

- [x] 4. Access and booking rules
  - [x] Create the owner Auth user and assign protected owner metadata.
  - [x] Configure owner-only RLS permissions.
  - [x] Define database constraints preventing double bookings.
  - [x] Add a protected owner endpoint that checks authentication and owner role.
  - [x] Verify its owner-token success path through the owner login UI.
  - [x] Keep owner actions under the user JWT and RLS instead of service-role access.

- [x] 5. OTP
  - [x] Generate codes and store keyed hashes (HMAC).
  - [x] Keep the HMAC secret in backend environment variables.
  - [x] Deploy public request and verification Edge Functions.
  - [x] Enforce expiry, attempt limits, and resend limits.
  - [x] Test challenge creation, wrong attempts, and resend blocking live.
  - [x] Verify one correct mock code from the protected function log.
  - [x] Consume a verified challenge atomically when Stage 6 creates a booking.
  - Phone verification authorizes booking; a persistent customer account/login
    is outside this POC's scope.

- [x] 6. Customer booking
  - [x] Show fixed slots minus confirmed database appointments.
  - [x] Collect name plus WhatsApp number and request a real OTP challenge.
  - [x] Verify OTP, then atomically consume it and create the appointment.
  - [x] Reject booking conflicts and blocked customers in the database.
  - [x] Show confirmation and temporarily log the confirmation for mock delivery.
  - [x] Verify the complete browser flow using a code from protected logs.

- [x] 7. Owner dashboard
  - [x] Add an owner-only login and verify protected owner metadata.
  - [x] View today's and upcoming appointments in a mobile-first timeline.
  - [x] Add appointments manually through an atomic owner-only function.
  - [x] Cancel appointments and release their slots.
  - [x] Block and unblock customers through owner RLS permissions.
  - [x] Configure the Vercel publishable key and test all actions live.

- [ ] 8. Customer cancellation
  - Provide an unguessable link authorizing access to one appointment.
  - Require an explicit confirmation button to cancel.
  - Release the slot after cancellation.

- [ ] 9. Deploy and test
  - Verify the deployed customer and owner flows.
  - Check simultaneous bookings, permissions, expired/reused OTPs, and limits.
  - Check cancellation and blocking.
  - Handle WhatsApp failures without losing or duplicating a saved appointment.

- [ ] 10. Optional reminders
  - Add a manually triggered WhatsApp reminder.

## Later ideas — not current implementation stages

- Appointment-specific rescheduling links sent through WhatsApp.
- Incoming WhatsApp messages received through webhooks.
- A production sending number, possibly with eligible WhatsApp Coexistence.
- Scheduled reminders and reliable message retries.
