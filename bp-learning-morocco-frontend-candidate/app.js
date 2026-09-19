import { loadState, saveState, createProfile, setActive, activeProfile, resetProfile, isComplete, nextRoute, syncCourse } from "./state.js";
import { t, setLang, getLang } from "./i18n.js";
import { content, setActiveCourse, activeCourseData, activeCourseKey, isCustomCourse } from "./fixtures.js";
import { COURSE_STORAGE_KEY, parseCourseFile, validateCourse } from "./course.js";
import { courseFromCSV, courseToCSV } from "./csv.js";
import { isPinSet, verifyPin, setPin, resetAdmin, setAdminSession, isAdminSession, lockAdmin } from "./admin.js";
import { escapeHTML, icon } from "./views/shared.js";
import * as welcome from "./views/welcome.js";
import * as home from "./views/home.js";
import * as simulation from "./views/simulation.js";
import * as checks from "./views/checks.js";
import * as summary from "./views/summary.js";
import * as manager from "./views/manager.js";
import * as adminLogin from "./views/admin-login.js";
import * as audio from "./audio.js";

const VIEWS = { welcome, home, simulation, checks, summary, manager, admin: adminLogin };
const storage = window.localStorage;
const sessionKey = "bp-session";
let courseStorageVolatile = false;

function restoreStoredCourse() {
  try {
    const stored = storage.getItem(COURSE_STORAGE_KEY);
    if (stored === null) return;
    let raw;
    try {
      raw = JSON.parse(stored);
    } catch {
      storage.removeItem(COURSE_STORAGE_KEY);
      return;
    }
    const result = validateCourse(raw);
    if (result.ok) setActiveCourse(result.course);
  } catch {
    courseStorageVolatile = true;
  }
}

restoreStoredCourse();
let { state, volatile } = loadState(storage);
volatile = volatile || courseStorageVolatile;
const bootReset = syncCourse(state, activeCourseKey());
if (bootReset && !saveState(storage, state)) volatile = true;
const ui = { adding: false, nameDraft: "", typing: false, revealedTurn: -1, feedbackTurn: null, typingTimer: 0, checkIndex: 0, checkAttempt: {}, checkRetry: {}, courseErrors: [], courseNotice: null, courseStorageWarning: false, adminError: null };

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
  if (requested === "manager" && !isAdminSession(window.sessionStorage)) {
    if (requested !== "admin") location.replace("#admin");
    return "admin";
  }
  if (!["manager", "admin"].includes(requested) && !activeProfile(state)) {
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
  const visible = ["welcome", "home", "summary", "manager", "admin"].includes(activeRoute);
  const banner = document.querySelector("[data-banner]");
  banner.hidden = !volatile;
  banner.textContent = volatile ? t("app.storageVolatile") : "";
  header.hidden = !visible;
  document.querySelector("[data-skip]").textContent = t("app.skip");
  document.title = t("app.name");
  if (!visible) { header.innerHTML = ""; return; }
  const brand = `<a class="brand" href="#home"><span class="brand-mark" aria-hidden="true">${icon("check")}</span><strong translate="no">${escapeHTML(t("app.name"))}</strong></a>`;
  const otherLang = getLang() === "fr" ? t("lang.ar") : t("lang.fr");
  const account = profile ? `<details class="account-menu"><summary aria-label="${escapeHTML(t("nav.account", { name: profile.name }))}"><span class="profile-initial header-initial" translate="no">${escapeHTML(profile.name.slice(0, 1).toUpperCase())}</span><span class="account-name">${escapeHTML(profile.name)}</span></summary><div class="account-panel"><strong>${escapeHTML(profile.name)}</strong><small>${escapeHTML(t("welcome.local"))}</small><button type="button" data-action="switch-profile">${escapeHTML(t("menu.switch"))}</button><button type="button" data-action="reset-confirm">${escapeHTML(t("menu.reset"))}</button></div></details>` : "";
  const lock = activeRoute === "manager" ? `<button class="header-lang" type="button" data-action="admin-lock">${escapeHTML(t("admin.lock"))}</button>` : "";
  header.innerHTML = `${brand}<div class="header-end">${activeRoute === "welcome" || activeRoute === "admin" ? "" : `<button class="header-lang" type="button" data-action="toggle-lang" aria-label="${escapeHTML(t("nav.language"))}">${escapeHTML(otherLang)}</button>`}${lock}${account}</div>${profile ? `<dialog data-reset-dialog><form method="dialog"><h2>${escapeHTML(t("menu.reset"))}</h2><p>${escapeHTML(t("plan.resetConfirmBody"))}</p><div class="button-row"><button class="button button-secondary" value="cancel">${escapeHTML(t("plan.resetCancel"))}</button><button class="button button-primary" value="confirm" data-action="reset-profile">${escapeHTML(t("plan.resetConfirm"))}</button></div></form></dialog>` : ""}`;
}

