import { t, getLang, formatDate } from "../i18n.js";
import { content } from "../fixtures.js";
import { dialogueScore, modulesSummary, nextRoute, progress, stepsDone, isComplete } from "../state.js";
import { escapeHTML, icon, routeLink } from "./shared.js";

export function render(state) {
  const profile = state.profiles[state.activeId];
  const C = content(getLang());
  const modules = modulesSummary(profile);
  const complete = isComplete(profile);
  const done = stepsDone(profile);
  const next = complete ? t("home.done", { date: formatDate(profile.completedAt) }) : profile.dialogueAnswers.length < 3 ? t("home.next.sim", { n: profile.dialogueAnswers.length + 1, total: 3 }) : t("home.next.check", { n: modules.solved + 1 });
  const destination = complete ? "summary" : nextRoute(profile);
  return `<section class="page-shell home" aria-labelledby="view-title">
    <h1 id="view-title" tabindex="-1">${escapeHTML(t("home.hello", { name: profile.name }))}</h1>
    <article class="continue-card">
      <p class="small subtle">${escapeHTML(C.course.title)} · ${escapeHTML(C.course.duration)}</p>
      <strong class="continue-next">${escapeHTML(next)}</strong>
      <div class="progress-line"><progress max="6" value="${escapeHTML(done)}" aria-label="${escapeHTML(t("home.progress", { done, total: 6 }))}"></progress><span>${escapeHTML(`${done}/6`)}</span></div>
      ${routeLink(destination, complete ? t("summary.print") : t("home.continue"))}
    </article>
    <ol class="steps" aria-label="${escapeHTML(t("home.steps"))}">
      ${stepRow("dialogue", t("home.step.dialogue"), profile.dialogueAnswers.length, 3, "simulation", profile.dialogueAnswers.length > 0 || !complete)}
      ${stepRow("checks", t("home.step.checks"), modules.solved, 3, "checks", profile.dialogueAnswers.length === 3)}
      ${stepRow("cert", t("home.step.cert"), complete ? 1 : null, 1, "summary", complete)}
    </ol>
  </section>`;
}

function stepRow(kind, label, done, total, route, reachable) {
  const marker = done === total ? `<span class="step-marker done">${icon("check")}</span>` : done ? `<span class="step-marker current">${icon("dot")}</span>` : `<span class="step-marker todo"></span>`;
  const count = done === null ? "—" : `${done}/${total}`;
  const body = `${marker}<span class="step-label">${escapeHTML(label)}</span><span class="step-count">${escapeHTML(count)}</span>`;
  return `<li>${reachable ? `<a href="#${escapeHTML(route)}">${body}</a>` : `<span>${body}</span>`}</li>`;
}
