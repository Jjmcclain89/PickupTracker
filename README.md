# Pickup Tracker — free play pickup tracker

Coordinates casino free play pickups between Josh, Igor, and Dave (plus a Test account).

## Stack
- Next.js 15 (App Router) + TypeScript + Tailwind
- Supabase (Postgres + Auth)
- Deploy target: Vercel

## Setup

### 1. Create a Supabase project
Free tier is plenty for this. Grab from **Project Settings → API**:
- Project URL
- `anon` public key
- `service_role` secret key (only needed for the one-time seed script — never expose this in the app)

### 2. Run the schema
Paste `supabase/schema.sql` into the Supabase SQL Editor and run it. This creates:
- `profiles` (extends `auth.users`, auto-populated on signup)
- `pickups`
- RLS policies (any signed-in user of the 4 can read/write everything — it's a small shared tool, not multi-tenant)

### 3. Create the 4 users
```bash
SUPABASE_URL=https://xxxx.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=xxxx \
node scripts/seed-users.mjs
```
Creates `josh`, `igor`, `dave`, `test`, all with password `123123123` and `must_change_password: true`. First login redirects to `/change-password` before they can see the board.

### 4. Local dev
```bash
cp .env.local.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev
```

### 5. Deploy to Vercel
- Push this repo to GitHub
- Import into Vercel
- Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as env vars
- Deploy

## How status works
Status isn't a field you set — it's derived from dates + a `picked_up_at` timestamp:
- `picked_up_at` set → **Picked up** (sticks regardless of dates)
- else, today before `date_start` → **Upcoming pickup**
- else, today after `date_end` → **Expired**
- else → **Active pickup**

See `src/types/pickup.ts` (`getPickupStatus`).

## Login
Auth is username-based on top of Supabase's email auth: usernames map to
`{username}@pickup-tracker.local` internally. Nobody needs to know or use a real email.
