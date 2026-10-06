# Chat Assistant Setup (AI-powered, free tier)

The corner widget on the site is the **"Chasin' Coverage Assistant"** — AI under the hood, never branded with the model name. Three pieces:

1. **`chat.js`** — the widget, live on the site. Bulletproof on its own: if the worker endpoint is missing, down, or timing out, it answers common questions from a built-in preset knowledge base (same approved FAQ wording as the site) and only shows a call/text/book fallback when nothing matches.
2. **`chat-worker.js`** — a Cloudflare Worker that holds the AI API key **server-side**. GitHub Pages is static, so the key must never live in the browser — this proxy is the piece that makes the live AI work.
3. **Provider: Google Gemini (free tier)** via the OpenAI-compatible endpoint. Default model `gemini-3.5-flash-lite`; `gemini-3.1-flash-lite` is the standby (3.8/3.5 flagship flash can 503 under load). To switch providers later (e.g. xAI Grok), change `XAI_URL` and `DEFAULT_MODEL` in `chat-worker.js` and swap the secret — the widget and site need zero changes.

## Step 1 — Get the API key (done)
Created in Google AI Studio under project **"chasin coverage web helper"**. Store it only as the worker secret below — never in the repo or browser code.

## Step 2 — Deploy the worker (free tier is enough)
1. Sign in at https://dash.cloudflare.com (free plan: 100k requests/day).
2. Create a Worker, paste the full contents of `chat-worker.js`.
3. Add secrets (Dashboard → your Worker → Settings → Variables):
   - `XAI_API_KEY` = the Gemini API key (legacy variable name kept for compat)
   - optional `MODEL` = `gemini-3.5-flash-lite` (default; see https://ai.google.dev/gemini-api/docs/models)
   - optional `ALLOWED_ORIGIN` = `https://chasincoverage.com` (localhost works automatically for dev)
4. Deploy. Note your worker URL, e.g. `https://chasin-chat.<your-subdomain>.workers.dev`.

## Step 3 — Point the widget at the worker
In `chat.js`, set:
```js
const CHAT_ENDPOINT = "https://chasin-chat.<your-subdomain>.workers.dev";
```
(The worker answers on every path, so no route suffix needed.)

## Step 4 — Deploy the site
Push to the GitHub Pages repo as usual: `index.html`, `styles.css`, `script.js`, `chat.js`, `assets/`, `chat-worker.js` (reference only — GitHub ignores it).

## Guardrails already built into the worker
- System prompt locks the bot to Chasin' Coverage facts: lines of coverage, free 15-min consult, no client fees, service states, phone/email/booking link.
- It will **not** quote premiums or plan details, give medical/tax/legal advice, or collect personal info — it routes to the call instead.
- CORS locked to your domain (+ localhost), message count/length caps, and the client can never override the persona.
- If the worker or the AI ever fails, `chat.js` silently falls back to the preset brain (Step 1's knowledge base) — visitors never see an error.

## Free-tier notes (Gemini)
- Rate limits are per project (RPM/TPM/RPD), reset nightly; far above a support widget's needs.
- Free tier: prompts/responses may be reviewed by Google — the system prompt already forbids collecting personal info.
- No billing attached = no accidental charges possible.

## Optional hardening (later)
- Cloudflare rate limiting rule on the worker route (e.g. 10 req/min per IP).
- Cloudflare Turnstile in the widget if you ever see abuse.
