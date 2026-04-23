(function () {
  const content = window.PROGRAMMER_MASTERCLASS_CONTENT || window.IBM_PREP_CONTENT;
  const body = document.body;
  const pageId = body.dataset.page;
  const isIdePage = pageId === "ide";
  const page = isIdePage ? null : content?.parts?.[pageId];
  const app = document.getElementById("app");
  const authRoot = document.getElementById("auth-modal-root");
  const authTrigger = document.getElementById("auth-trigger");
  const userPill = document.getElementById("user-pill");
  const globalStatus = document.getElementById("global-status");

  if (!content || !app || (!page && !isIdePage)) {
    return;
  }

  const state = {
    currentUser: null,
    pageState: createDefaultPageState(page),
    workspaceState: createDefaultWorkspaceState(),
    allStats: {},
    activeTopicId: page?.chapters?.[0]?.id || "assessment",
    pagePersistTimer: null,
    workspacePersistTimer: null,
    tickHandle: null,
    topicObserver: null,
    pyodidePromise: null,
    focusTimer: {
      running: false,
      startedAt: 0,
      elapsedMs: 0
    },
    examTimer: {
      running: false,
      startedAt: 0,
      remainingMs: ((page?.examClockMinutes || 60) * 60 * 1000)
    },
    supabase: {
      available: false,
      client: null,
      subscription: null,
      setupMessage: ""
    }
  };
  let layoutSyncFrame = 0;

  const DB = {
    name: "programmer-masterclass-local-store",
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
    }
  };

  init().catch((error) => {
    app.innerHTML = `
      <section class="fallback-card">
        <p class="eyebrow">Portal error</p>
        <h1>Unable to load the studio</h1>
        <p>${escapeHtml(error.message || String(error))}</p>
      </section>
    `;
  });

  async function init() {
    markActiveNav();
    applyBranding();
    await DB.init();
    await initSupabase();
    renderAuthModal();
    bindGlobalEvents();
    await restoreIdentity();
    await loadPageState();
    await loadWorkspaceState();
    await loadOverallStats();
    renderCurrentView();
    startTicking();
  }

  function applyBranding() {
    const brandTitle = document.querySelector(".brand-title");
    const brandKicker = document.querySelector(".brand-kicker");
    if (brandTitle) {
      brandTitle.textContent = content.meta.guideTitle;
    }
    if (brandKicker) {
      brandKicker.textContent = content.meta.brandKicker;
    }
  }

  function markActiveNav() {
    document.querySelectorAll("[data-nav]").forEach((link) => {
      if (link.dataset.nav === pageId) {
        link.classList.add("active");
      }
    });
  }

  async function initSupabase() {
    const config = window.PROGRAMMER_MASTERCLASS_SUPABASE || {};
    if (!window.supabase?.createClient) {
      state.supabase.setupMessage = "Supabase client library not loaded.";
      return;
    }
    if (!config.url || !config.anonKey) {
      state.supabase.setupMessage = "Supabase is not configured yet. Add your project URL and anon key in assets/supabase-config.js.";
      return;
    }

    state.supabase.client = window.supabase.createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    state.supabase.available = true;
    state.supabase.setupMessage = "Supabase cloud sync is configured.";

    const subscription = state.supabase.client.auth.onAuthStateChange((event) => {
      window.setTimeout(async () => {
        await restoreIdentity();
        await loadPageState();
        await loadWorkspaceState();
        await loadOverallStats();
        renderCurrentView();
      }, 0);
    });
    state.supabase.subscription = subscription?.data?.subscription || null;
  }

  async function restoreIdentity() {
    if (state.supabase.available) {
      const { data: sessionData } = await state.supabase.client.auth.getSession();
      if (sessionData?.session?.user) {
        const { data: userData } = await state.supabase.client.auth.getUser();
        const user = userData?.user || sessionData.session.user;
        state.currentUser = {
          authType: "supabase",
          userId: user.id,
          email: user.email,
          displayName: user.user_metadata?.display_name || user.email?.split("@")[0] || "Cloud learner"
        };
        return;
      }
    }

    const username = window.localStorage.getItem("pm-local-session");
    if (username) {
      const user = await DB.get(localUserKey(username));
      if (user) {
        state.currentUser = {
          authType: "local",
          userId: user.username,
          username: user.username,
          displayName: user.displayName
        };
        return;
      }
      window.localStorage.removeItem("pm-local-session");
    }

    state.currentUser = null;
  }

  async function loadPageState() {
    if (isIdePage) {
      state.pageState = createDefaultPageState(null);
      return;
    }

    const localSaved = await DB.get(pageStateKey(pageId));
    let remoteSaved = null;
    if (state.currentUser?.authType === "supabase") {
      remoteSaved = await fetchRemotePageState(pageId);
    }
    state.pageState = hydratePageState(page, remoteSaved || localSaved || createDefaultPageState(page));
    state.examTimer.remainingMs = state.pageState.examTimer.remainingMs;
  }

  async function loadWorkspaceState() {
    const localSaved = await DB.get(workspaceStateKey());
    let remoteSaved = null;
    if (state.currentUser?.authType === "supabase") {
      remoteSaved = await fetchRemoteWorkspaceState();
    }
    state.workspaceState = hydrateWorkspaceState(remoteSaved || localSaved || createDefaultWorkspaceState());
  }

  async function loadOverallStats() {
    if (state.currentUser?.authType === "supabase") {
      const { data, error } = await state.supabase.client
        .from("progress_states")
        .select("page_id, state_json")
        .eq("user_id", state.currentUser.userId);

      if (!error) {
        state.allStats = {};
        Object.values(content.parts).forEach((partItem) => {
          const row = data?.find((entry) => entry.page_id === partItem.id);
          state.allStats[partItem.id] = hydratePageState(partItem, row?.state_json || createDefaultPageState(partItem));
        });
        return;
      }
    }

    const entries = await Promise.all(
      Object.values(content.parts).map(async (partItem) => {
        const saved = await DB.get(pageStateKey(partItem.id));
        return [partItem.id, hydratePageState(partItem, saved || createDefaultPageState(partItem))];
      })
    );
    state.allStats = Object.fromEntries(entries);
  }

  function bindGlobalEvents() {
    authTrigger?.addEventListener("click", () => openAuthModal());
    window.addEventListener("resize", scheduleLayoutSync, { passive: true });

    document.addEventListener("click", async (event) => {
      const trigger = event.target.closest("[data-action]");
      if (!trigger) {
        return;
      }

      const action = trigger.dataset.action;

      if (action === "open-auth") {
        openAuthModal();
        return;
      }

      if (action === "close-auth" || action === "continue-guest") {
        closeAuthModal();
        return;
      }

      if (action === "logout-inline") {
        await logoutCurrentUser();
        return;
      }

      if (action === "complete-chapter") {
        const chapterId = trigger.dataset.chapterId;
        state.pageState.completedChapters[chapterId] = !state.pageState.completedChapters[chapterId];
        await persistPageState();
        rerenderPreservingScroll();
        return;
      }

      if (action === "submit-quiz") {
        await submitQuiz(trigger.dataset.quizId);
        return;
      }

      if (action === "reset-quiz") {
        delete state.pageState.quizzes[trigger.dataset.quizId];
        await persistPageState();
        rerenderPreservingScroll();
        return;
      }

      if (action === "sandbox-language") {
        setInlineLanguage("sandbox", trigger.dataset.sandboxId, trigger.dataset.language);
        rerenderPreservingScroll();
        return;
      }

      if (action === "challenge-language") {
        setInlineLanguage("challenge", trigger.dataset.challengeId, trigger.dataset.language);
        rerenderPreservingScroll();
        return;
      }

      if (action === "run-sandbox") {
        await runSandbox(trigger.dataset.sandboxId);
        return;
      }

      if (action === "reset-sandbox") {
        resetSandbox(trigger.dataset.sandboxId);
        await persistPageState();
        rerenderPreservingScroll();
        return;
      }

      if (action === "run-sample") {
        await runChallenge(trigger.dataset.challengeId, false);
        return;
      }

      if (action === "submit-challenge") {
        await runChallenge(trigger.dataset.challengeId, true);
        return;
      }

      if (action === "reset-challenge") {
        resetChallenge(trigger.dataset.challengeId);
        await persistPageState();
        rerenderPreservingScroll();
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
        await pauseExamTimer();
        return;
      }

      if (action === "timer-exam-reset") {
        await resetExamTimer();
        return;
      }

      if (action === "toggle-split-lab") {
        state.workspaceState.splitMode = !state.workspaceState.splitMode;
        await persistWorkspaceState();
        rerenderPreservingScroll();
        return;
      }

      if (action === "workspace-language") {
        state.workspaceState.activeLanguage = trigger.dataset.language;
        await persistWorkspaceState();
        rerenderPreservingScroll();
        return;
      }

      if (action === "run-workspace") {
        await runWorkspace();
        return;
      }

      if (action === "reset-workspace") {
        resetWorkspaceBuffer();
        await persistWorkspaceState();
        rerenderPreservingScroll();
        return;
      }

      if (action === "clear-workspace-output") {
        clearWorkspaceOutput();
        await persistWorkspaceState();
        rerenderPreservingScroll();
        return;
      }

      if (action === "save-notes") {
        await persistPageState();
        const status = document.getElementById("notes-status");
        if (status) {
          status.textContent = "Notes saved.";
        }
        return;
      }

      if (action === "load-workspace-source") {
        const source = findWorkspaceSource(trigger.dataset.sourceKind, trigger.dataset.sourceId);
        if (source) {
          loadSourceIntoWorkspace(source);
          await persistWorkspaceState();
          rerenderPreservingScroll();
        }
        return;
      }

      if (action === "load-sandbox-draft") {
        const sandbox = findSandboxById(trigger.dataset.sandboxId);
        if (sandbox) {
          loadDraftIntoWorkspace("sandbox", sandbox.id, sandbox.title, sandbox.starterCode);
          await persistWorkspaceState();
          rerenderPreservingScroll();
        }
        return;
      }

      if (action === "load-challenge-draft") {
        const challenge = findChallengeById(trigger.dataset.challengeId);
        if (challenge) {
          loadDraftIntoWorkspace("challenge", challenge.id, challenge.title, challenge.starterCode);
          await persistWorkspaceState();
          rerenderPreservingScroll();
        }
        return;
      }

      if (action === "workspace-preset") {
        loadWorkspacePreset(trigger.dataset.preset);
        await persistWorkspaceState();
        rerenderPreservingScroll();
        return;
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
        queuePagePersist();
        return;
      }

      if (target.matches(".sandbox-editor")) {
        const sandboxId = target.dataset.sandboxId;
        const language = getInlineLanguage("sandbox", sandboxId);
        setInlineDraft("sandbox", sandboxId, language, target.value);
        queuePagePersist();
        return;
      }

      if (target.matches(".challenge-editor")) {
        const challengeId = target.dataset.challengeId;
        const language = getInlineLanguage("challenge", challengeId);
        setInlineDraft("challenge", challengeId, language, target.value);
        queuePagePersist();
        return;
      }

      if (target.matches(".notes-editor")) {
        state.pageState.notes = target.value;
        queuePagePersist();
        return;
      }

      if (target.matches(".workspace-editor")) {
        state.workspaceState.buffers[state.workspaceState.activeLanguage] = target.value;
        queueWorkspacePersist();
        return;
      }

      if (target.matches(".workspace-width-range")) {
        const bounds = getSplitPanelBounds();
        state.workspaceState.panelWidth = clamp(Number(target.value), bounds.min, bounds.max);
        queueWorkspacePersist();
        updateWorkspaceLayout();
      }
    });

    authRoot.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) {
        return;
      }

      if (form.dataset.form === "local-login") {
        const username = form.querySelector("[name='local-login-username']")?.value.trim().toLowerCase();
        const password = form.querySelector("[name='local-login-password']")?.value || "";
        await localLogin(username, password);
        return;
      }

      if (form.dataset.form === "local-register") {
        const displayName = form.querySelector("[name='local-register-display-name']")?.value.trim();
        const username = form.querySelector("[name='local-register-username']")?.value.trim().toLowerCase();
        const password = form.querySelector("[name='local-register-password']")?.value || "";
        await localRegister(displayName, username, password);
        return;
      }

      if (form.dataset.form === "cloud-login") {
        const email = form.querySelector("[name='cloud-login-email']")?.value.trim();
        const password = form.querySelector("[name='cloud-login-password']")?.value || "";
        await cloudLogin(email, password);
        return;
      }

      if (form.dataset.form === "cloud-register") {
        const displayName = form.querySelector("[name='cloud-register-display-name']")?.value.trim();
        const email = form.querySelector("[name='cloud-register-email']")?.value.trim();
        const password = form.querySelector("[name='cloud-register-password']")?.value || "";
        await cloudRegister(displayName, email, password);
      }
    });
  }

  function renderCurrentView() {
    updateHeaderChrome();
    if (isIdePage) {
      renderIdePage();
    } else {
      renderLessonPage();
    }
    updateTimerDisplays();
    scheduleLayoutSync();
  }

  function updateHeaderChrome() {
    const currentFocus = isIdePage
      ? "Full IDE Lab"
      : getActiveTopicLabel();

    if (globalStatus) {
      globalStatus.innerHTML = "";
    }

    authTrigger.textContent = state.currentUser ? "Account" : "Sign In";
    userPill.innerHTML = state.currentUser
      ? `
          <div class="user-pill-copy">
            <strong>${escapeHtml(state.currentUser.displayName)}</strong>
            <span>${escapeHtml(state.currentUser.authType === "supabase" ? "Cloud sync" : "Local profile")}</span>
          </div>
        `
      : `
          <div class="user-pill-copy">
            <strong>Guest</strong>
            <span>${escapeHtml(state.supabase.available ? "Cloud optional" : "Local saves")}</span>
          </div>
        `;

    body.style.setProperty("--workspace-panel-width", `${getEffectiveWorkspacePanelWidth()}px`);
    body.dataset.splitMode = String(Boolean(state.workspaceState.splitMode && !isIdePage));
    document.title = isIdePage
      ? `${content.meta.guideTitle} | IDE Lab`
      : `${content.meta.guideTitle} | ${page.label} ${page.title}`;
    body.dataset.currentFocus = currentFocus;
  }

  function renderLessonPage() {
    const progress = getPageProgress(page, state.pageState);
    const programProgress = getProgramProgress();
    const nextTopic = getNextPendingTopic(page);
    const splitMode = state.workspaceState.splitMode;
    const panelWidth = getEffectiveWorkspacePanelWidth();

    app.innerHTML = `
      ${renderTopDock({
        title: page.title,
        subtitle: page.subtitle,
        progress,
        nextTopic,
        currentFocus: getActiveTopicLabel(),
        splitMode
      })}
      <section class="studio-layout ${splitMode ? "split-mode" : ""}" style="--workspace-panel-width:${panelWidth}px;">
        <aside class="roadmap-rail">
          ${renderRoadmapRail(page, progress, programProgress)}
        </aside>
        <main class="lesson-stage">
          <section class="hero-terminal">
            <div class="hero-terminal-copy">
              <p class="eyebrow">${escapeHtml(page.label)} · guided learning path</p>
              <h1>${escapeHtml(page.title)}</h1>
              <p class="hero-copy">${escapeHtml(page.subtitle)}</p>
              <p class="hero-copy">${escapeHtml(content.meta.promise)}</p>
              <div class="hero-pills">
                <span class="hero-pill">${escapeHtml(page.estimatedTime)}</span>
                <span class="hero-pill">${escapeHtml(page.audience)}</span>
                <span id="hero-current-focus" class="hero-pill">${escapeHtml(`Current focus: ${getActiveTopicLabel()}`)}</span>
              </div>
              <div class="hero-actions">
                <button class="primary-button" type="button" data-action="toggle-split-lab">${splitMode ? "Hide Split Lab" : "Open Split Lab"}</button>
                <a class="ghost-button" href="ide.html">Open Full IDE</a>
                <button class="ghost-button" type="button" data-action="open-auth">Save / Sync Progress</button>
              </div>
            </div>
            <div class="hero-terminal-panels">
              <div class="summary-card">
                <span class="summary-label">Current part progress</span>
                <strong>${progress.percent}%</strong>
                <p>${progress.completedUnits} of ${progress.totalUnits} checkpoints complete.</p>
              </div>
              <div class="summary-card">
                <span class="summary-label">Program progress</span>
                <strong>${programProgress.percent}%</strong>
                <p>${programProgress.completedParts} of 4 parts started.</p>
              </div>
              <div class="summary-card">
                <span class="summary-label">Next recommended step</span>
                <strong>${escapeHtml(nextTopic ? nextTopic.title : "Review completed work")}</strong>
                <p>${escapeHtml(nextTopic ? nextTopic.label : "You have completed the visible roadmap on this part.")}</p>
              </div>
            </div>
          </section>

          <section class="shortcut-strip">
            ${renderTopicShortcuts(page)}
          </section>

          <section class="chapter-stack">
            ${page.chapters.map((chapter, index) => renderChapter(chapter, index)).join("")}
          </section>

          ${renderAssessment(page.assessment)}
          ${renderNotesPanel()}
        </main>
        ${splitMode ? `<aside class="workspace-column">${renderWorkspacePanel({ fullPage: false, sourceCollection: collectSources("current") })}</aside>` : ""}
      </section>
    `;

    setupTopicObserver();
  }

  function renderIdePage() {
    app.innerHTML = `
      ${renderTopDock({
        title: "Full IDE Lab",
        subtitle: "Use this page for free-form experiments, challenge practice, HTML previews, and loading starter code from any lesson.",
        progress: null,
        nextTopic: null,
        currentFocus: "Full IDE workspace",
        splitMode: true,
        ideMode: true
      })}
      <section class="ide-layout">
        <aside class="roadmap-rail">
          <section class="rail-card">
            <p class="eyebrow">Program</p>
            <h2>${escapeHtml(content.meta.guideTitle)}</h2>
            <p>${escapeHtml(content.meta.promise)}</p>
            <div class="part-list">
              ${Object.values(content.parts).map(renderPartRailCard).join("")}
            </div>
          </section>
          <section class="rail-card">
            <p class="eyebrow">Loaders</p>
            <h2>Practice Sources</h2>
            <div class="source-list">
              ${collectSources("all").map((source) => renderSourceButton(source)).join("")}
            </div>
          </section>
        </aside>
        <main class="ide-stage">
          <section class="hero-terminal">
            <div class="hero-terminal-copy">
              <p class="eyebrow">Separate workspace</p>
              <h1>Experiment while you learn</h1>
              <p class="hero-copy">Switch between JavaScript, Python, and HTML. Load starters from any lesson, build your own scratch files, and keep a running terminal-style history.</p>
              <div class="hero-actions">
                <a class="ghost-button" href="index.html">Back to Part 1</a>
                <a class="ghost-button" href="part2.html">Jump to Part 2</a>
                <a class="ghost-button" href="part3.html">Jump to Part 3</a>
              </div>
            </div>
            <div class="hero-terminal-panels">
              <div class="summary-card">
                <span class="summary-label">Workspace source</span>
                <strong>${escapeHtml(state.workspaceState.loadedSource || "Scratchpad")}</strong>
                <p>${escapeHtml(state.currentUser?.authType === "supabase" ? "Cloud-synced workspace" : "Locally saved workspace")}</p>
              </div>
              <div class="summary-card">
                <span class="summary-label">Supported modes</span>
                <strong>JavaScript · Python · HTML</strong>
                <p>Use the language switcher in the lab below.</p>
              </div>
            </div>
          </section>
          ${renderWorkspacePanel({ fullPage: true, sourceCollection: collectSources("all") })}
        </main>
      </section>
    `;
  }

  function renderTopDock({ title, subtitle, progress, nextTopic, currentFocus, ideMode }) {
    return `
      <section class="top-dock">
        <div class="dock-card dock-card-wide">
          <span class="summary-label">Current workspace</span>
          <strong id="dock-current-focus">${escapeHtml(currentFocus)}</strong>
          <p>${escapeHtml(ideMode ? subtitle : `You are in ${page.label}. ${subtitle}`)}</p>
        </div>
        <div class="dock-card">
          <span class="summary-label">Local time</span>
          <strong id="dock-local-clock">${escapeHtml(formatWallClock(new Date()))}</strong>
          <p>Visible while you move through the lesson.</p>
        </div>
        <div class="dock-card">
          <span class="summary-label">Focus timer</span>
          <strong id="dock-focus-clock">${escapeHtml(formatDuration(getFocusElapsedMs()))}</strong>
          <div class="dock-controls">
            <button class="mini-button" type="button" data-action="timer-focus-start">Start</button>
            <button class="mini-button" type="button" data-action="timer-focus-pause">Pause</button>
            <button class="mini-button" type="button" data-action="timer-focus-reset">Reset</button>
          </div>
        </div>
        <div class="dock-card">
          <span class="summary-label">Assessment timer</span>
          <strong id="dock-exam-clock">${escapeHtml(formatDuration(getExamRemainingMs()))}</strong>
          <div class="dock-controls">
            <button class="mini-button" type="button" data-action="timer-exam-start">Start</button>
            <button class="mini-button" type="button" data-action="timer-exam-pause">Pause</button>
            <button class="mini-button" type="button" data-action="timer-exam-reset">Reset</button>
          </div>
        </div>
        <div class="dock-card">
          <span class="summary-label">${escapeHtml(progress ? "Progress" : "Status")}</span>
          <strong>${escapeHtml(progress ? `${progress.completedUnits}/${progress.totalUnits} checkpoints` : state.workspaceState.loadedSource || "Scratchpad")}</strong>
          <p>${escapeHtml(nextTopic ? `Next topic: ${nextTopic.title}` : state.supabase.setupMessage || "Ready to code.")}</p>
        </div>
      </section>
    `;
  }

  function renderRoadmapRail(currentPage, progress, programProgress) {
    return `
      <section class="rail-card">
        <p class="eyebrow">Guide</p>
        <h2>${escapeHtml(content.meta.guideTitle)}</h2>
        <p>${escapeHtml(content.meta.promise)}</p>
        <div class="metric-line">
          <span>Part progress</span>
          <strong>${progress.percent}%</strong>
        </div>
        <div class="metric-line">
          <span>Program progress</span>
          <strong>${programProgress.percent}%</strong>
        </div>
      </section>
      <section class="rail-card">
        <p class="eyebrow">Part shortcuts</p>
        <h2>Roadmap</h2>
        <div class="part-list">
          ${Object.values(content.parts).map(renderPartRailCard).join("")}
          <a class="part-rail-link" href="ide.html">
            <strong>IDE Lab</strong>
            <span>Full-screen coding workspace</span>
          </a>
        </div>
      </section>
      <section class="rail-card">
        <p class="eyebrow">Topics</p>
        <h2>This part</h2>
        <div class="topic-list">
          ${currentPage.chapters.map((chapter, index) => renderTopicRailItem(chapter, index)).join("")}
          <a class="topic-link ${state.activeTopicId === "assessment" ? "active" : ""}" href="#assessment">
            <span class="topic-index">A</span>
            <span class="topic-copy">
              <strong>${escapeHtml(currentPage.assessment.title)}</strong>
              <small>Assessment zone</small>
            </span>
          </a>
          <a class="topic-link" href="#notes">
            <span class="topic-index">N</span>
            <span class="topic-copy">
              <strong>Notes</strong>
              <small>Personal study area</small>
            </span>
          </a>
        </div>
      </section>
    `;
  }

  function renderPartRailCard(partItem) {
    const stats = state.allStats[partItem.id] ? getPageProgress(partItem, state.allStats[partItem.id]) : { percent: 0 };
    return `
      <a class="part-rail-link ${partItem.id === pageId ? "active" : ""}" href="${getPartHref(partItem.id)}">
        <strong>${escapeHtml(partItem.label)}</strong>
        <span>${escapeHtml(partItem.title)}</span>
        <small>${stats.percent}% complete</small>
      </a>
    `;
  }

  function renderTopicRailItem(chapter, index) {
    const chapterComplete = Boolean(state.pageState.completedChapters[chapter.id]);
    const chapterStatus = getChapterStatus(chapter);
    return `
      <a class="topic-link ${state.activeTopicId === chapter.id ? "active" : ""} ${chapterComplete ? "done" : ""}" href="#${escapeHtml(chapter.id)}">
        <span class="topic-index">${index + 1}</span>
        <span class="topic-copy">
          <strong>${escapeHtml(chapter.title)}</strong>
          <small>${escapeHtml(chapterStatus)}</small>
        </span>
      </a>
    `;
  }

  function renderTopicShortcuts(currentPage) {
    return currentPage.chapters
      .map((chapter, index) => `
        <a class="shortcut-button ${state.activeTopicId === chapter.id ? "active" : ""}" href="#${escapeHtml(chapter.id)}">
          ${escapeHtml(`Topic ${index + 1}: ${chapter.title}`)}
        </a>
      `)
      .join("");
  }

  function renderChapter(chapter, index) {
    const chapterDone = Boolean(state.pageState.completedChapters[chapter.id]);
    return `
      <article id="${escapeHtml(chapter.id)}" class="chapter-card" data-topic-id="${escapeHtml(chapter.id)}">
        <div class="chapter-header">
          <div>
            <p class="eyebrow">${escapeHtml(`${page.label} · Topic ${index + 1} · ${chapter.duration}`)}</p>
            <h2>${escapeHtml(chapter.title)}</h2>
            <p class="chapter-copy">${escapeHtml(chapter.outcome)}</p>
            <p class="chapter-gate">${escapeHtml(`Knowledge gate: ${chapter.unlock}`)}</p>
          </div>
          <button class="chapter-toggle ${chapterDone ? "done" : ""}" type="button" data-action="complete-chapter" data-chapter-id="${escapeHtml(chapter.id)}">
            ${chapterDone ? "Completed" : "Mark topic complete"}
          </button>
        </div>
        <div class="chapter-body">
          ${chapter.sections.map(renderSection).join("")}
          ${chapter.sandbox ? renderSandbox(chapter.sandbox) : ""}
          ${chapter.quiz ? renderQuiz(chapter.quiz) : ""}
          ${chapter.challenge ? renderChallenge(chapter.challenge) : ""}
        </div>
      </article>
    `;
  }

  function renderSection(section) {
    return `
      <section class="reading-card">
        <h3>${escapeHtml(section.heading)}</h3>
        ${section.paragraphs ? section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("") : ""}
        ${section.bullets ? `<ul class="reading-list">${section.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}</ul>` : ""}
        ${section.codeExamples ? `<div class="example-grid">${section.codeExamples.map(renderCodeExample).join("")}</div>` : ""}
        ${section.tip ? `<div class="study-tip"><strong>Study tip</strong><p>${escapeHtml(section.tip)}</p></div>` : ""}
      </section>
    `;
  }

  function renderCodeExample(example) {
    return `
      <article class="code-showcase">
        <div class="code-showcase-header">
          <strong>${escapeHtml(example.title)}</strong>
          <span class="language-badge">${escapeHtml(example.language)}</span>
        </div>
        <pre><code>${escapeHtml(example.code)}</code></pre>
      </article>
    `;
  }

  function renderSandbox(sandbox) {
    const language = getInlineLanguage("sandbox", sandbox.id);
    const code = getInlineDraft("sandbox", sandbox.id, language, sandbox.starterCode[language]);
    const result = state.pageState.sandboxes[sandbox.id];

    return `
      <section class="interactive-card">
        <div class="card-header">
          <div>
            <p class="eyebrow">Practice sandbox</p>
            <h3>${escapeHtml(sandbox.title)}</h3>
            <p>${escapeHtml(sandbox.description)}</p>
          </div>
          <div class="inline-actions">
            ${renderInlineLanguageButtons("sandbox", sandbox.id, language)}
            <button class="ghost-button" type="button" data-action="load-sandbox-draft" data-sandbox-id="${escapeHtml(sandbox.id)}">Load In Lab</button>
          </div>
        </div>
        <textarea class="editor sandbox-editor" data-sandbox-id="${escapeHtml(sandbox.id)}" spellcheck="false">${escapeHtml(code)}</textarea>
        <div class="card-actions">
          <button class="secondary-button" type="button" data-action="run-sandbox" data-sandbox-id="${escapeHtml(sandbox.id)}">Run Here</button>
          <button class="ghost-button" type="button" data-action="reset-sandbox" data-sandbox-id="${escapeHtml(sandbox.id)}">Reset Starter</button>
        </div>
        <div class="terminal-panel">
          <span class="summary-label">Output</span>
          <pre>${escapeHtml(result?.output || "Run the sandbox or load it into the split lab.")}</pre>
          <small>${result?.runtimeMs != null ? `${result.runtimeMs.toFixed(2)} ms` : "Not run yet"}</small>
        </div>
      </section>
    `;
  }

  function renderQuiz(quiz) {
    const saved = state.pageState.quizzes[quiz.id];
    const draft = state.pageState.quizDrafts[quiz.id] || {};
    return `
      <section class="interactive-card">
        <div class="card-header">
          <div>
            <p class="eyebrow">Checkpoint</p>
            <h3>${escapeHtml(quiz.title)}</h3>
            <p>Answers stay hidden until submission. Scores now reflect the real answer count instead of a placeholder score.</p>
          </div>
          <div class="score-bubble">${saved ? `${saved.correct}/${saved.total} · ${saved.percentage}%` : "Unsubmitted"}</div>
        </div>
        <div class="question-stack">
          ${quiz.questions.map((question, questionIndex) => {
            const submittedChoice = saved?.answers?.[questionIndex];
            const chosen = submittedChoice != null ? submittedChoice : draft[questionIndex];
            return `
              <article class="question-card">
                <h4>${escapeHtml(`${questionIndex + 1}. ${question.prompt}`)}</h4>
                <div class="choice-stack">
                  ${question.choices.map((choice, choiceIndex) => {
                    const checked = chosen === choiceIndex ? "checked" : "";
                    const revealClass = saved
                      ? choiceIndex === question.answer
                        ? "correct"
                        : submittedChoice === choiceIndex
                          ? "incorrect"
                          : ""
                      : "";
                    return `
                      <label class="choice-row ${revealClass}">
                        <input class="quiz-choice-input" type="radio" name="${quiz.id}-${questionIndex}" data-quiz-id="${escapeHtml(quiz.id)}" data-question-index="${questionIndex}" value="${choiceIndex}" ${checked}>
                        <span>${escapeHtml(choice)}</span>
                      </label>
                    `;
                  }).join("")}
                </div>
                ${saved ? `<p class="feedback-copy">${escapeHtml(question.explanation)}</p>` : ""}
              </article>
            `;
          }).join("")}
        </div>
        <div class="card-actions">
          <button class="primary-button" type="button" data-action="submit-quiz" data-quiz-id="${escapeHtml(quiz.id)}">Submit Checkpoint</button>
          <button class="ghost-button" type="button" data-action="reset-quiz" data-quiz-id="${escapeHtml(quiz.id)}">Reset</button>
        </div>
      </section>
    `;
  }

  function renderChallenge(challenge) {
    const language = getInlineLanguage("challenge", challenge.id);
    const code = getInlineDraft("challenge", challenge.id, language, challenge.starterCode[language]);
    const result = state.pageState.challenges[challenge.id]?.result;

    return `
      <section class="interactive-card challenge-card">
        <div class="card-header">
          <div>
            <p class="eyebrow">${escapeHtml(challenge.difficulty)} challenge</p>
            <h3>${escapeHtml(challenge.title)}</h3>
            <p>${escapeHtml(challenge.description)}</p>
          </div>
          <div class="inline-actions">
            ${renderInlineLanguageButtons("challenge", challenge.id, language)}
            <button class="ghost-button" type="button" data-action="load-challenge-draft" data-challenge-id="${escapeHtml(challenge.id)}">Load In Lab</button>
          </div>
        </div>
        <ul class="reading-list compact-list">
          ${challenge.instructions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
        <div class="challenge-meta">
          <div>
            <span class="summary-label">Visible sample tests</span>
            <ul class="reading-list compact-list">
              ${challenge.sampleTests.map((test) => `<li>${escapeHtml(formatArgs(test.args))} -> ${escapeHtml(JSON.stringify(test.expected))}</li>`).join("")}
            </ul>
          </div>
          <div>
            <span class="summary-label">Target complexity</span>
            <p>${escapeHtml(`${challenge.complexity.time} time · ${challenge.complexity.space} extra space`)}</p>
            <p class="small-copy">Reference solutions stay hidden until you submit.</p>
          </div>
        </div>
        <textarea class="editor challenge-editor" data-challenge-id="${escapeHtml(challenge.id)}" spellcheck="false">${escapeHtml(code)}</textarea>
        <div class="card-actions">
          <button class="secondary-button" type="button" data-action="run-sample" data-challenge-id="${escapeHtml(challenge.id)}">Run Sample Tests</button>
          <button class="primary-button" type="button" data-action="submit-challenge" data-challenge-id="${escapeHtml(challenge.id)}">Submit Hidden Tests</button>
          <button class="ghost-button" type="button" data-action="reset-challenge" data-challenge-id="${escapeHtml(challenge.id)}">Reset Starter</button>
        </div>
        <div class="challenge-results">
          <div class="terminal-panel">
            <span class="summary-label">Latest result</span>
            <pre>${escapeHtml(formatChallengeSummary(result))}</pre>
          </div>
          <div class="terminal-panel">
            <span class="summary-label">Efficiency review</span>
            <p>${escapeHtml(result?.efficiency?.time || "Submit hidden tests to estimate runtime shape.")}</p>
            <p>${escapeHtml(result?.efficiency?.space || "Space notes appear after hidden-test submission.")}</p>
          </div>
        </div>
        ${result?.submitted ? `
          <div class="post-submit-panel">
            <h4>After-submit explanation</h4>
            ${challenge.explanation.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
            <div class="example-grid">
              <article class="code-showcase">
                <div class="code-showcase-header"><strong>Python reference</strong><span class="language-badge">python</span></div>
                <pre><code>${escapeHtml(challenge.solution.python)}</code></pre>
              </article>
              <article class="code-showcase">
                <div class="code-showcase-header"><strong>JavaScript reference</strong><span class="language-badge">javascript</span></div>
                <pre><code>${escapeHtml(challenge.solution.javascript)}</code></pre>
              </article>
            </div>
          </div>
        ` : ""}
      </section>
    `;
  }

  function renderAssessment(assessment) {
    if (!assessment) {
      return "";
    }
    return `
      <section id="assessment" class="assessment-shell" data-topic-id="assessment">
        <div class="card-header">
          <div>
            <p class="eyebrow">Assessment zone</p>
            <h2>${escapeHtml(assessment.title)}</h2>
            <p>${escapeHtml(assessment.description)}</p>
          </div>
          <div class="score-bubble">${escapeHtml(assessment.timerLabel || "Timed practice")}</div>
        </div>
        ${assessment.questions?.length ? renderQuiz({
          id: assessment.id,
          title: "Assessment multiple-choice section",
          questions: assessment.questions
        }) : `<div class="reading-card"><p>This assessment is coding-first. Load the problems into the lab or use the inline editor below.</p></div>`}
        ${(assessment.codingChallenges || []).map(renderChallenge).join("")}
      </section>
    `;
  }

  function renderNotesPanel() {
    if (isIdePage) {
      return "";
    }
    return `
      <section id="notes" class="notes-shell">
        <div class="card-header">
          <div>
            <p class="eyebrow">Notes</p>
            <h2>Personal study notes</h2>
            <p>Summarize ideas in your own words, capture debugging rules, and keep a running study log.</p>
          </div>
        </div>
        <textarea class="notes-editor" spellcheck="true">${escapeHtml(state.pageState.notes || "")}</textarea>
        <div class="card-actions">
          <button class="secondary-button" type="button" data-action="save-notes">Save Notes</button>
          <span id="notes-status" class="small-copy"></span>
        </div>
      </section>
    `;
  }

  function renderWorkspacePanel({ fullPage, sourceCollection }) {
    const language = state.workspaceState.activeLanguage;
    const buffer = state.workspaceState.buffers[language] || "";
    const output = state.workspaceState.outputs[language] || "No output yet.";
    const previewHtml = language === "html" ? state.workspaceState.previewHtml : state.workspaceState.previewHtml;
    const splitBounds = getSplitPanelBounds();
    const panelWidth = getEffectiveWorkspacePanelWidth();

    return `
      <section class="workspace-panel ${fullPage ? "full-page" : ""}">
        <div class="workspace-header">
          <div>
            <p class="eyebrow">Programmer Lab</p>
            <h2>${escapeHtml(fullPage ? "Full IDE Workspace" : "Split Learning + Coding Workspace")}</h2>
            <p>${escapeHtml(state.workspaceState.loadedSource || "Scratchpad active")}</p>
          </div>
          <div class="inline-actions">
            ${renderWorkspaceLanguageButtons(language)}
            ${!fullPage ? `<button class="ghost-button" type="button" data-action="toggle-split-lab">Close Split Lab</button>` : `<a class="ghost-button" href="index.html">Back to Lessons</a>`}
          </div>
        </div>
        <div class="workspace-controls">
          <div class="workspace-control-group">
            <button class="secondary-button" type="button" data-action="run-workspace">Run Code</button>
            <button class="ghost-button" type="button" data-action="reset-workspace">Reset Buffer</button>
            <button class="ghost-button" type="button" data-action="clear-workspace-output">Clear Output</button>
          </div>
          <div class="workspace-control-group">
            ${!fullPage ? `
              <label class="slider-label">
                <span>Split width</span>
                <input class="workspace-width-range" type="range" min="${splitBounds.min}" max="${splitBounds.max}" step="10" value="${panelWidth}">
              </label>
            ` : ""}
            <button class="ghost-button" type="button" data-action="workspace-preset" data-preset="javascript">JS Starter</button>
            <button class="ghost-button" type="button" data-action="workspace-preset" data-preset="python">Python Starter</button>
            <button class="ghost-button" type="button" data-action="workspace-preset" data-preset="html">HTML Preview</button>
          </div>
        </div>
        <div class="workspace-grid">
          <div class="workspace-editor-pane">
            <textarea class="workspace-editor" spellcheck="false">${escapeHtml(buffer)}</textarea>
          </div>
          <div class="workspace-output-pane">
            <div class="terminal-panel tall">
              <span class="summary-label">Terminal Output</span>
              <pre>${escapeHtml(output)}</pre>
            </div>
            <div class="terminal-panel tall">
              <span class="summary-label">${language === "html" ? "Live Preview" : "Run History"}</span>
              ${language === "html"
                ? `<iframe class="preview-frame" sandbox="allow-scripts" srcdoc="${escapeHtml(previewHtml || "")}"></iframe>`
                : `<div class="history-stack">${renderHistory()}</div>`}
            </div>
          </div>
        </div>
        <div class="workspace-sources">
          <div class="source-panel">
            <span class="summary-label">Load lesson starters</span>
            <div class="source-list">
              ${sourceCollection.map(renderSourceButton).join("")}
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderHistory() {
    if (!state.workspaceState.history.length) {
      return `<p class="small-copy">Run code to build a terminal-style history.</p>`;
    }
    return state.workspaceState.history
      .map((entry) => `
        <article class="history-entry">
          <strong>${escapeHtml(`${entry.language} · ${entry.runtimeMs.toFixed(2)} ms`)}</strong>
          <small>${escapeHtml(entry.timestamp)}</small>
          <pre>${escapeHtml(entry.output)}</pre>
        </article>
      `)
      .join("");
  }

  function renderSourceButton(source) {
    return `
      <button class="source-button" type="button" data-action="load-workspace-source" data-source-kind="${escapeHtml(source.kind)}" data-source-id="${escapeHtml(source.id)}">
        <strong>${escapeHtml(source.title)}</strong>
        <span>${escapeHtml(source.location)}</span>
      </button>
    `;
  }

  function renderInlineLanguageButtons(kind, id, currentLanguage) {
    return ["python", "javascript"].map((language) => `
      <button class="language-chip ${language === currentLanguage ? "active" : ""}" type="button" data-action="${kind}-language" data-${kind}-id="${escapeHtml(id)}" data-language="${language}">
        ${language}
      </button>
    `).join("");
  }

  function renderWorkspaceLanguageButtons(currentLanguage) {
    return ["javascript", "python", "html"].map((language) => `
      <button class="language-chip ${language === currentLanguage ? "active" : ""}" type="button" data-action="workspace-language" data-language="${language}">
        ${language}
      </button>
    `).join("");
  }

  function renderAuthModal() {
    authRoot.innerHTML = `
      <div id="auth-modal" class="modal-shell hidden" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <div class="modal-card">
          <button class="icon-button" type="button" data-action="close-auth" aria-label="Close">×</button>
          <p class="eyebrow">Account, sync, and progress</p>
          <h2 id="auth-title">Save progress locally or sync it with Supabase</h2>
          <p class="modal-copy">${escapeHtml(content.meta.storageNote)}</p>
          <div class="auth-grid">
            <section class="auth-panel">
              <h3>Guest mode</h3>
              <p>Anyone can use the full curriculum without logging in. Guest work is stored in this browser.</p>
              <button class="ghost-button" type="button" data-action="continue-guest">Continue as Guest</button>
            </section>
            <form class="auth-panel" data-form="cloud-login">
              <h3>Supabase sign in</h3>
              <p>${escapeHtml(state.supabase.available ? "Use email and password for cross-device sync." : state.supabase.setupMessage)}</p>
              <label><span>Email</span><input type="email" name="cloud-login-email" ${state.supabase.available ? "" : "disabled"}></label>
              <label><span>Password</span><input type="password" name="cloud-login-password" ${state.supabase.available ? "" : "disabled"}></label>
              <button class="primary-button" type="submit" ${state.supabase.available ? "" : "disabled"}>Sign In</button>
            </form>
            <form class="auth-panel" data-form="cloud-register">
              <h3>Supabase sign up</h3>
              <label><span>Display name</span><input type="text" name="cloud-register-display-name" ${state.supabase.available ? "" : "disabled"}></label>
              <label><span>Email</span><input type="email" name="cloud-register-email" ${state.supabase.available ? "" : "disabled"}></label>
              <label><span>Password</span><input type="password" name="cloud-register-password" ${state.supabase.available ? "" : "disabled"}></label>
              <button class="secondary-button" type="submit" ${state.supabase.available ? "" : "disabled"}>Create Cloud Account</button>
            </form>
            <form class="auth-panel" data-form="local-login">
              <h3>Local profile sign in</h3>
              <p>Use this if you want named progress without setting up Supabase yet.</p>
              <label><span>Username</span><input type="text" name="local-login-username"></label>
              <label><span>Password</span><input type="password" name="local-login-password"></label>
              <button class="primary-button" type="submit">Sign In Locally</button>
            </form>
            <form class="auth-panel" data-form="local-register">
              <h3>Local profile sign up</h3>
              <label><span>Display name</span><input type="text" name="local-register-display-name"></label>
              <label><span>Username</span><input type="text" name="local-register-username"></label>
              <label><span>Password</span><input type="password" name="local-register-password"></label>
              <button class="secondary-button" type="submit">Create Local Profile</button>
            </form>
          </div>
          <p id="auth-message" class="auth-message"></p>
        </div>
      </div>
    `;
  }

  function openAuthModal() {
    document.getElementById("auth-modal")?.classList.remove("hidden");
  }

  function closeAuthModal() {
    document.getElementById("auth-modal")?.classList.add("hidden");
  }

  async function localRegister(displayName, username, password) {
    const message = document.getElementById("auth-message");
    if (!displayName || !username || !password) {
      message.textContent = "Fill in display name, username, and password.";
      return;
    }
    if (password.length < 6) {
      message.textContent = "Use at least 6 characters.";
      return;
    }
    const existing = await DB.get(localUserKey(username));
    if (existing) {
      message.textContent = "That local username already exists.";
      return;
    }
    const passwordHash = await hashText(password);
    await DB.put(localUserKey(username), {
      username,
      displayName,
      passwordHash,
      createdAt: new Date().toISOString()
    });
    window.localStorage.setItem("pm-local-session", username);
    await restoreIdentity();
    await loadPageState();
    await loadWorkspaceState();
    await loadOverallStats();
    closeAuthModal();
    renderCurrentView();
  }

  async function localLogin(username, password) {
    const message = document.getElementById("auth-message");
    if (!username || !password) {
      message.textContent = "Enter your local username and password.";
      return;
    }
    const user = await DB.get(localUserKey(username));
    if (!user) {
      message.textContent = "No local profile found.";
      return;
    }
    const passwordHash = await hashText(password);
    if (passwordHash !== user.passwordHash) {
      message.textContent = "Incorrect password.";
      return;
    }
    window.localStorage.setItem("pm-local-session", username);
    await restoreIdentity();
    await loadPageState();
    await loadWorkspaceState();
    await loadOverallStats();
    closeAuthModal();
    renderCurrentView();
  }

  async function cloudRegister(displayName, email, password) {
    const message = document.getElementById("auth-message");
    if (!state.supabase.available) {
      message.textContent = state.supabase.setupMessage;
      return;
    }
    if (!displayName || !email || !password) {
      message.textContent = "Fill in display name, email, and password.";
      return;
    }
    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    const { data, error } = await state.supabase.client.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName
        },
        emailRedirectTo: redirectTo
      }
    });
    if (error) {
      message.textContent = error.message;
      return;
    }
    if (data?.user) {
      await upsertSupabaseProfile(data.user.id, displayName, email);
    }
    message.textContent = "Cloud account created. If email confirmation is enabled in Supabase, confirm your email before signing in.";
  }

  async function cloudLogin(email, password) {
    const message = document.getElementById("auth-message");
    if (!state.supabase.available) {
      message.textContent = state.supabase.setupMessage;
      return;
    }
    const { error } = await state.supabase.client.auth.signInWithPassword({
      email,
      password
    });
    if (error) {
      message.textContent = error.message;
      return;
    }
    await restoreIdentity();
    await loadPageState();
    await loadWorkspaceState();
    await loadOverallStats();
    closeAuthModal();
    renderCurrentView();
  }

  async function logoutCurrentUser() {
    if (state.currentUser?.authType === "supabase" && state.supabase.available) {
      await state.supabase.client.auth.signOut();
    }
    if (state.currentUser?.authType === "local") {
      window.localStorage.removeItem("pm-local-session");
    }
    state.currentUser = null;
    await loadPageState();
    await loadWorkspaceState();
    await loadOverallStats();
    renderCurrentView();
  }

  async function fetchRemotePageState(partKey) {
    const { data, error } = await state.supabase.client
      .from("progress_states")
      .select("state_json")
      .eq("user_id", state.currentUser.userId)
      .eq("page_id", partKey)
      .maybeSingle();

    if (error) {
      return null;
    }
    return data?.state_json || null;
  }

  async function fetchRemoteWorkspaceState() {
    const { data, error } = await state.supabase.client
      .from("workspace_states")
      .select("state_json")
      .eq("user_id", state.currentUser.userId)
      .eq("workspace_key", "global")
      .maybeSingle();

    if (error) {
      return null;
    }
    return data?.state_json || null;
  }

  async function upsertSupabaseProfile(userId, displayName, email) {
    if (!state.supabase.available) {
      return;
    }
    await state.supabase.client.from("profiles").upsert({
      user_id: userId,
      display_name: displayName,
      email,
      updated_at: new Date().toISOString()
    });
  }

  function createDefaultPageState(pageDefinition) {
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
        remainingMs: ((pageDefinition?.examClockMinutes || 60) * 60 * 1000)
      }
    };
  }

  function createDefaultWorkspaceState() {
    return {
      activeLanguage: "javascript",
      splitMode: !isIdePage,
      panelWidth: 460,
      loadedSource: "Scratchpad starter",
      buffers: {
        javascript: "function greet(name) {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet(\"Programmer\"));",
        python: "def greet(name):\n    return f\"Hello, {name}!\"\n\nprint(greet(\"Programmer\"))",
        html: "<!DOCTYPE html>\n<html>\n  <head>\n    <style>\n      body { font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; padding: 24px; }\n      .card { border: 1px solid #334155; border-radius: 16px; padding: 24px; background: #111827; max-width: 520px; }\n      h1 { margin-top: 0; }\n      button { background: #14b8a6; color: #062321; border: none; padding: 10px 14px; border-radius: 999px; font-weight: bold; }\n    </style>\n  </head>\n  <body>\n    <div class=\"card\">\n      <h1>Programmer Masterclass Lab</h1>\n      <p>Edit this HTML, CSS, or JavaScript and click Run Code to preview it.</p>\n      <button onclick=\"document.querySelector('p').textContent='Preview updated successfully.'\">Click me</button>\n    </div>\n  </body>\n</html>"
      },
      outputs: {
        javascript: "No output yet.",
        python: "No output yet.",
        html: "Preview will render here after you run HTML."
      },
      previewHtml: "",
      history: []
    };
  }

  function hydratePageState(pageDefinition, candidate) {
    const base = createDefaultPageState(pageDefinition);
    return {
      ...base,
      ...candidate,
      completedChapters: { ...base.completedChapters, ...(candidate?.completedChapters || {}) },
      quizDrafts: { ...base.quizDrafts, ...(candidate?.quizDrafts || {}) },
      quizzes: { ...base.quizzes, ...(candidate?.quizzes || {}) },
      languageChoices: { ...base.languageChoices, ...(candidate?.languageChoices || {}) },
      drafts: {
        sandbox: { ...(base.drafts.sandbox || {}), ...(candidate?.drafts?.sandbox || {}) },
        challenge: { ...(base.drafts.challenge || {}), ...(candidate?.drafts?.challenge || {}) }
      },
      sandboxes: { ...base.sandboxes, ...(candidate?.sandboxes || {}) },
      challenges: { ...base.challenges, ...(candidate?.challenges || {}) },
      examTimer: {
        remainingMs: typeof candidate?.examTimer?.remainingMs === "number"
          ? candidate.examTimer.remainingMs
          : base.examTimer.remainingMs
      }
    };
  }

  function hydrateWorkspaceState(candidate) {
    const base = createDefaultWorkspaceState();
    return {
      ...base,
      ...candidate,
      buffers: { ...base.buffers, ...(candidate?.buffers || {}) },
      outputs: { ...base.outputs, ...(candidate?.outputs || {}) },
      history: Array.isArray(candidate?.history) ? candidate.history.slice(0, 14) : base.history
    };
  }

  function queuePagePersist() {
    window.clearTimeout(state.pagePersistTimer);
    state.pagePersistTimer = window.setTimeout(() => {
      persistPageState();
    }, 600);
  }

  function queueWorkspacePersist() {
    window.clearTimeout(state.workspacePersistTimer);
    state.workspacePersistTimer = window.setTimeout(() => {
      persistWorkspaceState();
    }, 600);
  }

  async function persistPageState() {
    if (isIdePage) {
      return;
    }
    state.pageState.examTimer = {
      remainingMs: Math.max(0, getExamRemainingMs())
    };
    await DB.put(pageStateKey(pageId), state.pageState);
    if (state.currentUser?.authType === "supabase") {
      await state.supabase.client.from("progress_states").upsert({
        user_id: state.currentUser.userId,
        page_id: pageId,
        state_json: state.pageState,
        updated_at: new Date().toISOString()
      });
    }
    state.allStats[pageId] = hydratePageState(page, state.pageState);
  }

  async function persistWorkspaceState() {
    await DB.put(workspaceStateKey(), state.workspaceState);
    if (state.currentUser?.authType === "supabase") {
      await state.supabase.client.from("workspace_states").upsert({
        user_id: state.currentUser.userId,
        workspace_key: "global",
        state_json: state.workspaceState,
        updated_at: new Date().toISOString()
      });
    }
  }

  function rerenderPreservingScroll() {
    const scrollY = window.scrollY;
    renderCurrentView();
    window.scrollTo({ top: scrollY });
  }

  function setupTopicObserver() {
    if (state.topicObserver) {
      state.topicObserver.disconnect();
    }
    const targets = Array.from(document.querySelectorAll("[data-topic-id]"));
    if (!targets.length) {
      return;
    }

    state.topicObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top);

      if (visible.length) {
        state.activeTopicId = visible[0].target.dataset.topicId;
        updateActiveTopicUI();
      }
    }, {
      rootMargin: "-120px 0px -55% 0px",
      threshold: [0.2, 0.5, 0.8]
    });

    targets.forEach((target) => state.topicObserver.observe(target));
  }

  function updateActiveTopicUI() {
    document.querySelectorAll(".topic-link").forEach((link) => {
      const href = link.getAttribute("href") || "";
      const isActive = href === `#${state.activeTopicId}`;
      link.classList.toggle("active", isActive);
    });
    const currentFocus = getActiveTopicLabel();
    const dock = document.getElementById("dock-current-focus");
    const hero = document.getElementById("hero-current-focus");
    if (dock) {
      dock.textContent = currentFocus;
    }
    if (hero) {
      hero.textContent = `Current focus: ${currentFocus}`;
    }
  }

  function setInlineLanguage(kind, id, language) {
    state.pageState.languageChoices[`${kind}:${id}`] = language;
  }

  function getInlineLanguage(kind, id) {
    return state.pageState.languageChoices[`${kind}:${id}`] || "python";
  }

  function setInlineDraft(kind, id, language, value) {
    state.pageState.drafts[kind][id] = state.pageState.drafts[kind][id] || {};
    state.pageState.drafts[kind][id][language] = value;
  }

  function getInlineDraft(kind, id, language, starter) {
    const scoped = state.pageState.drafts[kind][id];
    if (scoped && typeof scoped[language] === "string") {
      return scoped[language];
    }
    setInlineDraft(kind, id, language, starter);
    return starter;
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

    state.pageState.quizzes[quizId] = {
      answers,
      correct,
      total: quiz.questions.length,
      percentage: Math.round((correct / quiz.questions.length) * 100),
      submittedAt: new Date().toISOString()
    };

    await persistPageState();
    rerenderPreservingScroll();
  }

  async function runSandbox(sandboxId) {
    const sandbox = findSandboxById(sandboxId);
    if (!sandbox) {
      return;
    }

    const language = getInlineLanguage("sandbox", sandboxId);
    const code = getInlineDraft("sandbox", sandboxId, language, sandbox.starterCode[language]);
    const result = language === "python"
      ? await executePythonPlayground(code)
      : await executeJavascriptPlayground(code);

    state.pageState.sandboxes[sandboxId] = result;
    await persistPageState();
    rerenderPreservingScroll();
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

    const language = getInlineLanguage("challenge", challengeId);
    const code = getInlineDraft("challenge", challengeId, language, challenge.starterCode[language]);
    const tests = submitted ? challenge.hiddenTests : challenge.sampleTests;

    let execution;
    try {
      execution = language === "python"
        ? await executePythonChallenge(challenge, code, tests)
        : await executeJavascriptChallenge(challenge, code, tests);
    } catch (error) {
      execution = {
        ok: false,
        totalMs: 0,
        cases: [],
        summary: `Execution error: ${error.message || String(error)}`
      };
    }

    const existing = state.pageState.challenges[challengeId] || {};
    existing.result = {
      submitted,
      ok: execution.ok,
      totalMs: execution.totalMs,
      cases: execution.cases,
      summary: execution.summary
    };

    if (submitted) {
      existing.result.efficiency = await estimateEfficiency(challenge, language, code);
      existing.submittedAt = new Date().toISOString();
    }

    state.pageState.challenges[challengeId] = existing;
    await persistPageState();
    rerenderPreservingScroll();
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

  async function runWorkspace() {
    const language = state.workspaceState.activeLanguage;
    const code = state.workspaceState.buffers[language];
    let result;

    if (language === "python") {
      result = await executePythonPlayground(code);
    } else if (language === "javascript") {
      result = await executeJavascriptPlayground(code);
    } else {
      result = executeHtmlPreview(code);
    }

    state.workspaceState.outputs[language] = result.output;
    if (language === "html") {
      state.workspaceState.previewHtml = code;
    }
    prependWorkspaceHistory(language, result.output, result.runtimeMs || 0);
    await persistWorkspaceState();
    rerenderPreservingScroll();
  }

  function loadWorkspacePreset(preset) {
    const defaults = createDefaultWorkspaceState();
    if (preset === "javascript" || preset === "python" || preset === "html") {
      state.workspaceState.activeLanguage = preset;
      state.workspaceState.buffers[preset] = defaults.buffers[preset];
      state.workspaceState.loadedSource = `${preset} starter preset`;
      if (preset === "html") {
        state.workspaceState.previewHtml = defaults.buffers.html;
      }
    }
  }

  function resetWorkspaceBuffer() {
    const language = state.workspaceState.activeLanguage;
    const defaults = createDefaultWorkspaceState();
    state.workspaceState.buffers[language] = defaults.buffers[language];
    if (language === "html") {
      state.workspaceState.previewHtml = defaults.buffers.html;
    }
  }

  function clearWorkspaceOutput() {
    const language = state.workspaceState.activeLanguage;
    state.workspaceState.outputs[language] = "No output yet.";
    if (language === "html") {
      state.workspaceState.previewHtml = "";
    }
  }

  function prependWorkspaceHistory(language, output, runtimeMs) {
    state.workspaceState.history.unshift({
      language,
      output,
      runtimeMs,
      timestamp: new Date().toLocaleString()
    });
    state.workspaceState.history = state.workspaceState.history.slice(0, 12);
  }

  function loadSourceIntoWorkspace(source) {
    if (!source?.starterCode) {
      return;
    }
    if (source.starterCode.python) {
      state.workspaceState.buffers.python = source.starterCode.python;
    }
    if (source.starterCode.javascript) {
      state.workspaceState.buffers.javascript = source.starterCode.javascript;
    }
    state.workspaceState.activeLanguage = source.starterCode.python ? "python" : "javascript";
    state.workspaceState.loadedSource = source.location;
    state.workspaceState.splitMode = true;
  }

  function loadDraftIntoWorkspace(kind, id, title, starterCode) {
    const python = getInlineDraft(kind, id, "python", starterCode.python || "");
    const javascript = getInlineDraft(kind, id, "javascript", starterCode.javascript || "");
    if (python) {
      state.workspaceState.buffers.python = python;
    }
    if (javascript) {
      state.workspaceState.buffers.javascript = javascript;
    }
    state.workspaceState.activeLanguage = python ? "python" : "javascript";
    state.workspaceState.loadedSource = title;
    state.workspaceState.splitMode = true;
  }

  function collectSources(scope) {
    const parts = scope === "all" ? Object.values(content.parts) : page ? [page] : [];
    const items = [];

    parts.forEach((partItem) => {
      partItem.chapters.forEach((chapter) => {
        if (chapter.sandbox) {
          items.push({
            kind: "sandbox",
            id: chapter.sandbox.id,
            title: chapter.sandbox.title,
            location: `${partItem.label} · ${chapter.label} sandbox`,
            starterCode: chapter.sandbox.starterCode
          });
        }
        if (chapter.challenge) {
          items.push({
            kind: "challenge",
            id: chapter.challenge.id,
            title: chapter.challenge.title,
            location: `${partItem.label} · ${chapter.label} challenge`,
            starterCode: chapter.challenge.starterCode
          });
        }
      });

      (partItem.assessment?.codingChallenges || []).forEach((challenge) => {
        items.push({
          kind: "assessment",
          id: challenge.id,
          title: challenge.title,
          location: `${partItem.label} · Assessment`,
          starterCode: challenge.starterCode
        });
      });
    });

    return items;
  }

  function findWorkspaceSource(kind, id) {
    return collectSources("all").find((source) => source.kind === kind && source.id === id) || null;
  }

  function findQuizById(quizId) {
    if (!page) {
      return null;
    }
    for (const chapter of page.chapters) {
      if (chapter.quiz?.id === quizId) {
        return chapter.quiz;
      }
    }
    if (page.assessment?.id === quizId) {
      return {
        id: page.assessment.id,
        title: page.assessment.title,
        questions: page.assessment.questions
      };
    }
    return null;
  }

  function findSandboxById(sandboxId) {
    const allParts = Object.values(content.parts);
    for (const partItem of allParts) {
      for (const chapter of partItem.chapters) {
        if (chapter.sandbox?.id === sandboxId) {
          return chapter.sandbox;
        }
      }
    }
    return null;
  }

  function findChallengeById(challengeId) {
    const allParts = Object.values(content.parts);
    for (const partItem of allParts) {
      for (const chapter of partItem.chapters) {
        if (chapter.challenge?.id === challengeId) {
          return chapter.challenge;
        }
      }
      for (const challenge of partItem.assessment?.codingChallenges || []) {
        if (challenge.id === challengeId) {
          return challenge;
        }
      }
    }
    return null;
  }

  async function executeJavascriptPlayground(code) {
    const logs = [];
    const consoleShim = {
      log: (...args) => logs.push(args.map(formatValue).join(" ")),
      warn: (...args) => logs.push(args.map(formatValue).join(" ")),
      error: (...args) => logs.push(args.map(formatValue).join(" "))
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
      return {
        output: [...stdout, ...stderr].join("\n") || "Code ran without printed output.",
        runtimeMs: performance.now() - started
      };
    } catch (error) {
      return {
        output: `Error: ${error.message || String(error)}`,
        runtimeMs: performance.now() - started
      };
    }
  }

  function executeHtmlPreview(code) {
    return {
      output: "HTML preview rendered. Open the Live Preview panel to inspect the result.",
      runtimeMs: 0.01
    };
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
        totalMs: 0,
        cases: [],
        summary: `Compilation error: ${error.message || String(error)}`
      };
    }

    if (!fn) {
      return {
        ok: false,
        totalMs: 0,
        cases: [],
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
          totalMs,
          cases,
          summary: `Runtime error: ${error.message || String(error)}`
        };
      }
      const elapsed = performance.now() - started;
      totalMs += elapsed;
      cases.push({
        args: test.args,
        expected: test.expected,
        actual,
        passed: deepEqual(actual, test.expected),
        ms: elapsed
      });
    }

    const passedCount = cases.filter((item) => item.passed).length;
    return {
      ok: passedCount === cases.length,
      totalMs,
      cases,
      summary: `${passedCount}/${cases.length} tests passed`
    };
  }

  async function executePythonChallenge(challenge, code, tests) {
    const pyodide = await ensurePyodide();
    const cases = [];
    let totalMs = 0;

    for (const test of tests) {
      pyodide.globals.set("__pm_args_json", JSON.stringify(test.args));
      const started = performance.now();
      try {
        const raw = await pyodide.runPythonAsync(
          `${code}\nimport json\n__pm_args = json.loads(str(__pm_args_json))\njson.dumps(${challenge.functionName.python}(*__pm_args))`
        );
        const elapsed = performance.now() - started;
        totalMs += elapsed;
        const actual = JSON.parse(raw);
        cases.push({
          args: test.args,
          expected: test.expected,
          actual,
          passed: deepEqual(actual, test.expected),
          ms: elapsed
        });
      } catch (error) {
        return {
          ok: false,
          totalMs,
          cases,
          summary: `Runtime error: ${error.message || String(error)}`
        };
      }
    }

    const passedCount = cases.filter((item) => item.passed).length;
    return {
      ok: passedCount === cases.length,
      totalMs,
      cases,
      summary: `${passedCount}/${cases.length} tests passed`
    };
  }

  async function estimateEfficiency(challenge, language, code) {
    if (!challenge.benchmark) {
      return {
        time: "No benchmark configured.",
        space: `Target space was ${challenge.complexity.space}.`
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
          space: `Target space was ${challenge.complexity.space}.`
        };
      }
      if (!fn) {
        return {
          time: `Benchmark unavailable because ${challenge.functionName.javascript} was not found.`,
          space: `Target space was ${challenge.complexity.space}.`
        };
      }

      for (const size of challenge.benchmark.sizes) {
        const args = cloneValue(challenge.benchmark.buildInput(size));
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
          space: `Target space was ${challenge.complexity.space}.`
        };
      }

      for (const size of challenge.benchmark.sizes) {
        pyodide.globals.set("__pm_args_json", JSON.stringify(challenge.benchmark.buildInput(size)));
        const started = performance.now();
        await pyodide.runPythonAsync(
          `import json\n__pm_args = json.loads(str(__pm_args_json))\n${challenge.functionName.python}(*__pm_args)`
        );
        samples.push({ size, ms: Math.max(0.01, performance.now() - started) });
      }
    }

    const model = classifyGrowth(samples);
    return {
      time: `Observed runtime shape looked closest to ${model}. Target time was ${challenge.complexity.time}.`,
      space: `Static review target: ${challenge.complexity.space}. If your code builds helper maps or arrays, your extra space likely grows with input.`
    };
  }

  async function ensurePyodide() {
    if (window.__PROGRAMMER_MASTERCLASS_PYODIDE__) {
      return window.__PROGRAMMER_MASTERCLASS_PYODIDE__;
    }
    if (!state.pyodidePromise) {
      state.pyodidePromise = new Promise((resolve, reject) => {
        const finish = async () => {
          try {
            const pyodide = await window.loadPyodide({
              indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.2/full/"
            });
            window.__PROGRAMMER_MASTERCLASS_PYODIDE__ = pyodide;
            resolve(pyodide);
          } catch (error) {
            reject(error);
          }
        };

        if (window.loadPyodide) {
          finish();
          return;
        }

        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.27.2/full/pyodide.js";
        script.onload = finish;
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
        if (!isIdePage) {
          await persistPageState();
        }
      }
    }, 400);
  }

  function updateTimerDisplays() {
    const realClockEls = ["global-real-clock", "dock-local-clock"];
    const focusEls = ["dock-focus-clock"];
    const examEls = ["dock-exam-clock"];
    const now = formatWallClock(new Date());
    const focus = formatDuration(getFocusElapsedMs());
    const exam = formatDuration(getExamRemainingMs());

    realClockEls.forEach((id) => {
      const node = document.getElementById(id);
      if (node) {
        node.textContent = now;
      }
    });
    focusEls.forEach((id) => {
      const node = document.getElementById(id);
      if (node) {
        node.textContent = focus;
      }
    });
    examEls.forEach((id) => {
      const node = document.getElementById(id);
      if (node) {
        node.textContent = exam;
      }
    });
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
      state.examTimer.remainingMs = ((page?.examClockMinutes || 60) * 60 * 1000);
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
    if (!isIdePage) {
      await persistPageState();
    }
    updateTimerDisplays();
  }

  async function resetExamTimer() {
    state.examTimer.running = false;
    state.examTimer.startedAt = 0;
    state.examTimer.remainingMs = ((page?.examClockMinutes || 60) * 60 * 1000);
    if (!isIdePage) {
      await persistPageState();
    }
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
    return Math.max(0, state.examTimer.remainingMs - (Date.now() - state.examTimer.startedAt));
  }

  function getActiveTopicLabel() {
    if (state.activeTopicId === "assessment") {
      return page?.assessment?.title || "Assessment";
    }
    return page?.chapters?.find((chapter) => chapter.id === state.activeTopicId)?.title || page?.title || "Current topic";
  }

  function getNextPendingTopic(currentPage) {
    return currentPage.chapters.find((chapter) => !state.pageState.completedChapters[chapter.id]) || null;
  }

  function getChapterStatus(chapter) {
    const statusBits = [];
    if (chapter.quiz) {
      statusBits.push(state.pageState.quizzes[chapter.quiz.id] ? "quiz done" : "quiz pending");
    }
    if (chapter.challenge) {
      statusBits.push(state.pageState.challenges[chapter.challenge.id]?.result?.submitted ? "challenge submitted" : "challenge pending");
    }
    return statusBits.length ? statusBits.join(" · ") : "reading module";
  }

  function getPageProgress(currentPage, pageState) {
    const totalChapters = currentPage.chapters.length;
    const totalQuizzes = currentPage.chapters.filter((chapter) => chapter.quiz).length + (currentPage.assessment?.questions?.length ? 1 : 0);
    const totalChallenges = currentPage.chapters.filter((chapter) => chapter.challenge).length + (currentPage.assessment?.codingChallenges?.length || 0);
    const totalUnits = totalChapters + totalQuizzes + totalChallenges;

    const completedChapters = Object.values(pageState.completedChapters || {}).filter(Boolean).length;
    const completedQuizzes = Object.keys(pageState.quizzes || {}).length;
    const completedChallenges = Object.values(pageState.challenges || {}).filter((item) => item.result?.submitted || item.result?.ok).length;
    const completedUnits = completedChapters + completedQuizzes + completedChallenges;

    return {
      totalUnits,
      completedUnits,
      percent: totalUnits ? Math.round((completedUnits / totalUnits) * 100) : 0
    };
  }

  function getProgramProgress() {
    const snapshots = Object.values(content.parts).map((partItem) => getPageProgress(partItem, state.allStats[partItem.id] || createDefaultPageState(partItem)));
    return {
      completedParts: snapshots.filter((snapshot) => snapshot.completedUnits > 0).length,
      percent: Math.round(snapshots.reduce((sum, snapshot) => sum + snapshot.percent, 0) / snapshots.length)
    };
  }

  function updateWorkspaceLayout() {
    syncLayoutMetrics();
  }

  function scheduleLayoutSync() {
    if (layoutSyncFrame) {
      window.cancelAnimationFrame(layoutSyncFrame);
    }
    layoutSyncFrame = window.requestAnimationFrame(() => {
      layoutSyncFrame = 0;
      syncLayoutMetrics();
    });
  }

  function syncLayoutMetrics() {
    const header = document.querySelector(".site-header");
    if (header) {
      document.documentElement.style.setProperty("--header-height", `${Math.ceil(header.getBoundingClientRect().height)}px`);
    }

    const effectiveWidth = getEffectiveWorkspacePanelWidth();
    body.style.setProperty("--workspace-panel-width", `${effectiveWidth}px`);

    document.querySelectorAll(".studio-layout").forEach((layout) => {
      layout.style.setProperty("--workspace-panel-width", `${effectiveWidth}px`);
    });

    const bounds = getSplitPanelBounds();
    document.querySelectorAll(".workspace-width-range").forEach((range) => {
      range.min = String(bounds.min);
      range.max = String(bounds.max);
      range.value = String(effectiveWidth);
    });
  }

  function getSplitPanelBounds() {
    const min = 380;
    const shell = document.querySelector(".page-shell");
    const shellWidth = Math.max(960, Math.floor(shell?.clientWidth || window.innerWidth));
    const railWidth = 280;
    const contentMin = shellWidth > 1500 ? 500 : shellWidth > 1280 ? 420 : 360;
    const gapAllowance = 44;
    const naturalMax = Math.min(560, Math.floor(shellWidth * 0.34));
    const availableMax = Math.floor(shellWidth - railWidth - contentMin - gapAllowance);
    return {
      min,
      max: Math.max(min, Math.min(naturalMax, availableMax > 0 ? availableMax : naturalMax))
    };
  }

  function getEffectiveWorkspacePanelWidth() {
    const bounds = getSplitPanelBounds();
    return clamp(state.workspaceState.panelWidth || 460, bounds.min, bounds.max);
  }

  function classifyGrowth(samples) {
    const models = {
      "O(1)": (n) => 1,
      "O(log n)": (n) => Math.log2(n + 1),
      "O(n)": (n) => n,
      "O(n log n)": (n) => n * Math.log2(n + 1),
      "O(n²)": (n) => n * n
    };

    let bestLabel = "O(n)";
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
        bestLabel = label;
      }
    });

    return bestLabel;
  }

  function formatChallengeSummary(result) {
    if (!result) {
      return "No submission yet.";
    }
    const lines = [result.summary];
    result.cases?.forEach((testCase, index) => {
      lines.push(`Test ${index + 1}: ${testCase.passed ? "PASS" : "FAIL"} | expected ${JSON.stringify(testCase.expected)} | actual ${JSON.stringify(testCase.actual)} | ${testCase.ms.toFixed(2)} ms`);
    });
    if (typeof result.totalMs === "number") {
      lines.push(`Total runtime: ${result.totalMs.toFixed(2)} ms`);
    }
    return lines.join("\n");
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function formatDuration(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }

  function formatWallClock(date) {
    return new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).format(date);
  }

  function formatArgs(args) {
    return `args: ${JSON.stringify(args)}`;
  }

  function getPartHref(partId) {
    return partId === "part1" ? "index.html" : `${partId}.html`;
  }

  function pageStateKey(partKey) {
    return `page:${identityKey()}:${partKey}`;
  }

  function workspaceStateKey() {
    return `workspace:${identityKey()}:global`;
  }

  function localUserKey(username) {
    return `local-user:${username}`;
  }

  function identityKey() {
    if (state.currentUser?.authType === "supabase") {
      return `cloud:${state.currentUser.userId}`;
    }
    if (state.currentUser?.authType === "local") {
      return `local:${state.currentUser.username}`;
    }
    return "guest-device";
  }

  async function hashText(text) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(text);
    const digest = await window.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("");
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll("\"", "&quot;")
      .replaceAll("'", "&#39;");
  }

  function formatValue(value) {
    return typeof value === "string" ? value : JSON.stringify(value);
  }

  function cloneValue(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function deepEqual(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
  }
})();
