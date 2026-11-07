(() => {
  gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. about ---------- */

  const expEl = {
    section: document.querySelector("#experience"),
    track: document.querySelector(".experience__track"),
    stage: document.querySelector(".experience__stage"),
    vine: document.querySelector("#vine"),
    flowerRider: document.querySelector("#flowerRider"),
    cards: [...document.querySelectorAll(".exp-card")],
    leaves: [...document.querySelectorAll('[id^="leaf_"]')],
    petals: document.querySelector("#petals"),
    resumeBtn: document.querySelector(".resume-btn"),
  };

  // vars
  const vineLength = expEl.vine.getTotalLength();

  const SPEED_FACTOR = 1.3; // 1 = original speed

  const getScrollDist = () => expEl.track.offsetWidth - expEl.stage.clientWidth;

  // starting state
  gsap.set(expEl.vine, { drawSVG: "0% 0%" });

  gsap.set(expEl.cards, { autoAlpha: 0, y: 24 });

  const leafOrigins = ["514 508", "1049 463", "2021 407", "2954 499", "3921 470", "4584 268"];

  expEl.leaves.forEach((leaf, i) => {
    gsap.set(leaf, { scale: 0, svgOrigin: leafOrigins[i] });
  });

  gsap.set(expEl.flowerRider, { autoAlpha: 1 });

  const narrow = window.matchMedia("(max-width: 700px)"); // same breakpoint as the CSS

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const smooth = (k) => k * k * (3 - 2 * k);

  const leafStart = [0.06, 0.12, 0.33, 0.54, 0.86, 0.95]; // from my table
  const cardStart = [0.06, 0.12, 0.33, 0.54, 0.86];

  function render(p) {
    // 1) draw the vine
    gsap.set(expEl.vine, { drawSVG: `0% ${p * 100}%` });
    // gsap.set(expEl.petals, { rotation: `${p*1440}`, transformOrigin: "50% 50%" })

    // 2) flower
    const pt = expEl.vine.getPointAtLength(p * vineLength);
    gsap.set(expEl.flowerRider, { x: pt.x - 55, y: pt.y - 53.5 });

    // 3) camera
    const scale = expEl.track.offsetWidth / 4800;
    // phones: keep the flower right of center so the card it just passed stays on screen
    const anchor = narrow.matches ? 0.7 : 0.5;
    const cam = clamp(pt.x * scale - expEl.stage.clientWidth * anchor, 0, getScrollDist());
    gsap.set(expEl.track, { x: -cam });
    // 4) leaves
    expEl.leaves.forEach((leaf, i) => {
      const k = smooth(clamp((p - leafStart[i]) / 0.03, 0, 1));
      gsap.set(leaf, { scale: k });
    });

    // 5) cards
    expEl.cards.forEach((card, i) => {
      const k = smooth(clamp((p - cardStart[i]) / 0.03, 0, 1));
      gsap.set(card, { autoAlpha: k, y: (1 - k) * 24 });
    });
    const kb = smooth(clamp((p - 0.96) / 0.03, 0, 1));
    gsap.set(expEl.resumeBtn, { autoAlpha: kb, y: (1 - kb) * 20 });
  }
  // reduced motion: everything is already drawn and visible; the track just pans
  // with the scroll (needed to reach the cards), no flower, no grow/fade effects.
  function renderStatic(p) {
    gsap.set(expEl.track, { x: -p * getScrollDist() });
  }

  if (reduceMotion) {
    gsap.set(expEl.vine, { drawSVG: "0% 100%" });
    gsap.set(expEl.leaves, { scale: 1 });
    gsap.set(expEl.cards, { autoAlpha: 1, y: 0 });
    gsap.set(expEl.resumeBtn, { autoAlpha: 1, y: 0 });
    gsap.set(expEl.flowerRider, { autoAlpha: 0 });
    renderStatic(0);
  } else {
    render(0);
  }

  //horizontal scroll trigger

  ScrollTrigger.create({
    trigger: expEl.section,
    start: "top top",
    // more scroll distance = slower vine/camera. Raise SPEED_FACTOR to slow it further.
    end: () => "+=" + getScrollDist() * SPEED_FACTOR,
    pin: true,
    invalidateOnRefresh: true,
    refreshPriority: 0,
    onUpdate: (self) => (reduceMotion ? renderStatic : render)(self.progress),
    // markers: true,
  });
})();
