/**
 * Chasin' Coverage — TikTok demo proxy (Cloudflare Worker)
 *
 * Backs the unlisted /tiktok/ demo pages used for TikTok app review.
 * Same pattern as chat-worker.js: static site on GitHub Pages, secrets
 * live only here. Deploy steps: see README.md → "TikTok demo page".
 *
 * Secrets:  TIKTOK_CLIENT_SECRET  (wrangler secret put TIKTOK_CLIENT_SECRET)
 *           TOKEN_KEY             (random 32+ char string; encrypts the token blob)
 * Vars:     TIKTOK_CLIENT_KEY     (public, may also be a secret)
 *           REDIRECT_URI          default https://chasincoverage.com/tiktok/callback/
 *           ALLOWED_ORIGIN        default https://chasincoverage.com
 *
 * Routes (POST unless noted):
 *   GET  /config    -> { client_key, redirect_uri }
 *   POST /token     { code }                 -> { session, display_name, avatar_url }
 *   POST /post      raw MP4 body, header X-TT-Session -> { publish_id, creator }
 *   POST /status    { publish_id }, X-TT-Session      -> TikTok status payload
 *
 * Tokens are never logged and never returned in plaintext: the worker hands
 * the browser an AES-GCM-encrypted blob ("session") it can't read.
 */

const API = "https://open.tiktokapis.com";
const DEFAULT_REDIRECT = "https://chasincoverage.com/tiktok/callback/";
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // demo cap; single-chunk upload

const ALLOWED_LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
function originAllowed(origin, env) {
  if (!origin) return false;
  const o = origin.replace(/\/$/, "");
  return o === (env.ALLOWED_ORIGIN || "https://chasincoverage.com").replace(/\/$/, "") || ALLOWED_LOCAL.test(o);
}
const CORS = (origin) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-TT-Session",
  "Access-Control-Max-Age": "86400",
});
function json(obj, status, origin) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...(origin ? CORS(origin) : {}) },
  });
}

// --- token blob encryption (AES-GCM, key = SHA-256(TOKEN_KEY)) ---
const b64u = {
  enc: (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""),
  dec: (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)),
};
async function aesKey(env) {
  const raw = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(env.TOKEN_KEY));
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}
async function seal(env, obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await aesKey(env), new TextEncoder().encode(JSON.stringify(obj)));
  return b64u.enc(iv) + "." + b64u.enc(ct);
}
async function unseal(env, blob) {
  try {
    const [iv, ct] = String(blob || "").split(".");
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64u.dec(iv) }, await aesKey(env), b64u.dec(ct));
    const s = JSON.parse(new TextDecoder().decode(pt));
    return s.exp > Date.now() ? s : null;
  } catch (_) {
    return null;
  }
}

