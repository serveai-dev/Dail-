import { t, formatDate } from "../i18n.js";
import { listProfiles, progress, dialogueScore, modulesSummary } from "../state.js";
import { activeCourseData, isCustomCourse } from "../fixtures.js";
import { escapeHTML, routeLink } from "./shared.js";

export function render(state, ui = {}) {
  const profiles = listProfiles(state);
  const back = state.activeId ? "home" : "welcome";
  const head = `<h1 id="view-title" tabindex="-1">${escapeHTML(t("manager.title"))}</h1><p class="lede">${escapeHTML(t("manager.lede"))}</p>`;
  const course = courseAdmin(ui);
  const roster = profiles.length ? `<table class="roster"><caption class="visually-hidden">${escapeHTML(t("manager.roster"))}</caption><thead><tr><th scope="col">${escapeHTML(t("manager.name"))}</th><th scope="col">${escapeHTML(t("manager.progress"))}</th><th scope="col">${escapeHTML(t("manager.dialogue"))}</th><th scope="col">${escapeHTML(t("manager.firstTry"))}</th><th scope="col">${escapeHTML(t("manager.completed"))}</th><th scope="col">${escapeHTML(t("manager.attestation"))}</th></tr></thead><tbody>${profiles.map(row).join("")}</tbody></table>` : `<div class="empty-state"><p>${escapeHTML(t("manager.empty"))}</p></div>`;
  return `<section class="page-shell manager" aria-labelledby="view-title">${head}${course}${roster}${routeLink(back, t("manager.back"), "button-secondary")}</section>`;
}

function courseAdmin(ui) {
  const course = activeCourseData();
  const title = isCustomCourse() ? `${course.fr.course.title} · ${t("course.version", { version: course.version })}` : t("course.default");
  const errors = Array.isArray(ui.courseErrors) && ui.courseErrors.length ? `<div class="course-errors" role="alert"><h3>${escapeHTML(t("course.errorsTitle"))}</h3><ul>${ui.courseErrors.map((error) => `<li>${escapeHTML(error.path.startsWith("ligne ") ? t("course.err.row", { row: error.path.slice(6), message: t(`course.err.${error.code}`, { path: "", max: error.params?.max }).replace(/^\s*:\s*/, "") }) : t(`course.err.${error.code}`, { path: error.path, max: error.params?.max }))}</li>`).join("")}</ul></div>` : "";
  const notice = ui.courseNotice ? `<p class="course-notice" role="status">${escapeHTML(t("course.imported", { title: ui.courseNotice.title, n: ui.courseNotice.reset }))}</p>` : "";
  const storageWarning = ui.courseStorageWarning ? `<p class="course-errors" role="alert">${escapeHTML(t("app.storageVolatile"))}</p>` : "";
  const restore = isCustomCourse() ? `<button class="button button-quiet" type="button" data-action="restore-course">${escapeHTML(t("course.restore"))}</button>` : "";
  return `<article class="course-admin"><h2>${escapeHTML(t("course.title"))}</h2><p class="course-active"><strong>${escapeHTML(title)}</strong></p><p class="subtle">${escapeHTML(t("course.hint"))}</p><p class="small subtle">${escapeHTML(t("course.csvHint"))}</p><div class="button-row"><input class="course-file visually-hidden" id="course-file" type="file" accept=".json,.csv,application/json,text/csv" data-action="import-course"><label class="button button-primary" for="course-file">${escapeHTML(t("course.import"))}</label><button class="button button-secondary" type="button" data-action="download-template" data-template="csv">${escapeHTML(t("course.templateCsv"))}</button><button class="button button-secondary" type="button" data-action="download-template" data-template="json">${escapeHTML(t("course.templateJson"))}</button>${restore}</div>${errors}${storageWarning}${notice}${isCustomCourse() ? `<dialog data-course-dialog><form method="dialog"><h2>${escapeHTML(t("course.confirmTitle"))}</h2><p>${escapeHTML(t("course.confirmBody"))}</p><div class="button-row"><button class="button button-secondary" value="cancel">${escapeHTML(t("plan.resetCancel"))}</button><button class="button button-primary" value="confirm" data-action="restore-course-confirm">${escapeHTML(t("course.restore"))}</button></div></form></dialog>` : ""}</article>`;
}

function row(profile) {
  const dialogue = dialogueScore(profile);
  const modules = modulesSummary(profile);
  const completed = profile.completedAt ? formatDate(profile.completedAt) : t("manager.none");
  const ready = profile.completedAt ? t("manager.attestationReady") : t("manager.none");
  const cell = (label, value) => `<td><span class="stack-label visually-hidden">${escapeHTML(label)}</span>${escapeHTML(value)}</td>`;
  return `<tr>${cell(t("manager.name"), profile.name)}${cell(t("manager.progress"), `${progress(profile)}%`)}${cell(t("manager.dialogue"), `${dialogue.best}/${dialogue.total}`)}${cell(t("manager.firstTry"), `${modules.firstTry}/${modules.total}`)}${cell(t("manager.completed"), completed)}${cell(t("manager.attestation"), ready)}</tr>`;
}