function focusSelector(element) {
  if (!element?.dataset?.action) return "";
  return `[data-action="${CSS.escape(element.dataset.action)}"]${element.dataset.id ? `[data-id="${CSS.escape(element.dataset.id)}"]` : ""}${element.dataset.index ? `[data-index="${CSS.escape(element.dataset.index)}"]` : ""}`;
}

let speakingButton = null;
let audioNoticeTimer = 0;

function resetSpeaking() {
  speakingButton?.classList.remove("playing");
  speakingButton?.setAttribute("aria-pressed", "false");
  speakingButton = null;
  audio.stop();
}

function clearAudioNotices() {
  document.querySelectorAll(".audio-status").forEach((status) => status.remove());
  clearTimeout(audioNoticeTimer);
}

function sayText(target) {
  const [kind, value] = String(target).split(":");
  const index = Number(value);
  const C = content(getLang());
  return kind === "check" ? C.modules[index]?.question ?? "" : C.dialogue[index]?.text ?? "";
}

async function speak(target, button = null) {
  const sameButton = button && button === speakingButton;
  clearAudioNotices();
  if (sameButton) { resetSpeaking(); return; }
  resetSpeaking();
  const text = sayText(target);
  const element = document.querySelector("[data-audio]");
  if (element && target.startsWith("dialogue:") && !isCustomCourse()) element.src = `audio/${getLang()}/turn-${Number(target.split(":")[1]) + 1}.mp3`;
  if (button) { button.classList.add("playing"); button.setAttribute("aria-pressed", "true"); speakingButton = button; }
  const result = await audio.play(element, text, getLang(), { allowMp3: !isCustomCourse() && target.startsWith("dialogue:") });
  if (button && result === "unavailable") {
    const status = document.createElement("span");
    status.className = "audio-status";
    status.setAttribute("role", "status");
    status.textContent = t(getLang() === "ar" ? "audio.noVoice.ar" : "audio.noVoice.fr");
    button.parentElement?.append(status);
    audioNoticeTimer = window.setTimeout(() => status.remove(), 6000);
  }
  if (button === speakingButton) resetSpeaking();
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
      await speak(`dialogue:${index}`, document.querySelector(`[data-action="say"][data-say="dialogue:${index}"]`));
    }, 900 + Math.round((Math.random() - 0.5) * 400));
  }
}

