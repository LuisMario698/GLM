# GLM

GLM is a production-ready Next.js 16 App Router foundation for a health, habits, and home-training Progressive Web App.

## Stack

- Next.js 16 App Router with TypeScript
- Tailwind CSS v4 and shadcn/ui conventions
- Supabase SSR clients and SQL schema
- Zustand persisted client state
- Recharts data visualization
- PWA manifest and service-worker integration through `next-pwa`

## Getting started

```bash
cp .env.example .env.local
npm install
npm run dev
```

Configure Supabase with the variables in `.env.example` and apply `supabase/schema.sql` before connecting live data.
