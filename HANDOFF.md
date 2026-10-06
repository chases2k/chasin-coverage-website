# Chasin' Coverage — v2 Rebuild Handoff

Rebuild of chasincoverage.com with the approved upgrades. Same no-build stack as the live site: `index.html` + `styles.css` + `script.js` + `assets/`. The live CSS/JS were kept as the base, with a clearly-marked **"V2 UPGRADE LAYER"** appended to each — nothing from the original design language was removed.

## What changed vs. the live site

| Area | Change |
|---|---|
| Hero | 4 rotating hospital/ER clips → warm clips (family dinner, client handshake, family at home, couple laughing). Blue duotone kept. |
| Hero trust | New `5.0 ★ on Facebook Reviews` badge (links to facebook.com/ChasinCoverage/reviews); "Licensed in most states" → "Licensed in 30+ states" |
| Persona cards | Now real links: click → prefills the form's "What do you need?" select → smooth-scrolls to booking. Added arrow chip + 3D pointer tilt. |
| Reviews | Added centered "Read all reviews on Facebook" button below the grid |
| About | Producer ID line → pill badge with NIPR "verify license" link; shield mark gets a gentle 3D sway |
| Booking | Calendly widget.js/widget.css removed; calendar lazy-loads as a plain iframe with skeleton shimmer + fade-in (same URL/params). Friendly note above; excluded-states list moved into a "Don't see your state?" expandable under the State select. |
| Schema | Added FAQPage JSON-LD (InsuranceAgency schema already existed and was kept) |
| Head | Removed unsupported `as="video"` preload (warning); everything else (OG/Twitter meta, canonical, fonts) unchanged |
| Untouched | **Chasin+ cross-apostrophe wordmark** (assets/brand-chasin.png used as-is), all copy, reviews, form → FormSubmit → chasincoverage@gmail.com, sticky mobile CTA, legal text |

## Verify locally

```bash
cd chasincoverage
python -m http.server 8422
# open http://localhost:8422/
```

Checked during build: desktop + 390px mobile rendering, persona→form prefill, Calendly lazy mount, states expandable, 3D tilt (desktop pointers only), reduced-motion fallbacks, zero JS errors (only transient DNS drops from a flaky connection while testing).

## Deploy

1. Upload `index.html`, `styles.css`, `script.js`, `assets/` to the GitHub Pages repo (replace the old files; the `_live_*` files are reference copies of the current site and don't need to deploy).
2. Calendly params in `index.html` include `embed_domain=chasincoverage.com` — keep that value on the live domain.
3. Cache-buster query (`?v=20261005v2`) already bumped on both CSS and JS links.

## Only you can do these (account-level)

- **Calendly cookie banner:** the "Decline / I understand" dialog is rendered by Calendly inside their iframe — disable it in Calendly → Embed settings / cookie preferences.
- **Analytics:** site currently ships none. Recommended: Plausible or Cloudflare Web Analytics + click events on the two Book CTAs and Call links.
- **Domain email:** swap `chasincoverage@gmail.com` → `hello@chasincoverage.com` when ready (also update FormSubmit activation for the new address).
- **Real footage of Chase** for the hero would beat any stock clip — even a phone-shot 10s clip works.

## SEO / GEO / AI-visibility (added v2.1)
On-page, already shipped: geo meta tags, richer InsuranceAgency schema (Houston address, aggregateRating from the on-page reviews, knowsAbout, OfferCatalog of 6 services), FAQPage schema extended to 10 Q&As matching the on-page FAQ (4 new geo/intent questions: remote help, marketplace switches, TX/LA small business, coverage speed), footer service-area line, `robots.txt` explicitly welcoming GPTBot/OAI-SearchBot/ChatGPT-User/PerplexityBot/ClaudeBot/Google-Extended/Applebot-Extended, `sitemap.xml`, and `llms.txt` — a plain-text brand brief at the site root that AI assistants can ingest when someone asks "who's a good health insurance agent in Houston?"

**Only you can do these off-site (they matter more than anything on-page):**
1. **Google Business Profile** — create/claim one for Chasin' Coverage (service-area business, Houston TX, hide street address, list services + booking link, same phone). This is the single biggest local-search lever. Then Bing Places (feeds Copilot).
2. **NAP consistency** — identical Name/Address/Phone everywhere: GBP, Bing, Facebook page intro, LinkedIn, directory listings.
3. **Reviews that name the brand** — ask happy clients to mention "Chasin' Coverage" and their city in Facebook reviews and group posts ("Chase Tabor at Chasin' Coverage in Houston…"). AI assistants heavily weight third-party mentions they can quote; your site can't provide those.
4. **Get listed where assistants look** — industry directories (NAHU agent finder, healthcare.gov "find local help" listings), Houston/Louisiana small-business directories, Chamber listings.
5. **Measure monthly** — ask ChatGPT, Perplexity, and Gemini: "Who's a good independent health insurance agent in Houston?" and "health insurance agent Shreveport" — note when the brand appears; it usually lags 1-3 months behind the off-site work.
