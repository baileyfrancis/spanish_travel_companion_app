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

  test("Speaking log migration supplies retrieval defaults", () => {
    const normalized = CORE.normalizeSpeakingLog({
      id: "old-log",
      date: "2026-06-01",
      prompt: "Old prompt",
      minutes: 2,
      difficulty: 4
    }, {
      localISO: () => "2026-06-07",
      uid: () => "new-log"
    });
    equal([normalized.retrieval, normalized.passes, normalized.improved], [2, 1, "not-compared"]);
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
  frame.style.cssText = "position:fixed;left:0;top:0;width:390px;height:844px;border:0;visibility:hidden;pointer-events:none";
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
    await waitFor(() => frame.contentWindow.innerWidth > 0);
    await waitFor(() => appDocument.querySelector("#onboarding-form"));

    test("Mobile navigation exposes five primary destinations", () => {
      equal(appDocument.querySelectorAll(".bottom-nav .nav-item").length, 5);
    });
    test("Each week keeps one scenario across its daily travel steps", () => {
      const tasks = frame.contentWindow.APP_DATA.dailyTasks;
      const scenarioIdsInCatalogue = new Set(frame.contentWindow.APP_DATA.scenarios.map((scenario) => scenario.id));
      for (let index = 0; index < tasks.length; index += 7) {
        const week = tasks.slice(index, index + 7);
        const scenarioIds = new Set(week.map((task) => task.scenarioId));
        if (scenarioIds.size !== 1) {
          throw new Error(`Week ${week[0].week} uses more than one scenario`);
        }
        if (!scenarioIdsInCatalogue.has(week[0].scenarioId)) {
          throw new Error(`Week ${week[0].week} references a missing scenario`);
        }
      }
    });
    test("Update banner stays hidden until a new service worker is ready", () => {
      const banner = appDocument.querySelector("#update-banner");
      if (!banner.hidden || frame.contentWindow.getComputedStyle(banner).display !== "none") {
        throw new Error("Update banner is visible without an available update");
      }
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
    test("Legacy Read2Speak checkpoints migrate to balanced sessions", () => {
      const migrated = frame.contentWindow.APP_TEST_API.normalizeState({
        version: 6,
        settings: {
          startDate: "2026-01-01",
          tripDate: "2027-01-01",
          weeklyTargetHours: 5,
          countries: [],
          theme: "system"
        },
        deck: [],
        read2Speak: {
          courseId: "foundations",
          currentUnit: 1,
          units: {
            "foundations:1": {
              completedCheckpoints: ["ebook-introduction", "workbook-1-8"],
              confidence: 3
            }
          }
        }
      });
      const statuses = migrated.read2Speak.units["foundations:1"].sessionStatuses;
      equal([statuses["ebook-1"], statuses["workbook-1"], statuses["workbook-2"]], [
        "complete",
        "complete",
        "complete"
      ]);
    });
    test("Every Read2Speak unit has balanced active sessions", () => {
      frame.contentWindow.APP_DATA.read2SpeakCourses.forEach((course) => {
        course.units.forEach((unit) => {
          equal(unit.sessions.length, 16);
          unit.sessions.forEach((session) => {
            if (
              session.minutes !== 15 ||
              !session.learn ||
              !session.retrieve ||
              !session.produce ||
              !session.capture ||
              !session.latinAmerica
            ) {
              throw new Error(`${course.title} Unit ${unit.number} has an incomplete session`);
            }
            if (["ebook", "workbook"].includes(session.resource) && !Number.isInteger(session.startPage)) {
              throw new Error(`${course.title} Unit ${unit.number} has no PDF destination`);
            }
            if (
              session.resource === "ebook" &&
              (
                session.startPage < unit.ebook.startPage ||
                session.endPage > unit.ebook.endPage ||
                session.endPage < session.startPage
              )
            ) {
              throw new Error(`${course.title} Unit ${unit.number} has an invalid eBook range`);
            }
            if (
              session.resource === "workbook" &&
              (session.startPage < unit.workbook.startPage || session.startPage > unit.workbook.endPage)
            ) {
              throw new Error(`${course.title} Unit ${unit.number} has an invalid workbook destination`);
            }
          });
        });
      });
    });
    test("Daily task minute allocations match their displayed targets", () => {
      frame.contentWindow.APP_DATA.dailyTasks.forEach((task) => {
        equal(
          task.subtasks.reduce((sum, item) => sum + item.minutes, 0),
          task.targetMinutes,
          `Day ${task.day} minute allocation does not match its target`
        );
        equal(task.subtasks.find((item) => item.id === "read").minutes, 15);
      });
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

    test("Every daily step has a destination button", () => {
      equal(appDocument.querySelectorAll('[data-action="open-daily-task"]').length, 5);
    });
    test("Daily action buttons fit a phone viewport with comfortable tap targets", () => {
      [...appDocument.querySelectorAll('[data-action="open-daily-task"]')].forEach((button) => {
        const rect = button.getBoundingClientRect();
        if (rect.left < 0 || rect.right > frame.contentWindow.innerWidth) {
          throw new Error(`${button.textContent.trim()} overflows the phone viewport`);
        }
        if (rect.height < 44) {
          throw new Error(`${button.textContent.trim()} is shorter than 44px`);
        }
      });
    });
    test("Scenario previews explain where the included vocabulary lives", () => {
      const travelStep = appDocument.querySelector('[data-action="open-daily-task"][data-task-id="travel"]')
        ?.closest(".daily-task-item");
      if (!travelStep?.textContent.includes("in the app") || !travelStep.textContent.includes("Reveal phrase support")) {
        throw new Error("The travel step does not explain where to find its vocabulary");
      }
    });

    appDocument.querySelector('[data-action="open-daily-task"][data-task-id="read"]').click();
    await waitFor(() => appDocument.querySelector('[data-navigation-target="read2speak"]'));
    test("The reading step opens the Read2Speak workspace", () => {
      equal(frame.contentWindow.location.hash, "#resources");
    });
    test("The current Read2Speak session combines active learning steps", () => {
      const current = appDocument.querySelector(".read2speak-session.current");
      ["Learn:", "Retrieve:", "Produce:", "Capture:"].forEach((label) => {
        if (!current?.textContent.includes(label)) throw new Error(`Missing ${label}`);
      });
      if (!current.textContent.includes("Latin America") && !current.textContent.includes("route-country")) {
        throw new Error("Missing Latin America adaptation");
      }
    });

    appDocument.querySelector('.read2speak-session.current [data-status="partial"]').click();
    await waitFor(() => appDocument.querySelector(".read2speak-session.current")?.textContent.includes("In progress"));
    test("A partial session counts today without advancing the course", () => {
      const updated = JSON.parse(localStorage.getItem("spanishTravelCompanionState"));
      equal(updated.read2Speak.units["foundations:1"].sessionStatuses["ebook-1"], "partial");
      equal(updated.daily["1"].read2SpeakActivity.status, "partial");
      if (!updated.daily["1"].completedTasks.includes("read")) {
        throw new Error("Partial session did not complete today's reading activity");
      }
      if (!appDocument.querySelector(".read2speak-session.current")?.textContent.includes("Session 1")) {
        throw new Error("Partial work advanced to the next session");
      }
    });

    appDocument.querySelector('.read2speak-session.current [data-status="complete"]').click();
    await waitFor(() => appDocument.querySelector(".read2speak-session.current")?.textContent.includes("Session 2"));
    test("Completing a session advances both course and daily progress", () => {
      const updated = JSON.parse(localStorage.getItem("spanishTravelCompanionState"));
      equal(updated.read2Speak.units["foundations:1"].sessionStatuses["ebook-1"], "complete");
      equal(updated.daily["1"].read2SpeakActivity.status, "complete");
    });

    frame.contentWindow.location.hash = "today";
    await waitFor(() => appDocument.querySelector("#view-title")?.textContent === "Today");
    test("Daily Read2Speak completion is controlled by the course workspace", () => {
      const checkbox = appDocument.querySelector('[data-task-id="read"]');
      if (!checkbox?.disabled || !checkbox.checked) {
        throw new Error("Expected a disabled, course-completed daily checkbox");
      }
    });
    const scenarioButton = appDocument.querySelector('[data-action="open-daily-task"][data-task-id="travel"]');
    const expectedScenarioTitle = scenarioButton.textContent.trim().replace(/^Open /, "");
    scenarioButton.click();
    await waitFor(() => appDocument.querySelector("#scenario-form"));
    test("The travel step opens its named scenario directly", () => {
      equal(appDocument.querySelector(".modal-header h2")?.textContent, expectedScenarioTitle);
      if (!appDocument.querySelector(".scenario-support")?.textContent.includes("Key vocabulary")) {
        throw new Error("The opened scenario is missing its included vocabulary");
      }
    });
    appDocument.querySelector('[data-action="close-modal"]').click();
    frame.contentWindow.location.hash = "today";
    await waitFor(() => appDocument.querySelector("#view-title")?.textContent === "Today");

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
        .find((item) => item.textContent.includes("First pass"));
      if (!sessionStat || !sessionStat.textContent.includes("0/5")) {
        throw new Error("Expected a five-card review batch");
      }
    });
    test("Review defaults to active English-to-Spanish retrieval", () => {
      equal(appDocument.querySelector(".review-prompt-label")?.textContent, "Say this in Spanish");
      if (!appDocument.querySelector(".phrase-prompt")?.textContent.trim()) {
        throw new Error("Expected an English review prompt");
      }
    });
    test("Expanded phrasebook covers practical travel situations", () => {
      if (frame.contentWindow.APP_DATA.phrasebook.length < 190) {
        throw new Error("Expected at least 190 travel phrases");
      }
      const categories = new Set(frame.contentWindow.APP_DATA.phrasebook.map((phrase) => phrase.category));
      ["Airport", "Transport", "Accommodation", "Food", "Health", "Safety", "Bookings"]
        .forEach((category) => {
          if (!categories.has(category)) throw new Error(`Missing ${category} phrases`);
        });
      if (frame.contentWindow.APP_DATA.phrasebook.filter((phrase) => phrase.useCase).length < 70) {
        throw new Error("Expected phrase chains with practical use notes");
      }
    });
    test("Every travel scenario includes progressive active-recall variants", () => {
      if (frame.contentWindow.APP_DATA.scenarios.length < 22) {
        throw new Error("Expected at least 22 practical travel scenarios");
      }
      frame.contentWindow.APP_DATA.scenarios.forEach((scenario) => {
        if (!Array.isArray(scenario.cues) || scenario.cues.length < 3) {
          throw new Error(`${scenario.title} is missing recall cues`);
        }
        if (!Array.isArray(scenario.variants) || scenario.variants.length < 5) {
          throw new Error(`${scenario.title} is missing progressive variants`);
        }
        scenario.variants.forEach((variant) => {
          if (!variant.title || variant.cues.length < 3 || !variant.complication) {
            throw new Error(`${scenario.title} has an incomplete variant`);
          }
        });
      });
    });
    test("The full year has distinct weekly diagnostics and rotating checklist cues", () => {
      const data = frame.contentWindow.APP_DATA;
      equal(data.weeklyDiagnostics.length, 52);
      equal(new Set(data.weeklyDiagnostics.map((item) => item.task)).size, 52);
      const speakingCues = new Set(data.dailyTasks.map((task) => task.microFocus?.speak));
      if (speakingCues.size < 8) {
        throw new Error("Expected at least eight rotating speaking checklist cues");
      }
    });
    test("Scenario catalogue covers common travel pressure points", () => {
      const scenarioIds = new Set(frame.contentWindow.APP_DATA.scenarios.map((scenario) => scenario.id));
      [
        "airport-check-in",
        "flight-disruption",
        "baggage-claim",
        "taxi-ride",
        "money-atm",
        "market-shopping",
        "clinic-visit",
        "emergency-help",
        "tour-booking",
        "checkout-charge"
      ].forEach((id) => {
        if (!scenarioIds.has(id)) throw new Error(`Missing ${id} scenario`);
      });
      frame.contentWindow.APP_DATA.phases.forEach((phase) => {
        phase.scenarioIds.forEach((id) => {
          if (!scenarioIds.has(id)) throw new Error(`Month ${phase.month} references missing scenario ${id}`);
        });
      });
    });

    const promptText = appDocument.querySelector(".phrase-prompt").textContent.trim();
    const reviewedCard = saved.deck.find((card) => card.english === promptText);
    const reviewsBefore = saved.totalReviews;
    appDocument.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    await waitFor(() => appDocument.querySelector(".phrase-answer"));
    test("Review ratings show recall guidance and the actual schedule", () => {
      const hardButton = appDocument.querySelector('[data-rating="hard"]');
      const goodButton = appDocument.querySelector('[data-rating="good"]');
      if (!hardButton?.textContent.includes("Recalled with effort") || !hardButton.textContent.includes("Tomorrow")) {
        throw new Error("Hard rating guidance is incomplete");
      }
      if (!goodButton?.textContent.includes("Recalled correctly")) {
        throw new Error("Good rating guidance is incomplete");
      }
    });

    appDocument.dispatchEvent(new KeyboardEvent("keydown", { key: "1", bubbles: true }));
    await waitFor(() => appDocument.querySelector('[data-action="undo-review"]'));
    test("Keyboard shortcuts can rate a revealed review", () => {
      const updated = JSON.parse(localStorage.getItem("spanishTravelCompanionState"));
      const card = updated.deck.find((item) => item.id === reviewedCard.id);
      equal(updated.totalReviews, reviewsBefore + 1);
      equal(card.incorrectCount, reviewedCard.incorrectCount + 1);
    });

    appDocument.querySelector('[data-action="undo-review"]').click();
    await waitFor(() => !appDocument.querySelector('[data-action="undo-review"]'));
    test("Undo restores the card schedule and review total", () => {
      const restored = JSON.parse(localStorage.getItem("spanishTravelCompanionState"));
      equal(restored.totalReviews, reviewsBefore);
      equal(restored.deck.find((item) => item.id === reviewedCard.id), reviewedCard);
    });

    appDocument.querySelector('[data-action="toggle-review-direction"]').click();
    test("Review direction can be switched without changing saved settings", () => {
      equal(appDocument.querySelector(".review-prompt-label")?.textContent, "What does this mean?");
    });

    const retryState = JSON.parse(localStorage.getItem("spanishTravelCompanionState"));
    retryState.deck = retryState.deck.slice(0, 2).map((card) => ({
      ...card,
      dueDate: "2000-01-01",
      suspended: false
    }));
    localStorage.setItem("spanishTravelCompanionState", JSON.stringify(retryState));
    appDocument = await loadFrame("#review");
    await waitFor(() => appDocument.querySelector(".phrase-prompt"));
    const firstPrompt = appDocument.querySelector(".phrase-prompt").textContent.trim();
    appDocument.querySelector('[data-action="reveal-review"]').click();
    appDocument.querySelector('[data-rating="again"]').click();
    await waitFor(() => appDocument.querySelector(".phrase-prompt")?.textContent.trim() !== firstPrompt);
    test("Failed cards wait until the first pass is complete", () => {
      if (appDocument.querySelector(".review-progress strong")?.textContent === "Retry") {
        throw new Error("Failed card returned before the remaining first-pass card");
      }
    });
    appDocument.querySelector('[data-action="reveal-review"]').click();
    appDocument.querySelector('[data-rating="good"]').click();
    await waitFor(() => appDocument.querySelector(".review-progress strong")?.textContent === "Retry");
    test("Failed cards return as same-session retries", () => {
      equal(appDocument.querySelector(".phrase-prompt").textContent.trim(), firstPrompt);
    });
    appDocument.querySelector('[data-action="reveal-review"]').click();
    appDocument.querySelector('[data-rating="good"]').click();
    await waitFor(() => appDocument.querySelector(".review-summary"));
    test("Completed batches summarize first-attempt outcomes", () => {
      const summary = appDocument.querySelector(".review-summary").textContent;
      if (!summary.includes("1 recalled") || !summary.includes("1 needed another attempt")) {
        throw new Error(`Unexpected review summary: ${summary}`);
      }
    });

    frame.contentWindow.location.hash = "speaking";
    await waitFor(() => appDocument.querySelector("#view-title")?.textContent === "Speaking");
    test("Speaking catalogue contains structured practical exercises", () => {
      if (frame.contentWindow.APP_DATA.speakingExercises.length < 30) {
        throw new Error("Expected at least 30 speaking exercises");
      }
      frame.contentWindow.APP_DATA.speakingExercises.forEach((exercise) => {
        if (
          !exercise.id ||
          exercise.targets.length < 2 ||
          exercise.followUps.length < 2 ||
          exercise.support.length < 2 ||
          exercise.constraints.length < 4 ||
          !exercise.family
        ) {
          throw new Error(`${exercise.title || exercise.id} is incomplete`);
        }
      });
    });
    test("Speaking starts with recall and optional support", () => {
      if (!appDocument.querySelector(".speaking-prompt")?.textContent.trim()) {
        throw new Error("Expected a speaking prompt");
      }
      if (appDocument.querySelector(".speaking-support").open) {
        throw new Error("Phrase support should begin collapsed");
      }
      if (appDocument.querySelector("#speaking-log-form")) {
        throw new Error("Reflection should wait until speaking is complete");
      }
    });

    frame.contentWindow.APP_TEST_API.completeSpeakingTimer();
    await waitFor(() => appDocument.querySelector('[data-action="start-second-speaking-pass"]'));
    test("First attempt reveals support and offers a second pass", () => {
      if (!appDocument.querySelector(".speaking-support").open) {
        throw new Error("Support should open between attempts");
      }
      if (!appDocument.querySelector(".timer-finished")?.textContent.includes("00:00")) {
        throw new Error("Completed timer should stop at zero");
      }
    });
    appDocument.querySelector('[data-action="start-second-speaking-pass"]').click();
    frame.contentWindow.APP_TEST_API.completeSpeakingTimer();
    await waitFor(() => appDocument.querySelector("#speaking-log-form"));
    test("Second attempt leads to compact retrieval reflection", () => {
      equal(appDocument.querySelectorAll('[name="retrieval"]').length, 5);
      if (!appDocument.querySelector('[name="improved"]')) {
        throw new Error("Expected an improvement comparison");
      }
    });

    appDocument.querySelector('[name="retrieval"][value="2"]').checked = true;
    appDocument.querySelector("#stuck-phrase").value = "¿Dónde hago transbordo?";
    appDocument.querySelector("#stuck-meaning").value = "Where do I change?";
    appDocument.querySelector('[name="savePhrase"]').checked = true;
    appDocument.querySelector("#speaking-log-form").requestSubmit();
    await waitFor(() => appDocument.querySelector(".speaking-log"));
    test("Speaking save records two passes, updates today, and creates review phrases", () => {
      const updated = JSON.parse(localStorage.getItem("spanishTravelCompanionState"));
      const log = updated.speakingLogs.at(-1);
      equal([log.retrieval, log.passes, log.improved], [2, 2, "yes"]);
      if (!Object.values(updated.daily).some((record) => record.completedTasks?.includes("speak"))) {
        throw new Error("Expected today's speaking task to be complete");
      }
      if (!updated.deck.some((card) => card.spanish === "¿Dónde hago transbordo?" && card.source === "speaking")) {
        throw new Error("Expected a speaking-sourced review card");
      }
    });
    const repeatedExerciseTitle = appDocument.querySelector(".speaking-log-title strong").textContent;
    appDocument.querySelector('[data-action="repeat-speaking-exercise"]').click();
    test("Recent speaking entries can restart the same exercise", () => {
      equal(appDocument.querySelector(".speaking-session h3").textContent, repeatedExerciseTitle);
      if (appDocument.querySelector("#speaking-log-form")) throw new Error("Expected a fresh speaking session");
    });

    frame.contentWindow.location.hash = "scenarios";
    await waitFor(() => appDocument.querySelector("#view-title")?.textContent === "Travel scenarios");
    test("Scenario recommendations explain the next rehearsal", () => {
      const recommendation = appDocument.querySelector(".card-accent");
      if (!recommendation?.textContent.includes("untested") || !recommendation.querySelector('[data-action="open-scenario"]')) {
        throw new Error("Expected an actionable recommendation for an untested scenario");
      }
    });
    appDocument.querySelector('[data-action="open-scenario"]').click();
    await waitFor(() => appDocument.querySelector("#scenario-form"));
    test("Scenario practice starts with recall before revealing Spanish", () => {
      equal(appDocument.querySelectorAll(".scenario-cues li").length, 3);
      if (appDocument.querySelector(".scenario-support").open) {
        throw new Error("Phrase support should begin collapsed");
      }
      if (!appDocument.querySelector(".scenario-round-challenge")?.textContent.includes("complication")) {
        throw new Error("Expected a second-pass complication");
      }
    });
    appDocument.querySelector("#scenario-stuck-phrase").value = "¿Puede repetirlo más despacio?";
    appDocument.querySelector("#scenario-stuck-meaning").value = "Could you repeat that more slowly?";
    appDocument.querySelector('#scenario-form [name="completed"]').checked = true;
    appDocument.querySelector("#scenario-form").requestSubmit();
    await waitFor(() => !appDocument.querySelector("#scenario-form"));
    test("A difficult scenario phrase can be sent to spaced review", () => {
      const updated = JSON.parse(localStorage.getItem("spanishTravelCompanionState"));
      const phrase = updated.deck.find((card) => card.spanish === "¿Puede repetirlo más despacio?");
      if (!phrase || !phrase.source.startsWith("scenario:")) {
        throw new Error("Expected a scenario-sourced review card");
      }
      if (!Object.values(updated.scenarios).some((scenario) => scenario.completed && scenario.lastPractised)) {
        throw new Error("Expected completed scenario progress");
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
  const summaryText = failures.length
    ? `${failures.length} of ${results.length} tests failed.`
    : `${results.length} tests passed.`;
  document.querySelector("#summary").textContent = summaryText;
  document.title = failures.length
    ? `Tests failed (${failures.length}): ${failures.map((failure) => failure.name).join(" | ")}`
    : `Tests passed: ${results.length}`;
})();
