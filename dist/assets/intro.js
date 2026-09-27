// Decide before the body paints, so the homepage never flashes before the intro.
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  try {
    if (sessionStorage.getItem("rai-intro-seen")) return;
    sessionStorage.setItem("rai-intro-seen", "1");
  } catch { /* Storage may be unavailable; the intro still has a fixed end. */ }
  document.documentElement.classList.add("intro-active");
  // Fail open even if the main application cannot initialize.
  setTimeout(() => document.documentElement.classList.remove("intro-active", "intro-exiting"), 5000);
})();
