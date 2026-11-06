gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);

/* ---------- 1. about ---------- */

const aboutEl = {
  section: document.querySelector("#about"),
  track: document.querySelector(".about__track"),
  stage: document.querySelector(".about__stage"),
  vine: document.querySelector("#vine"),
  flowerRider: document.querySelector("#flowerRider"),
  cards: [...document.querySelectorAll(".about-card")],
  leaves: [...document.querySelectorAll('[id^="leaf_"]')],
};

// vars
const vineLength = aboutEl.vine.getTotalLength();

const getScrollDist = () => aboutEl.track.offsetWidth - aboutEl.stage.clientWidth;

// starting state
gsap.set(aboutEl.vine, { drawSVG: "0% 0%" });

gsap.set(aboutEl.cards, { autoAlpha: 0, y: 24 });

const leafOrigins = ["514 508", "1049 463", "2021 407", "2954 499", "3921 470", "4584 268"];

aboutEl.leaves.forEach((leaf, i) => {
  gsap.set(leaf, { scale: 0, svgOrigin: leafOrigins[i] });
});

gsap.set(aboutEl.flowerRider, { autoAlpha: 1 });

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const smooth = (k) => k * k * (3 - 2 * k);

const leafStart = [0.06, 0.12, 0.33, 0.54, 0.86, 0.95]; // from my table
const cardStart = [0.12, 0.33, 0.54, 0.86];

function render(p) {
  // 1) draw the vine
  gsap.set(aboutEl.vine, { drawSVG: `0% ${p * 100}%` });

  // 2) flower
  const pt = aboutEl.vine.getPointAtLength(p * vineLength);
  gsap.set(aboutEl.flowerRider, { x: pt.x - 55, y: pt.y - 53.5 });

  // 3) camera
  const scale = aboutEl.track.offsetWidth / 4800;
  const cam = clamp(pt.x * scale - aboutEl.stage.clientWidth / 2, 0, getScrollDist());
  gsap.set(aboutEl.track, { x: -cam });
  // 4) leaves
  aboutEl.leaves.forEach((leaf, i) => {
    const k = smooth(clamp((p - leafStart[i]) / 0.03, 0, 1));
    gsap.set(leaf, { scale: k });
  });

  // 5) cards
  aboutEl.cards.forEach((card, i) => {
    const k = smooth(clamp((p - cardStart[i]) / 0.03, 0, 1));
    gsap.set(card, { autoAlpha: k, y: (1 - k) * 24 });
  });
}
render(0);

//horizontal scroll trigger

ScrollTrigger.create({
  trigger: aboutEl.section,
  start: "top top",
  end: () => "+=" + getScrollDist(),
  pin: true,
  invalidateOnRefresh: true,
  refreshPriority: 0,
  onUpdate: (self) => render(self.progress),
  markers: true,
});
