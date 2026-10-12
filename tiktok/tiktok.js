// Unlisted TikTok demo — shared helpers. Set WORKER to the deployed worker URL.
const TIKTOK_WORKER = "https://chasin-tiktok.REPLACE-SUBDOMAIN.workers.dev";
const SCOPES = "user.info.basic,video.publish";

function $(id) { return document.getElementById(id); }
function say(msg, cls) { const el = $("status"); el.textContent = msg; el.className = "status " + (cls || ""); }

async function connectTikTok() {
  say("Starting TikTok login…");
  try {
    const cfg = await fetch(TIKTOK_WORKER + "/config").then((r) => r.json());
    if (!cfg.client_key) throw new Error(cfg.error || "Worker not configured");
    const bytes = crypto.getRandomValues(new Uint8Array(24));
    const state = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    sessionStorage.setItem("tt_state", state);
    const q = new URLSearchParams({
      client_key: cfg.client_key,
      response_type: "code",
      scope: SCOPES,
      redirect_uri: cfg.redirect_uri,
      state,
      disable_auto_auth: "1",
    });
    location.href = "https://www.tiktok.com/v2/auth/authorize/?" + q.toString();
  } catch (e) {
    say("Could not start login: " + e.message, "err");
  }
}
