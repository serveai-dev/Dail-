import { t, formatDate } from "../i18n.js";
import { listProfiles, progress, dialogueScore, modulesSummary } from "../state.js";
import { escapeHTML, routeLink } from "./shared.js";

export function render(state) {
  const profiles = listProfiles(state);
  const back = state.activeId ? "home" : "welcome";
  const head = `<h1 id="view-title" tabindex="-1">${escapeHTML(t("manager.title"))}</h1><p class="lede">${escapeHTML(t("manager.lede"))}</p>`;
  if (!profiles.length) return `<section class="page-shell manager" aria-labelledby="view-title">${head}<div class="empty-state"><p>${escapeHTML(t("manager.empty"))}</p></div>${routeLink(back, t("manager.back"), "button-secondary")}</section>`;
  return `<section class="page-shell manager" aria-labelledby="view-title">${head}<table class="roster"><caption class="visually-hidden">${escapeHTML(t("manager.roster"))}</caption><thead><tr><th scope="col">${escapeHTML(t("manager.name"))}</th><th scope="col">${escapeHTML(t("manager.progress"))}</th><th scope="col">${escapeHTML(t("manager.dialogue"))}</th><th scope="col">${escapeHTML(t("manager.firstTry"))}</th><th scope="col">${escapeHTML(t("manager.completed"))}</th><th scope="col">${escapeHTML(t("manager.attestation"))}</th></tr></thead><tbody>${profiles.map(row).join("")}</tbody></table>${routeLink(back, t("manager.back"), "button-secondary")}</section>`;
}

function row(profile) {
  const dialogue = dialogueScore(profile);
  const modules = modulesSummary(profile);
  const completed = profile.completedAt ? formatDate(profile.completedAt) : t("manager.none");
  const ready = profile.completedAt ? t("manager.attestationReady") : t("manager.none");
  const cell = (label, value) => `<td><span class="stack-label visually-hidden">${escapeHTML(label)}</span>${escapeHTML(value)}</td>`;
  return `<tr>${cell(t("manager.name"), profile.name)}${cell(t("manager.progress"), `${progress(profile)}%`)}${cell(t("manager.dialogue"), `${dialogue.best}/${dialogue.total}`)}${cell(t("manager.firstTry"), `${modules.firstTry}/${modules.total}`)}${cell(t("manager.completed"), completed)}${cell(t("manager.attestation"), ready)}</tr>`;
}
