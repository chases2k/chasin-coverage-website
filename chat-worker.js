/**
 * Chasin' Coverage — support chatbot proxy (Cloudflare Worker)
 *
 * Holds the xAI API key SERVER-SIDE. The browser widget posts here;
 * this worker prepends the brand system prompt, calls Grok, and
 * returns { reply }. Deploy steps: see chat/SETUP.md.
 *
 * Secrets (wrangler secret put … or Dashboard → Settings → Variables):
 *   XAI_API_KEY   — Gemini API key (Google AI Studio); name kept for compat
 * Optional vars:
 *   MODEL         — default "gemini-3.5-flash-lite" (free-tier Gemini via
 *                    OpenAI-compatible endpoint; fallback: gemini-3.1-flash-lite)
 *   ALLOWED_ORIGIN — default "https://chasincoverage.com" (localhost is
 *                    always allowed for dev)
 */

const XAI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const DEFAULT_MODEL = "gemini-3.5-flash-lite";
const MAX_TURNS = 8;          // last N messages forwarded (abuse + cost cap)
const MAX_CHARS_PER_MSG = 600;

const SYSTEM_PROMPT = `You are the website assistant for Chasin' Coverage, an independent health insurance agency owned by Chase Tabor (licensed agent, Producer ID 22123071, based in the Houston area).

FACTS YOU MAY SHARE:
- Lines of coverage: Medical, Life, Dental, and Vision for individuals, families, and small businesses (even 2-3 person teams).
- Consults are free, 15 minutes, no pressure. Chase is paid by carriers when someone enrolls, so clients never pay a guidance fee.
- Service area: most US states EXCEPT CA, CT, WA, OR, NM, NY, NJ, NH, MA, ME, MN, ND, ID, HI, RI, AK.
- Contact: call or text 318-880-7508, email chasincoverage@gmail.com, book at https://calendly.com/chasincoverage/15-minute-meeting
- Chase helps with job changes, COBRA, special enrollment windows, pre-65 early retirement, PPO/network questions, and plan reviews before auto-renewal.

HARD RULES:
- NEVER quote premiums, deductibles, or specific plan details — plans vary by state, carrier, and household. Say Chase compares real options on the call.
- No medical, tax, or legal advice.
- You cannot enroll anyone or take personal information. Never ask for SSN, DOB, or financial details.
- You are an AI assistant, not Chase. If asked, say so plainly and offer the free call.
- Keep answers under 80 words, plain English, friendly, no jargon, no emojis.
- When the person seems ready (or asks anything you can't answer), suggest the free 15-minute call or texting 318-880-7508.`;

const CORS_HEADERS = (origin) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
});

function allowedExact(env) {
  return new Set([
    (env.ALLOWED_ORIGIN || "https://chasincoverage.com").replace(/\/$/, ""),
    "https://chasetabor.github.io",
  ]);
}
const ALLOWED_LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function originAllowed(origin, env) {
  if (!origin) return false;
  return allowedExact(env).has(origin.replace(/\/$/, "")) || ALLOWED_LOCAL.test(origin);
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      if (!originAllowed(origin, env)) return new Response(null, { status: 204 });
      return new Response(null, { status: 204, headers: CORS_HEADERS(origin) });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }
    if (!originAllowed(origin, env)) {
      return new Response("Forbidden", { status: 403 });
    }

    const key = env.XAI_API_KEY;
    if (!key) {
      return json({ error: "Assistant not configured yet." }, 503, origin);
    }

    let body;
    try {
      body = await request.json();
    } catch (_) {
      return json({ error: "Bad request." }, 400, origin);
    }

    const incoming = Array.isArray(body.messages) ? body.messages : [];
    const clean = incoming
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-MAX_TURNS)
      .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS_PER_MSG) }));

    if (!clean.length || clean[clean.length - 1].role !== "user") {
      return json({ error: "Nothing to answer." }, 400, origin);
    }

    try {
      const upstream = await fetch(XAI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: env.MODEL || DEFAULT_MODEL,
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...clean],
          temperature: 0.4,
          max_tokens: 300,
        }),
      });

      if (!upstream.ok) {
        return json({ error: "Assistant is unavailable right now." }, 502, origin);
      }
      const data = await upstream.json();
      const reply =
        data.choices && data.choices[0] && data.choices[0].message
          ? String(data.choices[0].message.content || "").trim()
          : "";
      if (!reply) {
        return json({ error: "Assistant is unavailable right now." }, 502, origin);
      }
      return json({ reply }, 200, origin);
    } catch (_) {
      return json({ error: "Assistant is unavailable right now." }, 502, origin);
    }
  },
};

function json(obj, status, origin) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...(origin ? CORS_HEADERS(origin) : {}) },
  });
}
