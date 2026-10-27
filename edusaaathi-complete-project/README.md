# Edusaaathi — Education Consultancy Website

A custom editorial-style, mobile-first Edusaaathi website built with the Next.js App Router, TypeScript, Tailwind CSS v4, GSAP, ScrollTrigger and Lenis.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Use `npm run lint` for the TypeScript check and `npm run build` for a production build.

### Local admin access

Open `/admin/login`. In development, the preview-only default password is `coursesathi-demo`. If `ADMIN_PASSWORD` is set in `.env.local`, that value replaces the development default. The dashboard is served behind a signed, HttpOnly, eight-hour admin cookie; admin API routes also verify the session.

**Do not use the development default in production.** Set both `ADMIN_PASSWORD` and a long, random `ADMIN_SESSION_SECRET` before deploying. If either is missing in production, admin sign-in is disabled.

## Netlify deployment

The project includes `netlify.toml` and `.nvmrc`. Netlify's current Next.js adapter supports the App Router and Route Handlers; linked Git deployments use Netlify's OpenNext adapter with automatic framework setup. For the normal Git flow, push this project to a Git provider, create a Netlify site from that repository, and set the environment variables below in Netlify Site configuration. The config uses `npm run build` and `.next` as the publish directory. Add `coursesathi.in` as a custom domain in Netlify and follow its DNS instructions after the site is deployed.

For a **visual-only client demo**, the seeded course pages can be deployed as-is. The enquiry form and admin screens are present, but writes to the JSON store are not durable on Netlify Functions; don't use a demo deployment to collect real enquiries or rely on course edits surviving. Before real use, replace `lib/data-store.ts` with a persistent database or Netlify Blobs adapter, then verify enquiry writes, admin CRUD, and reads across function invocations. I don't have access to a Netlify account, site ID, auth token, or Git remote in this workspace, so I can prepare the project but cannot publish it or configure your DNS from here.

### Static Netlify Drop client-demo ZIP

To rebuild the visual-only static bundle, run `npm run build`, start the production app with `npm run start`, then run `python3 scripts/create_netlify_drop_demo.py` in another terminal. The script fetches the rendered pages from `http://localhost:3000` and creates `edusaaathi-netlify-demo.zip` in the project root. Extract that ZIP and drop the extracted site folder into Netlify Drop. It includes the self-hosted education-globe hero and student-study counselling backgrounds plus bundled front-end assets; the enquiry form only displays a demo notice, and the static bundle has no admin dashboard, API, or persistent data. Keep the full Next.js project for the API-connected implementation.

## Configuration

Copy `.env.example` to `.env.local` for local development; enter approved values in Netlify's environment variable settings for a hosted build:

```env
NEXT_PUBLIC_SITE_URL=https://coursesathi.in
NEXT_PUBLIC_WHATSAPP_NUMBER=
NEXT_PUBLIC_CONTACT_EMAIL=
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=
```

`NEXT_PUBLIC_WHATSAPP_NUMBER` must be the business number in international format, digits only (for India, include `91` and omit `+`). Until it is configured, WhatsApp links open WhatsApp's recipient chooser with the course-specific message prefilled. No client contact details or business number were supplied with the brief, so the project intentionally does not invent one. `NEXT_PUBLIC_CONTACT_EMAIL` is optional.

## What is included

- A premium editorial homepage with an education-globe hero background and student-study counselling panel, paired with reduced-motion-aware entrance animation.
- Course discovery, editorial three-step guidance, why Edusaaathi, counselling CTA, native accessible FAQ accordions and footer.
- `/courses` and `/courses/[slug]` pages, dynamic page metadata, canonical URLs, course-list and breadcrumb JSON-LD, sitemap and robots routes, and a custom 404.
- A delayed, dismissible enquiry dialog. Its form validates and saves before showing success; a dismissal is remembered in local storage for seven days.
- An authenticated admin workspace for creating, editing, publishing/unpublishing and deleting course guides; reviewing, searching and filtering enquiries; and updating enquiry status.
- A reduced-motion-aware Lenis/GSAP setup with ScrollTrigger reveal sequences and lifecycle cleanup.
- Self-hosted Manrope variable font assets under `public/fonts` (SIL Open Font License).

## Data and deployment notes

Course and enquiry data are read by server-side repository functions and exposed through the first-party `/api/courses`, `/api/courses/[slug]` and `/api/enquiries` API routes. Initial editable sample course records are in `data/courses.json`; enquiry records are written to `data/enquiries.json`. The admin CRUD API updates the same course store. Course copy is deliberately institution-neutral; durations are marked typical and eligibility/admissions must be confirmed with the relevant institution. Fees remain empty until supplied.

The bundled store is a small, file-backed first-version adapter so this project works without an external service. It is suitable for local development and a single persistent Node server, but it is **not a multi-instance/serverless database**. For a production deployment with multiple instances, ephemeral storage or stronger operational guarantees, replace `lib/data-store.ts` with a persistent database adapter (for example PostgreSQL) and keep the existing API contract. Back up and migrate any local JSON records before switching stores.

The privacy and terms pages are clearly marked as working drafts because final legal and data-retention details were not provided. Have them reviewed and aligned with the deployed storage/contact process before launch.

## Project structure

```text
app/
  (site)/                 Public site pages and shared public layout
  admin/                  Authenticated admin pages
  api/                    Public enquiry/course and protected admin APIs
  globals.css             Tailwind v4 theme plus responsive visual system
components/               Hero, course cards, forms, motion and admin UI
lib/                      Types, config, auth and file-backed data adapter
data/                     Editable starter course data and enquiry store
public/fonts/             Self-hosted Manrope variable WOFF2 + licence
public/images/            Education-globe hero and student-study counselling backgrounds
```
