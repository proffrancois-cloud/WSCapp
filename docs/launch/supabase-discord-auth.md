# Supabase Discord Auth

WSCapp supports Discord sign-in through Supabase OAuth.

## Current App

- Public app URL: `https://wscapp.app`
- Supabase project ref: `bwogymstqrrmoxlwlhio`
- Supabase callback URL for Discord OAuth:
  `https://bwogymstqrrmoxlwlhio.supabase.co/auth/v1/callback`

## Dashboard Setup

1. Open the Discord Developer Portal.
2. Create or open the `WSCapp` application.
3. In OAuth2, add this redirect URL:
   `https://bwogymstqrrmoxlwlhio.supabase.co/auth/v1/callback`
4. Copy the Discord Client ID and Client Secret.
5. In Supabase, open Authentication > Sign In / Providers > Discord.
6. Enable Discord and paste the Client ID and Client Secret.
7. Save.

Never paste the Discord Client Secret into chat or commit it to the repo.

## Analytics Data

Discord auth sync writes safe provider metadata into `public.alpaca_profiles`:

- `last_auth_provider`
- `auth_provider_id`
- `discord_user_id`
- `discord_username`
- `discord_global_name`
- `discord_avatar_url`
- `discord_connected_at`
- `last_sign_in_at`

Sign-in events are recorded in `public.alpaca_auth_events`.
The app does not store raw Discord profile JSON or Discord email in these analytics fields.

Useful Supabase SQL:

```sql
select
  created_at,
  user_id,
  provider,
  discord_user_id,
  discord_username,
  discord_global_name
from public.alpaca_auth_events
where provider = 'discord'
order by created_at desc
limit 50;
```
