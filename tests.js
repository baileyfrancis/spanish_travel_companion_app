(async function () {
  "use strict";

  const results = [];
  const CORE = window.APP_CORE;

  function test(name, run) {
    try {
      run();
      results.push({ name, passed: true });
    } catch (error) {
      results.push({ name, passed: false, error: error.message });
    }
  }

  function equal(actual, expected, message = "") {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(message || `Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
    }
  }

  function addDays(value, days) {
    const date = new Date(`${value}T12:00:00`);
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }

  function daysBetween(from, to) {
    return Math.round((new Date(`${to}T12:00:00`) - new Date(`${from}T12:00:00`)) / 86400000);
  }

  const defaults = {
    startDate: "2026-01-01",
    tripDate: "2027-01-01",
    weeklyTargetHours: 5,
    countries: [],
    theme: "system",
    onboardingComplete: false,
    experienceLevel: "beginner",
    preferredSessionMinutes: 15,
    reviewSessionLimit: 10
  };

  test("Older settings receive v5 defaults", () => {
    const normalized = CORE.normalizeSettings(
      { startDate: "2026-02-01", tripDate: "2026-12-01", weeklyTargetHours: 3 },
      defaults,
      ["Mexico", "Peru"]
    );
    equal(normalized.preferredSessionMinutes, 15);
    equal(normalized.reviewSessionLimit, 10);
    equal(normalized.onboardingComplete, false);
  });

  test("Settings reject unsupported values and countries", () => {
    const normalized = CORE.normalizeSettings({
      weeklyTargetHours: 99,
      countries: ["Mexico", "Nowhere", "Mexico"],
      theme: "neon",
      experienceLevel: "expert",
      preferredSessionMinutes: 12,
      reviewSessionLimit: 500
    }, defaults, ["Mexico", "Peru"]);
    equal(normalized.weeklyTargetHours, 30);
    equal(normalized.countries, ["Mexico"]);
    equal(normalized.theme, "system");
    equal(normalized.experienceLevel, "beginner");
  });

  test("Activity streaks use unique completion dates", () => {
    const streak = CORE.calculateStreaks(
      ["2026-06-04", "2026-06-05", "2026-06-05", "2026-06-06"],
      "2026-06-07",
      daysBetween
    );
    equal(streak, { current: 3, longest: 3 });
  });

  test("Old activity does not create a current streak", () => {
    const streak = CORE.calculateStreaks(["2026-05-01", "2026-05-02"], "2026-06-07", daysBetween);
    equal(streak, { current: 0, longest: 2 });
  });

  test("Due cards are overdue-first and paused cards are excluded", () => {
    const cards = CORE.sortDueCards([
      { id: "new", dueDate: "2026-06-07", incorrectCount: 0 },
      { id: "old", dueDate: "2026-06-01", incorrectCount: 0 },
      { id: "paused", dueDate: "2026-05-01", suspended: true },
      { id: "future", dueDate: "2026-06-08" }
    ], "2026-06-07");
    equal(cards.map((card) => card.id), ["old", "new"]);
  });

  test("Again keeps a card due and records an error", () => {
    const card = CORE.rateReviewCard(
      { reviewStage: 2, correctCount: 3, incorrectCount: 1, dueDate: "2026-06-07" },
      "again",
      "2026-06-07",
      addDays
    );
    equal([card.reviewStage, card.incorrectCount, card.dueDate], [1, 2, "2026-06-07"]);
  });

  test("Good advances the spaced-review interval", () => {
    const card = CORE.rateReviewCard(
      { reviewStage: 2, correctCount: 3, incorrectCount: 1 },
      "good",
      "2026-06-07",
      addDays
    );
    equal([card.reviewStage, card.correctCount, card.dueDate], [3, 4, "2026-06-14"]);
  });

  test("Backup summaries count portable records", () => {
    const summary = CORE.summarizeState({
      daily: { 1: { done: true }, 2: { completedTasks: ["a", "b"] } },
      deck: [{}, {}],
      speakingLogs: [{}],
      scenarios: { food: {} },
      milestones: { 1: {}, 2: {} }
    });
    equal(summary, {
      completedDays: 1,
      deckCards: 2,
      speakingLogs: 1,
      practisedScenarios: 1,
      milestones: 2
    });
  });

  try {
    const [manifest, serviceWorker] = await Promise.all([
      fetch("manifest.json").then((response) => response.json()),
      fetch("service-worker.js").then((response) => response.text())
    ]);
    test("PWA paths remain repository-relative", () => {
      equal(manifest.start_url, "./");
      equal(manifest.scope, "./");
      if (/["']\/(?:app|styles|manifest|icon)/.test(serviceWorker)) {
        throw new Error("Found a root-relative cached asset");
      }
    });
  } catch (error) {
    results.push({ name: "PWA paths remain repository-relative", passed: false, error: error.message });
  }

  const previousState = localStorage.getItem("spanishTravelCompanionState");
  const frame = document.createElement("iframe");
  frame.hidden = true;
  document.body.appendChild(frame);

  function waitFor(check, timeout = 4000) {
    return new Promise((resolve, reject) => {
      const started = Date.now();
      const poll = () => {
        try {
          const value = check();
          if (value) {
            resolve(value);
            return;
          }
        } catch (error) {
          reject(error);
          return;
        }
        if (Date.now() - started > timeout) {
          reject(new Error("Timed out waiting for browser state"));
          return;
        }
        setTimeout(poll, 40);
      };
      poll();
    });
  }

  async function loadFrame(hash) {
    const loaded = new Promise((resolve) => frame.addEventListener("load", resolve, { once: true }));
    frame.src = `./?test=${Date.now()}${hash}`;
    await loaded;
    return frame.contentDocument;
  }

  try {
    localStorage.removeItem("spanishTravelCompanionState");
    let appDocument = await loadFrame("#today");
    await waitFor(() => appDocument.querySelector("#onboarding-form"));

    test("Mobile navigation exposes five primary destinations", () => {
      equal(appDocument.querySelectorAll(".bottom-nav .nav-item").length, 5);
    });
    test("Existing v4 saves do not reopen first-run setup", () => {
      const migrated = frame.contentWindow.APP_TEST_API.normalizeState({
        version: 4,
        settings: {
          startDate: "2026-01-01",
          tripDate: "2027-01-01",
          weeklyTargetHours: 5,
          countries: [],
          theme: "system"
        },
        deck: []
      });
      equal(migrated.settings.onboardingComplete, true);
    });
    test("First-run dialog stays within the viewport", () => {
      const rect = appDocument.querySelector(".modal").getBoundingClientRect();
      if (rect.left < 0 || rect.right > frame.contentWindow.innerWidth) {
        throw new Error(`Dialog bounds ${rect.left}-${rect.right} exceed ${frame.contentWindow.innerWidth}px`);
      }
    });

    appDocument.querySelector('[data-action="skip-onboarding"]').click();
    await waitFor(() => !appDocument.querySelector("#onboarding-form"));
    test("First-run setup persists completion", () => {
      const saved = JSON.parse(localStorage.getItem("spanishTravelCompanionState"));
      equal(saved.settings.onboardingComplete, true);
    });

    appDocument.querySelector('[data-action="build-session"][data-minutes="15"]').click();
    await waitFor(() => appDocument.querySelector(".quick-session-plan"));
    test("Time-based sessions fill the selected duration", () => {
      const total = [...appDocument.querySelectorAll(".session-minutes")]
        .reduce((sum, item) => sum + Number.parseInt(item.textContent, 10), 0);
      equal(total, 15);
    });

    const saved = JSON.parse(localStorage.getItem("spanishTravelCompanionState"));
    saved.settings.reviewSessionLimit = 5;
    saved.deck.forEach((card) => {
      card.dueDate = "2000-01-01";
      card.suspended = false;
    });
    localStorage.setItem("spanishTravelCompanionState", JSON.stringify(saved));
    appDocument = await loadFrame("#review");
    await waitFor(() => appDocument.querySelector("#view-title")?.textContent === "Phrase review");
    test("Review batches respect the configured card limit", () => {
      const sessionStat = [...appDocument.querySelectorAll(".stat")]
        .find((item) => item.textContent.includes("This session"));
      if (!sessionStat || !sessionStat.textContent.includes("0/5")) {
        throw new Error("Expected a five-card review batch");
      }
    });

    frame.contentWindow.location.hash = "settings";
    await waitFor(() => appDocument.querySelector("#settings-form"));
    frame.contentWindow.APP_TEST_API.showImportPreview({
      ...saved,
      app: "Spanish Travel Companion",
      exportedAt: new Date().toISOString()
    });
    await waitFor(() => appDocument.querySelector("#modal-title")?.textContent === "Review backup import");
    test("Backup import shows a comparison before replacement", () => {
      equal(appDocument.querySelectorAll(".backup-comparison .list-card").length, 2);
    });
    appDocument.querySelector('[data-action="cancel-import"]').click();
  } catch (error) {
    results.push({ name: "Browser integration checks", passed: false, error: error.message });
  } finally {
    frame.remove();
    if (previousState === null) localStorage.removeItem("spanishTravelCompanionState");
    else localStorage.setItem("spanishTravelCompanionState", previousState);
  }

  const list = document.querySelector("#results");
  results.forEach((result) => {
    const item = document.createElement("li");
    item.className = result.passed ? "pass" : "fail";
    item.textContent = result.passed ? `PASS: ${result.name}` : `FAIL: ${result.name}: ${result.error}`;
    list.appendChild(item);
  });

  const failures = results.filter((result) => !result.passed);
  document.body.dataset.status = failures.length ? "failed" : "passed";
  document.querySelector("#summary").textContent = failures.length
    ? `${failures.length} of ${results.length} tests failed.`
    : `${results.length} tests passed.`;
})();
