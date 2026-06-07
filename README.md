# AppCraft

AppCraft is a Next.js 14 application for generating job application materials from a reusable career profile. It uses Supabase for Auth/Postgres/Storage and Anthropic Claude for structured job reading and application tailoring.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

3. Fill in:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ANTHROPIC_API_KEY`

4. Run the Supabase migration in `supabase/migrations/0001_appcraft_schema.sql`.

5. Start the app:

   ```bash
   npm run dev
   ```

## Verification

```bash
npm run lint
npm run typecheck
npm run build
```