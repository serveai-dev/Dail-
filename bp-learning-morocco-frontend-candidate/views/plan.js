import { t } from "../i18n.js";
import { escapeHTML, routeLink, pageHead } from "./shared.js";
import { progress, modulesSummary, isComplete } from "../state.js";

export function render(state) {
  const pct = progress(state);
  const summary = modulesSummary(state);
  const complete = isComplete(state);
  return `<section class="page-shell" aria-labelledby="view-title">
    ${pageHead(t("app.tagline"), t("plan.title"))}
    <div class="plan-grid"><div class="card"><h2>${escapeHTML(t("plan.steps"))}</h2><ol class="timeline">
      ${timelineRow("1", t("plan.prep"), (state.prep.length ? t("plan.prepCount", { done: state.prep.length, total: 3 }) : t("status.optional")), "prep")}
      ${timelineRow("2", t("plan.simulation"), t("plan.simulationCount", { done: state.dialogueAnswers.length, total: 3 }), "simulation")}
      ${timelineRow("3", t("plan.modules"), t("plan.modulesCount", { done: summary.solved, total: summary.total }), "modules")}
    </ol></div><aside class="card"><p class="eyebrow">${escapeHTML(t("plan.progress"))}</p><h2>${escapeHTML(pct)}%</h2><progress class="progress-track" max="100" value="${escapeHTML(pct)}" aria-label="${escapeHTML(t("nav.progress", { pct }))}">${escapeHTML(pct)}%</progress><p class="small subtle">${escapeHTML(t("plan.localStorage"))}</p><div class="button-row"><button class="button button-secondary" type="button" data-action="reset-confirm">${escapeHTML(t("plan.reset"))}</button></div></aside></div>
    <div class="card attestation-card"><h2>${escapeHTML(t("cert.title"))}</h2>${complete ? routeLink("certificate", t("plan.certificate")) : `<p class="small subtle">${escapeHTML(t("plan.certificateLocked"))}</p>`}</div>
    <dialog data-reset-dialog><form method="dialog"><h2>${escapeHTML(t("plan.resetConfirmTitle"))}</h2><p>${escapeHTML(t("plan.resetConfirmBody"))}</p><div class="button-row"><button value="cancel" class="button button-secondary">${escapeHTML(t("plan.resetCancel"))}</button><button value="confirm" class="button button-primary" data-action="reset-all">${escapeHTML(t("plan.resetConfirm"))}</button></div></form></dialog>
  </section>`;
}

function timelineRow(number, title, body, route) {
  return `<li><span class="timeline-marker">${escapeHTML(number)}</span><div><strong>${escapeHTML(title)}</strong><p class="subtle">${escapeHTML(body)}</p>${routeLink(route, t("status.open"), "button-secondary")}</div></li>`;
}
