/* ==========================================================================
   Hero
   1. Intro (plays on load): portrait rises -> role fades in and cycles -> cue appears
   2. Scroll (pinned):      headshot pixelates -> swaps to the sprite -> scroll arrow appears
   ========================================================================== */

(() => {
  gsap.registerPlugin(ScrollTrigger);

  // ScrollTrigger also remembers/restores scroll on refresh; turn that off and
  // start at the top so the scrubbed hero never begins half-played.
  ScrollTrigger.clearScrollMemory("manual");
  window.scrollTo(0, 0);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. Intro ---------- */

  const el = {
    stage: document.querySelector(".stage"),
    role: document.querySelector(".role"),
    faces: [...document.querySelectorAll(".role__face")],
    cue: document.querySelector("#user__cue"),
    scrollCue: document.querySelector(".scroll-cue"),
    cueIcon: document.querySelector(".scroll-cue__gems"),
  };

  const ROLE_HOLD = 1; // seconds each role stays on screen

  // Software Engineer -> Product Builder -> Full Stack Developer -> repeat
  function startRoleLoop() {
    if (reduceMotion) return;

    let i = 0;
    const flip = () => {
      const current = el.faces[i];
      i = (i + 1) % el.faces.length;
      const next = el.faces[i];

      gsap
        .timeline({ onComplete: () => gsap.delayedCall(ROLE_HOLD, flip) })
        .to(current, { rotateX: -90, duration: 0.4, ease: "power2.in" })
        .fromTo(next, { rotateX: 90 }, { rotateX: 0, duration: 0.5, ease: "power2.out" });
    };

    gsap.delayedCall(ROLE_HOLD, flip);
  }

  const intro = gsap.timeline({ paused: true, defaults: { ease: "power2.out" } });

  intro
    .fromTo(el.stage, { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: 0.9 }, 0)
    .fromTo(el.role, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.6 }, 0.5)
    .add(startRoleLoop, 1.1)
    .fromTo(el.cue, { autoAlpha: 0, y: -14 }, { autoAlpha: 1, y: 0, duration: 0.7 }, 1.3)
    // tells nav.js to fade the menu icon in (also fires when the intro is skipped)
    .add(() => document.dispatchEvent(new Event("intro:done")), 1.5);

  // Any scroll / tap / key press jumps the intro to its end.
  const skipEvents = ["wheel", "touchstart", "keydown", "pointerdown"];

  function skipIntro() {
    intro.progress(1, false);
    skipEvents.forEach((e) => window.removeEventListener(e, skipIntro));
  }

  if (reduceMotion) {
    intro.progress(1, false);
  } else {
    skipEvents.forEach((e) => window.addEventListener(e, skipIntro, { passive: true }));
    intro.play();
  }

  /* ---------- 2. Pixelate on scroll ---------- */

  const canvas = document.getElementById("headshot");
  const ctx = canvas.getContext("2d");
  const SIZE = 800;
  const BLOCKS = [1, 2, 4, 5, 8, 10, 16, 20, 25, 40, 50, 80, 100]; // all divide 800
  const MAX_BLOCK = 100;

  const photo = new Image();
  const off = document.createElement("canvas"); // tiny offscreen canvas
  const octx = off.getContext("2d");

  // Pick the allowed block size closest to b (compared on a log scale)
  function snap(b) {
    return BLOCKS.reduce((best, v) =>
      Math.abs(Math.log(v) - Math.log(b)) < Math.abs(Math.log(best) - Math.log(b)) ? v : best,
    );
  }

  function drawPixelated(block) {
    if (!photo.naturalWidth) return; // not loaded yet; onload draws it
    const cells = SIZE / block;
    off.width = off.height = cells;
    octx.imageSmoothingEnabled = true;
    octx.drawImage(photo, 0, 0, cells, cells); // shrink
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.drawImage(off, 0, 0, cells, cells, 0, 0, SIZE, SIZE); // blow back up
  }

  const state = { p: 0 }; // progress 0 -> 1, the tween animates this number
  const blockFor = (p) => snap(Math.exp(Math.log(MAX_BLOCK) * p));

  // Draw whatever block size the scroll position currently calls for.
  photo.onload = () => drawPixelated(blockFor(state.p));

  // Build the scroll animation right away (not inside photo.onload). On a real
  // server the image arrives late, and creating the pin then inserts a 3000px
  // spacer + forces a refresh while the visitor may already be further down,
  // which leaves the hero timeline out of sync and it won't reverse.
  (() => {
    // reduced motion: no pin, no pixelate/bubble/stars. Jump straight to the
    // light theme so the sections below look right, and show the scroll arrow.
    if (reduceMotion) {
      gsap.set(":root", { "--mesh": 1, "--text": "#1B1033" });
      gsap.set(el.cue, { autoAlpha: 0 }); // "scroll to animate" doesn't apply
      gsap.set(el.scrollCue, { autoAlpha: 1 });
      return;
    }

    // arrow bob: paused until the scroll reaches the very end
    const bob = gsap.to(el.cueIcon, {
      y: 10,
      duration: 0.9,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      paused: true,
    });

    // later tweens on an already-animated property: don't apply their start
    // values when the timeline is built, or they'd overwrite the starting look
    const later = { immediateRender: false };

    gsap
      .timeline({
        scrollTrigger: {
          trigger: ".sprite",
          start: "top 10%",
          end: "+=3000",
          pin: true,
          scrub: true,
          // markers: true,
          refreshPriority: 1,
          onUpdate: (self) => (self.progress === 1 ? bob.play() : bob.pause()),
        },
      })
      // Every step is a fromTo with explicit start values. Plain .to() records its
      // start the first time it plays; on an iPhone reload the timeline can jump
      // ahead once before settling at the top, so .to() tweens recorded the wrong
      // start and the pop vector / dark text stayed stuck on screen.
      // Later tweens on an already-animated property use `later` (see above).

      // 1) pixelate
      .to(state, {
        p: 1,
        ease: "none",
        duration: 4,
        onUpdate: () => drawPixelated(blockFor(state.p)),
      })
      // the intro also animates the cue, so don't set it at build time
      .fromTo(el.cue, { autoAlpha: 1 }, { autoAlpha: 0, duration: 1, ease: "power2.out", ...later }, "<")

      // 2) swap to the sprite
      .fromTo("#headshot", { opacity: 1 }, { opacity: 0, duration: 0.5 })
      .fromTo("#spritesheet", { opacity: 0 }, { opacity: 1, duration: 0.5 }, "<")

      // two frames where the character has no mouth
      .fromTo(
        "#spritesheet",
        { backgroundPositionX: "0%" },
        { backgroundPositionX: "15.385%", ease: "steps(2)", duration: 0.3 },
      )

      // bubble and sprite blowing
      .fromTo(
        "#spritesheet",
        { backgroundPositionX: "15.385%" },
        { backgroundPositionX: "84.615%", ease: "steps(9)", duration: 6, ...later },
      )
      .fromTo("#bubble", { opacity: 0 }, { opacity: 1, duration: 0.1 }, "<+=0.667")
      .fromTo(
        "#bubble",
        { scale: 0.1 },
        { scale: 1, transformOrigin: "48% 70%", ease: "none", duration: 6 },
        "<",
      )

      // bubble pop
      .fromTo("#bubble", { opacity: 1 }, { opacity: 0, ...later })
      .fromTo("#pop", { opacity: 0 }, { opacity: 1, duration: 0.5 }, "<")
      .fromTo(
        ":root",
        { "--mesh": 0, "--text": "#f7eeff" },
        { "--mesh": 1, "--text": "#1B1033", duration: 2, ease: "none" },
        "<",
      )
      .fromTo(
        "#spritesheet",
        { backgroundPositionX: "84.615%" },
        { backgroundPositionX: "100%", ease: "steps(2)", duration: 2, ...later },
        "<",
      )
      .fromTo(
        "#pop",
        { scale: 1.5 },
        { scale: 1, transformOrigin: "50% 50%", ease: "power3.out", duration: 2 },
        "<",
      )

      // pop disappears
      .fromTo("#pop", { opacity: 1 }, { opacity: 0, ease: "power2.out", ...later }, "-=0.6")

      // stars appear
      .fromTo(
        ".star",
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, ease: "back.out(2)", duration: 0.5, stagger: 0.1 },
        "-=0.3",
      )

      // stars fall
      .fromTo(
        ".star",
        { y: 0, rotation: 0 },
        {
          y: "120vh",
          rotation: (i) => (i % 2 ? 180 : -180),
          ease: "bounce.in",
          duration: 3,
          stagger: 0.1,
          ...later,
        },
      )

      // 4) scroll arrow: keep this LAST
      .fromTo(el.scrollCue, { autoAlpha: 0, y: -14 }, { autoAlpha: 1, y: 0, duration: 0.5 });

    // hero.js runs before experience.js, so triggers are already created in page
    // order. sort() is just a safety net; ScrollTrigger refreshes itself on load.
    ScrollTrigger.sort();
  })();

  photo.src = "./images/headshot.png"; // set last, after onload is attached
})();
