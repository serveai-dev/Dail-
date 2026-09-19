import { t, getLang } from "../i18n.js";
import { content } from "../fixtures.js";
import { escapeHTML, routeLink, pageHead, ring } from "./shared.js";
import { progress, isComplete, nextRoute, modulesSummary } from "../state.js";

export function render(state) {
  const course = content(getLang()).course;
  const pct = progress(state);
  const summary = modulesSummary(state);
  const primaryLabel = isComplete(state) ? t("start.cta.certificate") : t(state.dialogueAnswers.length ? "start.cta.continue" : "start.cta.begin");
  return `<section class="page-shell" aria-labelledby="view-title">
    <div class="hero">
      <div>
        ${pageHead(course.eyebrow, course.title, course.description)}
        <div class="meta"><span>${escapeHTML(course.duration)}</span><span aria-hidden="true">•</span><span>${escapeHTML(course.level)}</span><span aria-hidden="true">•</span><span>${escapeHTML(t("app.savedLocally"))}</span></div>
        <div class="button-row">${routeLink(isComplete(state) ? "certificate" : nextRoute(state), primaryLabel)}${routeLink("plan", t("start.cta.plan"), "button-secondary")}</div>
      </div>
      <div class="hero-visual">${ring(pct, t("nav.progress", { pct }))}</div>
    </div>
    <div class="section-heading"><div><p class="eyebrow">${escapeHTML(t("start.eyebrow"))}</p><h2>${escapeHTML(t("start.stagesTitle"))}</h2></div></div>
    <div class="card-grid">
      ${stageCard("01", t("start.stage.prep"), t("start.stage.prepBody"), state.prep.length === 3 ? t("status.read") : t("status.optional"), "prep", state.prep.length === 3)}
      ${stageCard("02", t("start.stage.simulation"), t("start.stage.simulationBody"), t("status.count", { done: state.dialogueAnswers.length, total: 3 }), "simulation", state.dialogueAnswers.length === 3)}
      ${stageCard("03", t("start.stage.modules"), t("start.stage.modulesBody"), t("status.count", { done: summary.solved, total: summary.total }), "modules", summary.solved === summary.total)}
    </div>
  </section>`;
}

function stageCard(number, title, body, status, route, done) {
  return `<article class="card ${done ? "active" : ""}"><div class="card-top"><span class="tag ${done ? "success" : ""}">${escapeHTML(done ? t("status.done") : t("status.step", { n: number }))}</span><span class="small subtle">${escapeHTML(status)}</span></div><h3>${escapeHTML(title)}</h3><p class="subtle">${escapeHTML(body)}</p>${routeLink(route, done ? t("status.review") : t("status.open"), "button-secondary")}</article>`;
}
