# Chat Assistant Setup (Grok-powered, ~15 minutes)

The corner widget on the site is the **"Chasin' Coverage Assistant"** — it's powered by xAI's Grok under the hood, but never branded as such user-facing. Two pieces:

1. **`chat.js`** — the widget, already live on the site. Safe to deploy right now: with no endpoint configured — or if the worker is ever down/timing out — it answers common questions from a built-in preset knowledge base (same approved FAQ wording as the site), and only shows a call/text/book fallback when nothing matches.
2. **`chat-worker.js`** — a Cloudflare Worker that holds your xAI API key **server-side**. GitHub Pages is static, so the key must never live in the browser — this proxy is the piece that makes the bot work.

## Step 1 — Get a Grok API key
1. Sign up at https://console.x.ai and create an API key.
2. Pricing is per-token (fast models ≈ $0.20–$2 per million input tokens). A typical chat turn costs a small fraction of a cent.

## Step 2 — Deploy the worker (free tier is enough)
1. Sign up at https://workers.cloudflare.com (free plan: 100k requests/day).
2. Create a Worker, paste the full contents of `chat-worker.js`.
3. Add secrets (Dashboard → your Worker → Settings → Variables):
   - `XAI_API_KEY` = your key from Step 1    - optional `MODEL` = a current model id (default `grok-4.7`; check https://docs.x.ai/developers/models for the latest list)
   - optional `ALLOWED_ORIGIN` = `https://chasincoverage.com` (localhost works automatically for dev)
4. Deploy. Note your worker URL, e.g. `https://chasin-chat.<your-subdomain>.workers.dev`.

## Step 3 — Point the widget at the worker
In `chat.js`, set:
```js
const CHAT_ENDPOINT = "https://chasin-chat.<your-subdomain>.workers.dev";
```
(The worker answers on every path, so no route suffix needed.)

## Step 4 — Deploy the site
Push to your GitHub Pages repo as usual: `index.html`, `styles.css`, `script.js`, `chat.js`, `assets/`, `chat-worker.js` (the last is only for reference — GitHub ignores it).

## Guardrails already built into the worker
- System prompt locks the bot to Chasin' Coverage facts: lines of coverage, free 15-min consult, no client fees, service states, phone/email/booking link.
- It will **not** quote premiums or plan details, give medical/tax/legal advice, or collect personal info — it routes to the call instead.
- CORS locked to your domain (+ localhost), message count/length caps, and the client can never override the persona.

## Optional hardening (later)
- Cloudflare rate limiting rule on the worker route (e.g. 10 req/min per IP).
- Cloudflare Turnstile in the widget if you ever see abuse.
- Switch `MODEL` to a cheaper fast variant if costs matter more than nuance.
