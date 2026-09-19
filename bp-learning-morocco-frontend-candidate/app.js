import { loadState, saveState, progress, isComplete } from "./state.js";
import { t, setLang, getLang } from "./i18n.js";
import { content } from "./fixtures.js";
import { escapeHTML } from "./views/shared.js";
import * as start from "./views/start.js";
import * as prep from "./views/prep.js";
import * as simulation from "./views/simulation.js";
import * as result from "./views/result.js";
import * as modules from "./views/modules.js";
import * as plan from "./views/plan.js";

const VIEWS = { start, prep, simulation, result, modules, plan };
const storage = window.localStorage;
let { state, volatile } = loadState(storage);
const ui = { typing: false, revealedTurn: -1, feedbackTurn: null, typingTimer: 0, onboardingStep: 0, moduleAttempt: {}, moduleRetry: {} };
setLang(state.profile.lang);
if (!saveState(storage, state)) volatile = true;

function route() {
  const value = location.hash.replace(/^#/, "");
  return VIEWS[value] ? value : "start";
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
  document.querySelector("[data-header]").innerHTML = `
    <a class="brand" href="#start"><span class="brand-mark" aria-hidden="true">BP</span><span><strong>${escapeHTML(t("app.name"))}</strong><small>${escapeHTML(t("app.tagline"))}</small></span></a>
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

let lastRoute = null;
let lastPct = progress(state);

function render() {
  const activeFocusSelector = focusSelector(document.activeElement);
  const activeRoute = route();
  const routeChanged = activeRoute !== lastRoute;
  if (routeChanged) {
    clearTimeout(ui.typingTimer);
    ui.typing = false;
    ui.feedbackTurn = null;
  }
  renderHeader(activeRoute);
  document.querySelector("[data-main]").innerHTML = VIEWS[activeRoute].render(state, ui);
  document.querySelectorAll("[data-pct]").forEach((element) => element.style.setProperty("--pct", `${element.dataset.pct}%`));
  const focusTarget = document.querySelector("[data-focus]");
  if (focusTarget) focusTarget.focus();
  else if (activeFocusSelector) document.querySelector(activeFocusSelector)?.focus();
  else if (routeChanged) document.getElementById("view-title")?.focus({ preventScroll: true });
  const pct = progress(state);
  if (pct > lastPct) popChip();
  lastPct = pct;
  lastRoute = activeRoute;
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
    case "choose": {
      const index = state.dialogueAnswers.length;
      if (index >= currentContent.dialogue.length || ui.feedbackTurn !== null) return;
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
    case "see-result":
      ui.feedbackTurn = null;
      go("result");
      return;
    case "restart-dialogue":
      state.dialogueAnswers = [];
      state.completedAt = null;
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
      document.querySelector(`[data-module-card="${CSS.escape(id)}"] [data-feedback-bar] button`)?.focus();
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
