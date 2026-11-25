# Switch site data to Hostinger MySQL

## What changes for you
- Products, categories, prices, texts, slides, posts, services, settings, bar serials and the catalog file are read and saved in the Hostinger database.
- Dashboard edits are saved directly in Hostinger, so the live site at goldcenterstr.com shows them immediately.
- Customer accounts, roles, carts, favorites, customer activity and contact messages stay where they are (as agreed: no customer data moves).
- Images and the PDF catalog move to Hostinger after the switch, and existing links are updated.

## Important limitation (needs your decision)
Hostinger only accepts connections from approved addresses. The live site on Hostinger connects locally, so it works. The Lovable preview and the Lovable copy of the site connect from changing addresses, so they can only reach the database if Hostinger "Remote MySQL" allows any host (%). Otherwise the preview here will show empty products and I can only verify on goldcenterstr.com after you redeploy.

## Steps
1. Final fresh copy of all site data into Hostinger (current edits included).
2. Add secure server-side read/save actions for every site table; saving checks the signed-in user's dashboard permission exactly like today.
3. Point the public pages, product pages, bar check and the dashboard editors at these actions.
4. Move images/PDF: upload files into a Hostinger table/folder served by the site at the same /api/public/media/... links, so nothing breaks.
5. Run the existing tests, check pages and a dashboard save, then you pull the update on Hostinger and add the database variables (host, user, password, name) there.

## Technical details
- `mysql2/promise` pool in `src/lib/mysql.server.ts`, env `MYSQL_HOST/USER/PASSWORD/DATABASE`; IPv4 forced.
- `src/lib/site-data.functions.ts`: generic `listRows`/`saveRow`/`deleteRow` with a table+column allowlist; writes use `requireSupabaseAuth` then `has_dashboard_permission` RPC via the user's client; settings keep field-scope validation.
- Price refresh writes quotes to MySQL after existing validation; `latest_verified_price` replaced by a MySQL query.
- Media stored as MEDIUMBLOB rows in `media_files`; `/api/public/media/$` streams them with cache headers.
