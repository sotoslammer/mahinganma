Marketing site and student signup for Mahingan Martial Arts, built with [Next.js](https://nextjs.org).

## What it does

- **Landing page** at `/` — programs, schedule, contact form.
- **Signup and waiver** at `/signup` — collects student details and captures a hand-drawn
  signature. Students under 18 cannot sign for themselves; the form requires a parent or
  guardian, and the server re-derives that from the date of birth rather than trusting the
  browser. On submit the owner is notified and the signer is emailed a PDF of what they signed.
- **Owner area** at `/admin` — the student list, each student's record, and their signed
  waivers, viewable on screen or downloadable as PDF.

Each signature stores a snapshot of the exact wording it was shown, so changing the current
waiver never alters an existing record.

## Getting started

```bash
npm install
cp .env.example .env   # then fill it in — see the comments in that file
```

You need a Postgres database. For local development the quickest option is Prisma's own:

```bash
npx prisma dev --name mahingan   # prints a DATABASE_URL; paste it into .env
npm run db:migrate               # create the tables
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The owner area is at `/admin`, using the
`ADMIN_PASSWORD` from your `.env`.

Without `RESEND_API_KEY` the app still records signups; it skips sending mail and logs that
it did so, which is usually what you want locally.

## The waiver wording is a placeholder

`lib/waiver.ts` ships a structural draft that has **not** been reviewed by a lawyer, and it
prints a notice saying so on every copy. To put real wording into service: replace the
sections, set `WAIVER_IS_DRAFT` to `false`, and bump `WAIVER_VERSION`.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Generate the Prisma client, then build |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Create and apply a migration in development |
| `npm run db:deploy` | Apply existing migrations (production) |
| `npm run db:studio` | Browse the database |

## Deploying

Set `DATABASE_URL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `RESEND_API_KEY`, `RESEND_FROM`
and `SIGNUP_NOTIFY_EMAIL` in your Vercel project, then run `npm run db:deploy` against the
production database whenever a migration is added.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
