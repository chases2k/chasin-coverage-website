(() => {
  try {
    if (window.__ccTapEventsBound) return;
    window.__ccTapEventsBound = true;

    const sendEvent = (name) => {
      try {
        if (typeof window.gtag === "function") {
          window.gtag("event", name);
        }
      } catch (_) {
        /* ignore */
      }
    };

    const onClick = (e) => {
      try {
        const target = e && e.target;
        const el =
          target && target.nodeType === 1
            ? target
            : target && target.parentElement;
        const link =
          el && typeof el.closest === "function" ? el.closest("a[href]") : null;
        if (!link) return;

        const rawHref = (link.getAttribute("href") || "").trim().toLowerCase();
        if (!rawHref) return;

        if (rawHref.startsWith("tel:")) {
          sendEvent("phone_tap");
        } else if (rawHref.startsWith("mailto:")) {
          sendEvent("email_tap");
        } else if (rawHref.startsWith("https://calendly.com/chasincoverage")) {
          sendEvent("booking_link_tap");
        }
      } catch (_) {
        /* ignore */
      }
    };

    const onMessage = (e) => {
      try {
        if (!e || e.origin !== "https://calendly.com") return;
        const data = e.data;
        if (!data || typeof data !== "object") return;
        if (data.event === "calendly.date_and_time_selected") {
          sendEvent("booking_time_selected");
        } else if (data.event === "calendly.event_scheduled") {
          sendEvent("booking_scheduled");
        }
      } catch (_) {
        /* ignore */
      }
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener("message", onMessage);
  } catch (_) {
    /* ignore */
  }
})();
