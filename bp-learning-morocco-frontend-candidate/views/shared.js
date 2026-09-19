import { t } from "../i18n.js";

export function escapeHTML(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

export function routeLink(route, label, kind = "button-primary", attrs = "") {
  return `<a class="button ${kind}" href="#${escapeHTML(route)}" ${attrs}>${escapeHTML(label)}</a>`;
}

export function pageHead(eyebrow, title, lede = "") {
  return `<p class="eyebrow">${escapeHTML(eyebrow)}</p><h1 id="view-title" tabindex="-1">${escapeHTML(title)}</h1>${lede ? `<p class="lede">${escapeHTML(lede)}</p>` : ""}`;
}

export function ring(pct, label) {
  return `<div class="ring" data-pct="${escapeHTML(pct)}" role="img" aria-label="${escapeHTML(label)}"><strong>${escapeHTML(pct)}%</strong></div>`;
}

export function feedbackBar({ kind, why, recommended = "", actionLabel, action, actionAttrs = "", focus = true }) {
  return `<div class="feedback-bar feedback-${kind}" role="status" aria-live="polite" data-feedback-bar>
    <span class="feedback-icon" aria-hidden="true">${kind === "success" ? "✓" : "!"}</span>
    <div class="feedback-text"><strong>${t(kind === "success" ? "feedback.good" : "feedback.almost")}</strong><p>${escapeHTML(why)}</p>${recommended ? `<p class="small">${escapeHTML(recommended)}</p>` : ""}</div>
    <button class="button button-primary" type="button" data-action="${escapeHTML(action)}" ${actionAttrs}${focus ? " data-focus" : ""}>${escapeHTML(actionLabel)}</button>
  </div>`;
}
