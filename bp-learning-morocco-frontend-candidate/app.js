import { loadState, saveState, createProfile, setActive, activeProfile, resetProfile, isComplete, nextRoute } from "./state.js";
import { t, setLang, getLang } from "./i18n.js";
import { content } from "./fixtures.js";
import { escapeHTML, icon } from "./views/shared.js";
import * as welcome from "./views/welcome.js";
import * as home from "./views/home.js";
import * as simulation from "./views/simulation.js";
import * as checks from "./views/checks.js";
import * as summary from "./views/summary.js";
import * as manager from "./views/manager.js";
import * as audio from "./audio.js";

const VIEWS = { welcome, home, simulation, checks, summary, manager };
const storage = window.localStorage;
const sessionKey = "bp-session";
let { state, volatile } = loadState(storage);
const ui = { adding: false, nameDraft: "", typing: false, revealedTurn: -1, feedbackTurn: null, typingTimer: 0, checkIndex: 0, checkAttempt: {}, checkRetry: {} };

function readSession() {
  try { return window.sessionStorage.getItem(sessionKey); } catch { return null; }
}

function writeSession(value) {
  try { if (value) window.sessionStorage.setItem(sessionKey, value); else window.sessionStorage.removeItem(sessionKey); } catch { /* local-only mode can continue */ }
}

const sessionId = readSession();
if (Object.keys(state.profiles).length) {
  if (sessionId && state.profiles[sessionId]) setActive(state, sessionId);
  else state.activeId = null;
}
setLang(activeProfile(state)?.lang ?? (typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("ar") ? "ar" : "fr"));