async function tt(path, token, body) {
  const r = await fetch(API + path, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify(body || {}),
  });
  return r.json().catch(() => ({ error: { code: "bad_response", message: `HTTP ${r.status}` } }));
}
const ttErr = (d) => d && d.error && d.error.code && d.error.code !== "ok" ? `${d.error.code}: ${d.error.message || ""}` : null;

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: originAllowed(origin, env) ? CORS(origin) : {} });
    }
    if (!originAllowed(origin, env)) return new Response("Forbidden", { status: 403 });
    if (!env.TIKTOK_CLIENT_KEY || !env.TIKTOK_CLIENT_SECRET || !env.TOKEN_KEY) {
      return json({ error: "TikTok demo not configured yet." }, 503, origin);
    }
    const redirectUri = env.REDIRECT_URI || DEFAULT_REDIRECT;

    try {
      if (path.endsWith("/config") && request.method === "GET") {
        return json({ client_key: env.TIKTOK_CLIENT_KEY, redirect_uri: redirectUri }, 200, origin);
      }
      if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

      if (path.endsWith("/token")) {
        const { code } = await request.json();
        if (!code) return json({ error: "Missing code." }, 400, origin);
        const r = await fetch(API + "/v2/oauth/token/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded", "Cache-Control": "no-cache" },
          body: new URLSearchParams({
            client_key: env.TIKTOK_CLIENT_KEY,
            client_secret: env.TIKTOK_CLIENT_SECRET,
            code,
            grant_type: "authorization_code",
            redirect_uri: redirectUri,
          }),
        });
        const t = await r.json().catch(() => ({}));
        if (!t.access_token) {
          return json({ error: `Token exchange failed: ${t.error || r.status} ${t.error_description || ""}`.trim() }, 400, origin);
        }
        const info = await fetch(API + "/v2/user/info/?fields=open_id,display_name,avatar_url", {
          headers: { Authorization: `Bearer ${t.access_token}` },
        }).then((x) => x.json()).catch(() => ({}));
        const user = (info.data && info.data.user) || {};
        const session = await seal(env, {
          at: t.access_token,
          scope: t.scope,
          exp: Date.now() + Math.min(Number(t.expires_in) || 3600, 86400) * 1000,
        });
        return json({ session, scope: t.scope, display_name: user.display_name || "", avatar_url: user.avatar_url || "" }, 200, origin);
      }

      const s = await unseal(env, request.headers.get("X-TT-Session"));
      if (!s) return json({ error: "Not connected (or session expired). Click Connect TikTok again." }, 401, origin);

      if (path.endsWith("/post")) {
        const video = await request.arrayBuffer();
        const size = video.byteLength;
        if (!size || size > MAX_VIDEO_BYTES) return json({ error: "Send an MP4 under 50 MB." }, 400, origin);

        // 1) creator_info — required before every Direct Post
        const ci = await tt("/v2/post/publish/creator_info/query/", s.at);
        if (ttErr(ci)) return json({ error: "creator_info failed: " + ttErr(ci) }, 502, origin);
        const opts = (ci.data && ci.data.privacy_level_options) || [];
        if (opts.length && !opts.includes("SELF_ONLY")) {
          return json({ error: "SELF_ONLY not offered for this account: " + opts.join(",") }, 400, origin);
        }

        // 2) init Direct Post, FILE_UPLOAD, single chunk, private
        const init = await tt("/v2/post/publish/video/init/", s.at, {
          post_info: {
            title: "Chasin' Coverage — API test post",
            privacy_level: "SELF_ONLY",
            disable_comment: true,
            disable_duet: true,
            disable_stitch: true,
          },
          source_info: { source: "FILE_UPLOAD", video_size: size, chunk_size: size, total_chunk_count: 1 },
        });
        if (ttErr(init)) return json({ error: "init failed: " + ttErr(init) }, 502, origin);
        const { publish_id, upload_url } = init.data;

        // 3) upload bytes
        const up = await fetch(upload_url, {
          method: "PUT",
          headers: {
            "Content-Type": "video/mp4",
            "Content-Length": String(size),
            "Content-Range": `bytes 0-${size - 1}/${size}`,
          },
          body: video,
        });
        if (!up.ok) return json({ error: `Upload failed: HTTP ${up.status}`, publish_id }, 502, origin);

        return json({
          publish_id,
          creator: { username: ci.data.creator_username, nickname: ci.data.creator_nickname },
        }, 200, origin);
      }

      if (path.endsWith("/status")) {
        const { publish_id } = await request.json();
        if (!publish_id) return json({ error: "Missing publish_id." }, 400, origin);
        const st = await tt("/v2/post/publish/status/fetch/", s.at, { publish_id });
        if (ttErr(st)) return json({ error: "status failed: " + ttErr(st) }, 502, origin);
        return json(st.data || {}, 200, origin);
      }

      return json({ error: "Not found." }, 404, origin);
    } catch (_) {
      // deliberately no error detail logged: could contain tokens
      return json({ error: "TikTok demo error." }, 500, origin);
    }
  },
};
