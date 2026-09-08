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

Current: frontend design first, as requested. The React/Vite customer prototype
is implemented with mock data. See `docs/design/DESIGN.md` for the visual direction and
README.md for local startup. Full implementation stages below remain incomplete.

Stage 1 local setup is complete. The hosted Supabase project is linked and the
public health function is deployed and verified. Vercel linking and the frontend
preview deployment remain. Docker Desktop is only needed for the local Supabase
stack. See SETUP.md.

Next: link Vercel and deploy the frontend preview to finish Stage 1, then begin
the WhatsApp proof.

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

- [ ] 1. Setup
  - [x] Initialize the Git repository and React/Vite frontend.
  - [x] Add the project-scoped Supabase CLI and local configuration.
  - [x] Add the Edge Functions structure and a public health endpoint.
  - [x] Add Vercel frontend-only build/routing configuration.
  - [x] Keep secrets out of Git and provide frontend/backend env examples.
  - [x] Link a hosted Supabase project and deploy the health function.
  - [x] Confirm that real backend secrets are deferred until WhatsApp and OTP.
  - [ ] Link Vercel and create a frontend preview deployment.

- [ ] 2. WhatsApp proof
  - Set up Meta developer/business accounts and the provided test sender.
  - Add and verify your personal phone as a test recipient.
  - Send a test message, then prove OTP delivery to your phone.

- [ ] 3. Database
  - Create migrations for customers, appointments, and otp_challenges.
  - Include a customer blocked flag.
  - Apply the migrations to Supabase.

- [ ] 4. Access and booking rules
  - Configure owner login and RLS permissions.
  - Define database constraints preventing double bookings.
  - Require owner authorization for owner actions, including when backend code
    uses the service-role key.

- [ ] 5. OTP
  - Generate codes and store keyed hashes (HMAC).
  - Keep the HMAC secret in backend environment variables.
  - Verify and consume codes; enforce expiry, attempt limits, and resend limits.
  - Phone verification authorizes booking; a persistent customer account/login
    is outside this POC's scope.

- [ ] 6. Customer booking
  - Show fixed available slots and collect name plus WhatsApp number.
  - Verify OTP, then create the appointment if the slot is still available.
  - Show confirmation and send WhatsApp confirmation.
  - Reject bookings from blocked customers.

- [ ] 7. Owner dashboard
  - View today's and upcoming appointments.
  - Manually add and cancel appointments.
  - Mark customers as blocked.

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
