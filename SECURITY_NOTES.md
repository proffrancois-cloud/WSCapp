# Security Notes

WSCapp is not only a static browser bundle. The repository currently contains:

- the public web shell under `app/`;
- Cloudflare Pages and Vercel Functions under `functions/` and `api/`;
- a Cloudflare Worker/Durable Object realtime service under `workers/realtime/`;
- an Electron desktop wrapper under `app/desktop/electron/`.

Anything shipped under `app/` is public. GitHub Pages, a plain local server, Electron, Cloudflare Pages, and Vercel do not expose the same server APIs or response headers, so each runtime must be reviewed separately.

## Supabase browser configuration

`app/supabase-config.js` contains the Supabase project URL and publishable browser key. The key is intentionally public and is never an authorization boundary. The classic shell loads `@supabase/supabase-js@2.108.1` asynchronously from jsDelivr; the app can still boot in local mode if that optional dependency is unavailable.

Security must come from the deployed database and auth configuration:

- enable Row Level Security on every browser-reachable table;
- restrict profiles and progress to the current authenticated user unless a field is deliberately public;
- apply the SQL migrations in the active project, then test them with anonymous and two distinct authenticated accounts;
- never add a service-role key, database password, JWT signing secret, OAuth secret, Resend key, or deployment credential to the repository or a public artifact.

`app/supabase/alpaccounts.sql` now removes the public alpaca-name-to-email resolver, limits profile updates to self-service columns, and defines account-scoped progress policies. Source SQL is not proof that the active project has those policies. Confirm that `resolve_alpaca_login(text)` and anonymous account-lookup RPCs are absent in production.

`app/supabase/alpacapardy_live.sql` contains the legacy/live game room surfaces. Their RPC/RLS, persistence, host authority, and moderation model require a separate production review before making durable multiplayer claims.

## Authentication, profile, and local progress

Local mode works without signing in. Sign-in and password recovery are email-only; the browser no longer resolves alpaca names to email addresses. Duplicate or invalid account data is reported generically.

The default online guest display name is `Guest`. Public Worker player snapshots strip school, country, rewards, email, and client-supplied user IDs. This does not replace a privacy policy, retention/deletion controls, or a product decision about whether school and country should be collected at all.

Browser progress uses versioned guest/account namespaces. Switching accounts invalidates stale remote loads, and remote saves are serialized. Account data and UUID-keyed local records still persist on a shared device until storage is cleared. Remote sync still replaces an entire snapshot and has no explicit revision/merge protocol, so conflict behavior remains a known limitation.

All browser-storage writes are non-fatal. The app continues when storage is unavailable and can expose a local-progress warning.

## Pages/Vercel Functions

Cloudflare adapters and Vercel handlers expose:

- `POST /api/send-feedback-email`;
- `GET /api/embed-library-resource`.

The feedback endpoint enforces an origin allowlist, a 32 KiB request limit in both the platform adapter and handler, bounded fields, a honeypot, and an in-memory per-client rate limit. Reporting another person requires a valid Supabase bearer token. Required Cloudflare bindings are documented in `docs/launch/cloudflare-supabase-cutover.md`.

Residual feedback risks:

- the rate-limit map is per warm isolate, not globally durable;
- forwarded client IP headers depend on correct platform configuration;
- guest problem reports do not use CAPTCHA or another proof-of-human mechanism;
- Supabase and Resend fetches still need operational timeout/alerting policy;
- tests exercise local handlers, not the deployed mail provider or production bindings.

The library proxy uses a host allowlist, revalidates redirects, probes the upstream resource, caps size/type, applies a sandbox CSP, and is rendered in an opaque sandboxed iframe. It does not sanitize arbitrary upstream HTML; containment therefore depends on the allowlist, iframe sandbox, CSP, and browser behavior. Keep the allowlist narrow and add timeouts/rate limits before expanding it.

These APIs are available on Cloudflare Pages and Vercel when configured. They are not provided by GitHub Pages, a plain static server, or the Electron `file:` runtime; the UI must keep its explicit fallback/disabled behavior there.

## Realtime and multiplayer

The 2D campus prefers the Cloudflare Worker/Durable Object endpoint and can fall back to Supabase Realtime during rollout. The Worker currently:

- rejects missing or unapproved `Origin` headers;
- caps rooms, message size, coordinates, nested payloads, chat length, and per-event/global message rates;
- strips private player fields and ignores a query-string `userId`;
- allocates unique client IDs when requested IDs collide.

These are containment measures, not authentication. `Origin` can be forged by non-browser clients. The Worker does not yet validate a WSCapp session ticket/JWT or enforce authenticated host/team/role permissions. Challenge and debate events remain substantially client-authoritative, and peers may receive answer/score state that a modified client can exploit. The Supabase fallback does not automatically inherit the Worker's filtering and rate limits.

Before treating the campus as a trusted public multiplayer service, add:

- short-lived server-issued session tickets and role authorization;
- server-owned question, timer, answer, and scoring state;
- parity tests for the Supabase fallback or removal of that fallback;
- durable abuse controls, room-creation limits, moderation, block/mute, and audit trails;
- WebRTC identity/permission checks and explicit TURN/privacy policy where audio is enabled.

## Browser and Electron boundaries

Vercel configuration and the Cloudflare `_headers` artifact define CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and framing protections. `index.html` also carries a baseline CSP for `file:`/static runtimes. The current CSP still needs `'unsafe-inline'` for the classic shell and permits a pinned jsDelivr dependency without Subresource Integrity; bundling and hashing scripts is the preferred long-term fix.

Electron enables sandboxing, context isolation, disables Node integration, and applies a protocol allowlist to external navigation. OAuth and password-recovery flows that cannot safely return to `file:` are hidden in desktop mode. Packaging tests must ensure every script referenced by `index.html`, including `realtime-config.js`, is included.

The retired-PWA path unregisters old service workers and clears legacy route caches. A future PWA reintroduction needs a fresh cache and update-security review.

## Safe HTML boundary

The classic app still uses HTML-string renderers. `app/src/app/app-dom-service.js` is the only approved source file allowed to write `innerHTML` or parse trusted markup. Generated guide/content HTML is treated as trusted build-time content. User-supplied data must use `textContent`, `escapeHtml`, or an equivalent sanitizer and must never be passed to `trustedHtml`.

`npm run test:html-boundary` verifies the helpers and an XSS-looking fixture. `npm run test:html-sinks` fails if direct HTML sinks appear outside the approved service.

## Release review checklist

- Apply and test Supabase RLS/RPC changes in the active project with anonymous, account A, and account B sessions.
- Verify the production Cloudflare/Vercel headers and Pages Function bindings, not only repository configuration.
- Exercise feedback size/rate/auth paths and a real Resend delivery in a non-production inbox.
- Test proxy redirects, MIME/size limits, timeout behavior, and sandbox escape attempts in a browser.
- Test Worker WebSocket authorization, payload secrecy, rate limits, load, and fallback parity.
- Verify account switching, stale remote loads, storage failure, conflicts, and clearing data on a shared device.
- Scan the final public artifact for secrets, local paths, authoring prompts, direct HTML sinks, and oversized assets.
- Confirm no service-role or deployment secret appears in source, generated files, artifacts, screenshots, logs, or docs.
