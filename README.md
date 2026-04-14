# Eventra Demo App

Eventra is now converted into a functional React + Supabase demo while preserving the original Stitch visual language and page intent.

## What is implemented

- Public pages: Landing, Sign Up, Login, Event Listing, Event Details.
- User pages: Dashboard and QR Ticket.
- Admin pages: Dashboard, Add Event, Manage Events, Participants, Attendance Report, QR Scanner.
- Auth: Supabase Auth (with local demo fallback when env vars are missing).
- Data: profiles, events, registrations, attendance through Supabase tables (or browser local storage fallback).
- QR flow: QR generation on ticket and scanner check-in on admin scanner page.

## Supabase Setup

1. Install packages:
   npm install
2. Configure env at project root:
   create a file named `.env` beside `package.json` and fill:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
3. In Supabase SQL editor, run:
   supabase/schema.sql
4. Start app:
   npm run dev

## SQL schema

- Full schema file: `supabase/schema.sql`
- Core tables:
  - `profiles`: app role (`user` or `admin`) linked to auth user
  - `events`: event catalog managed by admins
  - `registrations`: event registrations (unique per user+event)
  - `attendance`: check-in state linked to registration

## Simple RLS policy suggestions

The provided schema already includes practical demo policies:

1. `profiles`
   - user can read/update only own profile
2. `events`
   - everyone can read active events
   - only admin role can create/update/delete events
3. `registrations`
   - user can register and read own registrations
   - admin can read/manage all registrations
4. `attendance`
   - user can read own attendance
   - user can insert pending row for own registration
   - admin can mark/manage attendance records

## Demo roles

- User account: sign up creates a user account by default
- Admin account: use an existing admin account or the local fallback admin demo login
- In local fallback mode, logging in with an email that includes `admin` grants admin role.

## Notes

- Original Stitch HTML exports are kept in their original folders and used as design reference.
- The React app intentionally reuses the same color tokens, typography, spacing style, and page structure flow.
- Registration prevents duplicates and checks seat capacity against event limit.
- Admin can create, edit, and delete events from the manage events flow.
