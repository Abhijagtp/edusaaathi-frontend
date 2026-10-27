# Edusaaathi — Editable Frontend Source

This is the editable Next.js project for future design and API-connected updates. It is separate from `edusaaathi-netlify-demo.zip`, which is a static, visual-only Netlify Drop demo.

## Run the project locally

1. Install Node.js 20 (the project version is recorded in `.nvmrc`).
2. Extract the source ZIP and open a terminal in the `edusaaathi-frontend-source` folder.
3. Install the locked dependencies:

   ```bash
   npm ci
   ```

4. Copy `.env.example` to `.env.local` and add only client-approved values when available.
5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open `http://localhost:3000`.

## Useful files

- `components/hero.tsx` — hero content and entrance motion.
- `app/globals.css` — responsive styles and the full-width, blended hero background.
- `public/images/elegant-education-globe.webp` and `public/images/moody-student-study.webp` — public hero and counselling-panel backgrounds.
- `app/(site)/page.tsx` — homepage and course listing.
- `data/courses.json` — sample course content.
- `app/api/` and `lib/` — current API and data-store scaffolding.

Run `npm run lint` for the TypeScript check and `npm run build` for a production build. The static Netlify Drop demo is for preview only; its enquiry form does not save submissions. Use this source project for further edits.
