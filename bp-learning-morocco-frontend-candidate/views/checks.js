import { t, getLang } from "../i18n.js";
import { content } from "../fixtures.js";
import { modulesSummary, stepsDone } from "../state.js";
import { escapeHTML, feedbackBar, icon, track, sayButton } from "./shared.js";

export function render(state, ui) {
  const profile = state.profiles[state.activeId];
  const modules = content(getLang()).modules;
  const summary = modulesSummary(profile);
  const index = currentIndex(modules, profile, ui);
  const module = modules[index];
  const record = profile.modules[module.id];
  const attempted = ui.checkAttempt[module.id];
  const answered = attempted !== undefined && ui.checkRetry[module.id] !== true;
  const correct = answered && attempted === module.correct;
  const wrong = answered && !correct;
  const current = 3 + index;
  const choices = module.answers.map((answer, answerIndex) => {
    const selectedWrong = wrong && attempted === answerIndex;
    const selectedCorrect = correct && attempted === answerIndex;
    const disabled = answered;
    return `<button class="choice ${selectedWrong ? "choice-wrong" : ""} ${selectedCorrect ? "choice-correct" : ""}" type="button" data-action="answer-check" data-index="${escapeHTML(answerIndex)}" ${disabled ? "disabled" : ""}><span class="choice-num" aria-hidden="true" translate="no">${escapeHTML(String.fromCharCode(65 + answerIndex))}</span><span>${escapeHTML(answer)}</span></button>`;
  }).join("");
  const bar = answered ? feedbackBar({
    kind: correct ? "success" : "attention",
    why: correct ? module.explanation : "",
    recommended: correct ? "" : t("feedback.recommended", { answer: module.answers[module.correct] }),
    actionLabel: correct ? (summary.solved === summary.total ? t("checks.toSummary") : t("checks.next")) : t("modules.retry"),
    action: correct ? (summary.solved === summary.total ? "to-summary" : "next-check") : "retry-check",
    actionAttrs: `data-module="${escapeHTML(module.id)}"`,
    checks: true,
  }) : "";
  return `<section class="player checks-player ${bar ? "has-bar" : ""}" aria-labelledby="view-title">
    <div class="player-top"><a class="player-close" href="#home" aria-label="${escapeHTML(t("player.close"))}">${icon("close")}<span>${escapeHTML(t("player.closeShort"))}</span></a>${track(stepsDone(profile), current)}<span></span></div>
    <div class="player-body check-body">
      <span class="module-label">${escapeHTML(module.label)}</span>
      <div class="check-question-heading"><h1 id="view-title" tabindex="-1">${escapeHTML(module.question)}</h1>${sayButton(`check:${index}`, t("checks.listen"))}</div>
      <div class="choice-list check-choices">${choices}</div>
    </div>
    ${bar}
  </section>`;
}

function currentIndex(modules, profile, ui) {
  const requested = Number.isInteger(ui.checkIndex) ? modules[ui.checkIndex] : null;
  if (requested && (!profile.modules[requested.id]?.solved || ui.checkAttempt[requested.id] !== undefined)) return ui.checkIndex;
  const open = modules.findIndex((module) => !profile.modules[module.id]?.solved);
  return open === -1 ? modules.length - 1 : open;
}
