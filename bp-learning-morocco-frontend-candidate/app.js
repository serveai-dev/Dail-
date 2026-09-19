(() => {
  "use strict";

  const DATA = window.BP_FIXTURES;
  const ROUTES = new Set(["start", "vorbereitung", "simulation", "abschluss", "lernplan"]);
  const STORE_KEY = "bp-historic-frontend-morocco-fr-v1";
  const defaultState = {
    prep: [],
    dialogueStep: 0,
    dialogueAnswers: [],
    quizAnswers: {},
  };

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
      if (!parsed || typeof parsed !== "object") return { ...defaultState };
      const prepIds = new Set(DATA.preparation.map((item) => item.id));
      const prep = Array.isArray(parsed.prep) ? [...new Set(parsed.prep.filter((id) => prepIds.has(id)))] : [];
      const dialogueAnswers = Array.isArray(parsed.dialogueAnswers)
        ? parsed.dialogueAnswers.slice(0, DATA.dialogue.length).filter((answer) => Number.isInteger(answer) && answer >= 0 && answer <= 2)
        : [];
      const quizAnswers = {};
      if (parsed.quizAnswers && typeof parsed.quizAnswers === "object" && !Array.isArray(parsed.quizAnswers)) {
        DATA.learningModules.forEach((module) => {
          const answer = parsed.quizAnswers[module.id];
          if (Number.isInteger(answer) && answer >= 0 && answer < module.answers.length) quizAnswers[module.id] = answer;
        });
      }
      return { prep, dialogueAnswers, dialogueStep: dialogueAnswers.length, quizAnswers };
    } catch {
      return { ...defaultState };
    }
  }

  let state = loadState();
  const views = [...document.querySelectorAll("[data-view]")];
  const toast = document.querySelector(".toast");

  function escapeHTML(value) {
    return String(value).replace(/[&<>'"]/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
    })[character]);
  }

  function save() {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  }

  function notify(message) {
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(notify.timer);
    notify.timer = window.setTimeout(() => { toast.hidden = true; }, 2600);
  }

  function routeFromHash() {
    const value = location.hash.replace(/^#/, "");
    return ROUTES.has(value) ? value : "start";
  }

  function progress() {
    const prep = state.prep.length / DATA.preparation.length;
    const dialogue = state.dialogueAnswers.length / DATA.dialogue.length;
    const quiz = Object.keys(state.quizAnswers).length / DATA.learningModules.length;
    return Math.round(((prep + dialogue + quiz) / 3) * 100);
  }

  function routeLink(route, label, kind = "button-primary") {
    return `<a class="button ${kind}" href="#${route}" data-route="${route}">${escapeHTML(label)}</a>`;
  }

  function renderStart() {
    const value = progress();
    const preparationComplete = state.prep.length === DATA.preparation.length;
    return `
      <div class="page-shell">
        <div class="hero">
          <div>
            <p class="eyebrow">${escapeHTML(DATA.course.eyebrow)}</p>
            <h1 id="start-title" tabindex="-1">${escapeHTML(DATA.course.title)}</h1>
            <p class="lede">${escapeHTML(DATA.course.description)}</p>
            <div class="meta"><span>${DATA.course.duration}</span><span>•</span><span>${DATA.course.level}</span><span>•</span><span>${DATA.learner.context}</span><span>•</span><span>Entraînement</span></div>
            <div class="button-row">
              ${routeLink(preparationComplete ? "simulation" : "vorbereitung", preparationComplete ? "Continuer la formation" : "Commencer la formation")}
              ${routeLink("lernplan", "Voir ma progression", "button-secondary")}
            </div>
          </div>
          <div class="hero-visual" aria-label="Progression globale : ${value} %">
            <div class="visual-card"><span class="small">Ta progression</span><span class="visual-number">${value}%</span><span class="small">Préparation · Simulation · Vérification</span></div>
          </div>
        </div>
        <div class="section-heading"><div><p class="eyebrow">Ton parcours</p><h2>Un parcours complet de communication</h2></div><span class="subtle small">La progression est enregistrée uniquement dans ce navigateur</span></div>
        <div class="card-grid">
          ${stageCard("01", "Préparation", "Trois principes de communication et une courte liste de préparation.", `${state.prep.length}/${DATA.preparation.length} préparés`, "vorbereitung", state.prep.length === DATA.preparation.length)}
          ${stageCard("02", "Simulation", "Un échange en trois étapes pour pratiquer vos réponses.", `${state.dialogueAnswers.length}/${DATA.dialogue.length} réponses`, "simulation", state.dialogueAnswers.length === DATA.dialogue.length)}
          ${stageCard("03", "Modules", "Trois vérifications courtes avec retour immédiat.", `${Object.keys(state.quizAnswers).length}/${DATA.learningModules.length} terminés`, "abschluss", Object.keys(state.quizAnswers).length === DATA.learningModules.length)}
        </div>
      </div>`;
  }

  function stageCard(number, title, body, status, route, done) {
    return `<article class="card ${done ? "active" : ""}"><div class="card-top"><span class="tag ${done ? "success" : ""}">${done ? "Terminé" : `Étape ${number}`}</span><span class="small subtle">${status}</span></div><h3>${title}</h3><p class="subtle">${body}</p>${routeLink(route, done ? "Revoir" : "Ouvrir", "button-secondary")}</article>`;
  }

  function renderPreparation() {
    const allDone = state.prep.length === DATA.preparation.length;
    return `<div class="page-shell split-layout">
      <aside class="sidebar card"><p class="eyebrow">Étape 1</p><h2>Préparation</h2><p class="subtle">Lis les trois points et indique que tu es prêt à les appliquer.</p><ol class="step-list">${DATA.preparation.map((item, index) => `<li><span class="step-dot">${index + 1}</span><span><b>${item.title}</b><br><span class="small">${state.prep.includes(item.id) ? "Prêt" : "À faire"}</span></span></li>`).join("")}</ol></aside>
      <div><p class="eyebrow">Communication en officine</p><h1 id="prep-title" tabindex="-1">Se préparer à l’échange</h1><p class="lede">Prépare trois habitudes utiles avant de commencer le scénario d’exercice dans un contexte marocain fictif.</p>
        <div aria-label="Liste de préparation">${DATA.preparation.map((item) => `<label class="card prep-card"><input type="checkbox" data-prep="${item.id}" ${state.prep.includes(item.id) ? "checked" : ""}/><span><strong>${item.title}</strong><br><span class="subtle">${item.body}</span></span></label>`).join("")}</div>
        <div class="button-row">${routeLink("start", "Retour à la vue d’ensemble", "button-secondary")}<button class="button button-primary" type="button" data-go-simulation ${allDone ? "" : "disabled"}>Démarrer la simulation</button></div>
        ${allDone ? "" : '<p class="small subtle">Valide les trois points pour démarrer la simulation.</p>'}
      </div>
    </div>`;
  }

  function renderSimulation() {
    const completed = state.dialogueAnswers.length;
    const current = DATA.dialogue[Math.min(state.dialogueStep, DATA.dialogue.length - 1)];
    const done = completed >= DATA.dialogue.length;
    const messages = [];
    DATA.dialogue.forEach((turn, index) => {
      if (index <= state.dialogueStep || done) messages.push(`<div class="message"><small>${DATA.scenario.customer}</small>${escapeHTML(turn.text)}</div>`);
      if (state.dialogueAnswers[index] !== undefined) messages.push(`<div class="message user"><small>Toi</small>${escapeHTML(turn.choices[state.dialogueAnswers[index]])}</div>`);
    });
    return `<div class="page-shell"><p class="eyebrow">Étape 2</p><h1 id="sim-title" tabindex="-1">Simulation de communication</h1><div class="simulation-shell">
      <aside class="scenario-panel"><div class="scenario-person" aria-hidden="true">CF</div><h2>${DATA.scenario.customer}</h2><p class="subtle">${DATA.scenario.context}</p><div class="scenario-block"><strong>Ton objectif</strong><p class="small subtle">${DATA.scenario.goal}</p></div><div class="scenario-block"><span class="tag">Scénario fictif</span></div></aside>
      <div class="conversation"><header class="conversation-header"><h2>Dialogue</h2><span class="small subtle">${Math.min(completed + 1, DATA.dialogue.length)} sur ${DATA.dialogue.length}</span></header><div class="messages" data-messages>${messages.join("")}${done ? '<div class="feedback">Simulation terminée. Tes décisions sont résumées dans le résultat.</div>' : ""}</div>
        <div class="choice-panel">${done ? `<div class="button-row">${routeLink("abschluss", "Voir le résultat")}<button class="button button-secondary" type="button" data-reset-dialogue>Recommencer la simulation</button></div>` : `<p class="small"><strong>Que réponds-tu ?</strong></p><div class="choice-list">${current.choices.map((choice, index) => `<button class="choice" type="button" data-choice="${index}">${escapeHTML(choice)}</button>`).join("")}</div>`}</div>
      </div>
    </div></div>`;
  }

  function renderCompletion() {
    const answered = state.dialogueAnswers.length;
    const best = state.dialogueAnswers.reduce((sum, answer, index) => sum + (answer === DATA.dialogue[index].best ? 1 : 0), 0);
    const score = answered ? Math.round((best / DATA.dialogue.length) * 100) : 0;
    return `<div class="page-shell"><div class="result-hero"><div><p class="eyebrow">Étape 3</p><h1 id="result-title" tabindex="-1">Résultat de la simulation</h1><p class="lede">Tu as terminé ${answered} étapes sur ${DATA.dialogue.length}. Utilise les modules pour consolider chaque principe de communication.</p><div class="button-row">${routeLink("simulation", answered ? "Revoir la simulation" : "Commencer la simulation", "button-secondary")}${routeLink("lernplan", "Ouvrir le parcours")}</div></div><div class="score-ring score-${score}" aria-label="${score} % de réponses recommandées sélectionnées"><div><strong>${score}%</strong><small>Dialogue</small></div></div></div>
      <div class="section-heading"><div><p class="eyebrow">Parcours adapté à tes décisions</p><h2>Trois vérifications rapides</h2></div><span class="subtle small">Fictif et déterministe</span></div>
      <div class="card-grid">${DATA.learningModules.map(renderModule).join("")}</div>
    </div>`;
  }

  function renderModule(module) {
    const selected = state.quizAnswers[module.id];
    return `<article class="card"><span class="tag">${module.label}</span><h3>${module.title}</h3><p class="subtle">${module.description}</p><div class="quiz"><strong>${module.question}</strong><div class="answer-list">${module.answers.map((answer, index) => {
      let cls = "";
      if (selected !== undefined && index === module.correct) cls = "correct";
      else if (selected === index) cls = "wrong";
      return `<button class="answer ${cls}" type="button" data-module="${module.id}" data-answer="${index}" ${selected !== undefined ? "disabled" : ""}>${escapeHTML(answer)}</button>`;
    }).join("")}</div>${selected === undefined ? '<span class="small subtle">Choisis une réponse.</span>' : `<span class="small ${selected === module.correct ? "" : "subtle"}">${selected === module.correct ? "Bonne réponse. " : "Pas tout à fait. "}La réponse recommandée est mise en évidence.</span>`}</div></article>`;
  }

  function renderPlan() {
    const value = progress();
    const quizDone = Object.keys(state.quizAnswers).length;
    return `<div class="page-shell"><p class="eyebrow">${DATA.learner.displayName}</p><h1 id="plan-title" tabindex="-1">Ton parcours d’apprentissage</h1><p class="lede">La progression réunit préparation, dialogue et vérifications. Elle reflète les activités réalisées dans cet entraînement.</p><div class="plan-grid"><div class="card"><h2>Prochaines étapes</h2><ol class="timeline"><li><span class="timeline-marker">1</span><div><strong>Préparation</strong><p class="subtle">${state.prep.length}/${DATA.preparation.length} points préparés.</p>${routeLink("vorbereitung", "Ouvrir", "button-secondary")}</div></li><li><span class="timeline-marker">2</span><div><strong>Simulation de dialogue</strong><p class="subtle">${state.dialogueAnswers.length}/${DATA.dialogue.length} décisions prises.</p>${routeLink("simulation", "Ouvrir", "button-secondary")}</div></li><li><span class="timeline-marker">3</span><div><strong>Vérifications</strong><p class="subtle">${quizDone}/${DATA.learningModules.length} modules terminés.</p>${routeLink("abschluss", "Ouvrir", "button-secondary")}</div></li></ol></div><aside class="card"><p class="eyebrow">Progression globale</p><h2>${value}%</h2><progress class="progress-track" max="100" value="${value}" aria-label="Progression globale : ${value} %">${value}%</progress><p class="small subtle">Cette valeur est calculée de façon transparente à partir de trois activités de même poids.</p><button class="button button-secondary" type="button" data-reset-all>Réinitialiser la progression locale</button></aside></div></div>`;
  }

  const renderers = { start: renderStart, vorbereitung: renderPreparation, simulation: renderSimulation, abschluss: renderCompletion, lernplan: renderPlan };

  function render(route = routeFromHash(), focus = false) {
    const activeRoute = ROUTES.has(route) ? route : "start";
    views.forEach((view) => {
      const active = view.dataset.view === activeRoute;
      view.hidden = !active;
      if (active) view.innerHTML = renderers[activeRoute]();
    });
    document.querySelectorAll("nav [data-route]").forEach((link) => link.toggleAttribute("aria-current", link.dataset.route === activeRoute));
    bindInteractions();
    if (focus) document.querySelector(`[data-view="${activeRoute}"] h1`)?.focus({ preventScroll: true });
    if (activeRoute === "simulation") document.querySelector("[data-messages]")?.scrollTo(0, 99999);
  }

  function go(route) {
    location.hash = route;
  }

  function bindInteractions() {
    document.querySelectorAll("[data-route]").forEach((element) => element.addEventListener("click", (event) => {
      const route = event.currentTarget.dataset.route;
      if (event.currentTarget.tagName === "BUTTON") go(route);
    }));
    document.querySelectorAll("[data-prep]").forEach((input) => input.addEventListener("change", (event) => {
      const id = event.currentTarget.dataset.prep;
      state.prep = event.currentTarget.checked ? [...new Set([...state.prep, id])] : state.prep.filter((item) => item !== id);
      save(); render("vorbereitung");
    }));
    document.querySelector("[data-go-simulation]")?.addEventListener("click", () => go("simulation"));
    document.querySelectorAll("[data-choice]").forEach((button) => button.addEventListener("click", (event) => {
      const choice = Number(event.currentTarget.dataset.choice);
      state.dialogueAnswers[state.dialogueStep] = choice;
      const feedback = DATA.dialogue[state.dialogueStep].feedback;
      state.dialogueStep = Math.min(state.dialogueStep + 1, DATA.dialogue.length);
      save(); render("simulation"); notify(feedback);
    }));
    document.querySelector("[data-reset-dialogue]")?.addEventListener("click", () => {
      state.dialogueStep = 0; state.dialogueAnswers = []; save(); render("simulation"); notify("Simulation réinitialisée.");
    });
    document.querySelectorAll("[data-module]").forEach((button) => button.addEventListener("click", (event) => {
      state.quizAnswers[event.currentTarget.dataset.module] = Number(event.currentTarget.dataset.answer);
      save(); render("abschluss");
    }));
    document.querySelector("[data-reset-all]")?.addEventListener("click", () => {
      state = { ...defaultState, prep: [], dialogueAnswers: [], quizAnswers: {} }; save(); render("lernplan"); notify("Progression locale réinitialisée.");
    });
  }

  window.addEventListener("hashchange", () => render(routeFromHash(), true));
  render();
})();
