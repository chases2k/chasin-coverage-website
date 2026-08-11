(() => {
  // Form endpoint: FormSubmit AJAX → chasincoverage@gmail.com
  // First successful submit may require confirming the email (FormSubmit activation).
  // To switch to Formspree later, set FORM_ENDPOINT to https://formspree.io/f/YOUR_ID
  const FORM_ENDPOINT = "https://formsubmit.co/ajax/chasincoverage@gmail.com";

  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  // Sticky header shadow + mobile menu offset under tall header
  const header = document.querySelector(".site-header");
  const nav = document.getElementById("site-nav");
  const setHeaderOffset = () => {
    if (!header) return;
    const h = header.offsetHeight || 130;
    document.documentElement.style.setProperty("--header-offset", `${h}px`);
  };
  const stickyCta = document.getElementById("sticky-cta");
  const heroEl = document.querySelector(".hero");
  const contactEl = document.getElementById("contact");
  const updateStickyCta = () => {
    if (!stickyCta || !heroEl) return;
    // Desktop: always hidden (CSS also display:none above 900px)
    if (window.matchMedia("(min-width: 901px)").matches) {
      stickyCta.hidden = true;
      document.body.classList.remove("has-sticky-cta");
      return;
    }
    // Don't fight the open menu
    if (document.body.classList.contains("nav-open")) {
      stickyCta.hidden = true;
      document.body.classList.remove("has-sticky-cta");
      return;
    }
    const heroRect = heroEl.getBoundingClientRect();
    // Show sticky as soon as the hero Book button starts leaving the viewport
    // (earlier than waiting for the whole hero to clear - more Book surface area)
    const heroCta = heroEl.querySelector(".btn-primary");
    let pastPrimary = heroRect.bottom < 80;
    if (heroCta) {
      pastPrimary = heroCta.getBoundingClientRect().bottom < 8;
    }
    // Hide near contact form so sticky bar doesn't cover the primary convert block
    let nearContact = false;
    if (contactEl) {
      const cr = contactEl.getBoundingClientRect();
      nearContact = cr.top < window.innerHeight * 0.72;
    }
    const show = pastPrimary && !nearContact;
    stickyCta.hidden = !show;
    document.body.classList.toggle("has-sticky-cta", show);
  };
  const onScroll = () => {
    if (header) header.classList.toggle("scrolled", window.scrollY > 12);
    updateStickyCta();
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => {
    setHeaderOffset();
    updateStickyCta();
  }, { passive: true });
  onScroll();
  setHeaderOffset();
  updateStickyCta();
  // Re-measure after fonts/images settle so anchor offset stays accurate
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      setHeaderOffset();
      updateStickyCta();
    }).catch(() => {});
  }
  window.addEventListener("load", () => {
    setHeaderOffset();
    updateStickyCta();
  }, { once: true });

  // Mobile nav accessibility
  // Nav lives in the header for desktop layout. On open we move it to <body>
  // so position:fixed covers the real viewport (header sticky/backdrop traps fixed kids).
  const toggle = document.getElementById("nav-toggle");
  const navClose = document.getElementById("nav-close");
  let lastFocus = null;
  const navHomeParent = nav ? nav.parentElement : null;
  const navHomeNext = nav ? nav.nextElementSibling : null;

  const parkNavInHeader = () => {
    if (!nav || !navHomeParent) return;
    if (nav.parentElement === navHomeParent) return;
    if (navHomeNext && navHomeNext.parentElement === navHomeParent) {
      navHomeParent.insertBefore(nav, navHomeNext);
    } else {
      navHomeParent.appendChild(nav);
    }
  };

  const setNavOpen = (open) => {
    if (!nav || !toggle) return;

    if (open) {
      // Portal to body so the drawer is never clipped by the header
      if (nav.parentElement !== document.body) {
        document.body.appendChild(nav);
      }
      nav.classList.add("open");
      nav.setAttribute("data-drawer", "open");
    } else {
      nav.classList.remove("open");
      nav.removeAttribute("data-drawer");
      parkNavInHeader();
    }

    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("nav-open", open);
    setHeaderOffset();

    if (open) {
      lastFocus = document.activeElement;
      // Don't fight the sticky bar while the menu is open
      if (stickyCta) stickyCta.hidden = true;
      document.body.classList.remove("has-sticky-cta");
      // Focus Book first - conversion path
      const bookLink = nav.querySelector(".nav-drawer-book");
      if (bookLink) {
        requestAnimationFrame(() => {
          try {
            bookLink.focus({ preventScroll: true });
          } catch (_) {
            bookLink.focus();
          }
        });
      }
    } else if (lastFocus && typeof lastFocus.focus === "function") {
      lastFocus.focus();
      lastFocus = null;
      updateStickyCta();
    } else {
      toggle.focus();
      updateStickyCta();
    }
  };

  if (toggle && nav) {
    if (!toggle.hasAttribute("aria-expanded")) {
      toggle.setAttribute("aria-expanded", "false");
    }

    // stopPropagation so the capture-phase document closer doesn't
    // immediately re-close the drawer on the same tap.
    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      setNavOpen(!nav.classList.contains("open"));
    });

    if (navClose) {
      navClose.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        setNavOpen(false);
      });
    }

    nav.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => setNavOpen(false));
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        e.preventDefault();
        setNavOpen(false);
      }
    });

    // Tap outside drawer (dimmed page) to close - only when open
    document.addEventListener(
      "click",
      (e) => {
        if (!nav.classList.contains("open")) return;
        if (nav.contains(e.target)) return;
        if (toggle.contains(e.target)) return;
        setNavOpen(false);
      },
      true
    );

    // If user rotates to desktop width, force-close and park nav back
    window.addEventListener(
      "resize",
      () => {
        if (window.matchMedia("(min-width: 901px)").matches && nav.classList.contains("open")) {
          setNavOpen(false);
        }
      },
      { passive: true }
    );
  }

  // Home / brand / footer: always scroll to true page top
  // (hash #top on a sticky header often fails to move the page)
  const scrollToPageTop = (e) => {
    if (e) e.preventDefault();
    if (nav && nav.classList.contains("open")) setNavOpen(false);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, left: 0, behavior: reduce ? "auto" : "smooth" });
    try {
      history.replaceState(null, "", `${location.pathname}${location.search}`);
    } catch (_) {
      /* ignore */
    }
  };
  document.querySelectorAll('a[href="#top"]').forEach((a) => {
    a.addEventListener("click", scrollToPageTop);
  });

  // Hero: crossfade doctor → dental → clip3 under blue tint
  const heroVids = [
    document.getElementById("hero-video-a"),
    document.getElementById("hero-video-b"),
    document.getElementById("hero-video-c"),
  ].filter(Boolean);
  if (heroVids.length) {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const playSafe = (v) => {
      const p = v.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };
    if (reduceMotion) {
      heroVids.forEach((v, i) => {
        v.pause();
        v.classList.toggle("is-active", i === 0);
      });
    } else {
      playSafe(heroVids[0]);
      // Warm preload the rest
      heroVids.slice(1).forEach((v) => v.load());
      let idx = 0;
      // Rotate every ~12s through all clips
      window.setInterval(() => {
        const prev = heroVids[idx];
        idx = (idx + 1) % heroVids.length;
        const next = heroVids[idx];
        playSafe(next);
        next.classList.add("is-active");
        prev.classList.remove("is-active");
        window.setTimeout(() => prev.pause(), 1200);
      }, 12000);
    }
  }

  // Scroll reveals
  const reveals = document.querySelectorAll(".reveal");
  if (reveals.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("in"));
  }

  // Contact form → FormSubmit (reliable on mobile; no mailto client required)
  const form = document.getElementById("contact-form");
  const note = document.getElementById("form-note");
  const submitBtn = document.getElementById("contact-submit");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (note) {
      note.textContent = "";
      note.classList.remove("error");
    }

    const name = (form.name.value || "").trim();
    const email = (form.email.value || "").trim();
    const phone = (form.phone.value || "").trim();
    const state = (form.state.value || "").trim();
    const need = (form.need.value || "").trim();
    const message = (form.message.value || "").trim();
    const hp = (form._gotcha && form._gotcha.value) || "";

    if (hp) {
      // Silent drop for bots
      if (note) note.textContent = "Thanks - your message was sent.";
      form.reset();
      return;
    }

    if (!name || !email || !state) {
      if (note) {
        note.textContent = "Name, email, and state are required.";
        note.classList.add("error");
      }
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";
    }
    if (note) note.textContent = "Sending your message…";

    const payload = {
      name,
      email,
      phone: phone || "-",
      state,
      need: need || "-",
      message: message || "-",
      _subject: `Chasin Coverage website lead - ${name} (${state})`,
      _template: "table",
      _replyto: email,
    };

    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (data && (data.error || data.message)) || `Send failed (${res.status})`
        );
      }
      form.reset();
      if (note) {
        note.classList.remove("error");
        note.textContent =
          "Thanks - your message was sent. Chase will follow up soon.";
      }
    } catch (err) {
      if (note) {
        note.classList.add("error");
        note.textContent =
          "Could not send right now. Email chasincoverage@gmail.com or call 318-880-7508.";
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Send message";
      }
    }
  });
})();