function route() {
  const raw = location.hash.replace(/^#/, "");
  const aliases = { onboarding: "welcome", start: "home", prep: "simulation", result: "checks", modules: "checks", plan: "summary", certificate: "summary" };
  const requested = aliases[raw] ?? (VIEWS[raw] ? raw : "home");
  if (requested !== raw) location.replace(`#${requested}`);
  if (requested !== "manager" && !activeProfile(state)) {
    if (requested !== "welcome") location.replace("#welcome");
    return "welcome";
  }
  if (requested === "welcome" && activeProfile(state) && !ui.adding) { location.replace("#home"); return "home"; }
  if (requested === "summary" && activeProfile(state) && !isComplete(activeProfile(state))) {
    const next = nextRoute(activeProfile(state));
    location.replace(`#${next}`);
    return next;
  }
  return requested;
}

function go(next) { location.hash = next; }

function save() {
  const profile = activeProfile(state);
  if (profile && isComplete(profile) && !profile.completedAt) profile.completedAt = new Date().toISOString();
  if (!saveState(storage, state)) volatile = true;
}

function renderHeader(activeRoute) {
  const header = document.querySelector("[data-header]");
  const profile = activeProfile(state);
  const visible = ["welcome", "home", "summary", "manager"].includes(activeRoute);
  const banner = document.querySelector("[data-banner]");
  banner.hidden = !volatile;
  banner.textContent = volatile ? t("app.storageVolatile") : "";
  header.hidden = !visible;
  document.querySelector("[data-skip]").textContent = t("app.skip");
  document.title = t("app.name");
  if (!visible) { header.innerHTML = ""; return; }
  const brand = `<a class="brand" href="#home"><span class="brand-mark" aria-hidden="true">${icon("check")}</span><strong>${escapeHTML(t("app.name"))}</strong></a>`;
  const otherLang = getLang() === "fr" ? t("lang.ar") : t("lang.fr");
  const account = profile ? `<details class="account-menu"><summary aria-label="${escapeHTML(t("nav.account", { name: profile.name }))}"><span class="profile-initial header-initial">${escapeHTML(profile.name.slice(0, 1).toUpperCase())}</span><span class="account-name">${escapeHTML(profile.name)}</span></summary><div class="account-panel"><strong>${escapeHTML(profile.name)}</strong><small>${escapeHTML(t("welcome.local"))}</small><button type="button" data-action="switch-profile">${escapeHTML(t("menu.switch"))}</button><a href="#manager">${escapeHTML(t("nav.manager"))}</a><button type="button" data-action="reset-confirm">${escapeHTML(t("menu.reset"))}</button></div></details>` : "";
  header.innerHTML = `${brand}<div class="header-end">${activeRoute === "welcome" ? "" : `<button class="header-lang" type="button" data-action="toggle-lang" aria-label="${escapeHTML(t("nav.language"))}">${escapeHTML(otherLang)}</button>`}${account}</div>${profile ? `<dialog data-reset-dialog><form method="dialog"><h2>${escapeHTML(t("menu.reset"))}</h2><p>${escapeHTML(t("plan.resetConfirmBody"))}</p><div class="button-row"><button class="button button-secondary" value="cancel">${escapeHTML(t("plan.resetCancel"))}</button><button class="button button-primary" value="confirm" data-action="reset-profile">${escapeHTML(t("plan.resetConfirm"))}</button></div></form></dialog>` : ""}`;
}

function focusSelector(element) {
  if (!element?.dataset?.action) return "";
  return `[data-action="${CSS.escape(element.dataset.action)}"]${element.dataset.id ? `[data-id="${CSS.escape(element.dataset.id)}"]` : ""}${element.dataset.index ? `[data-index="${CSS.escape(element.dataset.index)}"]` : ""}`;
}

async function speak(turn) {
  const element = document.querySelector("[data-audio]");
  const button = document.querySelector('[data-action="listen"]');
  const text = content(getLang()).dialogue[turn]?.text ?? "";
  button?.setAttribute("aria-busy", "true");
  try { await audio.play(element, text, getLang()); } finally { button?.removeAttribute("aria-busy"); }
}

function afterRender(activeRoute) {
  const profile = activeProfile(state);
  if (!profile) return;
  if (activeRoute === "simulation") {
    const D = content(getLang()).dialogue;
    const index = profile.dialogueAnswers.length;
    if (index >= D.length && ui.feedbackTurn === null) { go("checks"); return; }
    if (ui.feedbackTurn !== null || ui.typing || ui.revealedTurn >= index) return;
    const previousReveal = ui.revealedTurn;
    ui.typing = true;
    render();
    ui.typingTimer = window.setTimeout(async () => {
      ui.typingTimer = 0;
      if (route() !== "simulation" || ui.revealedTurn !== previousReveal || !ui.typing) return;
      ui.typing = false;
      ui.revealedTurn = index;
      render();
      const active = document.activeElement;
      if (!active || active === document.body || active.closest("[data-main]")) document.querySelector('[data-action="choose"][data-index="0"]')?.focus({ preventScroll: true });
      await speak(index);
    }, 900 + Math.round((Math.random() - 0.5) * 400));
  }
}

let lastRoute = null;
function render() {
  const currentFocus = focusSelector(document.activeElement);
  const activeRoute = route();
  const changed = activeRoute !== lastRoute;
  if (changed) { audio.stop(); clearTimeout(ui.typingTimer); ui.typingTimer = 0; ui.typing = false; ui.feedbackTurn = null; }
  renderHeader(activeRoute);
  document.querySelector("[data-main]").innerHTML = VIEWS[activeRoute].render(state, ui);
  const focusTarget = document.querySelector("[data-focus]");
  if (focusTarget) focusTarget.focus({ preventScroll: true });
  else if (currentFocus && !changed) document.querySelector(currentFocus)?.focus({ preventScroll: true });
  else if (changed) document.getElementById("view-title")?.focus({ preventScroll: true });
  if (activeRoute === "simulation" || document.querySelector("[data-feedback-bar]")) window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" });
  lastRoute = activeRoute;
  afterRender(activeRoute);
}

document.addEventListener("input", (event) => {
  const input = event.target.closest("#name");
  if (!input) return;
  ui.nameDraft = input.value;
  const submit = input.form?.querySelector('[type="submit"]');
  if (submit) submit.disabled = !input.value.trim();
});

document.addEventListener("click", (event) => {
  const menu = event.target.closest(".account-menu");
  if (!menu) document.querySelectorAll(".account-menu[open]").forEach((item) => { item.open = false; });
  const element = event.target.closest("[data-action]");
  if (!element) return;
  const profile = activeProfile(state);
  switch (element.dataset.action) {
    case "set-lang":
    case "toggle-lang": {
      const next = element.dataset.lang ?? (getLang() === "fr" ? "ar" : "fr");
      setLang(next);
      if (profile) { profile.lang = next; save(); }
      render();
      return;
    }
    case "add-profile": ui.adding = true; ui.nameDraft = ""; render(); return;
    case "cancel-add": ui.adding = false; ui.nameDraft = ""; render(); return;
    case "pick-profile":
      if (setActive(state, element.dataset.id)) { writeSession(state.activeId); setLang(activeProfile(state).lang); save(); go(nextRoute(activeProfile(state))); }
      return;
    case "choose": {
      if (!profile) return;
      const index = profile.dialogueAnswers.length;
      const D = content(getLang()).dialogue;
      if (ui.typing || ui.feedbackTurn !== null || index >= D.length || ui.revealedTurn < index) return;
      profile.dialogueAnswers.push(Number(element.dataset.index));
      ui.feedbackTurn = index;
      save();
      render();
      return;
    }
    case "continue-dialogue": ui.feedbackTurn = null; render(); return;
    case "to-checks": ui.feedbackTurn = null; go("checks"); return;
    case "listen": audio.stop(); speak(Number(element.dataset.turn)); return;
    case "answer-check": {
      if (!profile) return;
      const modules = content(getLang()).modules;
      const requested = Number.isInteger(ui.checkIndex) ? modules[ui.checkIndex] : null;
      const index = requested && !profile.modules[requested.id]?.solved ? ui.checkIndex : modules.findIndex((item) => !profile.modules[item.id]?.solved);
      const module = modules[index];
      if (!module || profile.modules[module.id]?.solved || ui.checkRetry[module.id] !== true && ui.checkAttempt[module.id] !== undefined) return;
      const answer = Number(element.dataset.index);
      if (!profile.modules[module.id]) profile.modules[module.id] = { first: answer, solved: answer === module.correct };
      else profile.modules[module.id].solved = answer === module.correct;
      ui.checkAttempt[module.id] = answer;
      ui.checkRetry[module.id] = false;
      save();
      render();
      return;
    }
    case "retry-check": ui.checkRetry[element.dataset.module] = true; delete ui.checkAttempt[element.dataset.module]; render(); document.querySelector('[data-action="answer-check"]')?.focus(); return;
    case "next-check": ui.checkIndex += 1; render(); return;
    case "to-summary": go("summary"); return;
    case "print": window.print(); return;
    case "restart-dialogue":
      if (profile) { profile.dialogueAnswers = []; profile.completedAt = null; save(); }
      ui.revealedTurn = -1; ui.feedbackTurn = null; ui.typing = false; go("simulation");
      return;
    case "switch-profile": state.activeId = null; writeSession(null); ui.adding = false; go("welcome"); return;
    case "reset-confirm": document.querySelector("[data-reset-dialog]")?.showModal(); return;
    case "reset-profile":
      if (profile) { resetProfile(state, profile.id); writeSession(profile.id); save(); }
      ui.revealedTurn = -1; ui.feedbackTurn = null; ui.typing = false; go("simulation");
      return;
    default: return;
  }
});

document.addEventListener("submit", (event) => {
  const form = event.target.closest('[data-action="save-name"]');
  if (!form) return;
  event.preventDefault();
  const name = form.elements.name.value.trim().slice(0, 40);
  if (!name) { form.elements.name.focus(); return; }
  const id = createProfile(state, name, getLang());
  if (!id) { document.querySelector("[data-name-alert]")?.removeAttribute("hidden"); return; }
  writeSession(id); save(); ui.adding = false; ui.nameDraft = ""; go("simulation");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") { document.querySelectorAll(".account-menu[open]").forEach((menu) => { menu.open = false; menu.querySelector("summary")?.focus(); }); return; }
  if (event.target.matches("input, select, textarea") || event.altKey || event.ctrlKey || event.metaKey) return;
  if (!["simulation", "checks"].includes(route()) || !/^[1-3]$/.test(event.key)) return;
  const action = route() === "simulation" ? "choose" : "answer-check";
  const button = document.querySelector(`[data-action="${action}"][data-index="${Number(event.key) - 1}"]`);
  if (button) { event.preventDefault(); button.click(); }
});

window.addEventListener("hashchange", render);
render();
