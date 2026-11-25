# Gold Center updates
- [x] Review security: restrict hidden products/slides, verified summaries and published media; remove public administrator bootstrap and untrusted invitation destinations. Preserve intentionally public business contact details/catalog data without dismissing their alerts.
- [x] Verify 127 regression tests, 13 public routes, desktop/mobile, product hydration, live quote fetching, real authenticated dashboard/account and anonymous denials. Temporary hidden product/slide checks and guest cart/favorites persistence passed; test rows removed.
- [x] Recheck security fixes, complete deep review and save changes. Full AI publication and invitation email receipt remain unverified; latest code must be published on Lovable and deployed on Hostinger for public handler fixes to reach those sites.
- [x] Implement Hostinger user listing/invitations/deletion through a pinned, authenticated Lovable-hosted bridge; 44 tests passed, real admin list/refresh and temporary account deletion verified, anonymous/customer sessions denied and unsafe invitation origins rejected.
- [ ] Activate the bridge on the deployed Hostinger site and verify invitation email acceptance there; requires publishing this Lovable update, deploying updated Hostinger code with HOSTED_ADMIN_BRIDGE_URL, and access to the recipient mailbox.
- [x] Add dashboard PDF catalog upload and connect homepage/main-menu downloads; authenticated upload/save/reload, exact PDF download, mobile layout and 18 tests passed; test catalog removed.
- [x] Extend team permissions to customer management (including analytics/Excel) and bar serial management; preserved existing serial access, verified admin save/reload, member serial create/read/delete, customer details and Excel download, revoked private-data reads, mobile layout and 22 tests.
- [x] Add public exact bar serial lookup, dashboard registry and Excel template/import; actual file import, public specification match, missing/disabled serials, saved edits and mobile verified; anonymous registry browsing denied, 16 tests passed, temporary record removed.
- [x] Add a full-admin Excel download of all customer profiles, shopping and activity, independent of search/pagination; actual download with empty search contains all four accounts, six cart rows, three favorites and 19 activity rows across five worksheets, no formulas or browser errors, mobile layout and four tests passed.
- [x] Cancel the requested product analytics/import work before implementation; preserve existing customer analytics and all application behavior.
- [x] Add full-admin customer analytics with 7/30/90-day registration/activity trends, current shopping totals, popular products and per-customer detail; real admin data, period switching, refresh and customer shopping/activity verified, no overflow at 394/890 widths, five tests passed.
- [x] Restore the previous simple administrator login without changing customer login or access protection; both pages verified at 1280/394/890 widths, signed-out admin redirects to /auth, no browser errors or horizontal overflow, three login tests passed.
- [x] Test the login page at desktop and 394/320px mobile widths; required fields, password visibility, invalid credentials, signup minimum, signed-out admin gate, authenticated account refresh and signout passed; six unit tests passed. Successful password submission could not be completed because preparing a temporary password returned a managed Auth HTTP 500. Google consent, signup confirmation and recovery-email receipt remain unverified and require a real Google account/mailbox; the reserved temporary email is rejected by the mail service.
- [x] Implement supplied luxury login design with existing email/Google auth, signup, public recovery and session preference; desktop/mobile, rejected credentials, actual account session and signout verified. Google consent and email delivery require the customer's Google account/mailbox.

- [x] Add Google customer accounts with name/photo/email, account-saved shopping, disclosed product activity and full-admin customer inspection; customer add/reload/signout/relogin and admin readback verified, mobile no overflow. Google enabled; actual Google consent requires the customer's Google account.

- [x] Move dashboard/favorites/cart shortcuts into the main navigation and remove the separate top strip; Arabic layouts checked at 320/394/890/1280/1536 widths, English mobile and navigation verified with no overflow or runtime errors; eight relevant tests passed.

- [x] Add confirmed full-admin user deletion with self/final-admin protection and permission cleanup; cancellation and actual temporary-account deletion persisted after dashboard reload, desktop/mobile checked, and 12 relevant tests passed.

- [x] Add four dashboard-managed availability states to cards/details; authenticated saves and public readback verified for all four and original state restored. Connect standalone catalog from price lists and mobile navigation, show bar specifications, and exclude non-available products from live order totals; 24 relevant tests passed.

- [x] Place homepage products immediately after prices and order the shared navigation with prices followed by products; desktop and mobile price scrolling and catalog navigation verified.

- [x] Refine shopping and navigation icons with consistent circular controls, readable labels, active states and mobile layout; shopping navigation and menu verified at 320/390/812/1280 widths, Arabic/English and dark/light themes.

- [x] Add browser-saved product favorites and quantity cart, live totals, and WhatsApp order/inquiry handoff; catalog, detail, persistence, removal and mobile verified; actual message sending remains the visitor's action in WhatsApp.

- [x] Add dashboard silver gram rate and metal selection with no silver karat; authenticated save and catalog/detail total verified (100 × 70 + 250 = 7,250 EGP), test product removed and original rate restored.

- [x] Center and refine main and subcategory icons with double-ring medallions; filtering, desktop centering, mobile, light theme and English verified.

- [x] Add a fixed per-product making charge to gram-linked prices; authenticated save/reload, negative validation, catalog/detail totals and mobile layout verified; original product values restored.

- [x] Add dashboard-controlled 21K/24K gram rates and per-product weight/karat linkage; authenticated saves, catalog/detail prices, changed rate, and mobile dashboard verified; original test values restored.

- [x] Remove the visitor product assistant at the user's request while preserving the catalog.

- [x] Add dashboard-managed main product groups and subcategories, link products, and verify public filtering and authenticated saves. Temporary group/branch removed and original product category restored; existing products left for the administrator to classify.
- [x] Verify WhatsApp order buttons escape embedded previews and preserve the saved number and product message on desktop/mobile; actual WhatsApp handoff page checked, message sending requires the visitor's WhatsApp account.
- [x] Validate dashboard WhatsApp numbers, preview actual product links before saving, and verify authenticated save/readback; original number restored after testing.
- [x] Verify product and contact WhatsApp links navigate without opening a blocked popup; destination verified on desktop/mobile, external WhatsApp handoff requires the user's device.
- [x] Add a persistent same-domain dashboard link and verify signed-out access remains protected on desktop and mobile.
- [x] Complete the dashboard overview, navigation and all existing content editors. Authenticated product and WhatsApp settings save/readback verified.
- [x] Apply supplied name and logo with matching favicon.
- [x] Add administrator-configured trusted price source, AI validation, audit history, and last-update display.
- [x] Track product views, WhatsApp clicks, and zakat calculations.
- [ ] Verify signup/password login and end-to-end AI refresh in a separate requested check; authenticated administrator access and edits verified with a managed session.
- [x] Run relevant tests and save changes.

- [x] Add administrator-managed invitations and scoped permissions. Verified account listing, permission save/reload, product member CRUD, denied price writes and escalation, admin promotion and access revocation on a temporary member; 25 tests passed and desktop/mobile checked. Invitation email receipt and acceptance require the recipient's mailbox and were not exercised.
- [x] Point the homepage gold-verification card to the bar serial check page and make its label dashboard-editable (serial_check_card); Arabic/English click-through to /check-bar, mobile layout and build verified.
