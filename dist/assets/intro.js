// Decide before the body paints, so the homepage never flashes before the intro.
(() => {
  const root = document.documentElement;
  root.classList.add("app-loading");
  // Cover every refresh, including visits that skip the intro. Fail open on errors.
  setTimeout(() => {
    root.classList.remove("app-loading", "intro-active", "intro-exiting");
    const shell = document.querySelector(".portfolio-shell");
    if (shell) shell.inert = false;
  }, 5000);
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  try {
    if (sessionStorage.getItem("rai-intro-seen")) return;
    sessionStorage.setItem("rai-intro-seen", "1");
  } catch { /* Storage may be unavailable; the intro still has a fixed end. */ }
  document.documentElement.classList.add("intro-active");
})();
