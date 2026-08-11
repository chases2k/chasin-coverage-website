# Chasin Coverage - Website

Static marketing site for **Chasin Coverage** (health insurance).

## Deploy notes (SEO / forms)

- **Canonical & social URLs** use `https://chasincoverage.com/` - update in `index.html` if the live domain differs.
- **OG image:** `assets/og-image.png` (1200×1200 logo on white). For best Facebook/LinkedIn previews, a 1200×630 landscape card is still ideal when you have one.
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
| `script.js` | Mobile nav + contact form → email draft |
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
