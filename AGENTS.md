<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.

<!-- LOVABLE:END -->

## Project rules

- All site content (texts, prices, slides, products, posts) lives in Cloud tables with `_ar`/`_en` columns; UI reads them via `pick()` in `src/lib/i18n.tsx` so every text stays editable from /admin.
- Admin dashboard uses the generic `ListEditor`/`SingleEditor` in `src/components/admin/editors.tsx`; add new editable tables by declaring fields there, not by writing new forms.
- Admin editor mutations invalidate the public collection, post detail and overview queries, and expose pending/error states so saved content is reflected without silent failures.
- Writes use full-admin or scoped dashboard permission RLS; settings updates also validate changed fields so price access cannot edit unrelated settings. The first signed-up user becomes admin through a trigger.
- Media bucket is private; content stores `/api/public/media/<path>` links that sign a fresh one-hour URL per request.
- Catalog PDF uses the generic editor and the catalog_download section; prefetch its signed file into a Blob for click-time mobile downloads.
- Price refresh requires authenticated price permission; only exact Gold API XAU/XAG HTTPS endpoints are allowed to prevent SSRF, and validated USD-per-ounce quotes must match AI output exactly before publication.
- Price audit records retain source timestamps, payload and model response ID; manual prices are not labeled source-verified.
- Visitor events use the injected optional track global at visible product exposure and existing interaction handlers; no personal data or calculator holdings are collected.
- Dashboard entry links use the same-origin `/admin` path in the shared header and footer; the managed authenticated layout remains the login gate so links work across hosting domains without weakening access.
- WhatsApp links use native target="_blank" anchors (rel noopener) with non-blocking optional analytics, because wa.me refuses to load inside frames and embedded previews block top-window navigation.
- The generic settings editor validates WhatsApp numbers with international numbering metadata and stores normalized digits; its product preview reuses the public link builder to match actual ordering destinations.
- Product taxonomy uses separate main-group and subcategory tables; products reference a subcategory, and generic editors manage all three. Restrict deletion of linked categories/groups to prevent accidental uncategorization.
- Product gram pricing is opt-in and calculated through one shared helper from weight times the matching configured rate plus a fixed per-product making charge; retain final manual prices for unlinked products and never fall back to them for incomplete linked prices, so catalog and detail totals remain consistent.
- Gram-linked products explicitly select their pricing metal, independently of editable category names; silver uses one configured gram rate and no karat so taxonomy renaming cannot change pricing.

- Home and catalog pages share ProductCatalog for category medallions and product filtering so dashboard-managed taxonomy renders consistently on both.

- Visitor favorites and cart persist only product IDs and quantities in a hydration-safe shared browser provider; cart views resolve active catalog rows and current shared prices before native WhatsApp handoff, preventing stale stored prices and requiring no visitor account.
- Shopping interface copy comes from bilingual shopping-prefixed sections managed by the existing dashboard editor so labels remain editable without dedicated forms.
- Product availability uses one shared four-state helper across catalog, details and live cart resolution; only available products enter order totals, while other states use WhatsApp reservation or inquiry.
- Account management uses authenticated server functions with a full-admin check before privileged Auth reads/invitations; atomic access changes run through an admin-authorized SQL function to prevent self-demotion and concurrent removal of the final admin.
- Team access lives separately in dashboard_access; the shared permission map filters dashboard navigation, while RLS and server checks enforce access independently of the UI.
- User deletion requires full-admin authorization and a self-deletion guard; a user_roles deletion trigger shares the access-change advisory lock to preserve the final admin even during concurrent Auth deletion.
- Dashboard company labels read the shared settings query through pick() so settings saves update dashboard branding without a separate company name.
- Header branding and display controls use a constrained grid; persistent account/shopping shortcuts live in the main navigation alongside a collapsible section menu below desktop width to avoid mobile crowding.
- Customer profiles mirror Auth identity via triggers; shopping mutations merge guest data once and run atomically per account. Customer data reads allow owners, full admins and customer-permission members; staff administration remains full-admin only.
- Customer management lives at the protected, unnested /admin/customers route; dashboard desktop links and mobile selection navigate there to support refreshable page URLs.
- Keep administrator sign-in implemented in its own route rather than the customer LoginPanel so customer presentation changes cannot alter dashboard entry.
- Customer analytics reads all paginated rows through customer-permission authenticated RLS and summarizes disclosed account activity separately from current shopping state; carts are not completed orders.
- Customer exports fetch every page under customer-permission RLS and generate XLSX locally in the browser; export strings as text, never formulas, and exclude credentials.
- Bar serials use a separate serial permission in navigation and RLS; public lookup returns only one active exact match, and Excel parsing runs in the browser with atomic validated upserts. Backfill existing product members' serial permission when separating access.
- Hostinger privileged Auth actions relay to the pinned Lovable endpoint with a validated admin bearer; secrets stay hosted and invitation origins are allowlisted.
