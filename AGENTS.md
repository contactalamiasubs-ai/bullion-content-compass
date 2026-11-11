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
- Writes are admin-only via `has_role(auth.uid(),'admin')` RLS; the first signed-up user becomes admin through a trigger.
- The `media` bucket is private (workspace blocks public buckets); uploads store a 10-year signed URL.
- Price refresh is an admin-authenticated server function; only exact Gold API XAU/XAG HTTPS endpoints are allowed to prevent SSRF, and validated USD-per-ounce quotes must match AI output exactly before publication.
- Price audit records retain source timestamps, payload and model response ID; manual prices are not labeled source-verified.
- Visitor events use the injected optional track global at visible product exposure and existing interaction handlers; no personal data or calculator holdings are collected.
- Dashboard entry links use the same-origin `/admin` path in the shared header and footer; the managed authenticated layout remains the login gate so links work across hosting domains without weakening access.
- WhatsApp contact links use same-window navigation and non-blocking optional analytics so popup restrictions or tracking failures cannot interrupt ordering.
- The generic settings editor validates WhatsApp numbers with international numbering metadata and stores normalized digits; its product preview reuses the public link builder to match actual ordering destinations.
