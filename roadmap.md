# Gold Center updates

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
