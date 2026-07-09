# Supabase Auth Email Templates

These templates are for Supabase Dashboard > Authentication > Email Templates.

Supabase renders auth templates with Go template variables. The signup confirmation
template should use `{{ .ConfirmationURL }}` for the confirmation link.

## Templates

- `confirm-signup.html` goes in the **Confirm signup** email template.
- `recovery.html` goes in the **Reset password** email template.

## Sender address

The sender shown by email clients is controlled by Supabase Auth SMTP settings,
not by these HTML templates. To send from `support@wscapp.app` or
`no-reply@wscapp.app`, configure Supabase Authentication > SMTP with a verified
outbound mail provider for `wscapp.app`.

Live Supabase Auth templates are project configuration, not part of the static app
bundle. Apply them through the Supabase dashboard or through the Management API
when a local `SUPABASE_ACCESS_TOKEN` is available.
