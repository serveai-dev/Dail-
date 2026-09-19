import { t, formatDate } from "../i18n.js";
import { escapeHTML, routeLink } from "./shared.js";
import { progress, dialogueScore, modulesSummary } from "../state.js";

export function render(state) {
  const head = `<p class="eyebrow">${escapeHTML(t("app.name"))}</p><h1 id="view-title" tabindex="-1">${escapeHTML(t("manager.title"))}</h1><p class="lede">${escapeHTML(t("manager.lede"))}</p>`;
  if (!state.completedAt) {
    return `<section class="page-shell" aria-labelledby="view-title">${head}<div class="empty-state"><p>${escapeHTML(t("manager.empty"))}</p>${routeLink("start", t("nav.overview"), "button-secondary")}</div></section>`;
  }

  const dialogue = dialogueScore(state);
  const modules = modulesSummary(state);
  return `<section class="page-shell" aria-labelledby="view-title">${head}
    <article class="card manager-card">
      <h2>${escapeHTML(state.profile.name)}</h2>
      <dl>
        <dt>${escapeHTML(t("manager.completion"))}</dt><dd>${escapeHTML(progress(state))} %</dd>
        <dt>${escapeHTML(t("manager.dialogueScore"))}</dt><dd>${escapeHTML(`${dialogue.best}/${dialogue.total} (${dialogue.pct} %)` )}</dd>
        <dt>${escapeHTML(t("manager.modules"))}</dt><dd>${escapeHTML(`${modules.solved}/${modules.total}`)} · ${escapeHTML(t("manager.firstTry", { n: modules.firstTry, total: modules.total }))}</dd>
        <dt>${escapeHTML(t("manager.completedOn"))}</dt><dd>${escapeHTML(formatDate(state.completedAt))}</dd>
        <dt>${escapeHTML(t("manager.attestation"))}</dt><dd>${escapeHTML(t("manager.attestationReady"))} · ${routeLink("certificate", t("manager.open"), "button-secondary")}</dd>
      </dl>
    </article>
  </section>`;
}
