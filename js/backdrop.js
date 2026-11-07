/* ==========================================================================
   Backdrop parallax
   Each blob drifts at its own speed/direction across the whole page scroll,
   so the background moves slower than the content and feels layered.
   ========================================================================== */
(() => {
  gsap.registerPlugin(ScrollTrigger);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // reduced motion: blobs stay put
  if (reduceMotion) return;

  // [y, x] drift over the entire page, in viewport heights / widths.
  // Mixed directions keep the blobs spread out so no corner goes empty.
  const drift = [
    [0.45, 0.08],
    [-0.35, -0.06],
    [-0.55, 0.05],
    [0.3, -0.1],
    [-0.4, 0.12],
  ];

  document.querySelectorAll(".blob").forEach((blob, i) => {
    const [dy, dx] = drift[i % drift.length];
    gsap.to(blob, {
      y: () => dy * window.innerHeight,
      x: () => dx * window.innerWidth,
      ease: "none",
      scrollTrigger: {
        start: 0,
        end: "max", // whole page, including pinned sections
        scrub: 1.5, // eases behind the scroll for a soft, floaty feel
        invalidateOnRefresh: true,
      },
    });
  });
})();
