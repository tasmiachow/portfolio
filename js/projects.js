(() => {
  gsap.registerPlugin(Draggable);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const cards = [...document.querySelectorAll(".project-card")];                     
    const spacing = 0.2;
  const snapTime = gsap.utils.snap(spacing);
  const RANGE = 250;                     

  gsap.set(cards, { xPercent: RANGE, opacity: 0, scale: 0 });

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
     if(cards[i].querySelector("video")){
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

  function moveTo(offset) {
    scrub.vars.offset = snapTime(offset);
     scrub.invalidate().restart();
  }

  document.querySelector(".next").addEventListener("click", () => moveTo(scrub.vars.offset + spacing));  
  document.querySelector(".prev").addEventListener("click", () => moveTo(scrub.vars.offset - spacing));

  Draggable.create(".drag-proxy", {
    type: "x",
    trigger: ".gallery",                         
    dragClickables: false,
    onPress() { this.startOffset = scrub.vars.offset; },
    onDrag() {
        scrub.vars.offset = this.startOffset + (this.startX - this.x) * (spacing / cards[0].offsetWidth);
        scrub.invalidate().restart();
    },
    onDragEnd() { moveTo(scrub.vars.offset); },
  });

  moveTo(0);
  updateActive();                                

  // paste buildSeamlessLoop from the pen here, unchanged
  function buildSeamlessLoop(items, spacing, animateFunc) {
	let overlap = Math.ceil(1 / spacing), // number of EXTRA animations on either side of the start/end to accommodate the seamless looping
		startTime = items.length * spacing + 0.5, // the time on the rawSequence at which we'll start the seamless loop
		loopTime = (items.length + overlap) * spacing + 1, // the spot at the end where we loop back to the startTime
		rawSequence = gsap.timeline({paused: true}), // this is where all the "real" animations live
		seamlessLoop = gsap.timeline({ // this merely scrubs the playhead of the rawSequence so that it appears to seamlessly loop
			paused: true,
			repeat: -1, // to accommodate infinite scrolling/looping
			onRepeat() { // works around a super rare edge case bug that's fixed GSAP 3.6.1
				this._time === this._dur && (this._tTime += this._dur - 0.01);
			}
		}),
		l = items.length + overlap * 2,
		time, i, index;

	// now loop through and create all the animations in a staggered fashion. Remember, we must create EXTRA animations at the end to accommodate the seamless looping.
	for (i = 0; i < l; i++) {
		index = i % items.length;
		time = i * spacing;
		rawSequence.add(animateFunc(items[index]), time);
		i <= items.length && seamlessLoop.add("label" + i, time); // we don't really need these, but if you wanted to jump to key spots using labels, here ya go.
	}

	// here's where we set up the scrubbing of the playhead to make it appear seamless.
	rawSequence.time(startTime);
	seamlessLoop.to(rawSequence, {
		time: loopTime,
		duration: loopTime - startTime,
		ease: "none"
	}).fromTo(rawSequence, {time: overlap * spacing + 1}, {
		time: startTime,
		duration: startTime - (overlap * spacing + 1),
		immediateRender: false,
		ease: "none"
	});
	return seamlessLoop;
}

})();