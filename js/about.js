(() => {
  gsap.registerPlugin(ScrollTrigger);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const aboutEl = {
    section: document.querySelector("#about"),
    bubbles: [...document.querySelectorAll(".bubble")],                   
    cards: [...document.querySelectorAll(".about-card")],                     
    fxTemplate: document.querySelector("#fx-template"),
  };

  // reduced motion: show the cards, skip the bubbles
  if (reduceMotion) {
    gsap.set(aboutEl.cards, { autoAlpha: 1 });
    aboutEl.cards.forEach((card) => card.setAttribute("aria-hidden", "false")); // visible, so let screen readers in
    gsap.set(aboutEl.bubbles, { display: "none" });
    return;
  }

  // 1) give every bubble its own burst + stars
  aboutEl.bubbles.forEach((bubble) => {
    bubble.append(aboutEl.fxTemplate.content.cloneNode(true));                           
  });

  // 2) starting state
  gsap.set(aboutEl.bubbles, { scale: 0, autoAlpha: 0 });   

  // 3) entrance, once, when the section scrolls into view
  gsap.to(aboutEl.bubbles, {
    scale: 1,
    autoAlpha: 1,
    ease: "power2.in",                                    
    duration: 0.8,
    // each bubble starts floating as soon as ITS entrance ends (not after all four),
    // so the first bubble (Education) can be popped right away
    stagger: {
      each: 0.15,
      onComplete() {
        startFloating(this.targets()[0]);
      },
    },
    scrollTrigger: { trigger: aboutEl.section, start: "top 50%", once: true },
  });

  // 4) idle float
  const floats = [];
  function startFloating(bubble) {
    const i = aboutEl.bubbles.indexOf(bubble);
    if (bubble.getAttribute("aria-expanded") === "true") return; // already popped
    floats[i] = gsap.to(bubble, {
      y: -15,
      duration: gsap.utils.random(1, 1.5),
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      delay: i * 0.3,
    });
  }
    // 5) click to pop
  let popped = 0;

  aboutEl.bubbles.forEach((bubble, i) => {
    bubble.addEventListener("click", () => pop(bubble, i), { once: true });
  });

  function pop(bubble, i) {
    // console.log(i, floats);
    floats[i]?.kill();                 // may not exist yet if clicked mid-entrance
    gsap.killTweensOf(bubble, "scale,autoAlpha,opacity,visibility"); // stop its entrance
    gsap.set(bubble, { scale: 1, autoAlpha: 1 });

    const card = document.getElementById(bubble.dataset.card);       
    const body  = bubble.querySelectorAll(".bubble__img, .bubble__label, .bubble__hint");
    const burst = bubble.querySelector(".fx__pop");
    const stars = bubble.querySelectorAll(".fx__star");

    
    gsap.set(stars, { xPercent: -50, yPercent: -50 });
    // how far to glide: card center minus bubble center
    const b = bubble.getBoundingClientRect();
    const c = card.getBoundingClientRect();
    const dx = c.left + c.width / 2 - (b.left + b.width / 2);    
    const dy = c.top + c.height / 2 - (b.top + b.height / 2);

    bubble.style.pointerEvents = "none";                 // hint 4
    bubble.setAttribute("aria-expanded", "true");
    card.setAttribute("aria-hidden", "false");

   gsap.timeline({ onComplete: () => gsap.set(bubble, { display: "none" }) })   // hint 9
    .to(bubble, { x: "+=" + dx, y: "+=" + dy, duration: 0.7, ease: "power2.inOut" })   // hint 5

      // swell, then vanish
      .to(body, { scale: 1.12, duration: 0.15 })
      .to(body, { autoAlpha: 0, duration: 0.1 })

      // burst
      .fromTo(burst, { scale: 0.6, autoAlpha: 0 }, { scale: 1.2, autoAlpha: 1, duration: 0.25 }, "<")   // hint 6
      .to(burst, { autoAlpha: 0, duration: 0.3 })

      // stars fly out, then fall
      .fromTo(stars,
        { scale: 0, autoAlpha: 0, x: 0, y: 0 },
        { scale: 1, autoAlpha: 1,
            x: (j) => Math.cos((j / stars.length) * Math.PI * 2) * bubble.offsetWidth * 0.6,   // hint 7
            y: (j) => Math.sin((j / stars.length) * Math.PI * 2) * bubble.offsetWidth * 0.6,
          ease: "back.out(2)", duration: 0.5, stagger: 0.04 },
        "<-0.2")
      .to(stars, { y: "+=220", rotation: (j) => (j % 2 ? 180 : -180),
                   autoAlpha: 0, ease: "power1.in", duration: 0.9, stagger: 0.04 })

      // the card lands in the grid
      .fromTo(card, { autoAlpha: 0, scale: 0.96, y: 20 },
                    { autoAlpha: 1, scale: 1, y: 0, duration: 0.4 },
       "-=0.4");                                         // hint 8

    popped++;
    if (popped === aboutEl.bubbles.length) { /* all four done */ }
  }

})();