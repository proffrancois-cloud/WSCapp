# Security Notes

This app is a static browser app. Anything shipped under `app/` is public once
deployed to Vercel or GitHub Pages.

## Supabase Browser Config

`app/supabase-config.js` contains the Supabase project URL and publishable
browser key. This key is not treated as a secret. It identifies the Supabase
project to the browser client.

Security must come from Supabase configuration:

- Row Level Security must be enabled on every public table that the browser can
  read or write.
- Policies must limit each user to their own Alpaccount profile/progress unless
  the feature intentionally exposes shared room data.
- Server-only secrets must never be added to this repo or any static artifact.

Do not commit:

- Supabase service role keys.
- Database passwords.
- JWT signing secrets.
- OAuth client secrets.
- Vercel tokens or deployment credentials.
- Private API keys for third-party services.

## Current Database Surfaces

`app/supabase/alpaccounts.sql` defines Alpaccount profiles and progress. It
enables RLS and grants authenticated users access to their own profile data.

`app/supabase/alpacapardy_live.sql` defines legacy/future live game room tables.
It enables RLS and currently gates live-room access through authenticated users
and the admin-tester helper policies in that script.

The 3D campus currently uses Supabase Realtime presence/broadcast for online
campus state. Presence and broadcast data should be treated as live session
messages, not persisted authoritative MMO state.

## Current Client Behavior

The main app allows local mode without signing in. Alpaccount sign-in is
optional for progress sync.

Alpaccount sign-in and password reset are email-only. The browser client no
longer resolves alpaca names to email addresses, and the SQL setup drops
`resolve_alpaca_login(text)`. The signup form also avoids an anonymous
preflight name-availability response; duplicate or invalid account data is
reported with generic wording.

The 3D campus multiplayer entry does not force Alpaccount login. The visible
default online alpaca identity remains `Devalpacca` in the main app entry card.

Legacy live Alpacapardy room features may request an authenticated or anonymous
Supabase session when the user tries to create or join a live room. That path is
separate from the public 3D campus launcher.

## Review Checklist

- Confirm RLS is enabled for every table reachable from browser code.
- Confirm policies have been applied in the active Supabase project, not only
  stored in SQL files.
- Confirm Realtime channels do not expose private profile or progress data.
- Confirm `resolve_alpaca_login(text)` is absent in the active Supabase project.
- Confirm anonymous users cannot call name-availability/account-lookup RPCs.
- Confirm anonymous sign-in is intentionally enabled or disabled for the live
  features that use it.
- Confirm no service-role or deployment secrets appear in source, generated
  files, build artifacts, screenshots, docs, or browser-visible config.
