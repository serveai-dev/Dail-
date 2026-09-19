import { t, getLang, formatDate } from "../i18n.js";
import { content } from "../fixtures.js";
import { escapeHTML, routeLink } from "./shared.js";
import { isComplete, dialogueScore, modulesSummary } from "../state.js";

export function render(state) {
  const course = content(getLang()).course;
  if (!isComplete(state) || !state.completedAt) {
    return `<section class="page-shell" aria-labelledby="view-title">
      <p class="eyebrow">${escapeHTML(t("app.name"))}</p>
      <h1 id="view-title" tabindex="-1">${escapeHTML(t("cert.title"))}</h1>
      <p class="lede">${t("cert.locked")}</p>
      <div class="button-row">${routeLink("plan", t("cert.back"), "button-secondary")}</div>
    </section>`;
  }

  const dialogue = dialogueScore(state);
  const modules = modulesSummary(state);
  const name = escapeHTML(state.profile.name);
  const courseTitle = escapeHTML(course.title);
  return `<section class="page-shell" aria-labelledby="view-title">
    <article class="certificate">
      <p class="eyebrow">${escapeHTML(t("app.name"))}</p>
      <h1 id="view-title" tabindex="-1">${escapeHTML(t("cert.title"))}</h1>
      <p class="cert-body">${t("cert.body", { name, course: courseTitle })}</p>
      <dl class="cert-facts">
        <dt>${escapeHTML(t("cert.date"))}</dt><dd>${escapeHTML(formatDate(state.completedAt))}</dd>
        <dt>${escapeHTML(t("cert.dialogue"))}</dt><dd>${escapeHTML(`${dialogue.best}/${dialogue.total}`)}</dd>
        <dt>${escapeHTML(t("cert.modules"))}</dt><dd>${escapeHTML(`${modules.solved}/${modules.total}`)}</dd>
      </dl>
      <p class="small subtle">${escapeHTML(t("cert.disclaimer"))}</p>
    </article>
    <div class="button-row">
      <button class="button button-primary" type="button" data-action="print" data-focus>${escapeHTML(t("cert.print"))}</button>
      ${routeLink("plan", t("cert.back"), "button-secondary")}
    </div>
  </section>`;
}
