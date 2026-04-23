(function () {
  const content = window.IBM_PREP_CONTENT;
  const pageId = document.body.dataset.page;
  const page = content?.parts?.[pageId];
  const app = document.getElementById("app");
  const authRoot = document.getElementById("auth-modal-root");
  const authTrigger = document.getElementById("auth-trigger");
  const userPill = document.getElementById("user-pill");

  if (!content || !page || !app) {
    return;
  }

  const state = {
    currentUser: null,
    pageState: null,
    allStats: {},
    pyodidePromise: null,
    focusTimer: {
      running: false,
      startedAt: 0,
      elapsedMs: 0
    },
    examTimer: {
      running: false,
      startedAt: 0,
      remainingMs: page.examClockMinutes * 60 * 1000
    },
    tickHandle: null
  };

  const DB = {
    name: "ibm-coding-prep-portal",
    version: 1,
    db: null,
    async init() {
      if (this.db) {
        return this.db;
      }

      this.db = await new Promise((resolve, reject) => {
        const request = window.indexedDB.open(this.name, this.version);

        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains("records")) {
            db.createObjectStore("records", { keyPath: "key" });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      return this.db;
    },
    async get(key) {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const tx = db.transaction("records", "readonly");
        const store = tx.objectStore("records");
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result ? request.result.value : null);
        request.onerror = () => reject(request.error);
      });
    },
    async put(key, value) {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const tx = db.transaction("records", "readwrite");
        const store = tx.objectStore("records");
        const request = store.put({
          key,
          value,
          updatedAt: new Date().toISOString()
        });
        request.onsuccess = () => resolve(value);
        request.onerror = () => reject(request.error);
      });
    },
    async delete(key) {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const tx = db.transaction("records", "readwrite");
        const store = tx.objectStore("records");
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  };

  init().catch((error) => {
    app.innerHTML = `<section class="fallback-card"><h1>Unable to load the portal</h1><p>${escapeHtml(error.message || String(error))}</p></section>`;
  });

  async function init() {
    markActiveNav();
    await DB.init();
    renderAuthModal();
    bindGlobalEvents();
    await restoreSession();
    await loadPageState();
    await loadOverallStats();
    renderPage();
    startTicking();
  }

  function markActiveNav() {
    document.querySelectorAll("[data-nav]").forEach((link) => {
      if (link.dataset.nav === pageId) {
        link.classList.add("active");
      }
    });
  }

  function bindGlobalEvents() {
    authTrigger?.addEventListener("click", () => openAuthModal("login"));

    document.addEventListener("click", async (event) => {
      const actionTarget = event.target.closest("[data-action]");
      if (!actionTarget) {
        return;
      }

      const action = actionTarget.dataset.action;

      if (action === "open-auth") {
        openAuthModal(actionTarget.dataset.mode || "login");
        return;
      }

      if (action === "close-auth") {
        closeAuthModal();
        return;
      }

      if (action === "complete-chapter") {
        const chapterId = actionTarget.dataset.chapterId;
        state.pageState.completedChapters[chapterId] = !state.pageState.completedChapters[chapterId];
        await persistPageState();
        renderPage();
        return;
      }

      if (action === "submit-quiz") {
        const quizId = actionTarget.dataset.quizId;
        await submitQuiz(quizId);
        return;
      }

      if (action === "reset-quiz") {
        const quizId = actionTarget.dataset.quizId;
        delete state.pageState.quizzes[quizId];
        await persistPageState();
        renderPage();
        return;
      }

      if (action === "sandbox-language") {
        const sandboxId = actionTarget.dataset.sandboxId;
        const language = actionTarget.dataset.language;
        setEditorLanguage("sandbox", sandboxId, language);
        renderPage();
        return;
      }

      if (action === "challenge-language") {
        const challengeId = actionTarget.dataset.challengeId;
        const language = actionTarget.dataset.language;
        setEditorLanguage("challenge", challengeId, language);
        renderPage();
        return;
      }

      if (action === "run-sandbox") {
        const sandboxId = actionTarget.dataset.sandboxId;
        await runSandbox(sandboxId);
        return;
      }

      if (action === "reset-sandbox") {
        const sandboxId = actionTarget.dataset.sandboxId;
        resetSandbox(sandboxId);
        await persistPageState();
        renderPage();
        return;
      }

      if (action === "run-sample") {
        const challengeId = actionTarget.dataset.challengeId;
        await runChallenge(challengeId, false);
        return;
      }

      if (action === "submit-challenge") {
        const challengeId = actionTarget.dataset.challengeId;
        await runChallenge(challengeId, true);
        return;
      }

      if (action === "reset-challenge") {
        const challengeId = actionTarget.dataset.challengeId;
        resetChallenge(challengeId);
        await persistPageState();
        renderPage();
        return;
      }

      if (action === "save-notes") {
        const notesInput = document.getElementById("notes-input");
        state.pageState.notes = notesInput ? notesInput.value : "";
        await persistPageState();
        const status = document.getElementById("notes-status");
        if (status) {
          status.textContent = "Notes saved to your browser database.";
        }
        return;
      }

      if (action === "timer-focus-start") {
        startFocusTimer();
        return;
      }

      if (action === "timer-focus-pause") {
        pauseFocusTimer();
        return;
      }

      if (action === "timer-focus-reset") {
        resetFocusTimer();
        return;
      }

      if (action === "timer-exam-start") {
        startExamTimer();
        return;
      }

      if (action === "timer-exam-pause") {
        pauseExamTimer();
        return;
      }

      if (action === "timer-exam-reset") {
        resetExamTimer();
      }
    });

    document.addEventListener("input", (event) => {
      const target = event.target;

      if (target.matches(".quiz-choice-input")) {
        const quizId = target.dataset.quizId;
        const questionIndex = Number(target.dataset.questionIndex);
        const choiceIndex = Number(target.value);
        state.pageState.quizDrafts[quizId] = state.pageState.quizDrafts[quizId] || {};
        state.pageState.quizDrafts[quizId][questionIndex] = choiceIndex;
        return;
      }

      if (target.matches(".sandbox-editor")) {
        const sandboxId = target.dataset.sandboxId;
        const language = getEditorLanguage("sandbox", sandboxId);
        setDraft("sandbox", sandboxId, language, target.value);
        return;
      }

      if (target.matches(".challenge-editor")) {
        const challengeId = target.dataset.challengeId;
        const language = getEditorLanguage("challenge", challengeId);
        setDraft("challenge", challengeId, language, target.value);
      }
    });

    authRoot.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) {
        return;
      }

      if (form.dataset.form === "login") {
        const username = form.querySelector("[name='login-username']")?.value.trim().toLowerCase();
        const password = form.querySelector("[name='login-password']")?.value || "";
        await login(username, password);
        return;
      }

      if (form.dataset.form === "register") {
        const displayName = form.querySelector("[name='register-display-name']")?.value.trim();
        const username = form.querySelector("[name='register-username']")?.value.trim().toLowerCase();
        const password = form.querySelector("[name='register-password']")?.value || "";
        await register(displayName, username, password);
      }
    });
  }

  async function restoreSession() {
    const username = window.localStorage.getItem("ibm-prep-session");
    if (!username) {
      state.currentUser = null;
      return;
    }

    const user = await DB.get(userKey(username));
    state.currentUser = user || null;
    if (!user) {
      window.localStorage.removeItem("ibm-prep-session");
    }
  }

  async function loadPageState() {
    const saved = await DB.get(pageStateKey(pageId));
    state.pageState = saved || defaultPageState();
    if (!state.pageState.examTimer || typeof state.pageState.examTimer.remainingMs !== "number") {
      state.pageState.examTimer = { remainingMs: page.examClockMinutes * 60 * 1000 };
    }
    state.examTimer.remainingMs = state.pageState.examTimer.remainingMs;
  }

  async function loadOverallStats() {
    const parts = Object.keys(content.parts);
    const entries = await Promise.all(
      parts.map(async (partKey) => {
        const saved = (await DB.get(pageStateKey(partKey))) || defaultPageState();
        return [partKey, saved];
      })
    );
    state.allStats = Object.fromEntries(entries);
  }

  function defaultPageState() {
    return {
      completedChapters: {},
      quizDrafts: {},
      quizzes: {},
      languageChoices: {},
      drafts: {
        sandbox: {},
        challenge: {}
      },
      sandboxes: {},
      challenges: {},
      notes: "",
      examTimer: {
        remainingMs: page.examClockMinutes * 60 * 1000
      }
    };
  }

  async function persistPageState() {
    state.pageState.examTimer = {
      remainingMs: Math.max(0, getExamRemainingMs())
    };
    await DB.put(pageStateKey(pageId), state.pageState);
    state.allStats[pageId] = state.pageState;
  }

  async function register(displayName, username, password) {
    const messageEl = document.getElementById("auth-message");
    if (!displayName || !username || !password) {
      messageEl.textContent = "Fill in display name, username, and password.";
      return;
    }
    if (password.length < 6) {
      messageEl.textContent = "Use at least 6 characters for the password.";
      return;
    }
    const existing = await DB.get(userKey(username));
    if (existing) {
      messageEl.textContent = "That username already exists on this device.";
      return;
    }
    const passwordHash = await hashText(password);
    const user = {
      username,
      displayName,
      passwordHash,
      createdAt: new Date().toISOString()
    };
    await DB.put(userKey(username), user);
    window.localStorage.setItem("ibm-prep-session", username);
    state.currentUser = user;
    await loadPageState();
    await loadOverallStats();
    closeAuthModal();
    renderPage();
  }

  async function login(username, password) {
    const messageEl = document.getElementById("auth-message");
    if (!username || !password) {
      messageEl.textContent = "Enter both username and password.";
      return;
    }
    const user = await DB.get(userKey(username));
    if (!user) {
      messageEl.textContent = "No account found for that username on this device.";
      return;
    }
    const candidateHash = await hashText(password);
    if (candidateHash !== user.passwordHash) {
      messageEl.textContent = "Incorrect password.";
      return;
    }
    window.localStorage.setItem("ibm-prep-session", username);
    state.currentUser = user;
    await loadPageState();
    await loadOverallStats();
    closeAuthModal();
    renderPage();
  }

  async function logout() {
    window.localStorage.removeItem("ibm-prep-session");
    state.currentUser = null;
    await loadPageState();
    await loadOverallStats();
    renderPage();
  }

  function renderAuthModal() {
    authRoot.innerHTML = `
      <div id="auth-modal" class="modal-shell hidden" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <div class="modal-card">
          <button class="icon-button" type="button" data-action="close-auth" aria-label="Close">×</button>
          <p class="eyebrow">Browser database account</p>
          <h2 id="auth-title">Save your progress on this device</h2>
          <p class="modal-copy">${escapeHtml(content.meta.storageNote)}</p>
          <div class="auth-grid">
            <form data-form="login" class="auth-form">
              <h3>Sign in</h3>
              <label>
                <span>Username</span>
                <input type="text" name="login-username" autocomplete="username">
              </label>
              <label>
                <span>Password</span>
                <input type="password" name="login-password" autocomplete="current-password">
              </label>
              <button class="primary-button" type="submit">Sign in</button>
            </form>
            <form data-form="register" class="auth-form">
              <h3>Create account</h3>
              <label>
                <span>Display name</span>
                <input type="text" name="register-display-name" autocomplete="name">
              </label>
              <label>
                <span>Username</span>
                <input type="text" name="register-username" autocomplete="username">
              </label>
              <label>
                <span>Password</span>
                <input type="password" name="register-password" autocomplete="new-password">
              </label>
              <button class="secondary-button" type="submit">Create account</button>
            </form>
          </div>
          <p id="auth-message" class="auth-message"></p>
          <p class="modal-footnote">Anyone can use the lessons in guest mode. Signing in simply lets the portal remember progress under a named profile on this browser.</p>
        </div>
      </div>
    `;
  }

  function openAuthModal() {
    const modal = document.getElementById("auth-modal");
    modal?.classList.remove("hidden");
  }

  function closeAuthModal() {
    const modal = document.getElementById("auth-modal");
    modal?.classList.add("hidden");
  }

  function renderPage() {
    const progress = getPageProgress(page, state.pageState);
    const quickLinks = buildQuickLinks(page);
    const globalStats = getGlobalProgress();

    authTrigger.textContent = state.currentUser ? "Switch Account" : "Sign In";
    userPill.innerHTML = state.currentUser
      ? `<strong>${escapeHtml(state.currentUser.displayName)}</strong><span>Saved on this device</span><button class="text-button" type="button" data-action="logout-inline">Sign out</button>`
      : `<strong>Guest mode</strong><span>Public access is open</span>`;

    const userInlineButton = userPill.querySelector("[data-action='logout-inline']");
    userInlineButton?.addEventListener("click", logout);

    app.innerHTML = `
      <section class="hero-card">
        <div class="hero-copy">
          <p class="eyebrow">${escapeHtml(page.label)} · public learning track</p>
          <h1>${escapeHtml(page.title)}</h1>
          <p class="hero-subtitle">${escapeHtml(page.subtitle)}</p>
          <div class="hero-chip-row">
            <span class="hero-chip">${escapeHtml(page.estimatedTime)}</span>
            <span class="hero-chip">${escapeHtml(page.audience)}</span>
          </div>
          <div class="hero-list-grid">
            <div class="panel-card">
              <h2>What this part will help you do</h2>
              <ul class="plain-list">${page.goals.map((goal) => `<li>${escapeHtml(goal)}</li>`).join("")}</ul>
            </div>
            <div class="panel-card">
              <h2>Logical learning order</h2>
              <ul class="plain-list">${page.journey.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
            </div>
          </div>
          <div class="hero-actions">
            ${page.previous ? `<a class="ghost-button" href="${escapeHtml(page.previous.href)}">${escapeHtml(page.previous.label)}</a>` : `<button class="ghost-button" type="button" data-action="open-auth" data-mode="register">Create account</button>`}
            ${page.next ? `<a class="primary-button" href="${escapeHtml(page.next.href)}">${escapeHtml(page.next.label)}</a>` : ""}
          </div>
        </div>
        <div class="hero-side">
          <div class="metric-card">
            <span class="metric-label">Current part progress</span>
            <strong class="metric-value">${progress.percent}%</strong>
            <div class="progress-track"><span class="progress-fill" style="width:${progress.percent}%"></span></div>
            <p class="metric-foot">${progress.completedUnits} of ${progress.totalUnits} checkpoints completed</p>
          </div>
          <div class="metric-card">
            <span class="metric-label">Portal-wide progress</span>
            <strong class="metric-value">${globalStats.percent}%</strong>
            <p class="metric-foot">${globalStats.completedParts} of 4 parts have at least one submitted checkpoint.</p>
          </div>
          <div class="timer-card">
            <span class="metric-label">Focus timer</span>
            <strong id="focus-timer-value" class="timer-value">${formatDuration(getFocusElapsedMs())}</strong>
            <div class="timer-controls">
              <button class="mini-button" type="button" data-action="timer-focus-start">Start</button>
              <button class="mini-button" type="button" data-action="timer-focus-pause">Pause</button>
              <button class="mini-button" type="button" data-action="timer-focus-reset">Reset</button>
            </div>
          </div>
          <div class="timer-card">
            <span class="metric-label">Assessment clock</span>
            <strong id="exam-timer-value" class="timer-value">${formatDuration(getExamRemainingMs())}</strong>
            <div class="timer-controls">
              <button class="mini-button" type="button" data-action="timer-exam-start">Start</button>
              <button class="mini-button" type="button" data-action="timer-exam-pause">Pause</button>
              <button class="mini-button" type="button" data-action="timer-exam-reset">Reset</button>
            </div>
          </div>
          <div class="metric-card">
            <span class="metric-label">Storage mode</span>
            <p class="metric-foot">${escapeHtml(content.meta.storageNote)}</p>
          </div>
        </div>
      </section>

      <section class="part-switcher">
        ${renderPartLinks()}
      </section>

      <section class="content-layout">
        <aside class="sticky-column">
          <div class="side-card">
            <h2>On this page</h2>
            <div class="side-link-list">${quickLinks}</div>
          </div>
          <div class="side-card">
            <h2>Score snapshot</h2>
            <div class="score-grid">
              <div>
                <span class="side-label">Quiz average</span>
                <strong>${getQuizAverage(state.pageState)}%</strong>
              </div>
              <div>
                <span class="side-label">Code pass rate</span>
                <strong>${getChallengePassRate(state.pageState)}%</strong>
              </div>
            </div>
          </div>
        </aside>

        <div class="main-column">
          ${page.chapters.map((chapter) => renderChapter(chapter)).join("")}
          ${renderAssessment(page.assessment)}
          ${renderNotesPanel()}
          ${renderFooterNav(page)}
        </div>
      </section>
    `;
  }

  function renderPartLinks() {
    return Object.values(content.parts)
      .map((partItem) => {
        const saved = state.allStats[partItem.id] || defaultPageState();
        const stats = getPageProgress(partItem, saved);
        return `
          <a class="part-link-card ${partItem.id === pageId ? "active" : ""}" href="${partItem.id === "part1" ? "index.html" : `${partItem.id}.html`}">
            <span class="eyebrow">${escapeHtml(partItem.label)}</span>
            <strong>${escapeHtml(partItem.title)}</strong>
            <span>${stats.percent}% complete</span>
          </a>
        `;
      })
      .join("");
  }

  function buildQuickLinks(currentPage) {
    const items = [];
    currentPage.chapters.forEach((chapter) => {
      items.push(`<a href="#${escapeHtml(chapter.id)}">${escapeHtml(chapter.label)}: ${escapeHtml(chapter.title)}</a>`);
    });
    if (currentPage.assessment) {
      items.push(`<a href="#assessment">${escapeHtml(currentPage.assessment.title)}</a>`);
    }
    items.push(`<a href="#notes">Notes</a>`);
    return items.join("");
  }

  function renderChapter(chapter) {
    const chapterDone = Boolean(state.pageState.completedChapters[chapter.id]);
    return `
      <article id="${escapeHtml(chapter.id)}" class="chapter-card">
        <div class="chapter-header">
          <div>
            <p class="eyebrow">${escapeHtml(chapter.label)} · ${escapeHtml(chapter.duration)}</p>
            <h2>${escapeHtml(chapter.title)}</h2>
            <p class="chapter-summary">${escapeHtml(chapter.outcome)}</p>
            <p class="chapter-unlock">Knowledge gate: ${escapeHtml(chapter.unlock)}</p>
          </div>
          <button class="chapter-toggle ${chapterDone ? "done" : ""}" type="button" data-action="complete-chapter" data-chapter-id="${escapeHtml(chapter.id)}">
            ${chapterDone ? "Completed" : "Mark complete"}
          </button>
        </div>
        <div class="chapter-body">
          ${chapter.sections.map(renderSection).join("")}
          ${renderSandbox(chapter.sandbox)}
          ${renderQuiz(chapter.quiz)}
          ${renderChallenge(chapter.challenge)}
        </div>
      </article>
    `;
  }

  function renderSection(section) {
    return `
      <section class="info-card">
        <h3>${escapeHtml(section.heading)}</h3>
        ${section.paragraphs ? section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("") : ""}
        ${section.bullets ? `<ul class="plain-list">${section.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}</ul>` : ""}
        ${section.codeExamples ? `<div class="code-grid">${section.codeExamples.map(renderCodeExample).join("")}</div>` : ""}
        ${section.tip ? `<div class="tip-box"><strong>Study tip:</strong> ${escapeHtml(section.tip)}</div>` : ""}
      </section>
    `;
  }

  function renderCodeExample(example) {
    return `
      <div class="code-card">
        <div class="code-card-header">
          <span>${escapeHtml(example.title)}</span>
          <span class="language-tag">${escapeHtml(example.language)}</span>
        </div>
        <pre><code>${escapeHtml(example.code)}</code></pre>
      </div>
    `;
  }

  function renderSandbox(sandbox) {
    const language = getEditorLanguage("sandbox", sandbox.id);
    const code = getDraft("sandbox", sandbox.id, language, sandbox.starterCode[language]);
    const result = state.pageState.sandboxes[sandbox.id];

    return `
      <section class="interactive-card">
        <div class="interactive-header">
          <div>
            <p class="eyebrow">Practice sandbox</p>
            <h3>${escapeHtml(sandbox.title)}</h3>
            <p>${escapeHtml(sandbox.description)}</p>
          </div>
          <div class="language-switcher">
            ${renderLanguageButtons("sandbox", sandbox.id, language)}
          </div>
        </div>
        <textarea class="editor sandbox-editor" data-sandbox-id="${escapeHtml(sandbox.id)}" spellcheck="false">${escapeHtml(code)}</textarea>
        <div class="editor-actions">
          <button class="secondary-button" type="button" data-action="run-sandbox" data-sandbox-id="${escapeHtml(sandbox.id)}">Run code</button>
          <button class="ghost-button" type="button" data-action="reset-sandbox" data-sandbox-id="${escapeHtml(sandbox.id)}">Reset starter</button>
        </div>
        <div class="result-panel">
          <div>
            <span class="result-label">Output</span>
            <pre>${escapeHtml(result?.output || "Run the sandbox to inspect output.")}</pre>
          </div>
          <div>
            <span class="result-label">Runtime</span>
            <p>${result?.runtimeMs != null ? `${result.runtimeMs.toFixed(2)} ms` : "Not run yet"}</p>
          </div>
        </div>
      </section>
    `;
  }

  function renderQuiz(quiz) {
    const saved = state.pageState.quizzes[quiz.id];
    const draft = state.pageState.quizDrafts[quiz.id] || {};

    return `
      <section class="quiz-card">
        <div class="interactive-header">
          <div>
            <p class="eyebrow">Knowledge check</p>
            <h3>${escapeHtml(quiz.title)}</h3>
            <p>Answers stay private until you click submit. The score is calculated from your actual selected answers, not a fixed placeholder.</p>
          </div>
          <div class="score-pill ${saved ? "visible" : ""}">
            ${saved ? `${saved.correct}/${saved.total} · ${saved.percentage}%` : "Not graded yet"}
          </div>
        </div>
        <div class="quiz-question-list">
          ${quiz.questions.map((question, questionIndex) => {
            const submittedChoice = saved?.answers?.[questionIndex];
            const selectedChoice = submittedChoice != null ? submittedChoice : draft[questionIndex];
            const reveal = Boolean(saved);

            return `
              <article class="question-card">
                <h4>${questionIndex + 1}. ${escapeHtml(question.prompt)}</h4>
                <div class="choice-list">
                  ${question.choices
                    .map((choice, choiceIndex) => {
                      const checked = selectedChoice === choiceIndex ? "checked" : "";
                      const feedbackClass = reveal
                        ? choiceIndex === question.answer
                          ? "correct"
                          : submittedChoice === choiceIndex
                            ? "incorrect"
                            : ""
                        : "";
                      return `
                        <label class="choice-pill ${feedbackClass}">
                          <input class="quiz-choice-input" type="radio" name="${quiz.id}-${questionIndex}" data-quiz-id="${quiz.id}" data-question-index="${questionIndex}" value="${choiceIndex}" ${checked}>
                          <span>${escapeHtml(choice)}</span>
                        </label>
                      `;
                    })
                    .join("")}
                </div>
                ${reveal ? `<p class="explanation">${escapeHtml(question.explanation)}</p>` : ""}
              </article>
            `;
          }).join("")}
        </div>
        <div class="editor-actions">
          <button class="primary-button" type="button" data-action="submit-quiz" data-quiz-id="${escapeHtml(quiz.id)}">Submit checkpoint</button>
          <button class="ghost-button" type="button" data-action="reset-quiz" data-quiz-id="${escapeHtml(quiz.id)}">Reset checkpoint</button>
        </div>
      </section>
    `;
  }

  function renderChallenge(challenge) {
    const language = getEditorLanguage("challenge", challenge.id);
    const code = getDraft("challenge", challenge.id, language, challenge.starterCode[language]);
    const saved = state.pageState.challenges[challenge.id];
    const result = saved?.result;

    return `
      <section class="challenge-card">
        <div class="interactive-header">
          <div>
            <p class="eyebrow">${escapeHtml(challenge.difficulty)} coding challenge</p>
            <h3>${escapeHtml(challenge.title)}</h3>
            <p>${escapeHtml(challenge.description)}</p>
          </div>
          <div class="language-switcher">
            ${renderLanguageButtons("challenge", challenge.id, language)}
          </div>
        </div>
        <ul class="plain-list compact-list">
          ${challenge.instructions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
        <div class="sample-box">
          <span class="result-label">Visible sample tests</span>
          <ul class="plain-list compact-list">
            ${challenge.sampleTests.map((test) => `<li>${escapeHtml(formatArgs(test.args))} -> ${escapeHtml(JSON.stringify(test.expected))}</li>`).join("")}
          </ul>
          <p class="small-note">Reference solutions and hidden-test explanations stay locked until you submit this challenge.</p>
        </div>
        <textarea class="editor challenge-editor" data-challenge-id="${escapeHtml(challenge.id)}" spellcheck="false">${escapeHtml(code)}</textarea>
        <div class="editor-actions">
          <button class="secondary-button" type="button" data-action="run-sample" data-challenge-id="${escapeHtml(challenge.id)}">Run sample tests</button>
          <button class="primary-button" type="button" data-action="submit-challenge" data-challenge-id="${escapeHtml(challenge.id)}">Submit hidden tests</button>
          <button class="ghost-button" type="button" data-action="reset-challenge" data-challenge-id="${escapeHtml(challenge.id)}">Reset starter</button>
        </div>
        <div class="result-grid">
          <div class="result-panel">
            <span class="result-label">Latest result</span>
            <pre>${escapeHtml(formatChallengeSummary(result))}</pre>
          </div>
          <div class="result-panel">
            <span class="result-label">Efficiency</span>
            <div class="metric-stack">
              <p>Target: ${escapeHtml(challenge.complexity.time)} time / ${escapeHtml(challenge.complexity.space)} extra space</p>
              <p>${escapeHtml(result?.efficiency?.time || "Submit to measure empirical runtime shape.")}</p>
              <p>${escapeHtml(result?.efficiency?.space || "Space note appears after hidden-test submission.")}</p>
            </div>
          </div>
        </div>
        ${result?.submitted ? `
          <div class="solution-panel">
            <h4>After-submit explanation</h4>
            ${challenge.explanation.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
            <div class="solution-grid">
              <div class="code-card">
                <div class="code-card-header"><span>Python reference</span><span class="language-tag">python</span></div>
                <pre><code>${escapeHtml(challenge.solution.python)}</code></pre>
              </div>
              <div class="code-card">
                <div class="code-card-header"><span>JavaScript reference</span><span class="language-tag">javascript</span></div>
                <pre><code>${escapeHtml(challenge.solution.javascript)}</code></pre>
              </div>
            </div>
          </div>
        ` : ""}
      </section>
    `;
  }

  function renderAssessment(assessment) {
    return `
      <section id="assessment" class="assessment-card">
        <div class="interactive-header">
          <div>
            <p class="eyebrow">Assessment zone</p>
            <h2>${escapeHtml(assessment.title)}</h2>
            <p>${escapeHtml(assessment.description)}</p>
          </div>
          <div class="hero-chip">${escapeHtml(assessment.timerLabel)}</div>
        </div>
        ${assessment.questions?.length ? renderQuiz({
          id: assessment.id,
          title: "Assessment multiple-choice section",
          questions: assessment.questions
        }) : `<div class="info-card"><p>This assessment is fully coding-based. Solutions and explanations unlock per question after submission.</p></div>`}
        ${assessment.codingChallenges?.length ? assessment.codingChallenges.map(renderChallenge).join("") : ""}
      </section>
    `;
  }

  function renderNotesPanel() {
    return `
      <section id="notes" class="notes-card">
        <div class="interactive-header">
          <div>
            <p class="eyebrow">Notes</p>
            <h2>Personal study notes</h2>
            <p>Use this space for patterns you forget, debugging habits that helped, or explanations in your own words.</p>
          </div>
        </div>
        <textarea id="notes-input" class="notes-editor" spellcheck="true">${escapeHtml(state.pageState.notes || "")}</textarea>
        <div class="editor-actions">
          <button class="secondary-button" type="button" data-action="save-notes">Save notes</button>
          <span id="notes-status" class="small-note"></span>
        </div>
      </section>
    `;
  }

  function renderFooterNav(currentPage) {
    return `
      <section class="footer-nav">
        ${currentPage.previous ? `<a class="ghost-button" href="${escapeHtml(currentPage.previous.href)}">${escapeHtml(currentPage.previous.label)}</a>` : `<a class="ghost-button" href="index.html">Go to Part 1</a>`}
        <div class="footer-links">
          <a href="index.html">Part 1</a>
          <a href="part2.html">Part 2</a>
          <a href="part3.html">Part 3</a>
          <a href="part4.html">Part 4</a>
        </div>
        ${currentPage.next ? `<a class="primary-button" href="${escapeHtml(currentPage.next.href)}">${escapeHtml(currentPage.next.label)}</a>` : `<a class="primary-button" href="index.html">Review again from Part 1</a>`}
      </section>
    `;
  }

  async function submitQuiz(quizId) {
    const quiz = findQuizById(quizId);
    if (!quiz) {
      return;
    }

    const draft = state.pageState.quizDrafts[quizId] || {};
    const answers = [];
    let correct = 0;

    quiz.questions.forEach((question, index) => {
      const selected = Number.isInteger(draft[index]) ? draft[index] : null;
      answers[index] = selected;
      if (selected === question.answer) {
        correct += 1;
      }
    });

    const total = quiz.questions.length;
    const percentage = Math.round((correct / total) * 100);

    state.pageState.quizzes[quizId] = {
      answers,
      correct,
      total,
      percentage,
      submittedAt: new Date().toISOString()
    };
    await persistPageState();
    renderPage();
  }

  async function runSandbox(sandboxId) {
    const sandbox = findSandboxById(sandboxId);
    if (!sandbox) {
      return;
    }

    const language = getEditorLanguage("sandbox", sandboxId);
    const code = getDraft("sandbox", sandboxId, language, sandbox.starterCode[language]);

    let result;
    if (language === "python") {
      result = await executePythonPlayground(code);
    } else {
      result = await executeJavascriptPlayground(code);
    }

    state.pageState.sandboxes[sandboxId] = result;
    await persistPageState();
    renderPage();
  }

  function resetSandbox(sandboxId) {
    const sandbox = findSandboxById(sandboxId);
    if (!sandbox) {
      return;
    }
    state.pageState.drafts.sandbox[sandboxId] = {
      python: sandbox.starterCode.python,
      javascript: sandbox.starterCode.javascript
    };
    delete state.pageState.sandboxes[sandboxId];
  }

  async function runChallenge(challengeId, submitted) {
    const challenge = findChallengeById(challengeId);
    if (!challenge) {
      return;
    }

    const language = getEditorLanguage("challenge", challengeId);
    const code = getDraft("challenge", challengeId, language, challenge.starterCode[language]);
    const tests = submitted ? challenge.hiddenTests : challenge.sampleTests;

    let execution;
    try {
      if (language === "python") {
        execution = await executePythonChallenge(challenge, code, tests);
      } else {
        execution = await executeJavascriptChallenge(challenge, code, tests);
      }
    } catch (error) {
      execution = {
        ok: false,
        summary: `Execution error: ${error.message || String(error)}`,
        cases: [],
        totalMs: 0
      };
    }

    const challengeState = state.pageState.challenges[challengeId] || {};
    challengeState.language = language;
    challengeState.result = {
      submitted,
      ok: execution.ok,
      cases: execution.cases,
      totalMs: execution.totalMs,
      summary: execution.summary
    };

    if (submitted) {
      challengeState.result.efficiency = await estimateEfficiency(challenge, language, code);
      challengeState.submittedAt = new Date().toISOString();
    }

    state.pageState.challenges[challengeId] = challengeState;
    await persistPageState();
    renderPage();
  }

  function resetChallenge(challengeId) {
    const challenge = findChallengeById(challengeId);
    if (!challenge) {
      return;
    }
    state.pageState.drafts.challenge[challengeId] = {
      python: challenge.starterCode.python,
      javascript: challenge.starterCode.javascript
    };
    delete state.pageState.challenges[challengeId];
  }

  async function executeJavascriptPlayground(code) {
    const logs = [];
    const consoleShim = {
      log: (...args) => logs.push(args.map(formatValue).join(" ")),
      error: (...args) => logs.push(args.map(formatValue).join(" ")),
      warn: (...args) => logs.push(args.map(formatValue).join(" "))
    };

    const started = performance.now();
    try {
      const runner = new Function("console", `"use strict";\n${code}`);
      runner(consoleShim);
      return {
        output: logs.join("\n") || "Code ran without console output.",
        runtimeMs: performance.now() - started
      };
    } catch (error) {
      return {
        output: `Error: ${error.message || String(error)}`,
        runtimeMs: performance.now() - started
      };
    }
  }

  async function executePythonPlayground(code) {
    const pyodide = await ensurePyodide();
    const stdout = [];
    const stderr = [];
    pyodide.setStdout({ batched: (message) => stdout.push(message) });
    pyodide.setStderr({ batched: (message) => stderr.push(message) });

    const started = performance.now();
    try {
      await pyodide.runPythonAsync(code);
      const joined = [...stdout, ...stderr].join("\n") || "Code ran without printed output.";
      return {
        output: joined,
        runtimeMs: performance.now() - started
      };
    } catch (error) {
      return {
        output: `Error: ${error.message || String(error)}`,
        runtimeMs: performance.now() - started
      };
    }
  }

  async function executeJavascriptChallenge(challenge, code, tests) {
    let fn;
    try {
      fn = new Function(
        `"use strict";\n${code}\nreturn typeof ${challenge.functionName.javascript} === "function" ? ${challenge.functionName.javascript} : null;`
      )();
    } catch (error) {
      return {
        ok: false,
        cases: [],
        totalMs: 0,
        summary: `Compilation error: ${error.message || String(error)}`
      };
    }

    if (!fn) {
      return {
        ok: false,
        cases: [],
        totalMs: 0,
        summary: `Function ${challenge.functionName.javascript} was not found.`
      };
    }

    const cases = [];
    let totalMs = 0;

    for (const test of tests) {
      const args = cloneValue(test.args);
      const started = performance.now();
      let actual;
      try {
        actual = fn(...args);
        if (actual instanceof Promise) {
          actual = await actual;
        }
      } catch (error) {
        return {
          ok: false,
          cases,
          totalMs,
          summary: `Runtime error: ${error.message || String(error)}`
        };
      }
      const elapsed = performance.now() - started;
      totalMs += elapsed;
      const passed = deepEqual(actual, test.expected);
      cases.push({
        passed,
        actual,
        expected: test.expected,
        args: test.args,
        ms: elapsed
      });
    }

    const passedCount = cases.filter((item) => item.passed).length;
    return {
      ok: passedCount === cases.length,
      cases,
      totalMs,
      summary: `${passedCount}/${cases.length} tests passed`
    };
  }

  async function executePythonChallenge(challenge, code, tests) {
    const pyodide = await ensurePyodide();
    const cases = [];
    let totalMs = 0;

    for (const test of tests) {
      pyodide.globals.set("__ibm_args_json", JSON.stringify(test.args));
      const started = performance.now();
      try {
        const raw = await pyodide.runPythonAsync(
          `${code}\nimport json\n__ibm_args = json.loads(str(__ibm_args_json))\njson.dumps(${challenge.functionName.python}(*__ibm_args))`
        );
        const elapsed = performance.now() - started;
        totalMs += elapsed;
        const actual = JSON.parse(raw);
        const passed = deepEqual(actual, test.expected);
        cases.push({
          passed,
          actual,
          expected: test.expected,
          args: test.args,
          ms: elapsed
        });
      } catch (error) {
        return {
          ok: false,
          cases,
          totalMs,
          summary: `Runtime error: ${error.message || String(error)}`
        };
      }
    }

    const passedCount = cases.filter((item) => item.passed).length;
    return {
      ok: passedCount === cases.length,
      cases,
      totalMs,
      summary: `${passedCount}/${cases.length} tests passed`
    };
  }

  async function estimateEfficiency(challenge, language, code) {
    const benchmark = challenge.benchmark;
    if (!benchmark) {
      return {
        time: "No benchmark configured.",
        space: estimateSpaceNote(language, code, challenge.complexity.space)
      };
    }

    const samples = [];
    if (language === "javascript") {
      let fn;
      try {
        fn = new Function(
          `"use strict";\n${code}\nreturn typeof ${challenge.functionName.javascript} === "function" ? ${challenge.functionName.javascript} : null;`
        )();
      } catch (error) {
        return {
          time: `Benchmark unavailable because the code did not compile: ${error.message || String(error)}`,
          space: estimateSpaceNote(language, code, challenge.complexity.space)
        };
      }

      if (!fn) {
        return {
          time: `Benchmark unavailable because ${challenge.functionName.javascript} was not defined.`,
          space: estimateSpaceNote(language, code, challenge.complexity.space)
        };
      }

      for (const size of benchmark.sizes) {
        const args = cloneValue(benchmark.buildInput(size));
        const started = performance.now();
        await Promise.resolve(fn(...args));
        samples.push({ size, ms: Math.max(0.01, performance.now() - started) });
      }
    } else {
      const pyodide = await ensurePyodide();
      try {
        await pyodide.runPythonAsync(code);
      } catch (error) {
        return {
          time: `Benchmark unavailable because the code did not compile: ${error.message || String(error)}`,
          space: estimateSpaceNote(language, code, challenge.complexity.space)
        };
      }

      for (const size of benchmark.sizes) {
        pyodide.globals.set("__ibm_args_json", JSON.stringify(benchmark.buildInput(size)));
        const started = performance.now();
        await pyodide.runPythonAsync(
          `import json\n__ibm_args = json.loads(str(__ibm_args_json))\n${challenge.functionName.python}(*__ibm_args)`
        );
        samples.push({ size, ms: Math.max(0.01, performance.now() - started) });
      }
    }

    const complexity = classifyGrowth(samples);
    return {
      time: `Observed runtime shape looked closest to ${complexity}. Hidden-test runtime target was ${challenge.complexity.time}.`,
      space: estimateSpaceNote(language, code, challenge.complexity.space)
    };
  }

  async function ensurePyodide() {
    if (window.__ibmPyodide) {
      return window.__ibmPyodide;
    }
    if (!state.pyodidePromise) {
      state.pyodidePromise = new Promise((resolve, reject) => {
        const finishLoad = async () => {
          try {
            const pyodide = await window.loadPyodide({
              indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.2/full/"
            });
            window.__ibmPyodide = pyodide;
            resolve(pyodide);
          } catch (error) {
            reject(error);
          }
        };

        if (window.loadPyodide) {
          finishLoad();
          return;
        }

        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.27.2/full/pyodide.js";
        script.onload = finishLoad;
        script.onerror = () => reject(new Error("Unable to load the Python runtime."));
        document.head.appendChild(script);
      });
    }
    return state.pyodidePromise;
  }

  function startTicking() {
    if (state.tickHandle) {
      window.clearInterval(state.tickHandle);
    }
    state.tickHandle = window.setInterval(async () => {
      updateTimerDisplays();
      if (state.examTimer.running && getExamRemainingMs() <= 0) {
        state.examTimer.running = false;
        state.examTimer.remainingMs = 0;
        await persistPageState();
      }
    }, 250);
  }

  function updateTimerDisplays() {
    const focusEl = document.getElementById("focus-timer-value");
    const examEl = document.getElementById("exam-timer-value");
    if (focusEl) {
      focusEl.textContent = formatDuration(getFocusElapsedMs());
    }
    if (examEl) {
      examEl.textContent = formatDuration(getExamRemainingMs());
    }
  }

  function startFocusTimer() {
    if (state.focusTimer.running) {
      return;
    }
    state.focusTimer.running = true;
    state.focusTimer.startedAt = Date.now();
  }

  function pauseFocusTimer() {
    if (!state.focusTimer.running) {
      return;
    }
    state.focusTimer.elapsedMs = getFocusElapsedMs();
    state.focusTimer.running = false;
    state.focusTimer.startedAt = 0;
    updateTimerDisplays();
  }

  function resetFocusTimer() {
    state.focusTimer.running = false;
    state.focusTimer.startedAt = 0;
    state.focusTimer.elapsedMs = 0;
    updateTimerDisplays();
  }

  function startExamTimer() {
    if (state.examTimer.running) {
      return;
    }
    if (getExamRemainingMs() <= 0) {
      state.examTimer.remainingMs = page.examClockMinutes * 60 * 1000;
    }
    state.examTimer.running = true;
    state.examTimer.startedAt = Date.now();
  }

  async function pauseExamTimer() {
    if (!state.examTimer.running) {
      return;
    }
    state.examTimer.remainingMs = getExamRemainingMs();
    state.examTimer.running = false;
    state.examTimer.startedAt = 0;
    await persistPageState();
    updateTimerDisplays();
  }

  async function resetExamTimer() {
    state.examTimer.running = false;
    state.examTimer.startedAt = 0;
    state.examTimer.remainingMs = page.examClockMinutes * 60 * 1000;
    await persistPageState();
    updateTimerDisplays();
  }

  function getFocusElapsedMs() {
    if (!state.focusTimer.running) {
      return state.focusTimer.elapsedMs;
    }
    return state.focusTimer.elapsedMs + (Date.now() - state.focusTimer.startedAt);
  }

  function getExamRemainingMs() {
    if (!state.examTimer.running) {
      return state.examTimer.remainingMs;
    }
    const remaining = state.examTimer.remainingMs - (Date.now() - state.examTimer.startedAt);
    return Math.max(0, remaining);
  }

  function getEditorLanguage(kind, id) {
    return state.pageState.languageChoices[`${kind}:${id}`] || "python";
  }

  function setEditorLanguage(kind, id, language) {
    state.pageState.languageChoices[`${kind}:${id}`] = language;
  }

  function setDraft(kind, id, language, value) {
    state.pageState.drafts[kind][id] = state.pageState.drafts[kind][id] || {};
    state.pageState.drafts[kind][id][language] = value;
  }

  function getDraft(kind, id, language, starter) {
    const scoped = state.pageState.drafts[kind][id];
    if (scoped && typeof scoped[language] === "string") {
      return scoped[language];
    }
    setDraft(kind, id, language, starter);
    return starter;
  }

  function findQuizById(quizId) {
    for (const chapter of page.chapters) {
      if (chapter.quiz?.id === quizId) {
        return chapter.quiz;
      }
    }
    if (page.assessment && page.assessment.id === quizId) {
      return {
        id: page.assessment.id,
        title: page.assessment.title,
        questions: page.assessment.questions
      };
    }
    return null;
  }

  function findSandboxById(sandboxId) {
    for (const chapter of page.chapters) {
      if (chapter.sandbox?.id === sandboxId) {
        return chapter.sandbox;
      }
    }
    return null;
  }

  function findChallengeById(challengeId) {
    for (const chapter of page.chapters) {
      if (chapter.challenge?.id === challengeId) {
        return chapter.challenge;
      }
    }
    for (const challenge of page.assessment?.codingChallenges || []) {
      if (challenge.id === challengeId) {
        return challenge;
      }
    }
    return null;
  }

  function getPageProgress(currentPage, pageState) {
    const totalChapters = currentPage.chapters.length;
    const totalQuizzes = currentPage.chapters.filter((chapter) => chapter.quiz).length + (currentPage.assessment?.questions?.length ? 1 : 0);
    const totalChallenges = currentPage.chapters.filter((chapter) => chapter.challenge).length + (currentPage.assessment?.codingChallenges?.length || 0);

    const completedChapters = Object.values(pageState.completedChapters || {}).filter(Boolean).length;
    const completedQuizzes = Object.keys(pageState.quizzes || {}).length;
    const completedChallenges = Object.values(pageState.challenges || {}).filter((item) => item.result?.submitted || item.result?.ok).length;

    const totalUnits = totalChapters + totalQuizzes + totalChallenges;
    const completedUnits = completedChapters + completedQuizzes + completedChallenges;

    return {
      totalUnits,
      completedUnits,
      percent: totalUnits ? Math.round((completedUnits / totalUnits) * 100) : 0
    };
  }

  function getGlobalProgress() {
    const partEntries = Object.entries(content.parts);
    const partSnapshots = partEntries.map(([partKey, partDefinition]) => getPageProgress(partDefinition, state.allStats[partKey] || defaultPageState()));
    const completedParts = partSnapshots.filter((snapshot) => snapshot.completedUnits > 0).length;
    const totalPercent = Math.round(partSnapshots.reduce((sum, snapshot) => sum + snapshot.percent, 0) / partSnapshots.length);
    return {
      completedParts,
      percent: totalPercent
    };
  }

  function getQuizAverage(pageState) {
    const values = Object.values(pageState.quizzes || {}).map((quiz) => quiz.percentage);
    if (!values.length) {
      return 0;
    }
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }

  function getChallengePassRate(pageState) {
    const values = Object.values(pageState.challenges || {});
    if (!values.length) {
      return 0;
    }
    const passed = values.filter((item) => item.result?.ok).length;
    return Math.round((passed / values.length) * 100);
  }

  function classifyGrowth(samples) {
    const models = {
      "O(1)": (n) => 1,
      "O(log n)": (n) => Math.log2(n + 1),
      "O(n)": (n) => n,
      "O(n log n)": (n) => n * Math.log2(n + 1),
      "O(n²)": (n) => n * n
    };

    let bestModel = "O(n)";
    let bestError = Number.POSITIVE_INFINITY;

    Object.entries(models).forEach(([label, fn]) => {
      const ratios = samples.map((sample) => sample.ms / fn(sample.size));
      const scale = ratios.reduce((sum, value) => sum + value, 0) / ratios.length;
      const error = samples.reduce((sum, sample) => {
        const predicted = scale * fn(sample.size);
        return sum + Math.abs(predicted - sample.ms) / Math.max(sample.ms, 0.01);
      }, 0);

      if (error < bestError) {
        bestError = error;
        bestModel = label;
      }
    });

    return bestModel;
  }

  function estimateSpaceNote(language, code, target) {
    const source = code.toLowerCase();
    const likelyMap = language === "python"
      ? /\bdict\b|{}|\.get\(|set\(/.test(source)
      : /new map|new set|{}|\.has\(|\.set\(|\.push\(/.test(source);
    const likelyCopies = /slice|sorted|sort\(|filter|map\(|reduce|split\(|join\(|append\(|push\(/.test(source);
    const likelyRecursive = language === "python"
      ? /def\s+([a-z_]\w*)[\s\S]*\1\(/.test(source)
      : /function\s+([a-z_]\w*)[\s\S]*\1\(/i.test(source);

    if (likelyRecursive) {
      return `The code appears recursive, so call-stack usage may grow with input depth. Target space was ${target}.`;
    }
    if (likelyMap || likelyCopies) {
      return `The code appears to allocate helper structures, so extra space may be closer to O(n) than O(1). Target space was ${target}.`;
    }
    return `No large helper structure was obvious from the source, so the extra space appears close to the target of ${target}.`;
  }

  function formatChallengeSummary(result) {
    if (!result) {
      return "No submission yet.";
    }
    const lines = [result.summary];
    if (result.cases?.length) {
      result.cases.forEach((testCase, index) => {
        lines.push(
          `Test ${index + 1}: ${testCase.passed ? "PASS" : "FAIL"} | expected ${JSON.stringify(testCase.expected)} | actual ${JSON.stringify(testCase.actual)} | ${testCase.ms.toFixed(2)} ms`
        );
      });
      lines.push(`Total runtime: ${result.totalMs.toFixed(2)} ms`);
    }
    return lines.join("\n");
  }

  function renderLanguageButtons(kind, id, current) {
    return ["python", "javascript"]
      .map(
        (language) => `
          <button class="language-button ${language === current ? "active" : ""}" type="button" data-action="${kind}-language" data-${kind === "sandbox" ? "sandbox" : "challenge"}-id="${escapeHtml(id)}" data-language="${language}">
            ${language}
          </button>
        `
      )
      .join("");
  }

  function formatDuration(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }

  function formatArgs(args) {
    return `args: ${JSON.stringify(args)}`;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function deepEqual(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
  }

  function cloneValue(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function formatValue(value) {
    if (typeof value === "string") {
      return value;
    }
    return JSON.stringify(value);
  }

  async function hashText(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const digest = await window.crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("");
  }

  function userKey(username) {
    return `user:${username}`;
  }

  function pageStateKey(partKey) {
    return `page:${identityKey()}:${partKey}`;
  }

  function identityKey() {
    return state.currentUser?.username || "guest-device";
  }
})();
