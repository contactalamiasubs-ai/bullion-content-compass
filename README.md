# جولد سنتر — Gold Center

موقع ذهب ومعادن ثمينة بالعربي (RTL) والإنجليزي، مع لوحة تحكم كاملة لتعديل كل محتوى
الموقع. / A gold and precious-metals site (Arabic RTL + English) with a full admin
dashboard for editing every part of the site.

## Stack

- TanStack Start v1 (React 19, Vite 7, SSR + server functions)
- Tailwind CSS v4, shadcn/ui components
- Lovable Cloud backend (Supabase): auth, Postgres tables, private media storage
- Lovable AI Gateway for price-quote analysis

## Requirements

- [Bun](https://bun.sh) 1.2 or newer (the lockfile is `bun.lock`)

## Setup

```sh
bun install
cp .env.example .env   # then fill in your own backend values
bun run dev            # http://localhost:8080
```

## Scripts

| Command           | What it does                          |
| ----------------- | ------------------------------------- |
| `bun run dev`     | Start the dev server                  |
| `bun run build`   | Production build                      |
| `bun run preview` | Serve the built app                   |
| `bun run test`    | Run the test suite (vitest)           |
| `bun run lint`    | ESLint over the whole project         |
| `bun run format`  | Prettier write                        |

## Environment

`.env` holds only public backend settings (the project URL and the publishable
key). Row-level security in the database is what protects the data, so those two
values are safe to keep in the repository. Copy `.env.example` when you start a
fresh clone.

Private keys (`SUPABASE_SERVICE_ROLE_KEY`, cron secrets, AI keys) must never be
committed — they live in the hosting platform's secret store and are read inside
server handlers only.

## Structure

- `src/routes/` — public pages (`/`, `/products`, `/products/$id`, `/services`,
  `/about`, `/blog`, `/news`, `/posts/$slug`, `/contact`), `/auth`, and
  `_authenticated/admin` (the dashboard, login-protected)
- `src/components/site.tsx` — shared header, footer, popup, cards
- `src/components/admin/editors.tsx` — generic list/single editors used by the dashboard
- `src/lib/` — content queries, i18n (`pick()` for `_ar`/`_en` columns), WhatsApp
  link builder, price validation, price refresh function
- `drizzle/` — database schema and migrations
- `src/test/` — tests

## Content and admin

All site content (texts, prices, slides, products, posts) lives in database
tables with `_ar`/`_en` columns and is edited from `/admin`. The first signed-up
account becomes the administrator; writes are admin-only through row-level
security. The WhatsApp order number is set in the dashboard's general settings
and every order button uses it.

## CI

`.github/workflows/ci.yml` installs dependencies, then runs lint, tests, and the
production build on every push and pull request.
