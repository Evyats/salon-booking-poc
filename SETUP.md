# Stage 1 setup

The repository is ready for one Vercel frontend and one Supabase backend.

## Local frontend

```powershell
cd frontend
npm install
npm run dev
```

Vite normally opens at `http://localhost:5173`. Stop it with `Ctrl+C`.

## Local Supabase

Start Docker Desktop first, then run from the repository root:

```powershell
npx supabase start
```

The first start downloads several Docker images. Supabase prints the local API,
Studio, database, and email-testing URLs when it is ready.

The public health endpoint is:

```text
http://127.0.0.1:54321/functions/v1/health
```

Useful commands:

```powershell
npx supabase status
npx supabase db reset
npx supabase stop
```

## Link a hosted Supabase project

Create the hosted project in the Supabase dashboard, then copy its project ref
from the dashboard URL and run:

```powershell
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase functions deploy health --use-api
```

The linked project ref is stored under `supabase/.temp/`, which Git ignores.

### Secrets

Frontend browser values belong in `frontend/.env.local`; start by copying
`frontend/.env.example`. Only the project URL and publishable key belong there.

Backend-only values belong in `supabase/functions/.env.local`; start by copying
`supabase/functions/.env.example`. Never use its values in React or commit them.

After replacing every placeholder with a real value, upload the backend secrets:

```powershell
npx supabase secrets set --env-file supabase/functions/.env.local
```

The hosted project currently uses `OTP_DELIVERY_MODE=mock`; generated codes are
visible only in the `request-booking-otp` function logs. Replace this mode when
the WhatsApp values become available. Supabase provides its own URL and
service-role credentials to deployed Edge Functions, so those do not need to be
copied into this file.

## Deploy the frontend to Vercel

In the Vercel dashboard, set the project's **Root Directory** to `frontend`.
Its `vercel.json` builds the Vite app and serves the `dist` output.

```powershell
cd frontend
npx vercel login
npx vercel
```

The second command creates a preview deployment and links the frontend. Once
the preview is approved, deploy production with:

```powershell
npx vercel --prod
```

When the frontend starts using Supabase, copy the two `VITE_` variables from
`frontend/.env.example` into the Vercel project's environment variables.

## Current boundaries

The health and OTP functions are public. OTP endpoints validate inputs and apply
per-number attempt/resend limits; stronger abuse controls are still required
before production use. Database migrations and owner access rules are applied.
WhatsApp delivery and real customer booking are later stages.
