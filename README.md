# Material Manager

Internal inventory tracking app for a small team (3–4 users). React (Create React App) on the front end, Supabase (PostgreSQL + Auth) on the back end.

## Features

- Email + password auth (no public signups), with password reset
- Roles: **Admin** and **Staff**, enforced in both UI and Row-Level Security
- Materials list with search and sort, low-stock badges
- Atomic stock IN/OUT via a Postgres function (`update_stock`)
- Immutable transaction log grouped by day
- Admin panel for managing user roles
- Real-time updates on the materials table

## Tech stack

- Create React App (JavaScript)
- Supabase (Auth + PostgreSQL)
- Zustand (state)
- React Router v6
- Tailwind CSS v3
- Lucide React (icons)
- React Hot Toast (notifications)

## 1. Install

```bash
npm install
```

## 2. Configure environment

Copy `.env.example` to `.env` and fill in your Supabase project URL and anon key.

```bash
cp .env.example .env
```

```
REACT_APP_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
REACT_APP_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

You can find both values in your Supabase project under **Project Settings → API**.

## 3. Set up Supabase

1. **Create a new Supabase project** at [supabase.com](https://supabase.com).
2. **Run the schema**: open the **SQL Editor**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates the `profiles`, `materials`, and `transactions` tables, the new-user trigger, and the `update_stock` RPC.
3. **Run the RLS policies**: open a new SQL Editor query, paste the contents of [`supabase/rls_policies.sql`](supabase/rls_policies.sql), and run it. This enables Row-Level Security and adds role-based policies.
4. **Enable email auth**: go to **Authentication → Providers**, make sure Email is enabled.
5. **Disable public signups**: go to **Authentication → Sign In / Up** (or **Settings**), and disable "Allow new users to sign up". You'll create users manually.
6. **Create the first admin user**:
   - Go to **Authentication → Users → Add user → Create new user**.
   - Enter an email and password. Tick "Auto Confirm User".
   - This will trigger the `handle_new_user` function and insert a row into `profiles` with role `staff`.
   - Go to **Table Editor → profiles**, find the new row, and change `role` to `admin`. Optionally set the `name` field.
7. (Optional) Add staff users the same way — they'll default to `staff`.

## 4. Run locally

```bash
npm start
```

The app opens at `http://localhost:3000`.

## Roles cheat sheet

| Feature                       | Admin | Staff |
|-------------------------------|:-----:|:-----:|
| View materials, logs, profile |   ✓   |   ✓   |
| Add stock (IN) / Remove (OUT) |   ✓   |   ✓   |
| Add / edit / delete material  |   ✓   |   ✗   |
| Admin panel (manage users)    |   ✓   |   ✗   |

## Project layout

```
src/
  components/
    ui/        Button, Input, Badge, Card, Modal, EmptyState, Spinner, ErrorState
    layout/    Sidebar, TopBar, BottomNav, AppLayout, ProtectedRoute
  pages/       Login, Dashboard, Materials, MaterialDetail, AddMaterial, Logs, Profile, Admin
  services/    supabaseClient, materialsService, transactionsService, usersService
  stores/      authStore, materialsStore
  utils/       formatters, validators
supabase/
  schema.sql
  rls_policies.sql
```

## Notes

- Stock quantities are **never** updated directly. Every IN/OUT goes through the `update_stock` RPC and inserts a `transactions` row.
- The `update_stock` function rejects OUT operations that would push quantity below zero.
- The transactions table has no UPDATE or DELETE policies — it's an append-only audit log.