let lastRoute = null;
function render() {
  const currentFocus = focusSelector(document.activeElement);
  const activeRoute = route();
  const changed = activeRoute !== lastRoute;
  if (changed) { audio.stop(); clearTimeout(ui.typingTimer); ui.typingTimer = 0; ui.typing = false; ui.feedbackTurn = null; }
  ui.adminPinSet = isPinSet(storage);
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
  if (element.dataset.action !== "say") clearAudioNotices();
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
    case "say": speak(element.dataset.say, element); return;
    case "admin-lock":
      lockAdmin(window.sessionStorage);
      state.activeId = null;
      writeSession(null);
      go("welcome");
      return;
    case "admin-reset": document.querySelector("[data-admin-dialog]")?.showModal(); return;
    case "admin-reset-confirm":
      resetAdmin(storage);
      setActiveCourse(null);
      ui.courseErrors = [];
      ui.courseNotice = null;
      syncCourse(state, activeCourseKey());
      save();
      document.querySelector("[data-admin-dialog]")?.close();
      render();
      return;
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
    case "download-template": {
      const course = activeCourseData();
      const csv = element.dataset.template === "csv";
      const blob = new Blob([csv ? courseToCSV(course) : JSON.stringify(course, null, 2)], { type: csv ? "text/csv" : "application/json" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${course.id}-v${course.version}.${csv ? "csv" : "json"}`;
      document.body.append(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return;
    }
    case "restore-course":
      document.querySelector("[data-course-dialog]")?.showModal();
      return;
    case "restore-course-confirm": {
      setActiveCourse(null);
      ui.courseErrors = [];
      ui.courseStorageWarning = false;
      ui.courseNotice = { title: t("course.default"), reset: syncCourse(state, activeCourseKey()) };
      try { storage.removeItem(COURSE_STORAGE_KEY); } catch { volatile = true; ui.courseStorageWarning = true; }
      if (!saveState(storage, state)) { volatile = true; ui.courseStorageWarning = true; }
      render();
      return;
    }
    default: return;
  }
});

document.addEventListener("change", async (event) => {
  const input = event.target.closest('[data-action="import-course"]');
  if (!input) return;
  const file = input.files?.[0];
  if (!file) return;
  let result;
  try {
    const source = await file.text();
    const csv = file.name.toLowerCase().endsWith(".csv") || source.trimStart().startsWith("type;") || source.trimStart().startsWith("type,") || source.trimStart().startsWith("type\t");
    result = csv ? courseFromCSV(source) : parseCourseFile(source);
    if (csv && result.ok) result = { ok: true, course: result.raw };
  } catch {
    result = { ok: false, errors: [{ code: "csv", path: "fichier", params: {} }] };
  }
  input.value = "";
  ui.courseNotice = null;
  ui.courseStorageWarning = false;
  if (!result.ok) {
    ui.courseErrors = result.errors;
    render();
    return;
  }
  setActiveCourse(result.course);
  ui.courseErrors = [];
  let storageWarning = false;
  try { storage.setItem(COURSE_STORAGE_KEY, JSON.stringify(result.course)); } catch { storageWarning = true; volatile = true; }
  const reset = syncCourse(state, activeCourseKey());
  if (!saveState(storage, state)) { storageWarning = true; volatile = true; }
  ui.courseStorageWarning = storageWarning;
  ui.courseNotice = { title: result.course.fr.course.title, reset };
  render();
});

document.addEventListener("submit", (event) => {
  const adminForm = event.target.closest('[data-action="admin-login"]');
  if (adminForm) {
    event.preventDefault();
    const pin = adminForm.elements.pin.value;
    const confirm = adminForm.elements.confirm?.value;
    adminForm.querySelectorAll("input").forEach((input) => { input.value = ""; });
    ui.adminError = null;
    if (adminForm.dataset.mode === "create") {
      if (!/^\d{6}$/.test(pin)) ui.adminError = { key: "admin.invalid", vars: {} };
      else if (pin !== confirm) ui.adminError = { key: "admin.mismatch", vars: {} };
      else setPin(storage, pin).then(() => { setAdminSession(window.sessionStorage); ui.adminError = null; go("manager"); }).catch(() => { ui.adminError = { key: "admin.invalid", vars: {} }; render(); });
    } else {
      verifyPin(storage, pin).then((result) => {
        if (result === "ok") { setAdminSession(window.sessionStorage); ui.adminError = null; go("manager"); return; }
        if (result === "locked") {
          let seconds = 60;
          try { const record = JSON.parse(storage.getItem("bp-admin")); seconds = Math.max(1, Math.ceil((Date.parse(record.lockedUntil) - Date.now()) / 1000)); } catch { /* use the safe default */ }
          ui.adminError = { key: "admin.locked", vars: { s: seconds } };
        } else if (result === "wrong") {
          let failures = 1;
          try { failures = JSON.parse(storage.getItem("bp-admin")).failures; } catch { /* use the safe default */ }
          ui.adminError = { key: "admin.wrong", vars: { left: Math.max(0, 5 - failures) } };
        } else ui.adminError = { key: "admin.unset", vars: {} };
        render();
      });
    }
    return;
  }
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
