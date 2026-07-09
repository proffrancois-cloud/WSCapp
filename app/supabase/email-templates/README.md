# Supabase Auth Email Templates

These templates are for Supabase Dashboard > Authentication > Email Templates.

Supabase renders auth templates with Go template variables. The signup confirmation
template should use `{{ .ConfirmationURL }}` for the confirmation link.

## Templates

- `confirm-signup.html` goes in the **Confirm signup** email template.

Live Supabase Auth templates are project configuration, not part of the static app
bundle. Apply them through the Supabase dashboard or through the Management API
when a local `SUPABASE_ACCESS_TOKEN` is available.
