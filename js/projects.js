(() => {
  gsap.registerPlugin(Draggable);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const cards = [...document.querySelectorAll(".project-card")];                     
    const spacing = 0.2;
  const snapTime = gsap.utils.snap(spacing);
  const RANGE = 250;                     

  gsap.set(cards, { xPercent: RANGE, opacity: 0, scale: 0 });

  // reduced motion: no autoplaying loops. Give the videos controls so they can be played on demand.
  if (reduceMotion) {
    document.querySelectorAll(".project__media video").forEach((v) => (v.controls = true));
  }

  const animateFunc = (element) => {
    const tl = gsap.timeline();
		tl.fromTo(element, {scale: 0, opacity: 0}, {scale: 1, opacity: 1, zIndex: 100, duration: 0.5, yoyo: true, repeat: 1, ease: "power1.in", immediateRender: false})
		  .fromTo(element, {xPercent: RANGE}, {xPercent: -RANGE, duration: 1, ease: "none", immediateRender: false}, 0);
		return tl;
  };

  const seamlessLoop = buildSeamlessLoop(cards, spacing, animateFunc);
  const playhead = { offset: 0 };
  const wrapTime = gsap.utils.wrap(0, seamlessLoop.duration());


const wrapIndex = gsap.utils.wrap(0, cards.length);
let active = -1;
function updateActive() {
    const i = wrapIndex(Math.round(playhead.offset/spacing));
     if (i === active){
        return; 
     }
    const prev = cards[active]?.querySelector("video");
    if (prev){
        prev.pause();
    }
     if(cards[i].querySelector("video") && !reduceMotion){
        cards[i].querySelector("video").play();
     }
    active = i;
   }

  const scrub = gsap.to(playhead, {
    offset: 0,
    onUpdate() { seamlessLoop.time(wrapTime(playhead.offset)); updateActive(); },
    duration: 0.35,
    ease: "power3",
    paused: true,
  });

  // glide the playhead to offset; reduced motion jumps there instantly instead
  function seek(offset) {
    scrub.vars.offset = offset;
    if (reduceMotion) {
      playhead.offset = offset;
      seamlessLoop.time(wrapTime(offset));
      updateActive();
    } else {
      scrub.invalidate().restart();
    }
  }

  function moveTo(offset) {
    seek(snapTime(offset));
  }

  document.querySelector(".next").addEventListener("click", () => moveTo(scrub.vars.offset + spacing));  
  document.querySelector(".prev").addEventListener("click", () => moveTo(scrub.vars.offset - spacing));

  Draggable.create(".drag-proxy", {
    type: "x",
    trigger: ".gallery",                         
    dragClickables: false,
    onPress() { this.startOffset = scrub.vars.offset; },
    onDrag() {
        seek(this.startOffset + (this.startX - this.x) * (spacing / cards[0].offsetWidth));
    },
    onDragEnd() { moveTo(scrub.vars.offset); },
  });

  moveTo(0);
  updateActive();                                

  // Builds a timeline exactly one card-cycle long (items.length * spacing) that scrubs a
  // longer "raw" sequence of staggered card animations. The pen's version assumed lots of
  // cards; with only a few, one of its tweens got a negative duration, which made the loop
  // longer than a cycle so snap points landed between cards. This version works for any count.
  // Note: needs items.length * spacing >= 1 (each card animation is 1s long), or copies overlap.
  function buildSeamlessLoop(items, spacing, animateFunc) {
    const n = items.length;
    const cycle = n * spacing;
    // card 0 is centered at raw time i*spacing + 0.5 for any i that is a multiple of n.
    // Start at least 1s in so every card that should be on screen has a copy already running.
    const startTime = Math.ceil(0.5 / cycle) * cycle + 0.5;
    const endTime = startTime + cycle;
    const count = Math.ceil(endTime / spacing) + 1; // enough copies to cover the right edge too

    const rawSequence = gsap.timeline({ paused: true });
    for (let i = 0; i < count; i++) {
      rawSequence.add(animateFunc(items[i % n]), i * spacing);
    }
    rawSequence.time(startTime);

    // no repeat: callers wrap the time into [0, cycle) themselves
    return gsap.timeline({ paused: true }).fromTo(
      rawSequence,
      { time: startTime },
      { time: endTime, duration: cycle, ease: "none", immediateRender: false }
    );
  }

})();