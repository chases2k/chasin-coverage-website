# Chasin Coverage - Website

Static marketing site for **Chasin Coverage** (health insurance).

## Deploy notes (SEO / forms)

- **Canonical & social URLs** use `https://chasincoverage.com/` - update in `index.html` if the live domain differs.
- **OG image:** `assets/og-image.png` (1200×630 landscape). Meta tags match that size.
- **Contact form** posts via [FormSubmit](https://formsubmit.co) AJAX to `chasincoverage@gmail.com`. First send may require confirming the activation email from FormSubmit. To use Formspree instead, change `FORM_ENDPOINT` in `script.js`.
- **WebP:** `logo.webp`, `chase-tabor.webp` with PNG/JPEG fallbacks via `<picture>`.

## Open locally

Double-click `index.html`, or from this folder:

```powershell
start index.html
```

Or serve with any static server:

```powershell
npx --yes serve .
```

## Files

| File | Purpose |
|------|---------|
| `index.html` | Page structure |
| `styles.css` | Brand styling (navy + blue, matches logo) |
| `script.js` | Mobile nav, motion, contact form → FormSubmit |
| `assets/logo.png` | Your Chasin Coverage logo |

## Contact form

The form posts via **FormSubmit** AJAX to `chasincoverage@gmail.com` (see `script.js`).
First successful send may require confirming FormSubmit’s activation email.

Phone on site: **318-880-7508** · Producer ID: **22123071** (license verification).

## Deploy (when ready)

Upload the whole folder to any static host:

- **Cloudflare Pages** / **Netlify** / **Vercel** - drag-and-drop or connect a repo  
- **GoDaddy / Namecheap** - upload via File Manager or FTP  
- Point your domain (e.g. `chasincoverage.com`) at the host

## Brand assets in `/assets`

| File | Use |
|------|-----|
| `logo.png` | Logo mark |
| `chase-tabor.jpg` | Headshot (hero + about) |
| `business-card.png` | Reference card art |

## Contact (from business card)

- **Phone:** 318-880-7508  
- **Email:** chasincoverage@gmail.com  
- **Calendly:** https://calendly.com/chasincoverage/15-minute-meeting  
- **LinkedIn:** linkedin.com/in/ChasinCoverage  
- **Facebook:** facebook.com/ChasinCoverage  
- **Tagline:** Quit Waitin’ · Start Chasin’  
- **Lines:** Medical · Life · Dental · Vision  

## Customize next

1. Domain / Google Business Profile  
2. Testimonials when you have them  
3. Carrier logos only if allowed  

## Brand notes

Colors follow the shield logo (deep navy + electric blue). Owner: **Chase Tabor**.  
Can serve most states except: CA, CT, WA, OR, NM, NY, NJ, NH, MA, ME, MN, ND, ID, HI, RI, AK.

## TikTok demo page (unlisted, for TikTok app review)

`/tiktok/` (Connect TikTok) → TikTok consent → `/tiktok/callback/` (shows display name, "Post test video").
Not linked anywhere, `noindex,nofollow`, not in `sitemap.xml`, disallowed in `robots.txt`.

- **Redirect URI to register** (TikTok dev portal → app → Login Kit): `https://chasincoverage.com/tiktok/callback/` (exact, with trailing slash)
- **Scopes:** `user.info.basic`, `video.publish` (add Login Kit + Content Posting API with Direct Post enabled)
- **Flow:** Login Kit web (authorization code + CSRF `state`; TikTok web flow does not use PKCE). Token exchange happens in `tiktok-worker.js`; the browser only ever holds an AES-GCM-encrypted session blob (sessionStorage, tab-scoped, ≤24h).
- **Posting:** Direct Post, `FILE_UPLOAD`, single chunk, `privacy_level: SELF_ONLY`. On the callback page you pick a small local MP4 (<50 MB); the browser sends it to the worker, which calls `creator_info/query` → `video/init` → PUTs the bytes → the page polls `status/fetch`. (FILE_UPLOAD avoids PULL_FROM_URL's URL-prefix verification, and repo MP4s are Git LFS pointers on Pages.)

### Deploy the worker (Cloudflare)
```bash
npx wrangler login                                   # browser sign-in to Cloudflare
# put the real client key in wrangler.tiktok.toml [vars] TIKTOK_CLIENT_KEY (public value)
npx wrangler secret put TIKTOK_CLIENT_SECRET -c wrangler.tiktok.toml   # paste secret at prompt
openssl rand -hex 32 | npx wrangler secret put TOKEN_KEY -c wrangler.tiktok.toml
npx wrangler deploy -c wrangler.tiktok.toml          # prints https://chasin-tiktok.<sub>.workers.dev
```
Then set `TIKTOK_WORKER` in `tiktok/tiktok.js` to that URL and push the site. No custom route is needed (workers.dev URL, CORS-locked to chasincoverage.com + localhost).
