/**
 * Chasin' Coverage — corner support chat widget (no dependencies).
 *
 * Setup: deploy chat-worker.js to a Cloudflare Worker, then paste the
 * worker URL into CHAT_ENDPOINT below. Until then — or whenever the
 * worker is down/timing out — the widget answers common questions from a
 * local preset knowledge base (same approved facts as the live bot) and
 * only points to call/text/book when nothing matches. Safe to ship as-is.
 *
 * Branding: deliberately never labeled "Grok" user-facing — it presents
 * as the Chasin' Coverage Assistant (an AI helper; Chase follows up).
 */
(() => {
  // ==== CONFIG ============================================================
  const CHAT_ENDPOINT = "https://chasin-chat.chases3k.workers.dev"; // Gemini via Cloudflare Worker (key server-side)
  const GREETING =
    "Hi! I'm the Chasin' Coverage assistant. Ask me about Medical, Life, Dental, or Vision coverage — or the free 15-minute call with Chase.";
  const QUICK_REPLIES = [
    "What do you help with?",
    "Do you charge a fee?",
    "Which states do you serve?",
    "Book the free call",
  ];
  // Shown once, when the assistant is offline and has no preset answer
  // for what the visitor asked.
  const ABSENT_NOTICE_HTML =
    'The AI helper is offline right now — but Chase is one tap away:<br>' +
    '<a href="tel:+13188807508">Call or text 318-880-7508</a> · ' +
    '<a href="mailto:chasincoverage@gmail.com">Email</a> · ' +
    '<a href="#book">Book a time</a>';

  // Offline brain: preset answers for the most common visitor questions.
  // Wording matches the page FAQ and the Grok system prompt in
  // chat-worker.js, so the bot never says two different things.
  const PRESET_QA = [
    { k: ["fee", "cost", "charge", "price", "expensive", "pay", "much"],
      a: "No. Like most independent agents, compensation comes from carriers when you enroll. You don't get an invoice for the guidance." },
    { k: ["free call", "consult", "15 minute", "15-minute", "15 min", "what happens on the call", "appointment", "meeting", "phone call", "expect"],
      a: "You tell Chase your situation: state, household, budget, doctors, timeline. He outlines next steps. No pressure to buy on the call." },
    { k: ["small business", "business", "employee", "team of", "company", "2-3", "micro-group", "owner-only", "group plan", "group vs"],
      a: "Yes. Micro-groups and owner-only setups are common. Chase walks through group vs individual and what usually fits the budget." },
    { k: ["agent", "broker", "instead of", "why use", "carrier directly", "healthcare.gov", "by myself", "on my own"],
      a: "One carrier only shows their own products. An independent agent compares across options for your state." },
    { k: ["open enrollment", "enrollment", "enroll", "deadline", "special enrollment", "qualifying", "life event", "window"],
      a: "No. Private insurance can be purchased any time of year. Marketplace plans still have open-enrollment windows (or special enrollment after a life event). Chase will map what fits." },
    { k: ["which states", "states", "serve", "texas", "louisiana", "where", "licensed", "license", "houston", "near", "local", "live in", "area", "producer"],
      a: "Most states, everywhere except California, Connecticut, Washington, Oregon, New Mexico, New York, New Jersey, New Hampshire, Massachusetts, Maine, Minnesota, North Dakota, Idaho, Hawaii, Rhode Island, and Alaska. Based in the Houston area. Producer ID: 22123071 (for license verification). Not sure? Call or book a slot and ask." },
    { k: ["marketplace", "obamacare", "aca", "subsidy", "switch", "tax credit"],
      a: "Yes. Chase reviews what you have, compares private and marketplace options for your state, and makes the switch without creating a coverage gap." },
    { k: ["how fast", "when can", "start", "effective", "asap", "soon", "immediately"],
      a: "Private plans can start any time of year. Marketplace plans require open enrollment or a qualifying life event. On the free call, Chase maps your window and timing so nothing lapses." },
    { k: ["dental", "vision", "life insurance", "medicare"],
      a: "Chase covers Medical, Life, Dental, and Vision for individuals, families, and small businesses. Tell him what you need on the free call and he'll point you the right way." },
    { k: ["contact", "phone", "number", "call", "text", "email", "reach", "reach you", "get in touch", "contact you", "talk to", "talk with", "speak to", "speak with", "phone number", "email address", "your number", "book", "schedule", "calendly"],
      a: 'Easiest: <a href="#book">book a free 15-minute call</a>. Or <a href="tel:+13188807508">call/text 318-880-7508</a> · <a href="mailto:chasincoverage@gmail.com">chasincoverage@gmail.com</a>.', isHTML: true },
    { k: ["hello", "hi there", "hey", "what do you help", "what do you do", "help with"],
      a: "Chase helps with Medical, Life, Dental, and Vision coverage — job changes, COBRA, early retirement, or a plan review. The free 15-minute call is the fastest way to real answers." },
    { k: ["human", "real person", "chase", "are you", "ai", "robot", "bot"],
      a: "This is the AI helper — Chase follows up personally. Fastest route to him: <a href=\"#book\">book the free call</a> or <a href=\"tel:+13188807508\">text 318-880-7508</a>.", isHTML: true },
  ];

  // Keyword match against the visitor's message. Intentionally simple (no
  // network): a few clear keywords per topic, official FAQ wording for answers.
  const answerPreset = (text) => {
    const t = " " + text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ") + " ";
    let best = null;
    let bestScore = 0;
    for (const qa of PRESET_QA) {
      let score = 0;
      for (const kw of qa.k) {
        if (t.includes(kw)) score += kw.length > 6 ? 2 : 1;
      }
      if (score > bestScore) { best = qa; bestScore = score; }
    }
    return bestScore >= 2 ? best : null;
  };
  // ========================================================================

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // --- markup (injected so the page stays clean without JS) ---------------
  const root = document.createElement("div");
  root.className = "chat-widget";
  root.innerHTML = `
    <button type="button" class="chat-fab" id="chat-fab" aria-expanded="false" aria-controls="chat-panel" aria-label="Open the Chasin' Coverage assistant chat">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <span class="chat-fab-close" aria-hidden="true">✕</span>
    </button>
    <section class="chat-panel" id="chat-panel" role="dialog" aria-label="Chasin' Coverage assistant" hidden>
      <header class="chat-head">
        <img class="chat-avatar" src="assets/logo-mark.png" alt="" width="34" height="34" />
        <div class="chat-head-text">
          <strong>Chasin' Coverage Assistant</strong>
          <span>AI helper · Chase follows up personally</span>
        </div>
        <button type="button" class="chat-close" id="chat-close" aria-label="Close chat">✕</button>
      </header>
      <div class="chat-log" id="chat-log" role="log" aria-live="polite"></div>
      <div class="chat-chips" id="chat-chips"></div>
      <form class="chat-form" id="chat-form">
        <label class="sr-only" for="chat-input">Message the assistant</label>
        <input id="chat-input" type="text" autocomplete="off" maxlength="600" placeholder="Ask about coverage…" />
        <button type="submit" class="chat-send" id="chat-send" aria-label="Send message">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
            <path d="M2 21 23 12 2 3v7l15 2-15 2z"/>
          </svg>
        </button>
      </form>
      <p class="chat-fine">AI answers can be imperfect — enrollment and quotes happen on your free call with Chase.</p>
    </section>`;
  document.body.appendChild(root);

  const fab = root.querySelector("#chat-fab");
  const panel = root.querySelector("#chat-panel");
  const log = root.querySelector("#chat-log");
  const chipsEl = root.querySelector("#chat-chips");
  const form = root.querySelector("#chat-form");
  const input = root.querySelector("#chat-input");
  const sendBtn = root.querySelector("#chat-send");

  // --- state ---------------------------------------------------------------
  let history = [];
  try {
    history = JSON.parse(sessionStorage.getItem("cc-chat") || "[]");
    if (!Array.isArray(history)) history = [];
  } catch (_) {
    history = [];
  }
  const saveHistory = () => {
    try { sessionStorage.setItem("cc-chat", JSON.stringify(history.slice(-12))); } catch (_) {}
  };
  let pending = false;
  let greeted = false;
  let closing = false;

  const addMsg = (text, who, isHTML) => {
    const el = document.createElement("div");
    el.className = `chat-msg chat-msg-${who}`;
    if (isHTML) el.innerHTML = text;
    else el.textContent = text;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  };

  const addTyping = () => {
    const el = document.createElement("div");
    el.className = "chat-msg chat-msg-assistant chat-typing";
    el.setAttribute("aria-label", "Assistant is typing");
    el.innerHTML = "<span></span><span></span><span></span>";
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  };

  const buildChips = () => {
    chipsEl.innerHTML = "";
    QUICK_REPLIES.forEach((q) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chat-chip";
      b.textContent = q;
      b.addEventListener("click", () => {
        if (q === "Book the free call") {
          const bookLink = document.querySelector('a[href="#book"]');
          if (bookLink) bookLink.click();
          setOpen(false);
          return;
        }
        input.value = q;
        form.requestSubmit();
      });
      chipsEl.appendChild(b);
    });
  };

  const setOpen = (open) => {
    if (open) {
      closing = false;
      panel.classList.remove("is-closing");
      panel.hidden = false;
      fab.setAttribute("aria-expanded", "true");
      fab.classList.add("is-open");
      if (!greeted) {
        greeted = true;
        if (history.length) {
          history.slice(-6).forEach((m) => addMsg(m.content, m.role === "user" ? "user" : "assistant"));
        } else {
          addMsg(GREETING, "assistant");
        }
        buildChips();
      }
      setTimeout(() => input.focus(), reduceMotion ? 0 : 120);
      return;
    }

    // Close: quick reverse animation, THEN hide (display:none would skip it)
    if (panel.hidden || closing) return;
    closing = true;
    fab.setAttribute("aria-expanded", "false");
    fab.classList.remove("is-open");
    const finish = () => {
      panel.hidden = true;
      panel.classList.remove("is-closing");
      closing = false;
      fab.focus();
    };
    if (reduceMotion) {
      finish();
      return;
    }
    panel.classList.add("is-closing");
    let done = false;
    panel.addEventListener(
      "animationend",
      () => {
        if (!done) {
          done = true;
          finish();
        }
      },
      { once: true }
    );
    // Safety net in case animationend never fires
    setTimeout(() => {
      if (!done) {
        done = true;
        finish();
      }
    }, 260);
  };

  fab.addEventListener("click", () => setOpen(panel.hidden));
  root.querySelector("#chat-close").addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.hidden) setOpen(false);
  });

  const ask = async (text) => {
    if (pending || !text) return;
    pending = true;
    sendBtn.disabled = true;
    addMsg(text, "user");
    history.push({ role: "user", content: text });
    const typing = addTyping();

    if (!CHAT_ENDPOINT) {
      setTimeout(() => {
        typing.remove();
        replyOffline(text);
        pending = false;
        sendBtn.disabled = false;
      }, reduceMotion ? 0 : 500);
      return;
    }

    try {
      const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
      const timer = ctrl ? setTimeout(() => ctrl.abort(), 12000) : null;
      const res = await fetch(CHAT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-8) }),
        signal: ctrl ? ctrl.signal : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (timer) clearTimeout(timer);
      typing.remove();
      if (!res.ok || !data.reply) throw new Error(data.error || "failed");
      addMsg(data.reply, "assistant");
      history.push({ role: "assistant", content: data.reply });
      saveHistory();
    } catch (_) {
      typing.remove();
      replyOffline(text);
    } finally {
      pending = false;
      sendBtn.disabled = false;
      input.focus();
    }
  };

  // Offline replies: try the local preset knowledge base first; only if
  // nothing matches, show the contact notice (once per session), then a
  // short pointer for further misses.
  let absentNoticeShown = false;
  const replyOffline = (userText) => {
    const preset = answerPreset(userText);
    if (preset) {
      const plain = preset.isHTML ? preset.a.replace(/<[^>]+>/g, "") : preset.a;
      addMsg(preset.a, "assistant", !!preset.isHTML);
      history.push({ role: "assistant", content: plain });
      saveHistory();
      return;
    }
    if (!absentNoticeShown) {
      absentNoticeShown = true;
      addMsg(ABSENT_NOTICE_HTML, "assistant", true);
    } else {
      addMsg(
        "I couldn't find an answer for that — Chase can help directly: <a href=\"#book\">book the free call</a> or <a href=\"tel:+13188807508\">text 318-880-7508</a>.",
        "assistant",
        true
      );
    }
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    ask(text);
  });
})();
