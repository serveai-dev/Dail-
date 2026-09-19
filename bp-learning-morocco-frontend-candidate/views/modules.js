import { t, getLang } from "../i18n.js";
import { content } from "../fixtures.js";
import { escapeHTML, routeLink, pageHead, feedbackBar } from "./shared.js";
import { modulesSummary } from "../state.js";

export function render(state, ui) {
  const modules = content(getLang()).modules;
  const summary = modulesSummary(state);
  return `<section class="page-shell" aria-labelledby="view-title">
    ${pageHead(t("step.of", { n: 3, total: 3 }), t("modules.title"), t("modules.lede"))}
    <p class="subtle">${escapeHTML(t("modules.solvedCount", { done: summary.solved, total: summary.total }))}</p>
    <div class="card-grid">${modules.map((module) => renderModule(module, state, ui)).join("")}</div>
    ${summary.solved === summary.total ? `<div class="button-row">${routeLink("plan", t("modules.done"))}</div>` : ""}
  </section>`;
}

function renderModule(module, state, ui) {
  const record = state.modules[module.id];
  const solved = record?.solved === true;
  const answeredWrong = Boolean(record) && !solved;
  const retryMode = ui.moduleRetry[module.id] === true;
  const attempted = ui.moduleAttempt[module.id];
  const bar = solved ? feedbackBar({ kind: "success", why: module.explanation, actionLabel: t("modules.next"), action: "focus-next-module", actionAttrs: `data-module="${escapeHTML(module.id)}"`, focus: false }) : answeredWrong && !retryMode ? feedbackBar({ kind: "attention", why: module.explanation, recommended: t("feedback.recommended", { answer: module.answers[module.correct] }), actionLabel: t("modules.retry"), action: "retry-module", actionAttrs: `data-module="${escapeHTML(module.id)}"`, focus: false }) : "";
  return `<article class="card module-card" data-module-card="${escapeHTML(module.id)}"><span class="tag">${escapeHTML(module.label)}</span><h2>${escapeHTML(module.title)}</h2><p class="subtle">${escapeHTML(module.description)}</p><div class="quiz"><strong>${escapeHTML(module.question)}</strong><div class="answer-list">${module.answers.map((answer, index) => { const wrong = attempted !== undefined && attempted === index && !solved; const correct = solved && index === module.correct; const disabled = solved || (answeredWrong && !retryMode); return `<button class="answer ${correct ? "correct" : ""} ${wrong ? "wrong" : ""}" type="button" data-action="answer-module" data-module="${escapeHTML(module.id)}" data-index="${escapeHTML(index)}" ${disabled ? "disabled" : ""}>${escapeHTML(answer)}</button>`; }).join("")}</div>${!record || retryMode ? `<span class="small subtle">${escapeHTML(t("modules.choose"))}</span>` : ""}</div>${bar}</article>`;
}
