import { t, getLang } from "../i18n.js";
import { content } from "../fixtures.js";
import { escapeHTML, routeLink, pageHead, ring } from "./shared.js";
import { dialogueScore } from "../state.js";

export function render(state) {
  const dialogue = content(getLang()).dialogue;
  const score = dialogueScore(state);
  const verdict = score.pct >= 100 ? "high" : score.pct >= 67 ? "mid" : "low";
  return `<section class="page-shell" aria-labelledby="view-title">
    <div class="result-hero"><div>${pageHead(t("step.of", { n: 2, total: 3 }), t("result.title"), t("result.steps", { n: score.best, total: score.total }))}<p class="lede">${escapeHTML(t(`result.verdict.${verdict}`))}</p><div class="button-row">${routeLink("modules", t("result.cta"))}${routeLink("simulation", t("result.redo"), "button-secondary")}</div></div>${ring(score.pct, t("result.score", { pct: score.pct }))}</div>
    <div class="section-heading"><div><p class="eyebrow">${escapeHTML(t("result.recap"))}</p><h2>${escapeHTML(t("result.recap"))}</h2></div></div>
    <ol class="recap">${dialogue.slice(0, state.dialogueAnswers.length).map((turn, index) => { const chosen = state.dialogueAnswers[index]; const correct = chosen === turn.best; return `<li class="card"><p><strong>${escapeHTML(turn.text)}</strong></p><p class="small"><b>${escapeHTML(t("result.yourAnswer"))} :</b> ${escapeHTML(turn.choices[chosen])}</p>${correct ? "" : `<p class="small recap-best"><b>${escapeHTML(t("result.recommendedAnswer"))} :</b> ${escapeHTML(turn.choices[turn.best])}</p>`}<p class="subtle">${escapeHTML(turn.feedback)}</p></li>`; }).join("")}</ol>
  </section>`;
}
