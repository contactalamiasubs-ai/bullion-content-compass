# Login page test — 17 November 2026

## Passed
- Login image loaded at 1280×1800, 394×674 and 320×674, with no horizontal overflow or browser runtime errors.
- Empty email is blocked by required-field validation.
- Password show/hide changes the field type correctly.
- An actual rejected password request displays the Arabic invalid-credentials message.
- Signup displays the email/password fields and enforces the existing eight-character minimum; no signup was submitted.
- Recovery mode displays only the email field; an invalid recovery link displays an error.
- Signed-out `/admin` redirects to `/auth`.
- A managed temporary customer session renders `/account`, survives refresh, and signs out to the login form.
- Signed-in mobile account layout has no horizontal overflow.
- Six existing login/customer-account unit tests passed.

## Not verified
- Successful email/password submission: assigning a password to the temporary account returned HTTP 500. Managed Auth logs recorded an internal panic for `PUT /user`. No customer passwords or existing account settings were changed.
- Recovery email receipt: the mail hook rejects the test account's reserved example-domain address. This does not establish whether real customer recovery emails are delivered.
- Actual signup confirmation and Google consent were not completed. The Google button initiated an OAuth request, but a successful provider return was not observed.
- No configured custom sending domain was returned by the email-domain lookup; email/password signup settings were not read from hosted settings.

No application code or authentication configuration was changed during this check.