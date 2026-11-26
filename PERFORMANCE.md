# Gold Center performance verification

## Implemented
- 24 existing images received private, high-quality (WebP quality 94) responsive display copies. Originals and database rows remain unchanged. Seven generated copies larger than their originals were removed; delivery falls back to originals.
- Future dashboard image uploads generate bounded responsive copies without blocking a successful original upload. Source resolution is retained.
- Five default images have CDN-hosted WebP copies at 640/1280/1920 widths.
- Public media streams at stable same-origin URLs, with five-minute browser/CDN caching, exact original publication checks, no cache for failures, and safe attachment handling for active document types.
- First homepage image is preloaded/high-priority. Hidden slides warm progressively; reduced-motion and hidden-tab autoplay are respected.
- Product lists render eight cards per URL-backed page; home keeps six. Metadata still loads as a shared catalog bundle for SEO/cart consistency: this is rendering/image pagination, not server-side catalog-data pagination.
- Query freshness prevents immediate duplicate hydration reads; existing dashboard invalidations are preserved. Chart code and catalog PDF prefetch wait until near viewport. No CSS/design/function was removed.

## Automated checks
173 tests passed. Browser tests at 390px (DPR 2) and 1280px verified homepage, chart controls, catalog pagination/filter refresh, customer-login images and serial-check images with no overflow/runtime errors. Product-detail image loaded; guest add-to-cart persisted and both WhatsApp destinations appeared. Current products without configured complete prices correctly retained “price on inquiry”.

## Lighthouse: local development preview, simulated mobile
These are single lab runs of the development preview, not production scores and not INP measurements. Preview includes development scripts; score remains poor and targets are not claimed met.

| Metric | Before | After | Unit |
| --- | ---: | ---: | --- |
| FCP | 2999.168 | 3481.159 | ms |
| LCP | 14699.764 | 8579.555 | ms |
| TBT | 7082.934 | 3136.174 | ms |
| CLS | 0.001 | 0.001 |  |

Performance score: 33 → 37. Simulated mobile LCP is still above 2.5s. TBT is not INP.

An unthrottled browser sample showed home LCP 2.924s before and 1.552s after; these individual observations are not a field p75 guarantee.

## Real visitor baseline (published Lovable site, last seven days)
Home FCP p75 1.851s / 50 readings (target 1.8s); LCP p75 5.745s / 24 readings; INP p75 258ms / 16 readings; CLS p75 0.0866 / 13 readings. LCP/INP/CLS samples are below 30, too small for reliable conclusions. These measurements do not represent unpublished improvements or necessarily Hostinger traffic.

## Production verification remaining
The automated browser reached Hostinger's “Checking your browser before accessing” challenge, not the app; that page's metrics were discarded. Google PageSpeed API was not called. After deploying to Lovable and updating/rebuilding Hostinger, run https://pagespeed.web.dev/ against https://goldcenterstr.com/ and /products, then compare real visitor p75 with at least 30 readings per metric. Confirm Hostinger's CDN honors the supplied cache headers; local checks verified headers, not a production CDN hit. No claim of <2.5s LCP, <200ms INP or <0.1 CLS across production visitors is made.
