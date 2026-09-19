import { t, getLang } from "../i18n.js";
import { content } from "../fixtures.js";
import { escapeHTML, routeLink, pageHead } from "./shared.js";

export function render(state) {
  const course = content(getLang());
  return `<section class="page-shell" aria-labelledby="view-title">
    ${pageHead(t("step.of", { n: 1, total: 3 }), t("prep.title"), t("prep.lede"))}
    <fieldset class="prep-list"><legend class="visually-hidden">${escapeHTML(t("prep.list"))}</legend>${course.preparation.map((item) => `<label class="card prep-card"><input type="checkbox" data-action="prep-toggle" data-id="${escapeHTML(item.id)}" ${state.prep.includes(item.id) ? "checked" : ""}/><span><strong>${escapeHTML(item.title)}</strong><br><span class="subtle">${escapeHTML(item.body)}</span></span></label>`).join("")}</fieldset>
    <div class="button-row">${routeLink("start", t("prep.back"), "button-secondary")}${routeLink("simulation", t("prep.start"))}</div>
  </section>`;
}
