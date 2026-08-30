# Google sign-in for WSCapp

Google sign-in requires both the app button and a configured Google provider in
Supabase. Adding the frontend button does not enable the provider.

## Production configuration

- App: `https://wscapp.app`
- Supabase project: `bwogymstqrrmoxlwlhio` (`proffrancois-AppWSC`)
- Google OAuth callback: `https://bwogymstqrrmoxlwlhio.supabase.co/auth/v1/callback`

In the Google Auth Platform console, use the WSCapp project and a **Web
application** OAuth client. Register `https://wscapp.app` as an authorized
JavaScript origin and the Supabase callback above as an authorized redirect URI.
The callback is the Supabase URL, not the WSCapp home page.

Configure the consent screen for the intended public audience. Request only
`openid`, `email`, and `profile`; WSCapp does not need Drive, Gmail, or other
Google account permissions. A client left in testing mode is limited to its
configured test users.

In Supabase, open Authentication → Sign In / Providers → Google, enter the
client ID and client secret, and enable Google. Keep nonce checks enabled and
keep the email requirement. Verify that the Auth Site URL is `https://wscapp.app`
and the redirect allow list accepts the app's return URL.

Never commit the client secret, put it in `supabase-config.js`, or paste it into
chat. The public app needs only the Supabase URL and publishable key.

## Verification

1. Read the project's public `/auth/v1/settings` endpoint with its publishable
   key in the `apikey` header. Confirm that `external.google` is `true`.
2. In WSCapp, open the login dialog and select **Continue with Google**. It must
   reach Google's account/consent screen without a JSON error page.
3. Complete sign-in with an authorized test account and verify the return to
   `wscapp.app`, the signed-in Alpaccount, and the profile-completion flow for a
   new account. Reaching Google's screen alone is not a full sign-in test.
4. Check email and Discord sign-in for regressions.

Run `npm --prefix app run test:auth-privacy` for the local OAuth regression
tests. They do not sign in to any real account or change server configuration.

## Failure handling

Before starting OAuth, the app checks the selected provider in Supabase's
public settings. A disabled provider, failed settings request, or invalid
response keeps the user in the login dialog with an explanation. The settings
request has an eight-second timeout, and a failed attempt restores the buttons.
No provider settings are cached, so enabling Google takes effect without another
frontend release.

An HTTP 400 with `Unsupported provider: provider is not enabled` means the
provider is disabled in the Supabase project used by the app. A Google
`redirect_uri_mismatch` error instead indicates the Google client's callback
registration needs correction. Do not disable security checks to work around
either error.

Reference: [Supabase — Login with Google](https://supabase.com/docs/guides/auth/social-login/auth-google).
