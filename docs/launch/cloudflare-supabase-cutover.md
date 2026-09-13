# WSCapp Cloudflare and Supabase Cutover

## Cloudflare Pages

Create or verify a Pages project with these settings:

- Project name: `wscapp`
- Git repository: `proffrancois-cloud/WSCapp`
- Production branch: `main`
- Root directory: repository root
- Build command: `cd app && npm ci && npm run build:pages`
- Build output directory: `app/dist-pages`
- Environment variable: `NODE_VERSION=24`
- Custom domain: `wscapp.app`
- Optional custom domain: `www.wscapp.app`, redirected/canonicalized to `https://wscapp.app`

The repo also includes root `wrangler.jsonc` for direct Pages deploys of `app/dist-pages`.

### Pages Functions environment

The feedback endpoint is a Pages Function. Configure the following bindings in both the Production and Preview environments before deploying it:

| Binding | Required | Purpose |
| --- | --- | --- |
| `RESEND_API_KEY` | Yes | Secret API key used to send the report email. |
| `WSC_FEEDBACK_FROM_EMAIL` | Yes | Resend-verified sender, for example `WSCapp <reports@wscapp.app>`. |
| `SUPABASE_PUBLISHABLE_KEY` | Yes for person reports | Browser-safe project key used only to verify the reporter's bearer token. |
| `SUPABASE_URL` | Recommended | Supabase project URL; the current project URL is the code fallback. |
| `WSC_ADMIN_EMAIL` | Optional | Report destination; defaults to the current admin address. |
| `WSC_ALLOWED_ORIGINS` | Optional | Comma-separated extra trusted origins for previews. |

Keep `RESEND_API_KEY` in Cloudflare's encrypted Secrets surface, not in `wrangler.jsonc` or Git. After changing a binding, redeploy and verify both a signed-in person report and a guest problem report. A missing mail key/sender intentionally returns `503`; a missing Supabase publishable key prevents authenticated person reports from being verified.

Current Cloudflare state:

- Pages project `wscapp` exists.
- Latest direct Pages deployment is available on `https://wscapp.pages.dev`.
- Custom domains `wscapp.app` and `www.wscapp.app` are attached to the Pages project and active.
- `wscapp.app` serves the Pages app.
- `www.wscapp.app` has a Cloudflare Redirect Rule to canonicalize to `https://wscapp.app`.

Active DNS records in Cloudflare DNS:

| Type | Name | Target | Proxy |
| --- | --- | --- | --- |
| `CNAME` | `@` | `wscapp.pages.dev` | Proxied |
| `CNAME` | `www` | `wscapp.pages.dev` | Proxied |

Cloudflare supports CNAME flattening at the apex, so the `@` CNAME is valid for `wscapp.app`.

## Supabase Auth

In Supabase Dashboard, update Authentication URL settings:

- Site URL: `https://wscapp.app`
- Redirect URLs:
  - `https://wsc-2026-study-routes.vercel.app/**`
  - `https://proffrancois-cloud.github.io/wsc-2026-study-routes/**`
  - `https://wscapp.app/**`
  - `https://www.wscapp.app/**`
  - `https://proffrancois-cloud.github.io/WSCapp/**`
  - `http://localhost:4173/**`

Current Supabase state:

- Site URL is set to `https://wscapp.app`.
- Redirect URLs include the old Vercel/GitHub URLs temporarily plus the new `wscapp.app`, `www.wscapp.app`, `WSCapp` GitHub Pages, and localhost entries.
- Remove the old Vercel/GitHub `wsc-2026-study-routes` URLs after the Cloudflare launch is validated.

Automation option:

1. Create a temporary Supabase Management API token in Supabase Dashboard > Account > Access Tokens.
2. Name it `wscapp-codex-cutover`.
3. Save it outside the repo:

   ```bash
   mkdir -p ~/.config/wscapp
   printf '%s' 'PASTE_SUPABASE_TOKEN_HERE' > ~/.config/wscapp/supabase-management-token
   chmod 600 ~/.config/wscapp/supabase-management-token
   ```

4. Preview the exact update:

   ```bash
   node tools/deployment/update-supabase-auth-config.mjs --dry-run
   ```

5. Apply it:

   ```bash
   node tools/deployment/update-supabase-auth-config.mjs
   ```

6. After the update is verified, delete the local token file and revoke the token in Supabase.

The Management API fields are:

- `site_url`
- `uri_allow_list`

## Cloudflare Realtime Worker

Deploy `workers/realtime` as `wscapp-realtime` and attach the custom domain:

- `https://realtime.wscapp.app`
- WebSocket endpoint: `wss://realtime.wscapp.app/room/:roomId`

The static app uses `app/realtime-config.js`. It defaults to `auto` and falls back to Supabase during rollout.

Current realtime Worker state:

- `wscapp-realtime` is deployed.
- Custom domain `realtime.wscapp.app` is attached.
- Remote load test on `wss://realtime.wscapp.app/room/load-50-*` passed with 50 players, 50 opens, 0 errors.

Deploy command:

```bash
cd workers/realtime
npm run deploy
```

## Search Launch

After `https://wscapp.app` is live:

- Submit `https://wscapp.app/sitemap.xml` to Google Search Console.
- Submit `https://wscapp.app/sitemap.xml` to Bing Webmaster Tools.
- Verify `https://wscapp.app/robots.txt`.
- Verify `https://wscapp.app/llms.txt`.
- Search for `site:wscapp.app WSCapp` after indexing starts.

## Rollback

Keep GitHub Pages and the old Vercel deployment reachable until:

- Cloudflare Pages serves the app correctly.
- Supabase login/signup/reset flows work on `wscapp.app`.
- The realtime Worker passes a 2-browser manual test.
- The Worker passes synthetic 10, 25, and 50 player load tests.
