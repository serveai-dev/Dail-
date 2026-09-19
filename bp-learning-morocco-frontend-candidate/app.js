import { loadState, saveState, progress, isComplete } from "./state.js";
import { t, setLang, getLang } from "./i18n.js";
import { content } from "./fixtures.js";
import { escapeHTML } from "./views/shared.js";
import * as audio from "./audio.js";
import * as start from "./views/start.js";
import * as prep from "./views/prep.js";
import * as simulation from "./views/simulation.js";
import * as result from "./views/result.js";
import * as modules from "./views/modules.js";
import * as plan from "./views/plan.js";
import * as certificate from "./views/certificate.js";
import * as manager from "./views/manager.js";
import * as onboarding from "./views/onboarding.js";

const VIEWS = { onboarding, start, prep, simulation, result, modules, plan, certificate, manager };
const storage = window.localStorage;
let { state, volatile } = loadState(storage);
const ui = { typing: false, revealedTurn: -1, feedbackTurn: null, typingTimer: 0, onboardingStep: 0, moduleAttempt: {}, moduleRetry: {}, scenarioOpen: window.matchMedia("(min-width: 721px)").matches };
setLang(state.profile.lang);
if (!saveState(storage, state)) volatile = true;

function route() {
  const value = location.hash.replace(/^#/, "");
  const requested = VIEWS[value] ? value : "start";
  if (!state.profile.name && requested !== "onboarding" && requested !== "manager") {
    location.replace("#onboarding");
    return "onboarding";
  }
  if (state.profile.name && requested === "onboarding") {
    location.replace("#start");
    return "start";
  }
  return requested;
}

function go(nextRoute) { location.hash = nextRoute; }

function save() {
  if (isComplete(state) && !state.completedAt) state.completedAt = new Date().toISOString();
  if (!saveState(storage, state)) volatile = true;
}

function renderHeader(activeRoute) {
  const pct = progress(state);
  const name = state.profile.name;
  document.querySelector("[data-skip]").textContent = t("app.skip");
  document.title = t("app.name");
  const brand = `<a class="brand" href="#start"><span class="brand-mark" aria-hidden="true">BP</span><span><strong>${escapeHTML(t("app.name"))}</strong><small>${escapeHTML(t("app.tagline"))}</small></span></a>`;
  const header = document.querySelector("[data-header]");
  if (activeRoute === "onboarding") {
    header.innerHTML = brand;
    const onboardingBanner = document.querySelector("[data-banner]");
    onboardingBanner.hidden = !volatile;
    onboardingBanner.textContent = volatile ? t("app.storageVolatile") : "";
    return;
  }
  header.innerHTML = `${brand}
    <nav aria-label="${escapeHTML(t("nav.overview"))}">
      <a href="#start" ${activeRoute === "start" ? "aria-current=\"page\"" : ""}>${escapeHTML(t("nav.overview"))}</a>
      <a href="#simulation" ${activeRoute === "simulation" ? "aria-current=\"page\"" : ""}>${escapeHTML(t("nav.simulation"))}</a>
      <a href="#plan" ${activeRoute === "plan" ? "aria-current=\"page\"" : ""}>${escapeHTML(t("nav.plan"))}</a>
    </nav>
    <div class="header-progress"><progress max="100" value="${escapeHTML(pct)}" aria-label="${escapeHTML(t("nav.progress", { pct }))}"></progress><span class="chip" data-chip hidden aria-hidden="true">${escapeHTML(t("chip.plusOne"))}</span></div>
    <label class="lang-switch"><span class="visually-hidden">${escapeHTML(t("nav.language"))}</span><select data-action="lang-switch"><option value="fr" ${getLang() === "fr" ? "selected" : ""}>${escapeHTML(t("lang.fr"))}</option><option value="ar" ${getLang() === "ar" ? "selected" : ""}>${escapeHTML(t("lang.ar"))}</option></select></label>
    ${name ? `<a class="profile-button" href="#plan" aria-label="${escapeHTML(t("nav.profile", { name }))}"><span aria-hidden="true">${escapeHTML(name.slice(0, 1).toUpperCase())}</span><span>${escapeHTML(name)}</span></a>` : ""}`;
  const banner = document.querySelector("[data-banner]");
  banner.hidden = !volatile;
  banner.textContent = volatile ? t("app.storageVolatile") : "";
}

function focusSelector(element) {
  if (!element?.dataset?.action) return "";
  return ["data-action", "data-id", "data-module", "data-index"]
    .filter((attribute) => element.hasAttribute(attribute))
    .map((attribute) => `[${attribute}="${CSS.escape(element.getAttribute(attribute))}"]`)
    .join("");
}

async function speak(turn) {
  const button = document.querySelector('[data-action="listen"]');
  const element = document.querySelector("[data-audio]");
  const text = content(getLang()).dialogue[turn]?.text ?? "";
  button?.setAttribute("aria-busy", "true");
  try {
    await audio.play(element, text, getLang());
  } finally {
    button?.removeAttribute("aria-busy");
  }
}

function afterRender(activeRoute) {
  if (activeRoute !== "simulation") return;
  const currentContent = content(getLang());
  const index = state.dialogueAnswers.length;
  if (index >= currentContent.dialogue.length || ui.feedbackTurn !== null || ui.typing || ui.revealedTurn >= index) {
    document.querySelector("[data-thread]")?.scrollTo(0, 99999);
    return;
  }
  const previousReveal = ui.revealedTurn;
  ui.typing = true;
  render();
  ui.typingTimer = setTimeout(async () => {
    ui.typingTimer = 0;
    if (route() !== "simulation" || ui.revealedTurn !== previousReveal || !ui.typing) return;
    ui.typing = false;
    ui.revealedTurn = index;
    render();
    const active = document.activeElement;
    if (!active || active === document.body || active.closest("[data-main]")) document.querySelector('[data-action="choose"][data-index="0"]')?.focus();
    await speak(index);
  }, 900 + Math.round((Math.random() - 0.5) * 400));
}

let lastRoute = null;
let lastPct = progress(state);

function renderFooter(activeRoute) {
  const footer = document.querySelector("[data-footer]");
  footer.hidden = activeRoute === "onboarding";
  footer.innerHTML = `<span>${escapeHTML(t("app.savedLocally"))}</span><a class="quiet-link" href="#manager" ${activeRoute === "manager" ? "aria-current=\"page\"" : ""}>${escapeHTML(t("nav.manager"))}</a>`;
}

function render() {
  const activeFocusSelector = focusSelector(document.activeElement);
  const focusWasInHeader = Boolean(document.activeElement?.closest?.("[data-header]"));
  const activeRoute = route();
  const routeChanged = activeRoute !== lastRoute;
  if (routeChanged) {
    audio.stop();
    clearTimeout(ui.typingTimer);
    ui.typingTimer = 0;
    ui.typing = false;
    ui.feedbackTurn = null;
  }
  renderHeader(activeRoute);
  renderFooter(activeRoute);
  document.querySelector("[data-main]").innerHTML = VIEWS[activeRoute].render(state, ui);
  document.querySelectorAll("[data-pct]").forEach((element) => element.style.setProperty("--pct", `${element.dataset.pct}%`));
  const focusTarget = document.querySelector("[data-focus]");
  if (focusWasInHeader && !routeChanged && activeFocusSelector) document.querySelector(activeFocusSelector)?.focus();
  else if (focusTarget) {
    focusTarget.focus({ preventScroll: true });
    focusTarget.closest(".feedback-bar")?.scrollIntoView({ block: "nearest", behavior: "instant" });
  }
  else if (activeFocusSelector) document.querySelector(activeFocusSelector)?.focus();
  else if (routeChanged) document.getElementById("view-title")?.focus({ preventScroll: true });
  const pct = progress(state);
  if (pct > lastPct) popChip();
  lastPct = pct;
  lastRoute = activeRoute;
  afterRender(activeRoute);
}

function popChip() {
  const chip = document.querySelector("[data-chip]");
  if (!chip) return;
  chip.hidden = false;
  chip.classList.add("chip-pop");
  setTimeout(() => { chip.hidden = true; chip.classList.remove("chip-pop"); }, 1400);
}

document.addEventListener("click", (event) => {
  const element = event.target.closest("[data-action]");
  if (!element) return;
  const currentContent = content(getLang());
  switch (element.dataset.action) {
    case "choose-lang":
      state.profile.lang = element.dataset.lang;
      setLang(state.profile.lang);
      save();
      ui.onboardingStep = 1;
      render();
      return;
    case "toggle-scenario":
      ui.scenarioOpen = !element.closest("details").open;
      return;
    case "choose": {
      const index = state.dialogueAnswers.length;
      if (index >= currentContent.dialogue.length || ui.feedbackTurn !== null || ui.typing || ui.revealedTurn < index) return;
      state.dialogueAnswers.push(Number(element.dataset.index));
      ui.feedbackTurn = index;
      save();
      render();
      return;
    }
    case "continue-dialogue":
      ui.feedbackTurn = null;
      render();
      return;
    case "listen":
      audio.stop();
      speak(Number(element.dataset.turn));
      return;
    case "print":
      window.print();
      return;
    case "see-result":
      ui.feedbackTurn = null;
      go("result");
      return;
    case "restart-dialogue":
      state.dialogueAnswers = [];
      state.completedAt = null;
      clearTimeout(ui.typingTimer);
      ui.typingTimer = 0;
      ui.typing = false;
      ui.revealedTurn = -1;
      ui.feedbackTurn = null;
      save();
      render();
      return;
    case "answer-module": {
      const id = element.dataset.module;
      const index = Number(element.dataset.index);
      const definition = currentContent.modules.find((module) => module.id === id);
      if (!definition) return;
      const record = state.modules[id];
      if (record?.solved || (record && !record.solved && ui.moduleRetry[id] !== true)) return;
      const nextRecord = record ?? { first: index, solved: false };
      nextRecord.solved = nextRecord.solved || index === definition.correct;
      state.modules[id] = nextRecord;
      ui.moduleAttempt[id] = index;
      ui.moduleRetry[id] = false;
      save();
      render();
      const moduleBarButton = document.querySelector(`[data-module-card="${CSS.escape(id)}"] [data-feedback-bar] button`);
      moduleBarButton?.focus({ preventScroll: true });
      moduleBarButton?.closest(".feedback-bar")?.scrollIntoView({ block: "nearest", behavior: "instant" });
      return;
    }
    case "retry-module":
      ui.moduleRetry[element.dataset.module] = true;
      delete ui.moduleAttempt[element.dataset.module];
      render();
      document.querySelector(`[data-module-card="${element.dataset.module}"] [data-action="answer-module"]`)?.focus();
      return;
    case "focus-next-module": {
      const cards = [...document.querySelectorAll("[data-module-card]")];
      const current = cards.findIndex((card) => card.dataset.module === element.dataset.module);
      const next = cards.slice(current + 1).find((card) => card.querySelector("[data-action=\"answer-module\"]:not([disabled])"));
      if (next) next.querySelector("[data-action=\"answer-module\"]")?.focus();
      else go("plan");
      return;
    }
    case "reset-confirm":
      document.querySelector("[data-reset-dialog]")?.showModal();
      return;
    case "reset-all":
      state = loadState({ getItem: () => null }).state;
      ui.onboardingStep = 0;
      ui.revealedTurn = -1;
      ui.feedbackTurn = null;
      ui.moduleAttempt = {};
      ui.moduleRetry = {};
      setLang(state.profile.lang);
      save();
      if (location.hash === "#start") render();
      else go("start");
      return;
  }
});

document.addEventListener("submit", (event) => {
  const form = event.target.closest('[data-action="save-name"]');
  if (!form) return;
  event.preventDefault();
  const input = form.elements.name;
  const name = input.value.trim().slice(0, 40);
  if (!name) {
    input.setCustomValidity(" ");
    input.reportValidity();
    input.setCustomValidity("");
    input.focus();
    return;
  }
  state.profile.name = name;
  save();
  ui.onboardingStep = 0;
  go("start");
});

document.addEventListener("change", (event) => {
  const element = event.target.closest("[data-action]");
  if (!element) return;
  if (element.dataset.action === "prep-toggle") {
    const id = element.dataset.id;
    state.prep = element.checked ? [...new Set([...state.prep, id])] : state.prep.filter((item) => item !== id);
    save();
    render();
  }
  if (element.dataset.action === "lang-switch") {
    audio.stop();
    clearTimeout(ui.typingTimer);
    ui.typingTimer = 0;
    ui.typing = false;
    ui.revealedTurn = -1;
    state.profile.lang = element.value;
    setLang(element.value);
    save();
    render();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.target.matches("input, select, textarea") || event.altKey || event.ctrlKey || event.metaKey) return;
  if (route() === "simulation" && /^[1-3]$/.test(event.key)) {
    const button = document.querySelector(`[data-action="choose"][data-index="${Number(event.key) - 1}"]`);
    if (button) { event.preventDefault(); button.click(); }
  }
});

window.addEventListener("hashchange", () => render());
render();
