import { t } from "../i18n.js";
import { escapeHTML, icon } from "./shared.js";

export function render(state, ui = {}) {
  const pinSet = ui.adminPinSet === true;
  const error = ui.adminError ? `<p class="form-alert" role="alert">${escapeHTML(t(ui.adminError.key, ui.adminError.vars))}</p>` : "";
  const create = !pinSet;
  return `<section class="page-shell admin-login" aria-labelledby="view-title">
    <a class="button button-quiet" href="#welcome">${escapeHTML(t("admin.back"))}</a>
    <div class="admin-login-card">
      <span class="admin-lock" aria-hidden="true">${icon("lock")}</span>
      <h1 id="view-title" tabindex="-1">${escapeHTML(t(create ? "admin.createTitle" : "admin.title"))}</h1>
      ${create ? `<p class="lede">${escapeHTML(t("admin.createHint"))}</p>` : ""}
      <form data-action="admin-login" data-mode="${create ? "create" : "unlock"}" novalidate>
        <label for="admin-pin">${escapeHTML(t("admin.pinLabel"))}</label>
        <input id="admin-pin" name="pin" type="password" inputmode="numeric" autocomplete="${create ? "new-password" : "current-password"}" maxlength="6" pattern="[0-9]{6}" required ${create ? "" : "autofocus"} />
        ${create ? `<label for="admin-confirm">${escapeHTML(t("admin.confirmLabel"))}</label><input id="admin-confirm" name="confirm" type="password" inputmode="numeric" autocomplete="new-password" maxlength="6" pattern="[0-9]{6}" required />` : ""}
        ${error}
        <button class="button button-primary" type="submit">${escapeHTML(t(create ? "admin.create" : "admin.unlock"))}${icon("arrow", "flip-rtl")}</button>
      </form>
      <details class="admin-forgot"><summary>${escapeHTML(t("admin.forgot"))}</summary><p>${escapeHTML(t("admin.forgotBody"))}</p><button class="button button-quiet" type="button" data-action="admin-reset">${escapeHTML(t("admin.reset"))}</button></details>
      <p class="small subtle admin-local">${escapeHTML(t("admin.local"))}</p>
      <dialog data-admin-dialog><form method="dialog"><h2>${escapeHTML(t("admin.resetTitle"))}</h2><p>${escapeHTML(t("admin.forgotBody"))}</p><div class="button-row"><button class="button button-secondary" value="cancel">${escapeHTML(t("plan.resetCancel"))}</button><button class="button button-primary" value="confirm" data-action="admin-reset-confirm">${escapeHTML(t("admin.reset"))}</button></div></form></dialog>
    </div>
  </section>`;
}
