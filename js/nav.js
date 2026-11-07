/* ==========================================================================
   Site nav
   1. Appear:  fades in once the hero intro is done ("intro:done" from hero.js)
   2. Idle:    hides after IDLE_MS with no activity; only scrolling brings it back
   3. Menu:    toggle, Esc / scrim to close, focus kept inside while open
   4. Jumps:   links jump instantly instead of smooth-scrolling through the
               pinned hero + experience animations
   ========================================================================== */
(() => {
  const IDLE_MS = 4000;

  const nav = document.querySelector(".site-nav");
  const toggle = nav.querySelector(".nav-toggle");
  const panel = nav.querySelector(".nav-panel");
  const scrim = nav.querySelector(".nav-scrim");
  const links = [...panel.querySelectorAll("a")];

  let ready = false;
  let isOpen = false;
  let idleTimer;

  panel.inert = true; // closed panel is out of the tab order and hidden from screen readers

  /* ---------- 1. Appear ---------- */

  function reveal() {
    if (ready) return;
    ready = true;
    nav.classList.add("is-ready");
    resetIdle();
  }
  document.addEventListener("intro:done", reveal, { once: true });
  setTimeout(reveal, 3000); // fallback in case the intro never reports in

  /* ---------- 2. Idle ---------- */

  function resetIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(goIdle, IDLE_MS);
  }

  function goIdle() {
    // never hide while the menu is open or the icon is being hovered/focused
    if (isOpen || nav.matches(":hover, :focus-within")) return resetIdle();
    nav.classList.add("is-idle");
  }

  function wake() {
    if (!ready) return;
    nav.classList.remove("is-idle");
    resetIdle();
  }

  // while the icon is visible, any activity keeps it visible
  ["pointermove", "keydown", "touchstart"].forEach((type) =>
    window.addEventListener(
      type,
      () => {
        if (ready && !nav.classList.contains("is-idle")) resetIdle();
      },
      { passive: true },
    ),
  );

  // once hidden, only a scroll brings it back...
  window.addEventListener("scroll", wake, { passive: true });
  // ...or Tabbing to it, so keyboard users are never stuck without the menu
  toggle.addEventListener("focus", wake);

  /* ---------- 3. Menu ---------- */

  function setOpen(open, { returnFocus = true } = {}) {
    isOpen = open;
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    panel.inert = !open;

    if (open) {
      clearTimeout(idleTimer);
      // wait a frame so the panel is no longer inert/hidden, otherwise focus() is ignored
      requestAnimationFrame(() => links[0].focus());
    } else {
      if (returnFocus) toggle.focus();
      resetIdle();
    }
  }

  toggle.addEventListener("click", () => setOpen(!isOpen));
  scrim.addEventListener("click", () => setOpen(false));

  document.addEventListener("keydown", (e) => {
    if (!isOpen) return;

    if (e.key === "Escape") {
      setOpen(false);
      return;
    }

    // keep Tab cycling between the toggle (close) and the links
    if (e.key === "Tab") {
      const first = toggle;
      const last = links[links.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  /* ---------- 4. Jumps ---------- */

  links.forEach((link) => {
    const href = link.getAttribute("href");

    // external links (resume) just close the menu
    if (!href.startsWith("#")) {
      link.addEventListener("click", () => setOpen(false, { returnFocus: false }));
      return;
    }

    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = document.querySelector(href);
      if (!target) return;

      setOpen(false, { returnFocus: false });

      // pinned sections are position:fixed mid-pin; measure their spacer instead
      const anchor = target.closest(".pin-spacer") || target;
      const top = anchor.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top, behavior: "instant" });

      // move focus to the section so keyboard / screen reader users land there too
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    });
  });
})();
