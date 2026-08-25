This is the Next.js site for [Mahingan Martial Arts](https://mahinganma.com).

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Smartwaiver signup links

Landing-page CTAs use Smartwaiver URLs with a per-program `auto_tag` (`bjj`, `boxing`, `young_warriors`, `trial`). Set `NEXT_PUBLIC_SMARTWAIVER_TEMPLATE_ID` (or per-program `NEXT_PUBLIC_SMARTWAIVER_WAIVER_*` overrides).

## Admin roster

Staff tools live at `/admin` (sign-in only; emails must be listed in `ADMIN_EMAILS`).

1. Provision Lakebase Postgres and Neon Auth, then copy `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `NEON_AUTH_BASE_URL`, and `NEON_AUTH_COOKIE_SECRET`.
2. Create staff users in Neon Auth (there is no public sign-up page).
3. Run `npm run db:migrate` against the unpooled URL.
4. Point the Smartwaiver webhook at `/api/webhooks/smartwaiver/<SMARTWAIVER_WEBHOOK_TOKEN>`.
5. Point Stripe at `/api/webhooks/stripe` and Twilio inbound SMS at `/api/webhooks/twilio/inbound`.
6. Set `CRON_SECRET` so Vercel Cron can call `/api/cron/smartwaiver` and `/api/cron/stripe` once per day (Hobby accounts cannot run more frequent crons; the Smartwaiver webhook still ingests signups in near real time).

See `.env.example` for the full list of keys. Each integration degrades to a “not configured” state when its secrets are missing.

Marketing email/SMS requires recorded consent (Smartwaiver `marketingAllowed` / custom fields, plus admin, Resend unsubscribe, and SMS `STOP`). Transactional messages do not. Minors are messaged via guardian contact details when present.
