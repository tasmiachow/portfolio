(() => {
  const btn = document.getElementById("copy-email");
  const msg = document.getElementById("copied-msg");
  btn.addEventListener("click", () => {
    navigator.clipboard.writeText("chowtasmia@gmail.com").then(() => {
      msg.classList.add("is-shown");
      setTimeout(() => msg.classList.remove("is-shown"), 1200);
    });
  });
})();