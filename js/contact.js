(() => {
  gsap.registerPlugin(ScrollTrigger);
  const footerEl = {
    tool: document.querySelector(".tools"), 
    badge_container: document.querySelector(".badge-container"),

  };

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(reduceMotion){
    gsap.set(".badge", {autoAlpha: 1});
  }
  
  gsap.to('.badge',{
    scrollTrigger:{
      trigger:footerEl.tool,
      start: "top center"

    },
    autoAlpha: 1, 
    stagger: 0.1,
    ease: "power2.in"
  });
  
  const btn = document.getElementById("copy-email");
  const msg = document.getElementById("copied-msg");
  btn.addEventListener("click", () => {
    navigator.clipboard.writeText("chowtasmia@gmail.com").then(() => {
      msg.classList.add("is-shown");
      setTimeout(() => msg.classList.remove("is-shown"), 1200);
    });
  });
})();