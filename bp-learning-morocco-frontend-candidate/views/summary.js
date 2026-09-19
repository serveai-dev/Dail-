import { t, getLang, formatDate } from "../i18n.js";
import { content } from "../fixtures.js";
import { dialogueScore, modulesSummary, isComplete } from "../state.js";
import { escapeHTML, icon, verdictTag, sayButton } from "./shared.js";
import { isCustomCourse } from "../fixtures.js";

export function render(state) {
  const profile = state.profiles[state.activeId];
  if (!profile || !isComplete(profile)) return `<section class="page-shell"><p>${escapeHTML(t("summary.locked"))}</p></section>`;
  const C = content(getLang());
  const dialogue = dialogueScore(profile);
  const modules = modulesSummary(profile);
  return `<section class="page-shell summary" aria-labelledby="view-title">
    <h1 id="view-title" tabindex="-1">${escapeHTML(t("summary.title", { name: profile.name }))}</h1>
    <p class="subtle summary-date">${escapeHTML(formatDate(profile.completedAt))}</p>
    <div class="stats"><div class="stat"><strong>${escapeHTML(`${dialogue.best}/${dialogue.total}`)}</strong><span>${escapeHTML(t("summary.dialogue"))}</span></div><div class="stat"><strong>${escapeHTML(`${modules.firstTry}/${modules.total}`)}</strong><span>${escapeHTML(t("summary.checks"))}</span></div></div>
    <div class="summary-actions"><button class="button button-primary" type="button" data-action="print">${escapeHTML(t("summary.print"))}</button><button class="button button-secondary" type="button" data-action="restart-dialogue">${escapeHTML(t("summary.redo"))}</button></div>
    <h2>${escapeHTML(t("summary.recap"))}</h2>
    <div class="recap-thread">${C.dialogue.map((turn, index) => recapTurn(turn, profile.dialogueAnswers[index], C.scenario, index)).join("")}</div>
    ${isCustomCourse() ? "" : `<audio preload="none" data-audio></audio>`}
    <article class="print-only certificate">
      <p class="eyebrow">${escapeHTML(t("app.name"))}</p>
      <h1>${escapeHTML(t("cert.title"))}</h1>
      <p class="cert-body">${escapeHTML(t("cert.body", { name: profile.name, course: C.course.title }))}</p>
      <dl class="cert-facts"><dt>${escapeHTML(t("cert.date"))}</dt><dd>${escapeHTML(formatDate(profile.completedAt))}</dd><dt>${escapeHTML(t("cert.dialogue"))}</dt><dd>${escapeHTML(`${dialogue.best}/${dialogue.total}`)}</dd><dt>${escapeHTML(t("cert.modules"))}</dt><dd>${escapeHTML(`${modules.solved}/${modules.total}`)}</dd></dl>
      <p class="small subtle">${escapeHTML(t("cert.disclaimer"))}</p>
    </article>
  </section>`;
}

function recapTurn(turn, chosen, scenario, index) {
  const best = chosen === turn.best;
  return `<article class="recap-turn"><div class="message-row customer"><span class="avatar avatar-small" aria-hidden="true" translate="no">${escapeHTML(scenario.initials)}</span><div class="message"><small>${escapeHTML(scenario.customer)}</small><div class="customer-line"><span>${escapeHTML(turn.text)}</span>${sayButton(`dialogue:${index}`, t("sim.listenLine"))}</div></div></div><div class="message-row learner"><div class="message user"><small>${escapeHTML(t("sim.you"))}</small><span>${escapeHTML(turn.choices[chosen])}</span>${verdictTag(best)}</div></div>${best ? "" : `<div class="recommended-box"><strong>${escapeHTML(t("result.recommendedAnswer"))}</strong><p>${escapeHTML(turn.choices[turn.best])}</p><p class="small subtle">${escapeHTML(turn.feedback)}</p></div>`}</article>`;
}
