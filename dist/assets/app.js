const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const motion = matchMedia("(prefers-reduced-motion: reduce)");
const navigation = $("#navigation");
const menu = $("#menu-items");
const page = $(".portfolio-scene");
const contact = $("#contact-panel");
const main = $("#main-content");
const feedback = $("#feedback-form");
const contactContent = $(".contact-summary");
let view = "home";
let menuOpen = false;
let contactOpen = false;
let project = 1;
let work = 1;
let simulation;
let backgroundLoading = false;
const viewTimers = new Set();
let clipboardTimer;
let navigationTimer;
let typingGeneration = 0;
let returnFocus;
const later = (fn, ms) => {
  const id = setTimeout(
    () => {
      viewTimers.delete(id);
      fn();
    },
    motion.matches ? 0 : ms
  );
  viewTimers.add(id);
  return id;
};
function clearViewTimers() {
  viewTimers.forEach(clearTimeout);
  viewTimers.clear();
  typingGeneration++;
}
function focusHeading() {
  $(`#${view}-title`)?.focus({ preventScroll: true });
}
function updateSimulation() {
  if (!simulation) return;
  const paused = document.hidden || motion.matches || contactOpen ||
    document.documentElement.classList.contains("intro-active");
  simulation.setPaused(paused);
  if (!paused && !contactOpen && !menuOpen)
    simulation.addAllEventListeners();
  else simulation.removeAllEventListeners();
}
function setMenu(open, focus = true) {
  clearTimeout(navigationTimer);
  if (open && contactOpen) setContact(false, false);
  menuOpen = open;
  navigation.classList.toggle("is-open", open);
  page.classList.toggle("menu-visible", open);
  menu.inert = !open;
  main.inert = open || contactOpen;
  const button = $('[data-action="toggle-menu"]');
  button.setAttribute("aria-expanded", String(open));
  button.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  updateSimulation();
  if (focus)
    (open ? $('[aria-current="page"]', menu) : button).focus({
      preventScroll: true,
    });
}
function setContact(open, restore = true) {
  if (open) {
    returnFocus = document.activeElement;
    setMenu(false, false);
  }
  contactOpen = open;
  document.body.classList.toggle("contact-mode", open);
  contact.classList.toggle("is-visible", open);
  page.classList.toggle("contact-visible", open);
  contact.inert = !open;
  main.inert = open;
  $('[data-action="contact-menu"]').hidden = !open;
  $('[data-action="toggle-menu"]').inert = open;
  const button = $('[data-action="toggle-contact"]');
  button.setAttribute("aria-expanded", String(open));
  button.setAttribute("aria-label", open ? "Close contact" : "Contact me");
  updateSimulation();
  if (open) $("#contact-title").focus({ preventScroll: true });
  else {
    setFeedback(false, false);
    if (restore)
      (returnFocus?.isConnected &&
      returnFocus !== document.body &&
      !returnFocus.closest("[hidden], [inert]")
        ? returnFocus
        : button
      ).focus({ preventScroll: true });
  }
}
function showView(next, focus = true) {
  if (!["home", "about", "skills", "work", "projects"].includes(next)) return;
  clearViewTimers();
  $$(".itsMagic").forEach((el) => el.classList.remove("itsMagic"));
  // Reset before exposing the section, including repeat visits to Skills.
  const skills = $("#skills");
  skills.classList.remove("skills-revealed");
  if (next === "skills") {
    skills.hidden = true;
    void skills.offsetHeight;
  }
  view = next;
  $$("[data-view]").forEach((section) => {
    section.hidden = section.dataset.view !== next;
  });
  $$("[data-target]", menu).forEach((button) => {
    if (button.dataset.target === next)
      button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  setMenu(false, false);
  $(".content-viewport").scrollTop = 0;
  if (next === "home") {
    typeSkills();
  }
  if (next === "skills") {
    const revealSkills = () => {
      skills.classList.add("skills-revealed");
      if (!motion.matches && !document.hidden && !menuOpen && !contactOpen)
        simulation?.burst();
      animateSkill();
    };
    if (motion.matches) revealSkills();
    else later(revealSkills, 3000);
  }
  if (next === "projects") showProject(1);
  if (next === "work") showWork(1);
  updateSimulation();
  if (focus) focusHeading();
}
function animateSkill() {
  if (view !== "skills" || motion.matches) return;
  const spans = $$(".animateText", $("#skills"));
  const target = spans[Math.floor(Math.random() * spans.length)];
  if (!document.hidden && !menuOpen && !contactOpen)
    target.classList.add("itsMagic");
  later(() => {
    target.classList.remove("itsMagic");
    animateSkill();
  }, 2000);
}
function showWork(number) {
  const roles = $$("[data-work]");
  work = number;
  roles.forEach((role) => { role.hidden = Number(role.dataset.work) !== number; });
  $(".work-counter").textContent = `${number} / ${roles.length}`;
  for (const [action, disabled] of [
    ["previous-work", number === 1],
    ["next-work", number === roles.length],
  ]) {
    const button = $(`[data-action="${action}"]`);
    button.setAttribute("aria-disabled", String(disabled));
    button.classList.toggle("disabled", disabled);
  }
  $(".content-viewport").scrollTop = 0;
}
function showProject(number) {
  project = number;
  $(".project-position").textContent = `${number} / ${$$("[data-project]").length}`;
  $$("[data-project]").forEach((slide) => {
    slide.hidden = Number(slide.dataset.project) !== number;
    $("article", slide).classList.toggle("showProjectPara", motion.matches);
  });
  for (const [name, disabled] of [
    ["previous-project", number === 1],
    ["next-project", number === $$("[data-project]").length],
  ]) {
    const button = $(`[data-action="${name}"]`);
    button.setAttribute("aria-disabled", String(disabled));
    button.classList.toggle("disabled", disabled);
  }
}
const code = $(".code-skill");
const originalCode = code.innerHTML;
// Reserve the complete code block's size while the visible copy types.
const codeSizeGuide = code.cloneNode(true);
codeSizeGuide.classList.add("code-size-guide");
code.after(codeSizeGuide);
function typeSkills() {
  const generation = ++typingGeneration;
  code.innerHTML = originalCode;
  if (motion.matches) return;
  const erasedSkill = $(".text-red-500:empty", code);
  erasedSkill.textContent = "stackoverflow";
  const walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode())
    nodes.push({
      node: walker.currentNode,
      text: walker.currentNode.textContent,
      erase: walker.currentNode.parentElement === erasedSkill,
    });
  nodes.forEach((item) => (item.node.textContent = ""));
  let n = 0,
    pos = 0;
  function tick() {
    if (generation !== typingGeneration || view !== "home") return;
    if (document.hidden) {
      later(tick, 250);
      return;
    }
    if (n >= nodes.length) return;
    const item = nodes[n];
    if (item.erase && pos === item.text.length) {
      later(function erase() {
        if (generation !== typingGeneration) return;
        if (item.node.textContent.length) {
          item.node.textContent = item.node.textContent.slice(0, -1);
          later(erase, 30);
        } else {
          n++;
          pos = 0;
          tick();
        }
      }, 500);
      return;
    }
    item.node.textContent = item.text.slice(0, ++pos);
    if (pos >= item.text.length && !item.erase) {
      n++;
      pos = 0;
    }
    later(tick, 15 + Math.random() * 30);
  }
  later(tick, 3000);
}
function setFeedback(open, focus = true) {
  feedback.hidden = !open;
  contactContent.hidden = open;
  if (focus) {
    (open ? $("input[name=name]", feedback) : $('[data-action="show-feedback"]')).focus({
      preventScroll: true,
    });
  }
}
let feedbackSending = false;
async function sendFeedback(event) {
  event.preventDefault();
  if (feedbackSending) return;
  const status = $("#feedback-status");
  const fields = $$("input:not([type=hidden]), textarea", feedback);
  fields.forEach((field) => { field.value = field.value.trim(); });
  if (!feedback.reportValidity()) return;
  const data = Object.fromEntries(new FormData(feedback));
  if (!data.access_key.trim()) {
    status.textContent = "Please email amritanshurai04@gmail.com while this form is being set up.";
    return;
  }
  const button = $("#feedback-send");
  const label = $(".button-label", button);
  feedbackSending = true;
  button.disabled = true;
  fields.forEach((field) => { field.disabled = true; });
  feedback.setAttribute("aria-busy", "true");
  label.textContent = "sending…";
  status.textContent = "Sending your message…";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ ...data, replyto: data.email }),
      signal: controller.signal,
    });
    const result = await response.json();
    if (!response.ok || result.success !== true) {
      status.textContent = response.status === 429
        ? "Too many attempts. Please wait a little and try again."
        : "Your message could not be sent. Please try again or email amritanshurai04@gmail.com.";
      return;
    }
    feedback.reset();
    status.textContent = "Thanks! Your message has been sent.";
  } catch (error) {
    status.textContent = error.name === "AbortError"
      ? "Sending timed out. Delivery is unconfirmed; your message is kept here. Please try again later."
      : "Unable to confirm delivery. Your message is kept here. Check your connection or email amritanshurai04@gmail.com.";
  } finally {
    clearTimeout(timeout);
    feedbackSending = false;
    button.disabled = false;
    fields.forEach((field) => { field.disabled = false; });
    feedback.removeAttribute("aria-busy");
    label.textContent = "send";
  }
}
async function copyEmail() {
  const status = $(".copy-notice");
  try {
    await navigator.clipboard.writeText("amritanshurai04@gmail.com");
    status.textContent = "Copied to clipboard!";
  } catch {
    status.textContent = "Please copy the email address: amritanshurai04@gmail.com";
  }
  clearTimeout(clipboardTimer);
  status.classList.remove("is-announcing");
  requestAnimationFrame(() => status.classList.add("is-announcing"));
  clipboardTimer = setTimeout(
    () => status.classList.remove("is-announcing"),
    1000
  );
}
document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  if (button.matches("a")) event.preventDefault();
  switch (button.dataset.action) {
    case "toggle-menu":
      setMenu(!menuOpen);
      break;
    case "navigate":
      if (button.dataset.target === "contact") {
        showView("home", false);
        navigationTimer = setTimeout(
          () => setContact(true),
          motion.matches ? 0 : 600
        );
      } else showView(button.dataset.target);
      break;
    case "toggle-contact":
      setContact(!contactOpen);
      break;
    case "contact-from-about":
      showView("home", false);
      setContact(true);
      break;
    case "contact-menu":
      setContact(false, false);
      setMenu(true);
      break;
    case "show-feedback":
      setFeedback(true);
      break;
    case "hide-feedback":
      setFeedback(false);
      break;
    case "copy-email":
      copyEmail();
      break;
    case "next-work":
      if (work < $$("[data-work]").length) showWork(work + 1);
      break;
    case "previous-work":
      if (work > 1) showWork(work - 1);
      break;
    case "next-project":
      if (project < $$("[data-project]").length) showProject(project + 1);
      break;
    case "previous-project":
      if (project > 1) showProject(project - 1);
      break;
  }
});
feedback.addEventListener("submit", sendFeedback);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (contactOpen) {
      setContact(false);
      event.preventDefault();
    } else if (menuOpen) {
      setMenu(false);
      event.preventDefault();
    }
  }
  if (event.key === "Tab" && (menuOpen || contactOpen)) {
    const roots = menuOpen
      ? [navigation]
      : [
          contact,
          $('[data-action="contact-menu"]'),
          $('[data-action="toggle-contact"]'),
        ];
    const focusables = roots
      .flatMap((root) => [
        ...(root.matches("button")
          ? [root]
          : root.querySelectorAll("button,a[href],input,textarea")),
      ])
      .filter(
        (el) =>
          !el.closest("[hidden]") && !el.disabled && !el.closest("[inert]")
      );
    const i = focusables.indexOf(document.activeElement);
    if (event.shiftKey && i <= 0) {
      event.preventDefault();
      focusables.at(-1)?.focus();
    } else if (!event.shiftKey && (i === focusables.length - 1 || i < 0)) {
      event.preventDefault();
      focusables[0]?.focus();
    }
  }
});
document.addEventListener("visibilitychange", updateSimulation);
function finishIntro() {
  // Finish the overlay exit before starting any homepage animation or typing.
  document.documentElement.classList.add("intro-exiting");
  setTimeout(() => {
    document.documentElement.classList.remove("intro-active", "intro-exiting");
    $(".portfolio-shell").inert = false;
    showView("home", false);
  }, motion.matches ? 0 : 350);
}
if (document.documentElement.classList.contains("intro-active")) {
  $(".portfolio-shell").inert = true;
  setTimeout(finishIntro, 2000);
} else {
  showView("home", false);
}
async function startBackground() {
  if (motion.matches || simulation || backgroundLoading) return;
  backgroundLoading = true;
  try {
    const { default: createFluid } = await import("./fluid.js");
    if (motion.matches) return;
    simulation = createFluid();
    updateSimulation();
  } catch (error) {
    console.warn(
      "Animated background unavailable; keeping the static background.",
      error
    );
  } finally {
    backgroundLoading = false;
  }
}
startBackground();
motion.addEventListener("change", () => {
  showView(view, false);
  startBackground();
});

if (
  "serviceWorker" in navigator &&
  !["localhost", "127.0.0.1"].includes(location.hostname)
) {
  window.addEventListener("load", () =>
    navigator.serviceWorker.register("/sw.js").catch(console.error)
  );
}
