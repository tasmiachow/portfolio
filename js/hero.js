/* ==========================================================================
   Hero
   1. Intro (plays on load): portrait rises -> role fades in and cycles -> cue appears
   2. Scroll (pinned):      headshot pixelates -> swaps to the sprite -> scroll arrow appears
   ========================================================================== */

gsap.registerPlugin(ScrollTrigger);

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
  .fromTo(el.cue, { autoAlpha: 0, y: -14 }, { autoAlpha: 1, y: 0, duration: 0.7 }, 2.2);

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
  const cells = SIZE / block;
  off.width = off.height = cells;
  octx.imageSmoothingEnabled = true;
  octx.drawImage(photo, 0, 0, cells, cells); // shrink
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.drawImage(off, 0, 0, cells, cells, 0, 0, SIZE, SIZE); // blow back up
}

photo.onload = () => {
  drawPixelated(1);

  const state = { p: 0 }; // progress 0 -> 1, the tween animates this number

  // arrow bob: paused until the scroll reaches the very end
  const bob = gsap.to(el.cueIcon, {
    y: 10,
    duration: 0.9,
    ease: "sine.inOut",
    repeat: -1,
    yoyo: true,
    paused: true,
  });

  gsap
    .timeline({
      scrollTrigger: {
        trigger: ".sprite",
        start: "top top",
        end: "+=3000",
        pin: true,
        scrub: true,
        markers: true,
        onUpdate: (self) => (self.progress === 1 ? bob.play() : bob.pause()),
      },
    })
    // 1) pixelate
    .to(state, {
      p: 1,
      ease: "none",
      duration: 4,
      onUpdate: () => drawPixelated(snap(Math.exp(Math.log(MAX_BLOCK) * state.p))),
    })
    .to(el.cue, { autoAlpha: 0, duration: 1, ease: "power2.out" }, "<")

    // 2) swap to the sprite

    .to("#headshot", { opacity: 0, duration: 0.5 })
    .to("#spritesheet", { opacity: 1, duration: 0.5 }, "<")

    //two frames were the character has no mouth
    .to("#spritesheet", {
      backgroundPositionX: "15.385%",
      ease: "steps(2)",
      duration: 0.3,
    })

    // bubble and sprite blowing
    .to("#spritesheet", {
      backgroundPositionX: "84.615%",
      ease: "steps(9)",
      duration: 6,
    })
    .to(
      "#bubble",
      {
        opacity: 1,
        duration: 0.1,
      },
      "<+=0.667",
    )
    .fromTo(
      "#bubble",
      { scale: 0.1 },
      { scale: 1, transformOrigin: "48% 70%", ease: "none", duration: 6 },
      "<",
    )

    // bubble pop
    .to("#bubble", {
      opacity: 0,
    })
    .to(
      "#pop",
      {
        opacity: 1,
        duration: 0.5,
      },
      "<",
    )
    .to(
      "#spritesheet",
      {
        backgroundPositionX: "100%",
        ease: "steps(2)",
        duration: 3,
      },
      "<",
    )
    .fromTo(
      "#pop",
      { scale: 1.5 },
      { scale: 1, transformOrigin: "50% 50%", ease: "power3.out", duration: 3 },
      "<",
    )
    

    //pop disappears

    .to("#pop", { opacity: 0, duration: 0.5, ease: "power2.out" }, "-=0.6")
    
    //stars appear 
    .fromTo(".star", 
      { scale:0, opacity:0 }, 
      { scale:1, opacity:1, 
        ease: "back.out(2)",
        duration: 0.3,
        stagger:0.1
      },
      "-=0.3"
    )

    // stars fall 
    .to(".star", {
      y:"300%",
      rotation: (i) => i % 2 ? 180 : -180,
      opacity:0, 
      ease:"power1.in", 
      duration: 2,
      stagger:0.1
    })



    // 4) scroll arrow: keep this LAST
    .fromTo(el.scrollCue, { autoAlpha: 0, y: -14 }, { autoAlpha: 1, y: 0, duration: 0.5 });
};

photo.src = "./images/headshot.png"; // set last, after onload is attached
