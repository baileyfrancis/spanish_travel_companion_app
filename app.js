(function () {
  "use strict";

  const DATA = window.APP_DATA;
  const CORE = window.APP_CORE;
  const STORAGE_KEY = "spanishTravelCompanionState";
  const STATE_VERSION = 6;
  const DAY_MS = 86400000;
  const GOOD_INTERVALS = CORE.GOOD_INTERVALS;
  const VALID_TASK_IDS = ["read", "listen", "speak", "review", "travel"];
  const TEST_MODE = new URLSearchParams(location.search).has("test");
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  let startupStorageWarning = "";
  let state = loadState();
  let activeTab = location.hash.replace("#", "") || "today";
  let activeDayNumber = null;
  let recommendation = null;
  let reviewCardId = null;
  let reviewRevealed = false;
  let reviewSessionReviewed = new Set();
  let reviewRetryQueue = [];
  let reviewSessionCardIds = [];
  let reviewSessionOutcomes = new Map();
  let reviewUndo = null;
  let reviewPromptDirection = "english";
  let quickSession = null;
  let timerSeconds = 120;
  let timerRemaining = 120;
  let timerInterval = null;
  let speakingExerciseId = null;
  let speakingPass = 1;
  let speakingPassOneComplete = false;
  let speakingSessionComplete = false;
  let speakingElapsedSeconds = 0;
  let toastTimer = null;
  let notesSaveTimer = null;
  let pendingServiceWorker = null;
  let pendingInstallPrompt = null;
  let pendingImportState = null;
  let offlineReady = false;
  let lastFocusedElement = null;
  const read2SpeakFiles = {
    ebook: null,
    workbook: null
  };

  const view = $("#view");
  const modalRoot = $("#modal-root");

  function localISO(date = new Date()) {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  function parseDate(value) {
    if (!value) return null;
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function addDays(dateString, days) {
    const date = parseDate(dateString) || new Date();
    date.setDate(date.getDate() + days);
    return localISO(date);
  }

  function daysBetween(from, to) {
    const start = parseDate(from);
    const end = parseDate(to);
    if (!start || !end) return 0;
    return Math.floor((end.setHours(12, 0, 0, 0) - start.setHours(12, 0, 0, 0)) / DAY_MS);
  }

  function formatDate(value, options = { month: "short", day: "numeric" }) {
    const date = parseDate(value);
    return date ? new Intl.DateTimeFormat(undefined, options).format(date) : "Not set";
  }

  function uid(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function isObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function isDateString(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = parseDate(value);
    return Boolean(date) && localISO(date) === value;
  }

  function finiteNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function defaultState() {
    const today = localISO();
    const trip = new Date();
    trip.setFullYear(trip.getFullYear() + 1);
    const starterDeck = DATA.phrasebook
      .filter((phrase) => DATA.starterDeckIds.includes(phrase.id))
      .map((phrase, index) => ({
        ...phrase,
        reviewStage: 0,
        dueDate: addDays(today, index % 3),
        correctCount: 0,
        incorrectCount: 0,
        suspended: false,
        lastReviewed: null,
        createdAt: today
      }));

    return {
      version: STATE_VERSION,
      createdAt: new Date().toISOString(),
      settings: {
        startDate: today,
        tripDate: localISO(trip),
        weeklyTargetHours: 5,
        countries: [],
        theme: "system",
        onboardingComplete: false,
        experienceLevel: "beginner",
        preferredSessionMinutes: 15,
        reviewSessionLimit: 10
      },
      daily: {},
      deck: starterDeck,
      speakingLogs: [],
      scenarios: {},
      milestones: {},
      read2Speak: {
        courseId: "foundations",
        currentUnit: 1,
        units: {}
      },
      languageTransfer: {
        currentLesson: 1,
        completedLessons: [],
        notes: {}
      },
      finalPrep: {},
      achievements: {},
      totalReviews: 0,
      lastBackupAt: null
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      return normalizeState(JSON.parse(raw));
    } catch (error) {
      console.warn("Could not load saved progress:", error);
      startupStorageWarning = "Saved progress could not be read. A fresh local plan is open; import a backup before making changes if needed.";
      return defaultState();
    }
  }

  function normalizeState(saved) {
    const base = defaultState();
    if (!isObject(saved)) return base;

    const settings = isObject(saved.settings) ? saved.settings : {};
    const daily = {};
    if (isObject(saved.daily)) {
      Object.entries(saved.daily).forEach(([key, record]) => {
        const day = Number(key);
        if (!Number.isInteger(day) || day < 1 || day > 364 || !isObject(record)) return;
        daily[String(day)] = {
          completedTasks: Array.isArray(record.completedTasks)
            ? [...new Set(record.completedTasks.filter((id) => VALID_TASK_IDS.includes(id)))]
            : [],
          done: Boolean(record.done),
          hours: clamp(finiteNumber(record.hours), 0, 12),
          notes: typeof record.notes === "string" ? record.notes : "",
          completedDate: isDateString(record.completedDate) ? record.completedDate : null
        };
      });
    }

    const seenCardIds = new Set();
    const deck = (Array.isArray(saved.deck) ? saved.deck : base.deck)
      .filter(isObject)
      .map((card) => {
        const spanish = typeof card.spanish === "string" ? card.spanish.trim() : "";
        const english = typeof card.english === "string" ? card.english.trim() : "";
        if (!spanish || !english) return null;
        let id = typeof card.id === "string" && card.id ? card.id : uid("restored");
        if (seenCardIds.has(id)) id = uid("restored");
        seenCardIds.add(id);
        return {
          id,
          spanish,
          english,
          category: typeof card.category === "string" && card.category.trim() ? card.category.trim() : "Custom",
          source: typeof card.source === "string" && card.source.trim() ? card.source.trim() : "custom",
          reviewStage: clamp(Math.floor(finiteNumber(card.reviewStage)), 0, GOOD_INTERVALS.length),
          dueDate: isDateString(card.dueDate) ? card.dueDate : localISO(),
          correctCount: Math.max(0, Math.floor(finiteNumber(card.correctCount))),
          incorrectCount: Math.max(0, Math.floor(finiteNumber(card.incorrectCount))),
          suspended: Boolean(card.suspended),
          lastReviewed: isDateString(card.lastReviewed) ? card.lastReviewed : null,
          createdAt: isDateString(card.createdAt) ? card.createdAt : localISO()
        };
      })
      .filter(Boolean);

    const speakingLogs = (Array.isArray(saved.speakingLogs) ? saved.speakingLogs : [])
      .filter(isObject)
      .map((log) => {
        const normalized = CORE.normalizeSpeakingLog(log, {
          localISO,
          uid: () => uid("speak")
        });
        normalized.date = isDateString(normalized.date) ? normalized.date : localISO();
        return normalized;
      });

    const scenarios = {};
    if (isObject(saved.scenarios)) {
      DATA.scenarios.forEach((scenario) => {
        const record = saved.scenarios[scenario.id];
        if (!isObject(record)) return;
        scenarios[scenario.id] = {
          confidence: clamp(Math.round(finiteNumber(record.confidence, 3)), 1, 5),
          notes: typeof record.notes === "string" ? record.notes : "",
          completed: Boolean(record.completed),
          lastPractised: isDateString(record.lastPractised) ? record.lastPractised : null
        };
      });
    }

    const milestones = {};
    if (isObject(saved.milestones)) {
      DATA.milestones.forEach((milestone) => {
        const record = saved.milestones[String(milestone.month)];
        if (!isObject(record) || !["pass", "fail"].includes(record.result)) return;
        milestones[String(milestone.month)] = {
          result: record.result,
          confidence: clamp(Math.round(finiteNumber(record.confidence, 3)), 1, 5),
          notes: typeof record.notes === "string" ? record.notes : "",
          date: isDateString(record.date) ? record.date : localISO()
        };
      });
    }

    const savedRead2Speak = isObject(saved.read2Speak) ? saved.read2Speak : {};
    const course = DATA.read2SpeakCourses.find((item) => item.id === savedRead2Speak.courseId) ||
      DATA.read2SpeakCourses[0];
    const read2SpeakUnits = {};
    if (isObject(savedRead2Speak.units)) {
      Object.entries(savedRead2Speak.units).forEach(([key, record]) => {
        if (!isObject(record)) return;
        const [courseId, unitText] = key.split(":");
        const matchingCourse = DATA.read2SpeakCourses.find((item) => item.id === courseId);
        const unitNumber = Number(unitText);
        if (!matchingCourse || !matchingCourse.units.some((unit) => unit.number === unitNumber)) return;
        read2SpeakUnits[key] = {
          completedCheckpoints: Array.isArray(record.completedCheckpoints)
            ? [...new Set(record.completedCheckpoints.filter((id) =>
              DATA.read2SpeakCheckpoints.some((checkpoint) => checkpoint.id === id)
            ))]
            : [],
          notes: typeof record.notes === "string" ? record.notes : "",
          confidence: clamp(Math.round(finiteNumber(record.confidence, 3)), 1, 5),
          lastStudied: isDateString(record.lastStudied) ? record.lastStudied : null,
          reviewDate: isDateString(record.reviewDate) ? record.reviewDate : null
        };
      });
    }

    const savedLanguageTransfer = isObject(saved.languageTransfer) ? saved.languageTransfer : {};
    const completedLanguageTransferLessons = Array.isArray(savedLanguageTransfer.completedLessons)
      ? [...new Set(savedLanguageTransfer.completedLessons
        .map(Number)
        .filter((lesson) => Number.isInteger(lesson) && lesson >= 1 && lesson <= DATA.languageTransferCourse.lessonCount)
      )].sort((a, b) => a - b)
      : [];
    const languageTransferNotes = {};
    if (isObject(savedLanguageTransfer.notes)) {
      Object.entries(savedLanguageTransfer.notes).forEach(([key, note]) => {
        const lesson = Number(key);
        if (
          Number.isInteger(lesson) &&
          lesson >= 1 &&
          lesson <= DATA.languageTransferCourse.lessonCount &&
          typeof note === "string" &&
          note.trim()
        ) {
          languageTransferNotes[String(lesson)] = note;
        }
      });
    }

    const normalizedSettings = CORE.normalizeSettings({
      ...settings,
      startDate: isDateString(settings.startDate) ? settings.startDate : base.settings.startDate,
      tripDate: isDateString(settings.tripDate) ? settings.tripDate : base.settings.tripDate
    }, base.settings, DATA.countries);
    if (typeof settings.onboardingComplete !== "boolean" && finiteNumber(saved.version) >= 1) {
      normalizedSettings.onboardingComplete = true;
    }

    return {
      version: STATE_VERSION,
      createdAt: typeof saved.createdAt === "string" ? saved.createdAt : base.createdAt,
      settings: normalizedSettings,
      daily,
      deck,
      speakingLogs,
      scenarios,
      milestones,
      read2Speak: {
        courseId: course.id,
        currentUnit: clamp(
          Math.round(finiteNumber(savedRead2Speak.currentUnit, 1)),
          1,
          course.units.length
        ),
        units: read2SpeakUnits
      },
      languageTransfer: {
        currentLesson: clamp(
          Math.round(finiteNumber(savedLanguageTransfer.currentLesson, 1)),
          1,
          DATA.languageTransferCourse.lessonCount
        ),
        completedLessons: completedLanguageTransferLessons,
        notes: languageTransferNotes
      },
      finalPrep: isObject(saved.finalPrep)
        ? Object.fromEntries(DATA.finalPrep.map((item) => [item.id, Boolean(saved.finalPrep[item.id])]))
        : {},
      achievements: isObject(saved.achievements)
        ? Object.fromEntries(Object.entries(saved.achievements).filter(([id, date]) =>
          DATA.achievements.some((achievement) => achievement.id === id) && isDateString(date)
        ))
        : {},
      totalReviews: Math.max(0, Math.floor(finiteNumber(saved.totalReviews))),
      lastBackupAt: typeof saved.lastBackupAt === "string" && !Number.isNaN(Date.parse(saved.lastBackupAt))
        ? saved.lastBackupAt
        : null
    };
  }

  function saveState(message) {
    state.version = STATE_VERSION;
    evaluateAchievements();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Could not save progress:", error);
      showToast("Progress could not be saved. Check available browser storage.");
      return;
    }
    updateHeader();
    if (message) showToast(message);
  }

  function scheduleNotesSave() {
    clearTimeout(notesSaveTimer);
    notesSaveTimer = setTimeout(() => {
      notesSaveTimer = null;
      saveState();
    }, 350);
  }

  function flushNotesSave() {
    if (!notesSaveTimer) return;
    clearTimeout(notesSaveTimer);
    notesSaveTimer = null;
    saveState();
  }

  function applyTheme() {
    const theme = state.settings.theme;
    const dark = theme === "dark" ||
      (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.content = dark ? "#101817" : "#163c3a";
  }

  function planDayNumber(date = localISO()) {
    return clamp(daysBetween(state.settings.startDate, date) + 1, 1, 364);
  }

  function getCurrentTask() {
    const day = activeDayNumber || planDayNumber();
    return DATA.dailyTasks[day - 1];
  }

  function currentRead2SpeakCourse() {
    return DATA.read2SpeakCourses.find((course) => course.id === state.read2Speak.courseId) ||
      DATA.read2SpeakCourses[0];
  }

  function currentRead2SpeakUnit() {
    const course = currentRead2SpeakCourse();
    return course.units.find((unit) => unit.number === state.read2Speak.currentUnit) || course.units[0];
  }

  function clearRead2SpeakFiles() {
    Object.keys(read2SpeakFiles).forEach((resource) => {
      if (read2SpeakFiles[resource]?.url) URL.revokeObjectURL(read2SpeakFiles[resource].url);
      read2SpeakFiles[resource] = null;
    });
  }

  function read2SpeakUnitKey(courseId = state.read2Speak.courseId, unitNumber = state.read2Speak.currentUnit) {
    return `${courseId}:${unitNumber}`;
  }

  function getRead2SpeakUnitRecord(courseId, unitNumber, create = false) {
    const key = read2SpeakUnitKey(courseId, unitNumber);
    if (!state.read2Speak.units[key] && create) {
      state.read2Speak.units[key] = {
        completedCheckpoints: [],
        notes: "",
        confidence: 3,
        lastStudied: null,
        reviewDate: null
      };
    }
    return state.read2Speak.units[key] || {
      completedCheckpoints: [],
      notes: "",
      confidence: 3,
      lastStudied: null,
      reviewDate: null
    };
  }

  function read2SpeakUnitProgress(courseId, unitNumber) {
    const record = getRead2SpeakUnitRecord(courseId, unitNumber);
    const complete = record.completedCheckpoints.length;
    const total = DATA.read2SpeakCheckpoints.length;
    return { complete, total, percent: Math.round((complete / total) * 100) };
  }

  function nextRead2SpeakCheckpoint() {
    const record = getRead2SpeakUnitRecord(state.read2Speak.courseId, state.read2Speak.currentUnit);
    return DATA.read2SpeakCheckpoints.find((checkpoint) =>
      !record.completedCheckpoints.includes(checkpoint.id)
    ) || null;
  }

  function dailySubtasks(task) {
    const course = currentRead2SpeakCourse();
    const unit = currentRead2SpeakUnit();
    const checkpoint = nextRead2SpeakCheckpoint();
    return task.subtasks.map((subtask) => {
      if (subtask.id === "read") {
        return {
          ...subtask,
          title: `Read2Speak · ${course.level} Unit ${unit.number}`,
          detail: getDayRecord(task.day).completedTasks.includes("read")
            ? `Course work logged for this plan day.${checkpoint ? ` Next: ${checkpoint.title}.` : " This unit is complete."}`
            : checkpoint
              ? `${checkpoint.title}. ${checkpoint.detail}`
              : `${unit.title} is complete. Review weak points or move to the next unit in Resources.`
        };
      }
      if (subtask.id === "listen" && languageTransferProgress().complete < DATA.languageTransferCourse.lessonCount) {
        const lesson = state.languageTransfer.currentLesson;
        return {
          ...subtask,
          title: `Language Transfer · Lesson ${lesson}`,
          detail: getDayRecord(task.day).completedTasks.includes("listen")
            ? `Listening logged for this plan day. Next: Language Transfer Lesson ${state.languageTransfer.currentLesson}.`
            : `Complete Lesson ${lesson}. Pause before each answer, respond aloud, then replay anything that did not click.`
        };
      }
      return subtask;
    });
  }

  function languageTransferProgress() {
    const complete = state.languageTransfer.completedLessons.length;
    const total = DATA.languageTransferCourse.lessonCount;
    return { complete, total, percent: Math.round((complete / total) * 100) };
  }

  function nextIncompleteLanguageTransferLesson(afterLesson = 0) {
    const completed = new Set(state.languageTransfer.completedLessons);
    for (let lesson = afterLesson + 1; lesson <= DATA.languageTransferCourse.lessonCount; lesson += 1) {
      if (!completed.has(lesson)) return lesson;
    }
    for (let lesson = 1; lesson <= afterLesson; lesson += 1) {
      if (!completed.has(lesson)) return lesson;
    }
    return DATA.languageTransferCourse.lessonCount;
  }

  function setLanguageTransferLessonComplete(lesson, complete) {
    const completed = new Set(state.languageTransfer.completedLessons);
    if (complete) completed.add(lesson);
    else completed.delete(lesson);
    state.languageTransfer.completedLessons = [...completed].sort((a, b) => a - b);
    if (complete && lesson === state.languageTransfer.currentLesson) {
      state.languageTransfer.currentLesson = nextIncompleteLanguageTransferLesson(lesson);
    }
  }

  function getDayRecord(dayNumber, create = false) {
    const key = String(dayNumber);
    if (!state.daily[key] && create) {
      state.daily[key] = {
        completedTasks: [],
        done: false,
        hours: 0,
        notes: "",
        completedDate: null
      };
    }
    return state.daily[key] || {
      completedTasks: [],
      done: false,
      hours: 0,
      notes: "",
      completedDate: null
    };
  }

  function taskCompletion(dayNumber) {
    const record = getDayRecord(dayNumber);
    return Math.round((record.completedTasks.length / 5) * 100);
  }

  function isDayComplete(dayNumber) {
    const record = getDayRecord(dayNumber);
    return record.done || record.completedTasks.length === 5;
  }

  function completedDays() {
    return Object.keys(state.daily).filter((day) => isDayComplete(Number(day))).map(Number);
  }

  function dueCards() {
    return CORE.sortDueCards(state.deck, localISO());
  }

  function masteredCards() {
    return state.deck.filter((card) => !card.suspended && card.reviewStage >= 5);
  }

  function dueRead2SpeakReviews() {
    const today = localISO();
    return Object.entries(state.read2Speak.units)
      .filter(([, record]) => record.reviewDate && record.reviewDate <= today)
      .map(([key, record]) => {
        const [courseId, unitText] = key.split(":");
        const course = DATA.read2SpeakCourses.find((item) => item.id === courseId);
        const unit = course?.units.find((item) => item.number === Number(unitText));
        return course && unit ? { course, unit, record } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.record.reviewDate.localeCompare(b.record.reviewDate));
  }

  function staleScenarios(days = 30) {
    const today = localISO();
    return DATA.scenarios
      .map((scenario) => ({ scenario, record: state.scenarios[scenario.id] }))
      .filter(({ record }) =>
        record?.lastPractised && daysBetween(record.lastPractised, today) >= days
      )
      .sort((a, b) => a.record.lastPractised.localeCompare(b.record.lastPractised));
  }

  function scenarioAverage() {
    const scores = Object.values(state.scenarios)
      .map((item) => Number(item.confidence))
      .filter(Boolean);
    return scores.length ? scores.reduce((sum, value) => sum + value, 0) / scores.length : 0;
  }

  function startOfWeekISO() {
    const date = new Date();
    const day = date.getDay() || 7;
    date.setDate(date.getDate() - day + 1);
    return localISO(date);
  }

  function speakingMinutesThisWeek() {
    const start = startOfWeekISO();
    return state.speakingLogs
      .filter((log) => log.date >= start)
      .reduce((sum, log) => sum + Number(log.minutes || 0), 0);
  }

  function listeningMinutesThisWeek() {
    const current = planDayNumber();
    const weekStart = Math.max(1, current - ((current - 1) % 7));
    let minutes = 0;
    for (let day = weekStart; day <= current; day += 1) {
      const record = getDayRecord(day);
      if (record.completedTasks.includes("listen")) {
        const task = DATA.dailyTasks[day - 1].subtasks.find((item) => item.id === "listen");
        minutes += task.minutes;
      }
    }
    return minutes;
  }

  function totalListeningMinutes() {
    return Object.entries(state.daily).reduce((sum, [dayNumber, record]) => {
      if (!record.completedTasks?.includes("listen")) return sum;
      const task = DATA.dailyTasks[Number(dayNumber) - 1]?.subtasks.find((item) => item.id === "listen");
      return sum + Number(task?.minutes || 0);
    }, 0);
  }

  function totalHours() {
    return Object.values(state.daily).reduce((sum, day) => sum + Number(day.hours || 0), 0);
  }

  function hoursThisWeek() {
    const current = planDayNumber();
    const weekStart = current - ((current - 1) % 7);
    let hours = 0;
    for (let day = weekStart; day <= current; day += 1) {
      hours += Number(getDayRecord(day).hours || 0);
    }
    return hours;
  }

  function streaks() {
    const dates = [...new Set(
      Object.values(state.daily)
        .filter((record) => (record.done || record.completedTasks?.length === 5) && record.completedDate)
        .map((record) => record.completedDate)
    )];
    return CORE.calculateStreaks(dates, localISO(), daysBetween);
  }

  function weeklyCompletion() {
    const current = planDayNumber();
    const weekStart = current - ((current - 1) % 7);
    const elapsedDays = current - weekStart + 1;
    let complete = 0;
    for (let day = weekStart; day <= current; day += 1) {
      if (isDayComplete(day)) complete += 1;
    }
    return Math.round((complete / elapsedDays) * 100);
  }

  function monthlyCompletion() {
    const current = planDayNumber();
    const task = DATA.dailyTasks[current - 1];
    const monthDays = DATA.dailyTasks.filter((item) => item.month === task.month && item.day <= current);
    const complete = monthDays.filter((item) => isDayComplete(item.day)).length;
    return Math.round((complete / monthDays.length) * 100);
  }

  function readProgress() {
    const course = currentRead2SpeakCourse();
    const expected = course.units.length * DATA.read2SpeakCheckpoints.length;
    const complete = course.units.reduce((sum, unit) =>
      sum + read2SpeakUnitProgress(course.id, unit.number).complete, 0
    );
    return { complete, expected, percent: Math.round((complete / expected) * 100) };
  }

  function overallProgress() {
    const elapsed = planDayNumber();
    const complete = completedDays().filter((day) => day <= elapsed).length;
    return Math.round((complete / 364) * 100);
  }

  function evaluateAchievements() {
    const completed = completedDays().length;
    const streak = streaks().longest;
    const speaking = state.speakingLogs.reduce((sum, log) => sum + Number(log.minutes || 0), 0);
    const scenariosComplete = Object.values(state.scenarios).filter((item) => item.completed).length;
    const passedMilestones = Object.values(state.milestones).filter((item) => item.result === "pass").length;
    const conditions = {
      "first-day": completed >= 1,
      "three-day": streak >= 3,
      "seven-day": streak >= 7,
      "thirty-days": completed >= 30,
      "first-hour": totalHours() >= 1,
      "ten-hours": totalHours() >= 10,
      speaker: state.speakingLogs.length >= 1,
      "speaking-60": speaking >= 60,
      "review-50": state.totalReviews >= 50,
      "master-10": masteredCards().length >= 10,
      "scenario-3": scenariosComplete >= 3,
      "scenario-confidence": scenarioAverage() >= 4,
      "milestone-1": passedMilestones >= 1,
      "route-ready": state.settings.countries.length >= 3
    };
    Object.entries(conditions).forEach(([id, earned]) => {
      if (earned && !state.achievements[id]) state.achievements[id] = localISO();
    });
  }

  function updateHeader() {
    const task = DATA.dailyTasks[planDayNumber() - 1];
    $("#header-period").textContent = `Day ${task.day} · Week ${task.week} · Month ${task.month}`;
    $("#header-summary").innerHTML = `
      <strong>${overallProgress()}% of the journey</strong>
      <span>${completedDays().length} days · ${totalHours().toFixed(1)} hours</span>
    `;
  }

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.hidden = true;
    }, 2800);
  }

  function setActiveTab(tab, moveFocus = false) {
    flushNotesSave();
    const allowed = ["today", "review", "speaking", "scenarios", "more", "progress", "resources", "settings"];
    const previousTab = activeTab;
    activeTab = allowed.includes(tab) ? tab : "today";
    if (activeTab === "review" && previousTab !== "review") {
      reviewSessionReviewed = new Set();
      reviewRetryQueue = [];
      reviewSessionCardIds = [];
      reviewSessionOutcomes = new Map();
      reviewUndo = null;
      reviewCardId = null;
      reviewRevealed = false;
    }
    location.hash = activeTab;
    $$(".nav-item").forEach((button) => {
      const active = button.dataset.tab === activeTab ||
        (button.dataset.tab === "more" && ["progress", "resources", "settings"].includes(activeTab));
      button.classList.toggle("active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    if (previousTab === "speaking" && activeTab !== "speaking") stopTimer(false);
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (moveFocus) $("#view-title")?.focus({ preventScroll: true });
  }

  function viewHeader(title, description, extra = "") {
    return `
      <header class="view-header">
        <div>
          <h2 id="view-title" tabindex="-1">${escapeHTML(title)}</h2>
          <p>${escapeHTML(description)}</p>
        </div>
        ${extra}
      </header>
    `;
  }

  function progressBar(value, label = "") {
    const safeValue = clamp(Math.round(value || 0), 0, 100);
    return `
      ${label ? `<div class="progress-meta"><span>${escapeHTML(label)}</span><strong>${safeValue}%</strong></div>` : ""}
      <div class="progress-track" role="progressbar" aria-label="${escapeHTML(label || "Progress")}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${safeValue}">
        <div class="progress-fill" style="width:${safeValue}%"></div>
      </div>
    `;
  }

  function render() {
    const renderers = {
      today: renderToday,
      review: renderReview,
      speaking: renderSpeaking,
      scenarios: renderScenarios,
      more: renderMore,
      progress: renderProgress,
      resources: renderResources,
      settings: renderSettings
    };
    updateHeader();
    renderers[activeTab]();
  }

  function pwaStatus() {
    if (location.protocol === "file:") {
      return { label: "Browser-only mode", detail: "Use localhost or HTTPS to enable offline installation." };
    }
    if (!navigator.onLine) {
      return { label: "Offline", detail: offlineReady ? "The app shell is available offline." : "Some app files may not be cached yet." };
    }
    if (offlineReady) {
      return { label: "Offline ready", detail: "Core screens and saved progress remain available without signal." };
    }
    return { label: "Preparing offline", detail: "Keep this page open briefly while the app files are cached." };
  }

  function renderMore() {
    const status = pwaStatus();
    view.innerHTML = `
      ${viewHeader("More", "Progress, learning resources, settings, and app readiness.")}
      <section class="card card-accent">
        <div class="card-header">
          <div>
            <span class="badge ${offlineReady ? "" : "badge-muted"}">${escapeHTML(status.label)}</span>
            <h3 style="margin-top:.5rem">App status</h3>
            <p class="muted">${escapeHTML(status.detail)}</p>
          </div>
          ${pendingInstallPrompt ? `<button class="button button-small" type="button" data-action="install-app">Install app</button>` : ""}
        </div>
        ${!pendingInstallPrompt && !window.matchMedia("(display-mode: standalone)").matches ? `
          <p class="help-text">To install manually, use your browser’s “Add to Home Screen” or “Install app” command.</p>
        ` : ""}
      </section>
      <section class="more-grid">
        <button class="card more-card" type="button" data-action="go-tab" data-tab="progress">
          <span class="nav-icon" aria-hidden="true">▥</span>
          <span><strong>Progress</strong><small>Streaks, milestones, balance, and learning risks</small></span>
        </button>
        <button class="card more-card" type="button" data-action="go-tab" data-tab="resources">
          <span class="nav-icon" aria-hidden="true">◎</span>
          <span><strong>Resources</strong><small>Courses, listening ladder, regional notes, and final prep</small></span>
        </button>
        <button class="card more-card" type="button" data-action="go-tab" data-tab="settings">
          <span class="nav-icon" aria-hidden="true">⚙</span>
          <span><strong>Settings</strong><small>Plan preferences, backup, appearance, and storage</small></span>
        </button>
      </section>
    `;
  }

  function renderToday() {
    const task = getCurrentTask();
    const subtasks = dailySubtasks(task);
    const record = getDayRecord(task.day);
    const completion = taskCompletion(task.day);
    const todayDay = planDayNumber();
    const viewingDifferentDay = task.day !== todayDay;
    const tripDays = daysBetween(localISO(), state.settings.tripDate);
    const finalMode = tripDays >= 0 && tripDays <= 30;

    view.innerHTML = `
      ${viewHeader(
        viewingDifferentDay ? `Catch-up: Day ${task.day}` : "Today",
        `${task.phaseTitle}. A clear next step, built for the time you have.`
      )}
      ${viewingDifferentDay ? `
        <div class="inline-note" style="margin-bottom:.9rem">
          You are viewing an earlier plan day.
          <button class="button button-small button-secondary" type="button" data-action="return-today">Return to today</button>
        </div>` : ""}
      ${finalMode ? renderFinalPrepBanner(tripDays) : ""}
      <section class="card card-accent hero-card">
        <div class="hero-content">
          <div class="card-header">
            <div>
              <span class="badge">Day ${task.day} · ${task.label}</span>
              <h3 style="font-size:1.28rem;margin-top:.55rem">${escapeHTML(task.title)}</h3>
            </div>
            <span class="badge badge-accent">${task.targetMinutes} min</span>
          </div>
          ${progressBar(completion, "Today’s plan")}
          <p class="muted" style="margin:.8rem 0 0">Week ${task.week} · Month ${task.month}: ${escapeHTML(DATA.phases[task.month - 1].focus)}</p>
          <p class="muted" style="margin:.35rem 0 0">Course: ${escapeHTML(currentRead2SpeakCourse().level)} ${escapeHTML(currentRead2SpeakCourse().title)}, Unit ${currentRead2SpeakUnit().number} · ${escapeHTML(currentRead2SpeakUnit().title)}</p>
        </div>
      </section>

      <section class="card quick-session-card">
        <div class="card-header">
          <div>
            <h3>How much time do you have?</h3>
            <p class="muted">Build a focused session from what is due and unfinished.</p>
          </div>
          <span class="badge">${state.settings.preferredSessionMinutes} min usual</span>
        </div>
        <div class="timer-options">
          ${[5, 15, 30].map((minutes) => `
            <button class="button ${quickSession?.minutes === minutes ? "" : "button-secondary"}" type="button"
              data-action="build-session" data-minutes="${minutes}">${minutes} min</button>
          `).join("")}
        </div>
        ${quickSession ? renderQuickSession(quickSession) : `
          <p class="help-text" style="margin:.75rem 0 0">Choose a duration. The plan stays small enough to finish and does not mark anything complete automatically.</p>
        `}
      </section>

      <section class="card">
        <div class="card-header">
          <div>
            <h3>Your five steps</h3>
            <p class="muted">Tap each one as you finish. Partial days still count as useful work.</p>
          </div>
        </div>
        <ul class="task-list">
          ${subtasks.map((subtask) => {
            const checked = record.completedTasks.includes(subtask.id);
            return `
              <li class="task-item ${checked ? "completed" : ""}">
                <input class="task-check" id="task-${subtask.id}" type="checkbox"
                  data-action="toggle-daily-task" data-task-id="${subtask.id}" ${checked ? "checked" : ""}>
                <label class="task-copy" for="task-${subtask.id}">
                  <span class="task-title">${escapeHTML(subtask.title)} <span class="badge badge-muted">${subtask.minutes} min</span></span>
                  <span class="task-detail">${escapeHTML(subtask.detail)}</span>
                </label>
              </li>
            `;
          }).join("")}
        </ul>
        <div class="button-row" style="margin-top:.8rem">
          <button class="button button-small button-secondary" type="button" data-action="go-tab" data-tab="resources">Open Read2Speak course</button>
        </div>
      </section>

      <section class="grid grid-2" style="margin-top:.9rem">
        <div class="card">
          <h3>What should I do now?</h3>
          <p class="muted">Get one recommendation based on reviews, today’s work, and this week’s balance.</p>
          <button class="button button-accent" type="button" data-action="recommend">Choose my next action</button>
          ${recommendation ? `
            <div class="recommendation" style="margin-top:.9rem">
              <h3>${escapeHTML(recommendation.action)}</h3>
              <p>${escapeHTML(recommendation.reason)}</p>
              ${recommendation.tab ? `<button class="button button-small" type="button" data-action="go-tab" data-tab="${recommendation.tab}">Start now</button>` : ""}
            </div>` : ""}
        </div>

        <div class="card">
          <h3>Short on time?</h3>
          <p class="muted">Keep the chain alive with pronunciation, one phrase, and one minute of speaking.</p>
          <div class="button-row">
            <button class="button button-secondary" type="button" data-action="fallback">5-minute fallback</button>
            <button class="button button-secondary" type="button" data-action="catch-up">Catch up</button>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="grid grid-2">
          <div class="form-group">
            <label for="day-hours">${viewingDifferentDay ? "Hours logged for this plan day" : "Hours logged today"}</label>
            <input class="input" id="day-hours" type="number" min="0" max="12" step="0.1" value="${Number(record.hours || 0)}" data-action="day-hours">
          </div>
          <div class="form-group">
            <label for="day-notes">Daily notes</label>
            <textarea id="day-notes" placeholder="What clicked? What needs another pass?" data-action="day-notes">${escapeHTML(record.notes || "")}</textarea>
          </div>
        </div>
        <div class="button-row" style="margin-top:.9rem">
          <button class="button" type="button" data-action="mark-day-done" ${isDayComplete(task.day) ? "disabled" : ""}>${isDayComplete(task.day) ? "All five steps complete" : "Complete all five steps"}</button>
          ${isDayComplete(task.day) ? `<span class="badge">Completed ${formatDate(record.completedDate || localISO())}</span>` : ""}
        </div>
        <p class="help-text" style="margin:.55rem 0 0">This records the daily checklist only. Read2Speak and Language Transfer progress changes in Resources when you complete the corresponding work.</p>
      </section>
    `;
  }

  function buildQuickSession(minutes) {
    const task = getCurrentTask();
    const record = getDayRecord(task.day);
    const due = dueCards().length;
    const candidates = [];

    if (due) {
      const reviewMinutes = minutes === 5 ? 3 : Math.min(8, Math.max(4, Math.round(minutes * 0.3)));
      candidates.push({
        title: `Review ${Math.min(due, minutes === 5 ? 3 : state.settings.reviewSessionLimit)} due phrases`,
        detail: "Retrieve each answer aloud before revealing it.",
        minutes: reviewMinutes,
        tab: "review"
      });
    }

    const tabByTask = {
      read: "resources",
      listen: "resources",
      speak: "speaking",
      review: "review",
      travel: "scenarios"
    };
    dailySubtasks(task)
      .filter((subtask) => !record.completedTasks.includes(subtask.id))
      .forEach((subtask) => candidates.push({
        title: subtask.title,
        detail: subtask.detail,
        minutes: Math.min(subtask.minutes, minutes === 5 ? 2 : subtask.minutes),
        tab: tabByTask[subtask.id]
      }));

    if (!candidates.some((item) => item.tab === "speaking")) {
      candidates.push({
        title: "Short speaking activation",
        detail: "Answer today’s prompt without stopping to translate.",
        minutes: minutes === 5 ? 2 : 3,
        tab: "speaking"
      });
    }

    const selected = [];
    let remaining = minutes;
    candidates.forEach((candidate) => {
      if (candidate.minutes <= remaining && (minutes > 5 || selected.length < 2)) {
        selected.push(candidate);
        remaining -= candidate.minutes;
      }
    });

    if (!selected.length) selected.push({ ...candidates[0], minutes });
    else if (remaining > 0) {
      selected.push({
        title: "Quick recall and notes",
        detail: "Say the most useful phrase from this session once more, then note what to revisit.",
        minutes: remaining,
        tab: "today"
      });
    }
    return { minutes, items: selected };
  }

  function renderQuickSession(session) {
    return `
      <div class="quick-session-plan">
        <div class="progress-meta"><span>Your ${session.minutes}-minute session</span><strong>${session.items.length} steps</strong></div>
        <ol class="session-list">
          ${session.items.map((item) => `
            <li>
              <span class="session-minutes">${item.minutes} min</span>
              <div>
                <strong>${escapeHTML(item.title)}</strong>
                <p class="muted">${escapeHTML(item.detail)}</p>
                <button class="button button-small button-secondary" type="button" data-action="go-tab" data-tab="${item.tab}">Open</button>
              </div>
            </li>
          `).join("")}
        </ol>
      </div>
    `;
  }

  function renderFinalPrepBanner(days) {
    const complete = DATA.finalPrep.filter((item) => state.finalPrep[item.id]).length;
    return `
      <section class="card card-accent" style="margin-bottom:.9rem">
        <div class="card-header">
          <div>
            <span class="badge badge-accent">Final prep mode</span>
            <h3 style="margin-top:.4rem">${days === 0 ? "Departure day" : `${days} days until your trip`}</h3>
            <p class="muted">${complete} of ${DATA.finalPrep.length} readiness checks complete.</p>
          </div>
          <button class="button button-small" type="button" data-action="go-tab" data-tab="resources">Open checklist</button>
        </div>
        ${progressBar((complete / DATA.finalPrep.length) * 100, "Departure readiness")}
      </section>
    `;
  }

  function smartRecommendation() {
    const task = getCurrentTask();
    const record = getDayRecord(task.day);
    const due = dueCards().length;
    if (due) {
      return { action: `Review ${Math.min(due, 10)} due phrase${due === 1 ? "" : "s"}`, reason: `${due} card${due === 1 ? " is" : "s are"} due. Clearing these first protects long-term recall.`, tab: "review" };
    }
    const courseReview = dueRead2SpeakReviews()[0];
    if (courseReview) {
      return {
        action: `Review ${courseReview.course.level} Unit ${courseReview.unit.number}`,
        reason: `You scheduled ${courseReview.unit.title} for review on ${formatDate(courseReview.record.reviewDate)}.`,
        tab: "resources"
      };
    }
    const staleScenario = staleScenarios()[0];
    if (staleScenario) {
      return {
        action: `Revisit ${staleScenario.scenario.title}`,
        reason: `You last practised this scenario ${daysBetween(staleScenario.record.lastPractised, localISO())} days ago.`,
        tab: "scenarios"
      };
    }

    const priorities = ["read", "listen", "speak", "review", "travel"];
    const incomplete = priorities.find((id) => !record.completedTasks.includes(id));
    if (incomplete) {
      const subtask = dailySubtasks(task).find((item) => item.id === incomplete);
      return { action: subtask.title, reason: `${subtask.detail} This is the highest-priority unfinished part of today’s plan.`, tab: incomplete === "speak" ? "speaking" : null };
    }
    if (speakingMinutesThisWeek() < 20) {
      return { action: "Do a 2-minute speaking prompt", reason: `You have logged ${speakingMinutesThisWeek()} speaking minutes this week. Short, frequent retrieval builds fluency.`, tab: "speaking" };
    }
    if (listeningMinutesThisWeek() < 60) {
      return { action: "Complete one listening ladder session", reason: `You have ${listeningMinutesThisWeek()} planned listening minutes this week. More input will make real speech less surprising.`, tab: "resources" };
    }
    const read = readProgress();
    if (read.percent < 75) {
      const checkpoint = nextRead2SpeakCheckpoint();
      return {
        action: checkpoint?.title || "Review your current Read2Speak unit",
        reason: `${read.complete} of ${read.expected} course checkpoints are complete. One focused checkpoint is enough.`,
        tab: "resources"
      };
    }
    if (scenarioAverage() < 3.5) {
      return { action: "Practise your weakest travel scenario", reason: `Average scenario confidence is ${scenarioAverage().toFixed(1)} out of 5. Rehearsal reduces the load in real situations.`, tab: "scenarios" };
    }
    return { action: "Choose light, enjoyable Spanish input", reason: "Your core work is balanced. Finish with optional listening that keeps Spanish pleasant.", tab: "resources" };
  }

  function showFallback() {
    openModal(`
      <div class="modal-header">
        <div><span class="badge badge-accent">5 minutes</span><h2 style="margin-top:.35rem">Keep Spanish warm</h2></div>
        <button class="icon-button" type="button" data-action="close-modal" aria-label="Close">×</button>
      </div>
      <ol>
        <li><strong>1 minute:</strong> Read a short part of your current Read2Speak section aloud three times.</li>
        <li><strong>2 minutes:</strong> Review three due or favourite travel phrases aloud.</li>
        <li><strong>1 minute:</strong> Answer: “¿Qué voy a hacer mañana?” without stopping.</li>
        <li><strong>1 minute:</strong> Listen to a short Spanish clip and copy one sentence.</li>
      </ol>
      <p class="inline-note">A fallback is a deliberate small day, not a failed full day.</p>
      <button class="button" type="button" data-action="complete-fallback">Log fallback</button>
    `);
  }

  function findCatchUpDay() {
    const current = planDayNumber();
    for (let day = current - 1; day >= Math.max(1, current - 14); day -= 1) {
      if (!isDayComplete(day)) return day;
    }
    return null;
  }

  function renderReview() {
    const due = dueCards();
    if (!reviewSessionCardIds.length && due.length) {
      reviewSessionCardIds = due.slice(0, state.settings.reviewSessionLimit).map((card) => card.id);
    }
    const sessionCards = reviewSessionCardIds
      .map((id) => state.deck.find((card) => card.id === id))
      .filter((card) => card && !card.suspended);
    const firstPass = sessionCards.filter((card) => !reviewSessionReviewed.has(card.id));
    if (!reviewCardId || !sessionCards.some((card) => card.id === reviewCardId)) {
      reviewCardId = firstPass[0]?.id || null;
      while (!reviewCardId && reviewRetryQueue.length) {
        const retryId = reviewRetryQueue.shift();
        if (sessionCards.some((card) => card.id === retryId)) reviewCardId = retryId;
      }
      reviewRevealed = false;
    }
    const card = state.deck.find((item) => item.id === reviewCardId);
    const firstPassComplete = reviewSessionCardIds.filter((id) => reviewSessionReviewed.has(id)).length;
    const moreDue = due.some((item) => !reviewSessionCardIds.includes(item.id));
    const currentIsRetry = Boolean(card && reviewSessionReviewed.has(card.id));
    const retryCount = reviewRetryQueue.length + (currentIsRetry ? 1 : 0);
    const recalledCount = [...reviewSessionOutcomes.values()].filter((rating) => rating !== "again").length;
    const needsPracticeCount = [...reviewSessionOutcomes.values()].filter((rating) => rating === "again").length;
    const promptIsEnglish = reviewPromptDirection === "english";
    const batchComplete = Boolean(
      reviewSessionCardIds.length &&
      firstPassComplete === reviewSessionCardIds.length &&
      !retryCount &&
      !card
    );

    view.innerHTML = `
      ${viewHeader(
        "Phrase review",
        "Retrieve the phrase aloud before revealing it.",
        `<button class="button button-small button-secondary" type="button" data-action="toggle-review-direction">
          ${promptIsEnglish ? "English → Spanish" : "Spanish → English"}
        </button>`
      )}
      <section class="stats-grid">
        <div class="stat"><span class="stat-value">${due.length}</span><span class="stat-label">Due now</span></div>
        <div class="stat"><span class="stat-value">${firstPassComplete}/${reviewSessionCardIds.length || 0}</span><span class="stat-label">First pass</span></div>
        <div class="stat"><span class="stat-value">${retryCount}</span><span class="stat-label">Retries waiting</span></div>
        <div class="stat"><span class="stat-value">${masteredCards().length}</span><span class="stat-label">Mastered</span></div>
      </section>

      <section class="card phrase-card">
        ${reviewUndo ? `
          <div class="review-undo" role="status">
            <span>Rated <strong>${escapeHTML(reviewUndo.ratingLabel)}</strong>.</span>
            <button class="button button-small button-secondary" type="button" data-action="undo-review">Undo</button>
          </div>
        ` : ""}
        ${card ? `
          <div class="review-progress">
            <strong>${currentIsRetry ? "Retry" : `Card ${firstPassComplete + 1} of ${reviewSessionCardIds.length}`}</strong>
            <span>${firstPass.length} first-pass card${firstPass.length === 1 ? "" : "s"} left${retryCount ? ` · ${retryCount} retr${retryCount === 1 ? "y" : "ies"}` : ""}</span>
          </div>
          <div class="chip-row" style="justify-content:center;margin-bottom:.8rem">
            <span class="badge">${escapeHTML(card.category)}</span>
            <span class="badge badge-muted">${escapeHTML(card.source)}</span>
            <span class="badge badge-muted">Stage ${card.reviewStage}</span>
          </div>
          <p class="review-prompt-label">${promptIsEnglish ? "Say this in Spanish" : "What does this mean?"}</p>
          <div class="phrase-prompt" ${promptIsEnglish ? "" : `lang="es"`}>${escapeHTML(promptIsEnglish ? card.english : card.spanish)}</div>
          ${reviewRevealed ? `
            <div class="phrase-answer" ${promptIsEnglish ? `lang="es"` : ""}>${escapeHTML(promptIsEnglish ? card.spanish : card.english)}</div>
            <p class="muted">${promptIsEnglish ? "Say the Spanish once more, then rate your first attempt." : "Check the meaning, then rate your first attempt."}</p>
            <div class="review-actions">
              ${renderReviewRatingButton(card, "again", "Again", "Couldn’t recall", "button-secondary", "1")}
              ${renderReviewRatingButton(card, "hard", "Hard", "Recalled with effort", "button-secondary", "2")}
              ${renderReviewRatingButton(card, "good", "Good", "Recalled correctly", "", "3")}
              ${renderReviewRatingButton(card, "easy", "Easy", "Immediate and confident", "button-accent", "4")}
            </div>
          ` : `<button class="button" type="button" data-action="reveal-review">Show answer</button>`}
          <p class="keyboard-hint">Keyboard: <kbd>Space</kbd> reveal · <kbd>1</kbd>–<kbd>4</kbd> rate</p>
        ` : `
          <div class="empty-state">
            <h3>${batchComplete ? "Review batch complete" : "All caught up"}</h3>
            <p>${batchComplete
              ? `${reviewSessionCardIds.length} cards completed.${moreDue ? " More due cards are ready when you are." : " You cleared the due queue."}`
              : "No phrase reviews are due today. Add a useful phrase or come back tomorrow."}</p>
            ${reviewSessionOutcomes.size ? `
              <p class="review-summary"><strong>${recalledCount} recalled</strong> · <strong>${needsPracticeCount} needed another attempt</strong></p>
            ` : ""}
            ${moreDue ? `<button class="button" type="button" data-action="next-review-batch">Review next ${Math.min(state.settings.reviewSessionLimit, due.length)} cards</button>` : ""}
            ${due.length && !moreDue ? `<button class="button button-secondary" type="button" data-action="restart-review">Review due cards again</button>` : ""}
          </div>
        `}
      </section>

      <details class="details review-management">
        <summary>Manage phrases · ${state.deck.length} in your deck · ${DATA.phrasebook.length} in phrasebook</summary>
        <div class="details-body">
          <section class="grid grid-2">
            <form class="card stack" id="add-phrase-form">
              <div>
                <h3>Add a custom phrase</h3>
                <p class="muted">Prefer complete chunks you expect to say, not isolated words.</p>
              </div>
              <div class="form-group">
                <label for="phrase-spanish">Spanish</label>
                <input class="input" id="phrase-spanish" name="spanish" lang="es" required>
              </div>
              <div class="form-group">
                <label for="phrase-english">English</label>
                <input class="input" id="phrase-english" name="english" required>
              </div>
              <div class="form-group">
                <label for="phrase-category">Category</label>
                <input class="input" id="phrase-category" name="category" value="Custom">
              </div>
              <button class="button" type="submit">Add to review deck</button>
            </form>

            <div class="card">
              <div class="card-header">
                <div><h3>Travel phrasebook</h3><p class="muted">Search practical phrases and add the ones you expect to use.</p></div>
              </div>
              <div class="form-group" style="margin-bottom:.7rem">
                <label for="phrasebook-filter">Filter phrases</label>
                <input class="input" id="phrasebook-filter" type="search" placeholder="Food, bus, pharmacy…" data-action="filter-phrasebook">
              </div>
              <div id="phrasebook-list" class="resource-list">
                ${renderPhrasebookItems("")}
              </div>
            </div>
          </section>

          <section class="card">
            <div class="card-header">
              <div><h3>Manage deck</h3><p class="muted">Edit, pause, or remove phrases. CSV columns are ready for a simple Anki import.</p></div>
              <button class="button button-secondary" type="button" data-action="export-csv">Export review deck CSV</button>
            </div>
            <div class="form-group" style="margin-bottom:.7rem">
              <label for="deck-filter">Filter your deck</label>
              <input class="input" id="deck-filter" type="search" placeholder="Phrase, meaning, or category" data-action="filter-deck">
            </div>
            <div id="deck-list" class="resource-list">${renderDeckItems("")}</div>
          </section>
        </div>
      </details>
    `;
  }

  function reviewRatingSchedule(card, rating) {
    const today = localISO();
    const next = CORE.rateReviewCard(card, rating, today, addDays);
    if (rating === "again") return "Retry this session";
    const days = Math.max(1, daysBetween(today, next.dueDate));
    if (days === 1) return "Tomorrow";
    return `In ${days} days`;
  }

  function renderReviewRatingButton(card, rating, label, guidance, className, shortcut) {
    return `
      <button class="button ${className}" type="button" data-action="rate-review" data-rating="${rating}" aria-label="${label}: ${guidance}. ${reviewRatingSchedule(card, rating)}. Shortcut ${shortcut}">
        ${label}
        <small>${guidance}</small>
        <small>${reviewRatingSchedule(card, rating)}</small>
      </button>
    `;
  }

  function resetReviewSession() {
    reviewSessionReviewed = new Set();
    reviewRetryQueue = [];
    reviewSessionCardIds = [];
    reviewSessionOutcomes = new Map();
    reviewUndo = null;
    reviewCardId = null;
    reviewRevealed = false;
  }

  function undoReview() {
    if (!reviewUndo) return;
    const card = state.deck.find((item) => item.id === reviewUndo.card.id);
    if (!card) {
      reviewUndo = null;
      renderReview();
      return;
    }
    Object.assign(card, reviewUndo.card);
    state.totalReviews = reviewUndo.totalReviews;
    reviewSessionReviewed = new Set(reviewUndo.reviewed);
    reviewRetryQueue = [...reviewUndo.retryQueue];
    reviewSessionOutcomes = new Map(reviewUndo.outcomes);
    reviewCardId = reviewUndo.card.id;
    reviewRevealed = true;
    reviewUndo = null;
    saveState("Last rating undone.");
    renderReview();
  }

  function renderPhrasebookItems(filter) {
    const normalized = filter.trim().toLowerCase();
    const existing = new Set(state.deck.map((card) => card.id));
    const phrases = DATA.phrasebook.filter((phrase) =>
      !normalized ||
      `${phrase.spanish} ${phrase.english} ${phrase.category}`.toLowerCase().includes(normalized)
    ).slice(0, normalized ? 30 : 8);
    return phrases.map((phrase) => `
      <div class="list-card">
        <div class="list-card-header">
          <div>
            <strong lang="es">${escapeHTML(phrase.spanish)}</strong>
            <p class="muted">${escapeHTML(phrase.english)} · ${escapeHTML(phrase.category)}</p>
          </div>
          <button class="button button-small button-secondary" type="button" data-action="add-phrasebook" data-id="${phrase.id}" ${existing.has(phrase.id) ? "disabled" : ""}>
            ${existing.has(phrase.id) ? "Added" : "Add"}
          </button>
        </div>
      </div>
    `).join("") || `<p class="empty-state">No matching phrases.</p>`;
  }

  function renderDeckItems(filter) {
    const normalized = filter.trim().toLowerCase();
    const cards = state.deck
      .filter((card) =>
        !normalized ||
        `${card.spanish} ${card.english} ${card.category}`.toLowerCase().includes(normalized)
      )
      .sort((a, b) => Number(a.suspended) - Number(b.suspended) || a.spanish.localeCompare(b.spanish));
    return cards.map((card) => `
      <div class="list-card deck-item ${card.suspended ? "is-suspended" : ""}">
        <div class="list-card-header">
          <div>
            <strong lang="es">${escapeHTML(card.spanish)}</strong>
            <p class="muted">${escapeHTML(card.english)} · ${escapeHTML(card.category)} · ${card.suspended ? "Paused" : `Due ${formatDate(card.dueDate)}`}</p>
          </div>
          <div class="button-row">
            <button class="button button-small button-secondary" type="button" data-action="edit-card" data-id="${escapeHTML(card.id)}">Edit</button>
            <button class="button button-small button-secondary" type="button" data-action="toggle-card-suspended" data-id="${escapeHTML(card.id)}">${card.suspended ? "Resume" : "Pause"}</button>
            <button class="button button-small button-danger" type="button" data-action="delete-card" data-id="${escapeHTML(card.id)}">Delete</button>
          </div>
        </div>
      </div>
    `).join("") || `<p class="empty-state">No matching cards.</p>`;
  }

  function duplicateCard(spanish, excludeId = "") {
    const normalized = spanish.trim().toLocaleLowerCase();
    return state.deck.find((card) =>
      card.id !== excludeId && card.spanish.trim().toLocaleLowerCase() === normalized
    );
  }

  function openCardEditor(id) {
    const card = state.deck.find((item) => item.id === id);
    if (!card) return;
    openModal(`
      <div class="modal-header">
        <h2>Edit phrase</h2>
        <button class="icon-button" type="button" data-action="close-modal" aria-label="Close">×</button>
      </div>
      <form id="edit-card-form" class="stack">
        <input type="hidden" name="cardId" value="${escapeHTML(card.id)}">
        <div class="form-group">
          <label for="edit-card-spanish">Spanish</label>
          <input class="input" id="edit-card-spanish" name="spanish" lang="es" value="${escapeHTML(card.spanish)}" required>
        </div>
        <div class="form-group">
          <label for="edit-card-english">English</label>
          <input class="input" id="edit-card-english" name="english" value="${escapeHTML(card.english)}" required>
        </div>
        <div class="form-group">
          <label for="edit-card-category">Category</label>
          <input class="input" id="edit-card-category" name="category" value="${escapeHTML(card.category)}">
        </div>
        <button class="button" type="submit">Save phrase</button>
      </form>
    `);
  }

  function rateReview(rating) {
    const card = state.deck.find((item) => item.id === reviewCardId);
    if (!card || !reviewRevealed || !["again", "hard", "good", "easy"].includes(rating)) return;
    const today = localISO();
    reviewUndo = {
      card: { ...card },
      totalReviews: state.totalReviews,
      reviewed: [...reviewSessionReviewed],
      retryQueue: [...reviewRetryQueue],
      outcomes: [...reviewSessionOutcomes],
      ratingLabel: rating[0].toUpperCase() + rating.slice(1)
    };
    Object.assign(card, CORE.rateReviewCard(card, rating, today, addDays));
    if (rating === "again" && !reviewRetryQueue.includes(card.id)) reviewRetryQueue.push(card.id);
    if (!reviewSessionOutcomes.has(card.id)) reviewSessionOutcomes.set(card.id, rating);
    state.totalReviews += 1;
    reviewSessionReviewed.add(card.id);
    reviewCardId = null;
    reviewRevealed = false;
    saveState();
    renderReview();
  }

  function recommendedSpeakingExercise() {
    const exercises = DATA.speakingExercises;
    const weakLog = state.speakingLogs
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8)
      .find((log) => log.retrieval <= 2 && exercises.some((exercise) => exercise.id === log.exerciseId));
    if (weakLog) return exercises.find((exercise) => exercise.id === weakLog.exerciseId);

    const stale = staleScenarios(10)
      .map(({ scenario }) => exercises.find((exercise) => exercise.id === scenario.id))
      .find(Boolean);
    return stale || exercises[(planDayNumber() - 1) % exercises.length];
  }

  function currentSpeakingExercise() {
    const exercises = DATA.speakingExercises;
    const selected = exercises.find((exercise) => exercise.id === speakingExerciseId);
    const exercise = selected || recommendedSpeakingExercise();
    speakingExerciseId = exercise.id;
    return exercise;
  }

  function speakingMinutesForSession() {
    const activeSeconds = Math.max(0, timerSeconds - timerRemaining);
    return Math.max(1, Math.ceil((speakingElapsedSeconds + activeSeconds) / 60));
  }

  function resetSpeakingSession(resetExercise = false) {
    stopTimer(false);
    timerRemaining = timerSeconds;
    speakingPass = 1;
    speakingPassOneComplete = false;
    speakingSessionComplete = false;
    speakingElapsedSeconds = 0;
    if (resetExercise) speakingExerciseId = null;
  }

  function renderSpeakingSupport(exercise, open = false) {
    return `
      <details class="details speaking-support" ${open ? "open" : ""}>
        <summary>Need help? Show phrase support</summary>
        <div class="details-body">
          ${exercise.support.map(([spanish, english]) => `
            <div class="support-phrase">
              <strong lang="es">${escapeHTML(spanish)}</strong>
              <span class="muted">${escapeHTML(english)}</span>
            </div>
          `).join("")}
        </div>
      </details>
    `;
  }

  function renderSpeaking() {
    const exercise = currentSpeakingExercise();
    const weekly = speakingMinutesThisWeek();
    const recent = state.speakingLogs.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
    const timerStarted = timerRemaining < timerSeconds || Boolean(timerInterval);
    const passLabel = speakingPass === 1 ? "First attempt" : "Second attempt";
    view.innerHTML = `
      ${viewHeader("Speaking", "Build the habit of retrieving Spanish before you need it in the real world.")}
      <section class="card card-accent speaking-session">
        <div class="card-header">
          <div>
            <span class="badge">${speakingSessionComplete ? "Reflect" : passLabel}</span>
            <h3>${escapeHTML(exercise.title)}</h3>
          </div>
          <button class="button button-small button-secondary" type="button" data-action="different-speaking-exercise">Different exercise</button>
        </div>
        <p class="speaking-prompt">${escapeHTML(exercise.prompt)}</p>

        <div class="speaking-guidance">
          <div>
            <strong>Communication targets</strong>
            <ul>${exercise.targets.map((target) => `<li>${escapeHTML(target)}</li>`).join("")}</ul>
          </div>
          <div>
            <strong>Keep going with</strong>
            <ul>${exercise.followUps.map((question) => `<li>${escapeHTML(question)}</li>`).join("")}</ul>
          </div>
        </div>

        ${!speakingSessionComplete ? `
          ${renderSpeakingSupport(exercise, speakingPassOneComplete)}
          ${!timerStarted && !speakingPassOneComplete ? `
            <div class="timer-options" aria-label="Timer duration">
              ${[60, 120, 300].map((seconds) => `
                <button class="button ${timerSeconds === seconds ? "" : "button-secondary"}" type="button" data-action="set-timer" data-seconds="${seconds}">
                  ${seconds / 60} min
                </button>`).join("")}
            </div>
          ` : ""}
          <div class="timer-display ${timerRemaining === 0 ? "timer-finished" : ""}" id="timer-display" aria-live="off">${formatTimer(timerRemaining)}</div>
          ${speakingPassOneComplete && speakingPass === 1 ? `
            <div class="speaking-transition">
              <strong>First attempt complete.</strong>
              <p>Review only what you need, then repeat the same task with fewer pauses or clearer detail.</p>
              <div class="button-row">
                <button class="button" type="button" data-action="start-second-speaking-pass">Start second attempt</button>
                <button class="button button-secondary" type="button" data-action="finish-one-speaking-pass">Reflect after one attempt</button>
              </div>
            </div>
          ` : `
            <div class="button-row speaking-timer-actions">
              <button class="button" type="button" data-action="toggle-timer">
                ${timerInterval ? "Pause" : (timerStarted ? "Resume" : `Start ${passLabel.toLowerCase()}`)}
              </button>
              ${timerStarted ? `<button class="button button-secondary" type="button" data-action="finish-speaking-pass">Finish attempt</button>` : ""}
              <button class="button button-secondary" type="button" data-action="reset-speaking-session">Reset</button>
            </div>
          `}
          <p class="help-text speaking-instruction">Speak without reading a script. Keep moving with simpler Spanish when a word is missing.</p>
        ` : `
          <form class="speaking-reflection" id="speaking-log-form">
            <input type="hidden" name="exerciseId" value="${escapeHTML(exercise.id)}">
            <input type="hidden" name="prompt" value="${escapeHTML(exercise.prompt)}">
            <input type="hidden" name="minutes" value="${speakingMinutesForSession()}">
            <input type="hidden" name="passes" value="${speakingPassOneComplete && speakingPass === 2 ? 2 : 1}">
            <div class="form-group">
              <span class="label">How easily could you retrieve the Spanish?</span>
              <div class="retrieval-options">
                ${[
                  [1, "Mostly stuck"],
                  [2, "Frequent pauses"],
                  [3, "Some pauses"],
                  [4, "Mostly fluid"],
                  [5, "Comfortable"]
                ].map(([value, label]) => `
                  <label class="choice-chip">
                    <input type="radio" name="retrieval" value="${value}" ${value === 3 ? "checked" : ""}>
                    <span>${label}</span>
                  </label>
                `).join("")}
              </div>
            </div>
            ${speakingPass === 2 ? `
              <div class="form-group">
                <span class="label">Compared with the first attempt</span>
                <div class="choice-row">
                  <label class="choice-chip"><input type="radio" name="improved" value="yes" checked><span>Easier</span></label>
                  <label class="choice-chip"><input type="radio" name="improved" value="same"><span>About the same</span></label>
                  <label class="choice-chip"><input type="radio" name="improved" value="harder"><span>Harder</span></label>
                </div>
              </div>
            ` : `<input type="hidden" name="improved" value="not-compared">`}
            <div class="form-group">
              <label for="speaking-focus">Main thing to work on</label>
              <select id="speaking-focus" name="focus">
                ${[
                  ["", "No single issue"],
                  ["vocabulary", "Finding useful words and phrases"],
                  ["grammar", "Building accurate sentences"],
                  ["pronunciation", "Pronunciation and rhythm"],
                  ["listening-response", "Reacting without preparation"],
                  ["confidence", "Continuing under pressure"],
                  ["fluency", "Connecting ideas smoothly"]
                ].map(([value, label]) => `<option value="${value}" ${value === exercise.focus ? "selected" : ""}>${label}</option>`).join("")}
              </select>
            </div>
            <details class="details speaking-reflection-more">
              <summary>Add a phrase or reflection</summary>
              <div class="details-body">
                <div class="form-group">
                  <label for="stuck-phrase">Spanish phrase I got stuck on</label>
                  <input class="input" id="stuck-phrase" name="stuckPhrase" lang="es" placeholder="The Spanish phrase, even if incomplete">
                </div>
                <div class="form-group">
                  <label for="stuck-meaning">Meaning for a review card</label>
                  <input class="input" id="stuck-meaning" name="stuckMeaning" placeholder="Optional English meaning">
                </div>
                <label class="check-option">
                  <input type="checkbox" name="savePhrase"> Save the complete phrase to Review
                </label>
                <div class="form-group">
                  <label for="speaking-notes">One useful note for next time</label>
                  <textarea id="speaking-notes" name="notes" placeholder="What helped, or what will you change?"></textarea>
                </div>
              </div>
            </details>
            <div class="speaking-save-row">
              <p class="muted">${speakingMinutesForSession()} min · ${weekly} min already logged this week</p>
              <button class="button" type="submit">Save practice</button>
            </div>
          </form>
        `}
      </section>

      <section class="card">
        <div class="card-header">
          <div><h3>Recent speaking</h3><p class="muted">Repeat difficult exercises and notice what becomes easier.</p></div>
          <span class="badge">${weekly} min this week</span>
        </div>
        <div class="resource-list">
          ${recent.length ? recent.map((log) => `
            <div class="list-card speaking-log">
              <div class="list-card-header">
                <div>
                  <div class="speaking-log-title">
                    <strong>${escapeHTML(DATA.speakingExercises.find((exerciseItem) => exerciseItem.id === log.exerciseId)?.title || log.prompt)}</strong>
                    ${log.retrieval <= 2 ? `<span class="badge badge-muted">Retry</span>` : ""}
                  </div>
                  <p class="muted">${formatDate(log.date)} · ${log.minutes} min · ${log.passes} ${log.passes === 1 ? "attempt" : "attempts"} · ${["", "Mostly stuck", "Frequent pauses", "Some pauses", "Mostly fluid", "Comfortable"][log.retrieval]}</p>
                  ${log.focus ? `<p>Focus: ${escapeHTML(log.focus.replace("-", " "))}</p>` : ""}
                  ${log.stuckPhrase ? `<p lang="es">Stuck on: ${escapeHTML(log.stuckPhrase)}</p>` : ""}
                  ${log.notes ? `<p class="muted">${escapeHTML(log.notes)}</p>` : ""}
                </div>
                <div class="button-row">
                  ${log.exerciseId && DATA.speakingExercises.some((exerciseItem) => exerciseItem.id === log.exerciseId)
                    ? `<button class="button button-small button-secondary" type="button" data-action="repeat-speaking-exercise" data-id="${escapeHTML(log.exerciseId)}">Repeat</button>`
                    : ""}
                  <button class="button button-small button-danger" type="button" data-action="delete-speaking-log" data-id="${log.id}">Delete</button>
                </div>
              </div>
            </div>`).join("") : `<p class="empty-state">Your first speaking log will appear here.</p>`}
        </div>
      </section>
    `;
  }

  function completeSpeakingPass() {
    const elapsed = timerRemaining <= 0 ? timerSeconds : timerSeconds - timerRemaining;
    if (elapsed < 1) {
      showToast("Start speaking before finishing the attempt.");
      return;
    }
    speakingElapsedSeconds += elapsed;
    stopTimer(false);
    timerRemaining = 0;
    if (speakingPass === 1) speakingPassOneComplete = true;
    else speakingSessionComplete = true;
    renderSpeaking();
  }

  function startSecondSpeakingPass() {
    speakingPass = 2;
    timerRemaining = timerSeconds;
    speakingSessionComplete = false;
    renderSpeaking();
  }

  function formatTimer(seconds) {
    const safeSeconds = Math.max(0, seconds);
    const mins = Math.floor(safeSeconds / 60);
    const secs = safeSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  function toggleTimer() {
    if (timerInterval) {
      stopTimer(false);
      renderSpeaking();
      return;
    }
    if (timerRemaining <= 0) return;
    timerInterval = setInterval(() => {
      timerRemaining = Math.max(0, timerRemaining - 1);
      const display = $("#timer-display");
      if (display) display.textContent = formatTimer(timerRemaining);
      if (timerRemaining === 0) {
        completeSpeakingPass();
        showToast(speakingPassOneComplete && speakingPass === 1
          ? "First attempt complete. Review what you need, then repeat it."
          : "Second attempt complete. Log what changed.");
      }
    }, 1000);
    renderSpeaking();
  }

  function stopTimer(reset = false) {
    clearInterval(timerInterval);
    timerInterval = null;
    if (reset) timerRemaining = timerSeconds;
  }

  function renderScenarios() {
    const avg = scenarioAverage();
    const completed = Object.values(state.scenarios).filter((item) => item.completed).length;
    const stale = staleScenarios()[0];
    const attempted = DATA.scenarios
      .filter((scenario) => state.scenarios[scenario.id])
      .sort((a, b) =>
        Number(state.scenarios[a.id].confidence) - Number(state.scenarios[b.id].confidence) ||
        String(state.scenarios[a.id].lastPractised || "").localeCompare(String(state.scenarios[b.id].lastPractised || ""))
      )[0];
    const unattempted = DATA.scenarios.find((scenario) => !state.scenarios[scenario.id]);
    const recommended = stale?.scenario || (attempted && state.scenarios[attempted.id].confidence < 4 ? attempted : unattempted) || attempted;
    const recommendationReason = stale
      ? `You last practised this ${daysBetween(stale.record.lastPractised, localISO())} days ago. Revisit it before it fades.`
      : recommended && state.scenarios[recommended.id]
        ? `Your confidence is ${state.scenarios[recommended.id].confidence}/5. Another full run should make the sequence easier to retrieve.`
        : "This scenario is still untested. Try one full run without looking at the Spanish first.";
    const needsPractice = DATA.scenarios.filter((scenario) =>
      !state.scenarios[scenario.id] || state.scenarios[scenario.id].confidence < 4
    ).length;

    view.innerHTML = `
      ${viewHeader("Travel scenarios", "Rehearse complete situations so useful Spanish arrives as a sequence, not a word hunt.")}
      <section class="stats-grid">
        <div class="stat"><span class="stat-value">${completed}/${DATA.scenarios.length}</span><span class="stat-label">Completed</span></div>
        <div class="stat"><span class="stat-value">${avg ? avg.toFixed(1) : "—"}</span><span class="stat-label">Average confidence</span></div>
        <div class="stat"><span class="stat-value">${Object.keys(state.scenarios).length}</span><span class="stat-label">Attempted</span></div>
        <div class="stat"><span class="stat-value">${needsPractice}</span><span class="stat-label">Need practice</span></div>
      </section>
      ${recommended ? `
        <section class="card card-accent">
          <div class="card-header">
            <div><span class="badge badge-accent">Recommended</span><h3 style="margin-top:.4rem">${escapeHTML(recommended.title)}</h3><p class="muted">${escapeHTML(recommendationReason)}</p></div>
            <button class="button" type="button" data-action="open-scenario" data-id="${recommended.id}">Start rehearsal</button>
          </div>
        </section>` : ""}
      <section class="scenario-list">
        ${DATA.scenarios.map((scenario) => {
          const progress = state.scenarios[scenario.id] || {};
          return `
            <article class="card">
              <div class="list-card-header">
                <div>
                  <div class="chip-row">
                    <span class="badge">${escapeHTML(scenario.category)}</span>
                    ${progress.completed ? `<span class="badge badge-accent">Completed</span>` : ""}
                  </div>
                  <h3 style="margin-top:.55rem">${escapeHTML(scenario.title)}</h3>
                  <p class="muted">${escapeHTML(scenario.situation)}</p>
                </div>
                <span class="badge badge-muted">Confidence ${progress.confidence || "—"}/5</span>
              </div>
              <button class="button button-secondary" type="button" data-action="open-scenario" data-id="${scenario.id}">
                ${progress.completed ? "Practise again" : "Open scenario"}
              </button>
            </article>
          `;
        }).join("")}
      </section>
    `;
  }

  function openScenario(id) {
    const scenario = DATA.scenarios.find((item) => item.id === id);
    if (!scenario) return;
    const progress = state.scenarios[id] || { confidence: 3, completed: false, notes: "" };
    const lastPractised = progress.lastPractised
      ? `<span class="badge badge-muted">Last practised ${escapeHTML(formatDate(progress.lastPractised))}</span>`
      : `<span class="badge badge-muted">First attempt</span>`;
    openModal(`
      <div class="modal-header">
        <div>
          <div class="chip-row"><span class="badge">${escapeHTML(scenario.category)}</span>${lastPractised}</div>
          <h2 style="margin-top:.35rem">${escapeHTML(scenario.title)}</h2>
        </div>
        <button class="icon-button" type="button" data-action="close-modal" aria-label="Close">×</button>
      </div>
      <p>${escapeHTML(scenario.situation)}</p>
      <section class="scenario-round" aria-labelledby="scenario-round-one">
        <span class="scenario-step" aria-hidden="true">1</span>
        <div>
          <h3 id="scenario-round-one">First pass: no help</h3>
          <p class="muted">Speak aloud. Join these ideas into one natural exchange before opening the support below.</p>
          <ol class="scenario-cues">
            ${scenario.cues.map((cue) => `<li>${escapeHTML(cue)}</li>`).join("")}
          </ol>
        </div>
      </section>
      <details class="details scenario-support">
        <summary>Reveal phrase support</summary>
        <div class="details-body">
          <h3>Key vocabulary</h3>
          <div class="chip-row">${scenario.vocabulary.map((word) => `<span class="chip" lang="es">${escapeHTML(word)}</span>`).join("")}</div>
          <h3 style="margin-top:1rem">Useful phrases</h3>
          <ul>${scenario.phrases.map((phrase) => `<li lang="es">${escapeHTML(phrase)}</li>`).join("")}</ul>
        </div>
      </details>
      <section class="scenario-round scenario-round-challenge" aria-labelledby="scenario-round-two">
        <span class="scenario-step" aria-hidden="true">2</span>
        <div>
          <h3 id="scenario-round-two">Second pass: handle the complication</h3>
          <p class="muted">Play both roles. Keep going for at least three turns each, even if the wording is imperfect.</p>
          <p><strong>Your complication:</strong> ${escapeHTML(scenario.roleplay)}</p>
        </div>
      </section>
      <form id="scenario-form" class="stack scenario-reflection">
        <input type="hidden" name="scenarioId" value="${scenario.id}">
        <div class="form-group">
          <label for="scenario-confidence">How ready would you feel in real life? <span id="scenario-confidence-value">${progress.confidence || 3}</span>/5</label>
          <input id="scenario-confidence" name="confidence" type="range" min="1" max="5" value="${progress.confidence || 3}" data-action="range-output" data-output="scenario-confidence-value">
          <span class="range-labels" aria-hidden="true"><span>Blocked</span><span>Managed it</span><span>Ready</span></span>
        </div>
        <div class="form-group">
          <label for="scenario-notes">What should be easier next time?</label>
          <textarea id="scenario-notes" name="notes" placeholder="A phrase to retrieve faster, a question to understand, or a detail to personalise…">${escapeHTML(progress.notes || "")}</textarea>
        </div>
        <details class="details">
          <summary>Add a difficult phrase to Review</summary>
          <div class="details-body stack">
            <p class="help-text">Save one phrase you needed during the roleplay so spaced repetition brings it back later.</p>
            <div class="form-group">
              <label for="scenario-stuck-phrase">Spanish phrase</label>
              <input class="input" id="scenario-stuck-phrase" name="stuckPhrase" lang="es" autocomplete="off">
            </div>
            <div class="form-group">
              <label for="scenario-stuck-meaning">Meaning or cue</label>
              <input class="input" id="scenario-stuck-meaning" name="stuckMeaning" autocomplete="off">
            </div>
            <label class="check-option"><input type="checkbox" name="savePhrase" checked> Add this phrase to Review</label>
          </div>
        </details>
        <label class="check-option"><input type="checkbox" name="completed" ${progress.completed ? "checked" : ""}> I completed both speaking passes</label>
        <button class="button" type="submit">Save rehearsal</button>
      </form>
    `);
  }

  function weaknesses() {
    const issues = [];
    const due = dueCards().length;
    const courseReviews = dueRead2SpeakReviews();
    const staleScenarioList = staleScenarios();
    const speaking = speakingMinutesThisWeek();
    const listening = listeningMinutesThisWeek();
    const read = readProgress();
    const current = planDayNumber();
    const dayInWeek = ((current - 1) % 7) + 1;
    const skipped = Array.from({ length: Math.min(current - 1, 14) }, (_, index) => current - 1 - index)
      .filter((day) => day > 0 && !isDayComplete(day)).length;
    const currentMonth = DATA.dailyTasks[current - 1].month;

    if (due >= 10) issues.push({
      issue: `${due} phrase reviews are due`,
      why: "A growing queue makes useful phrases slower to retrieve and future sessions harder to start.",
      action: "Review 10 cards now, then pause adding new phrases.",
      tab: "review"
    });
    if (courseReviews.length) issues.push({
      issue: `${courseReviews.length} Read2Speak review${courseReviews.length === 1 ? " is" : "s are"} due`,
      why: "A scheduled return tests whether the unit remains retrievable after the first study session.",
      action: `Revisit ${courseReviews[0].course.level} Unit ${courseReviews[0].unit.number} and set a new review date.`,
      tab: "resources"
    });
    if (staleScenarioList.length) issues.push({
      issue: `${staleScenarioList.length} practised scenario${staleScenarioList.length === 1 ? " has" : "s have"} gone quiet`,
      why: "Complete interactions fade when they are not retrieved for several weeks.",
      action: `Revisit ${staleScenarioList[0].scenario.title}, playing both roles.`,
      tab: "scenarios"
    });
    if (dayInWeek >= 4 && speaking < 20) issues.push({
      issue: `Only ${speaking} speaking minutes this week`,
      why: "Understanding does not automatically become fast spoken retrieval.",
      action: "Do one two-minute prompt today and log it.",
      tab: "speaking"
    });
    if (dayInWeek >= 4 && listening < 45) issues.push({
      issue: `Only ${listening} planned listening minutes this week`,
      why: "Regular input trains your ear for speed, accent variation, and connected speech.",
      action: languageTransferProgress().complete < DATA.languageTransferCourse.lessonCount
        ? `Complete Language Transfer Lesson ${state.languageTransfer.currentLesson}.`
        : "Choose one 10-minute session at your current ladder stage.",
      tab: "resources"
    });
    if (read.percent < 65 && current > 7) issues.push({
      issue: `Read2Speak course progress is ${read.percent}%`,
      why: "The paired eBook and workbook sequence provides the structured language progression behind the travel plan.",
      action: "Complete the next course checkpoint only, then stop.",
      tab: "resources"
    });
    if (scenarioAverage() < 3 && Object.keys(state.scenarios).length) issues.push({
      issue: `Scenario confidence averages ${scenarioAverage().toFixed(1)}/5`,
      why: "Low confidence often means the language has not yet been rehearsed as a full interaction.",
      action: "Repeat your lowest-scoring scenario, playing both roles.",
      tab: "scenarios"
    });
    if (skipped >= 6) issues.push({
      issue: `${skipped} of the last 14 plan days are incomplete`,
      why: "Trying to repay every missed task can create an unmanageable backlog.",
      action: "Use the five-minute fallback today, then continue from the current day.",
      tab: "today"
    });
    if (currentMonth > 1 && !state.milestones[String(currentMonth - 1)]) issues.push({
      issue: `Month ${currentMonth - 1} milestone is not recorded`,
      why: "A monthly output check shows whether study is transferring into practical use.",
      action: "Attempt it once without notes and record the result.",
      tab: "progress"
    });
    return issues;
  }

  function renderProgress() {
    evaluateAchievements();
    const current = planDayNumber();
    const currentTask = DATA.dailyTasks[current - 1];
    const streak = streaks();
    const read = readProgress();
    const languageTransfer = languageTransferProgress();
    const listen = listeningMinutesThisWeek();
    const speakingTotal = state.speakingLogs.reduce((sum, log) => sum + Number(log.minutes || 0), 0);
    const issues = weaknesses();
    const achievementsEarned = Object.keys(state.achievements).length;

    view.innerHTML = `
      ${viewHeader("Progress", "See what is accumulating, spot the weak link, and choose a useful weekly focus.")}
      <section class="card progress-hero">
        <div class="ring" style="--value:${overallProgress()}">
          <div class="ring-label"><strong>${overallProgress()}%</strong><span>of 364 days</span></div>
        </div>
        <div class="progress-hero-copy">
          <span class="badge">Day ${current}</span>
          <h3 style="font-size:1.3rem;margin-top:.45rem">${completedDays().length} study days complete</h3>
          <p class="muted">${totalHours().toFixed(1)} hours logged · ${streak.current}-day current streak</p>
        </div>
      </section>

      <section class="stats-grid">
        <div class="stat"><span class="stat-value">${taskCompletion(current)}%</span><span class="stat-label">Today</span></div>
        <div class="stat"><span class="stat-value">${weeklyCompletion()}%</span><span class="stat-label">This week</span></div>
        <div class="stat"><span class="stat-value">${monthlyCompletion()}%</span><span class="stat-label">Month ${currentTask.month}</span></div>
        <div class="stat"><span class="stat-value">${streak.longest}</span><span class="stat-label">Longest streak</span></div>
      </section>

      <section class="grid grid-2">
        <div class="card stack">
          <h3>Learning balance</h3>
          ${progressBar(Math.min(100, (hoursThisWeek() / state.settings.weeklyTargetHours) * 100), `Study time ${hoursThisWeek().toFixed(1)}/${state.settings.weeklyTargetHours} hours this week`)}
          ${progressBar(read.percent, `Read2Speak course ${read.complete}/${read.expected} checkpoints`)}
          ${progressBar(languageTransfer.percent, `Language Transfer ${languageTransfer.complete}/${languageTransfer.total} lessons`)}
          ${progressBar(Math.min(100, (listen / 90) * 100), `Listening ${listen} min this week`)}
          ${progressBar(Math.min(100, (speakingMinutesThisWeek() / 30) * 100), `Speaking ${speakingMinutesThisWeek()} min this week`)}
          ${progressBar(state.deck.length ? (masteredCards().length / state.deck.length) * 100 : 0, `Phrases ${masteredCards().length}/${state.deck.length} mastered`)}
          ${progressBar((scenarioAverage() / 5) * 100, `Scenario confidence ${scenarioAverage().toFixed(1)}/5`)}
          <p class="inline-note">${totalListeningMinutes()} total listening minutes · ${languageTransfer.complete} Language Transfer lessons · ${speakingTotal} total speaking minutes · ${state.totalReviews} phrase reviews completed.</p>
        </div>
        <div class="card">
          <h3>Weekly focus</h3>
          ${completedDays().length === 0 ? `
            <div class="recommendation">
              <strong>Complete the first useful step</strong>
              <p>Start with today’s Read2Speak task. A partial first day is enough to establish the routine.</p>
              <button class="button button-small" type="button" data-action="go-tab" data-tab="today">Open today</button>
            </div>
          ` : issues.length ? `
            <div class="recommendation">
              <strong>${escapeHTML(issues[0].issue)}</strong>
              <p>${escapeHTML(issues[0].action)}</p>
              <button class="button button-small" type="button" data-action="go-tab" data-tab="${issues[0].tab}">Work on this</button>
            </div>
          ` : `
            <div class="list-card success">
              <strong>Your learning mix looks balanced.</strong>
              <p>Keep the current rhythm and use optional time for enjoyable listening or a route-specific scenario.</p>
            </div>
          `}
        </div>
      </section>

      <section class="card">
        <div class="card-header"><div><h3>Learning risks</h3><p class="muted">These are prompts to rebalance, not grades.</p></div><span class="badge">${issues.length} active</span></div>
        <div class="issue-list">
          ${issues.length ? issues.map((item) => `
            <div class="list-card issue">
              <strong>${escapeHTML(item.issue)}</strong>
              <p><span class="muted">Why it matters:</span> ${escapeHTML(item.why)}</p>
              <p><span class="muted">Next action:</span> ${escapeHTML(item.action)}</p>
              <button class="button button-small button-secondary" type="button" data-action="go-tab" data-tab="${item.tab}">Open</button>
            </div>
          `).join("") : `<div class="list-card success"><strong>No major risks detected.</strong><p>Your current activity is reasonably balanced.</p></div>`}
        </div>
      </section>

      <section class="card">
        <div class="card-header"><div><h3>Monthly milestones</h3><p class="muted">Attempt these without notes first. A fail is useful diagnostic information.</p></div></div>
        <div class="stack">
          ${DATA.milestones.map((milestone) => {
            const result = state.milestones[String(milestone.month)];
            return `
              <details class="details" ${milestone.month === currentTask.month ? "open" : ""}>
                <summary>Month ${milestone.month}: ${escapeHTML(milestone.task)} ${result ? `· ${result.result === "pass" ? "Passed" : "Retry"}` : ""}</summary>
                <div class="details-body">
                  <form class="milestone-form stack" data-month="${milestone.month}">
                    <div class="grid grid-3">
                      <div class="form-group">
                        <label for="milestone-result-${milestone.month}">Result</label>
                        <select id="milestone-result-${milestone.month}" name="result">
                          <option value="">Not attempted</option>
                          <option value="pass" ${result?.result === "pass" ? "selected" : ""}>Pass</option>
                          <option value="fail" ${result?.result === "fail" ? "selected" : ""}>Needs another attempt</option>
                        </select>
                      </div>
                      <div class="form-group">
                        <label for="milestone-confidence-${milestone.month}">Confidence (1-5)</label>
                        <input class="input" id="milestone-confidence-${milestone.month}" name="confidence" type="number" min="1" max="5" value="${result?.confidence || 3}">
                      </div>
                      <div class="form-group">
                        <label for="milestone-date-${milestone.month}">Date</label>
                        <input class="input" id="milestone-date-${milestone.month}" name="date" type="date" value="${result?.date || localISO()}">
                      </div>
                    </div>
                    <div class="form-group">
                      <label for="milestone-notes-${milestone.month}">Notes</label>
                      <textarea id="milestone-notes-${milestone.month}" name="notes">${escapeHTML(result?.notes || "")}</textarea>
                    </div>
                    <button class="button button-small" type="submit">Save milestone</button>
                  </form>
                </div>
              </details>
            `;
          }).join("")}
        </div>
      </section>

      <section class="card">
        <div class="card-header"><div><h3>Achievements</h3><p class="muted">${achievementsEarned} of ${DATA.achievements.length} unlocked.</p></div></div>
        <div class="achievement-list grid grid-2">
          ${DATA.achievements.map((achievement) => {
            const earned = state.achievements[achievement.id];
            return `
              <div class="list-card achievement ${earned ? "" : "locked"}">
                <span class="achievement-mark">${escapeHTML(achievement.mark)}</span>
                <div><strong>${escapeHTML(achievement.title)}</strong><p class="muted">${escapeHTML(achievement.description)}${earned ? ` · ${formatDate(earned)}` : ""}</p></div>
              </div>
            `;
          }).join("")}
        </div>
      </section>
    `;
  }

  function renderRead2SpeakCourse() {
    const course = currentRead2SpeakCourse();
    const unit = currentRead2SpeakUnit();
    const record = getRead2SpeakUnitRecord(course.id, unit.number);
    const unitProgress = read2SpeakUnitProgress(course.id, unit.number);
    const courseProgress = readProgress();
    const nextCheckpoint = nextRead2SpeakCheckpoint();
    const unitComplete = unitProgress.complete === unitProgress.total;
    const canMoveNext = unit.number < course.units.length;

    return `
      <section class="card card-accent read2speak-course">
        <div class="card-header">
          <div>
            <span class="badge badge-accent">Paired course</span>
            <h3 style="margin-top:.45rem">Read2Speak course workspace</h3>
            <p class="muted">Study the eBook first, complete the matching workbook exercises in order, check answers, then review and retry.</p>
          </div>
          <span class="badge">${courseProgress.complete}/${courseProgress.expected} checkpoints</span>
        </div>

        <div class="grid grid-2">
          <div class="form-group">
            <label for="read2speak-course">Course level</label>
            <select id="read2speak-course" data-action="select-read2speak-course">
              ${DATA.read2SpeakCourses.map((item) => `
                <option value="${item.id}" ${item.id === course.id ? "selected" : ""}>${escapeHTML(item.level)} · ${escapeHTML(item.title)}</option>
              `).join("")}
            </select>
          </div>
          <div class="form-group">
            <label for="read2speak-unit">Current workbook unit</label>
            <select id="read2speak-unit" data-action="select-read2speak-unit">
              ${course.units.map((item) => `
                <option value="${item.number}" ${item.number === unit.number ? "selected" : ""}>Unit ${item.number}: ${escapeHTML(item.title)}</option>
              `).join("")}
            </select>
          </div>
        </div>

        <div class="course-unit-heading">
          <div>
            <span class="badge">${escapeHTML(course.level)} Unit ${unit.number}</span>
            <h3>${escapeHTML(unit.title)}</h3>
            <p class="muted">eBook PDF pages ${unit.ebook.startPage}–${unit.ebook.endPage} · Workbook PDF pages ${unit.workbook.startPage}–${unit.workbook.endPage}</p>
          </div>
          <strong>${unitProgress.percent}%</strong>
        </div>
        ${progressBar(unitProgress.percent, `Unit ${unit.number} workflow`)}

        ${unit.alignment ? `
          <p class="inline-note course-warning"><strong>Edition note:</strong> ${escapeHTML(unit.alignment)}</p>
        ` : ""}

        <div class="grid grid-2 course-files">
          ${["ebook", "workbook"].map((resource) => {
            const selected = read2SpeakFiles[resource];
            const resourceLabel = resource === "ebook" ? "eBook" : "Workbook";
            const page = unit[resource].startPage;
            return `
              <div class="list-card">
                <strong>${resourceLabel}</strong>
                <p class="muted">${selected ? escapeHTML(selected.name) : "Choose your licensed PDF for this browser session."}</p>
                <div class="button-row">
                  <label class="button button-small button-secondary file-button">
                    Choose PDF
                    <input class="hidden" type="file" accept="application/pdf,.pdf" data-action="select-read2speak-pdf" data-resource="${resource}">
                  </label>
                  <button class="button button-small" type="button" data-action="open-read2speak-pdf"
                    data-resource="${resource}" data-page="${page}" ${selected ? "" : "disabled"}>
                    Open page ${page}
                  </button>
                </div>
              </div>
            `;
          }).join("")}
        </div>
        <p class="help-text">PDFs are opened from your device and are not uploaded, saved in app storage, or included in offline caching. Re-select them after reopening the app.</p>

        <div class="card-header course-next">
          <div>
            <h3>${nextCheckpoint ? "Next checkpoint" : "Unit complete"}</h3>
            <p class="muted">${nextCheckpoint ? escapeHTML(nextCheckpoint.title) : "All paired study, practice, correction, and activation checkpoints are complete."}</p>
          </div>
          ${unitComplete && canMoveNext ? `<button class="button button-small button-accent" type="button" data-action="next-read2speak-unit">Start Unit ${unit.number + 1}</button>` : ""}
        </div>

        <div class="task-list course-checkpoints">
          ${DATA.read2SpeakCheckpoints.map((checkpoint) => {
            const checked = record.completedCheckpoints.includes(checkpoint.id);
            return `
              <label class="task-item ${checked ? "completed" : ""}">
                <input class="task-check" type="checkbox" data-action="toggle-read2speak-checkpoint"
                  data-checkpoint-id="${checkpoint.id}" ${checked ? "checked" : ""}>
                <span class="task-copy">
                  <span class="task-title">${escapeHTML(checkpoint.title)} <span class="badge badge-muted">${escapeHTML(checkpoint.resource)}</span></span>
                  <span class="task-detail">${escapeHTML(checkpoint.detail)}</span>
                </span>
              </label>
            `;
          }).join("")}
        </div>

        <div class="grid grid-2 course-reflection">
          <div class="form-group">
            <label for="read2speak-notes">Unit notes</label>
            <textarea id="read2speak-notes" data-action="read2speak-notes" placeholder="Mistakes to revisit, useful patterns, or phrases to mine...">${escapeHTML(record.notes)}</textarea>
          </div>
          <div class="stack">
            <div class="form-group">
              <label for="read2speak-confidence">Confidence: <span id="read2speak-confidence-value">${record.confidence}</span>/5</label>
              <input id="read2speak-confidence" type="range" min="1" max="5" value="${record.confidence}"
                data-action="read2speak-confidence" data-output="read2speak-confidence-value">
            </div>
            <div class="form-group">
              <label for="read2speak-review-date">Review again</label>
              <input class="input" id="read2speak-review-date" type="date" value="${record.reviewDate || ""}" data-action="read2speak-review-date">
            </div>
            <p class="help-text">${record.lastStudied ? `Last studied ${formatDate(record.lastStudied)}.` : "No checkpoint has been completed yet."}</p>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="card-header">
          <div><h3>${escapeHTML(course.title)} unit overview</h3><p class="muted">The workbook order is authoritative where the supplied editions differ.</p></div>
          <span class="badge">${course.units.filter((item) => read2SpeakUnitProgress(course.id, item.number).percent === 100).length}/${course.units.length} units</span>
        </div>
        <div class="course-unit-list">
          ${course.units.map((item) => {
            const progress = read2SpeakUnitProgress(course.id, item.number);
            return `
              <button class="course-unit-button ${item.number === unit.number ? "active" : ""}" type="button"
                data-action="open-read2speak-unit" data-unit="${item.number}" aria-label="Open Unit ${item.number}: ${escapeHTML(item.title)}">
                <span><strong>Unit ${item.number}</strong><small>${escapeHTML(item.title)}</small></span>
                <span class="badge ${progress.percent === 100 ? "" : "badge-muted"}">${progress.percent}%</span>
              </button>
            `;
          }).join("")}
        </div>
      </section>
    `;
  }

  function renderLanguageTransferCourse() {
    const course = DATA.languageTransferCourse;
    const lesson = state.languageTransfer.currentLesson;
    const progress = languageTransferProgress();
    const complete = state.languageTransfer.completedLessons.includes(lesson);
    const notes = state.languageTransfer.notes[String(lesson)] || "";

    return `
      <section class="card card-accent language-transfer-course">
        <div class="card-header">
          <div>
            <span class="badge badge-accent">90-lesson audio course</span>
            <h3 style="margin-top:.45rem">Language Transfer · Complete Spanish</h3>
            <p class="muted">Pause before the learner answers, respond aloud yourself, then continue. The app tracks sequence and reflection; the audio remains on Language Transfer.</p>
          </div>
          <span class="badge">${progress.complete}/${progress.total} lessons</span>
        </div>

        ${progressBar(progress.percent, "Language Transfer course")}

        <div class="language-transfer-current">
          <div>
            <span class="badge ${complete ? "" : "badge-muted"}">${complete ? "Completed" : "Current lesson"}</span>
            <h3>Lesson ${lesson}</h3>
            <p class="muted">${complete ? "This lesson is complete. You can revisit it or choose another lesson below." : "Listen actively, pause often, and answer every prompt aloud."}</p>
          </div>
          <div class="button-row">
            <a class="button button-secondary" href="${course.url}" target="_blank" rel="noopener noreferrer">Open course <span aria-hidden="true">↗</span></a>
            <button class="button ${complete ? "button-secondary" : "button-accent"}" type="button"
              data-action="toggle-language-transfer-current" data-complete="${complete}">
              ${complete ? "Mark incomplete" : "Complete and continue"}
            </button>
          </div>
        </div>

        <div class="form-group language-transfer-notes">
          <label for="language-transfer-notes">Lesson ${lesson} notes</label>
          <textarea id="language-transfer-notes" data-action="language-transfer-notes"
            placeholder="What clicked? Which transformation needs another pass?">${escapeHTML(notes)}</textarea>
        </div>

        <div class="language-transfer-ranges">
          ${course.ranges.map((range) => `
            <details class="details" ${lesson >= range.start && lesson <= range.end ? "open" : ""}>
              <summary>Lessons ${range.start}–${range.end} · ${state.languageTransfer.completedLessons.filter((item) => item >= range.start && item <= range.end).length}/${range.end - range.start + 1}</summary>
              <div class="details-body lesson-grid">
                ${course.lessons.filter((item) => item.number >= range.start && item.number <= range.end).map((item) => {
                  const isComplete = state.languageTransfer.completedLessons.includes(item.number);
                  return `
                    <button class="lesson-button ${item.number === lesson ? "active" : ""} ${isComplete ? "completed" : ""}"
                      type="button" data-action="open-language-transfer-lesson" data-lesson="${item.number}"
                      aria-label="Open Language Transfer Lesson ${item.number}${isComplete ? ", completed" : ""}">
                      <span>${item.number}</span>
                      <small>${isComplete ? "Done" : "Open"}</small>
                    </button>
                  `;
                }).join("")}
              </div>
            </details>
          `).join("")}
        </div>
      </section>
    `;
  }

  function renderResources() {
    const currentStage = DATA.dailyTasks[planDayNumber() - 1].listeningStage;
    const selectedNotes = state.settings.countries.map((country) => [country, DATA.regionalNotes[country]]);
    const tripDays = daysBetween(localISO(), state.settings.tripDate);
    const showFinal = tripDays >= 0 && tripDays <= 30;

    view.innerHTML = `
      ${viewHeader("Resources", "A small, purposeful library. External links need internet; your plan and progress do not.")}
      ${renderRead2SpeakCourse()}
      ${renderLanguageTransferCourse()}
      <section class="grid grid-2">
        ${DATA.resources.map((resource) => `
          <article class="card">
            <h3>${escapeHTML(resource.title)}</h3>
            <p class="muted">${escapeHTML(resource.description)}</p>
            <div class="button-row">
              ${(resource.links || (resource.url ? [["Open resource", resource.url]] : [])).map(([label, url]) => `
                <a class="button button-small button-secondary" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(label)} <span aria-hidden="true">↗</span></a>
              `).join("")}
            </div>
          </article>
        `).join("")}
      </section>

      <section class="card">
        <div class="card-header"><div><span class="badge">Current stage ${currentStage}</span><h3 style="margin-top:.45rem">Listening ladder</h3><p class="muted">Advance by comprehension and stamina, not by calendar alone.</p></div></div>
        <div class="stack">
          ${DATA.listeningLadder.map((stage) => `
            <details class="details" ${stage.stage === currentStage ? "open" : ""}>
              <summary>Stage ${stage.stage}: ${escapeHTML(stage.title)} · ${stage.minutes} min/week</summary>
              <div class="details-body">
                <p><strong>Goal:</strong> ${escapeHTML(stage.goal)}</p>
                <p><strong>Watch or search:</strong> ${escapeHTML(stage.content)}</p>
                <p><strong>Move up when:</strong> ${escapeHTML(stage.moveUp)}</p>
                <div class="button-row">
                  ${stage.links.map(([label, url]) => `<a class="button button-small button-secondary" href="${url}" target="_blank" rel="noopener noreferrer">${escapeHTML(label)} ↗</a>`).join("")}
                </div>
              </div>
            </details>
          `).join("")}
        </div>
      </section>

      <section class="card">
        <div class="card-header">
          <div><h3>Route-specific Spanish</h3><p class="muted">Learn to recognise regional language while continuing to speak clear, neutral Spanish.</p></div>
          <button class="button button-small button-secondary" type="button" data-action="go-tab" data-tab="settings">Choose countries</button>
        </div>
        <div class="stack">
          ${selectedNotes.length ? selectedNotes.map(([country, note]) => `
            <details class="details">
              <summary>${escapeHTML(country)}</summary>
              <div class="details-body">
                <p><strong>Common words:</strong> ${escapeHTML(note.words.join("; "))}</p>
                <p><strong>Listening note:</strong> ${escapeHTML(note.warning)}</p>
                <p><strong>Useful phrases:</strong></p>
                <ul>${note.phrases.map((phrase) => `<li lang="es">${escapeHTML(phrase)}</li>`).join("")}</ul>
                <p><strong>Scenario advice:</strong> ${escapeHTML(note.advice)}</p>
              </div>
            </details>
          `).join("") : `<p class="empty-state">Select likely countries in Settings to build your regional preparation list.</p>`}
        </div>
      </section>

      <section class="card">
        <div class="card-header"><div><h3>Travel phrasebook</h3><p class="muted">Browse by category and add phrases from the Review tab.</p></div><span class="badge">${DATA.phrasebook.length} phrases</span></div>
        ${Array.from(new Set(DATA.phrasebook.map((phrase) => phrase.category))).map((category) => `
          <details class="details" style="margin-top:.5rem">
            <summary>${escapeHTML(category)}</summary>
            <div class="details-body">
              ${DATA.phrasebook.filter((phrase) => phrase.category === category).map((phrase) => `
                <p><strong lang="es">${escapeHTML(phrase.spanish)}</strong><br><span class="muted">${escapeHTML(phrase.english)}</span></p>
              `).join("")}
            </div>
          </details>
        `).join("")}
      </section>

      <section class="card ${showFinal ? "card-accent" : ""}">
        <div class="card-header">
          <div><span class="badge ${showFinal ? "badge-accent" : "badge-muted"}">${showFinal ? `${tripDays} days to go` : "Unlocks within 30 days"}</span><h3 style="margin-top:.45rem">Final 30-day prep</h3></div>
        </div>
        ${showFinal ? `
          <div class="task-list">
            ${DATA.finalPrep.map((item) => `
              <label class="task-item ${state.finalPrep[item.id] ? "completed" : ""}">
                <input class="task-check" type="checkbox" data-action="toggle-final-prep" data-id="${item.id}" ${state.finalPrep[item.id] ? "checked" : ""}>
                <span class="task-copy"><span class="task-title">${escapeHTML(item.title)}</span><span class="task-detail">${escapeHTML(item.detail)}</span></span>
              </label>
            `).join("")}
          </div>
        ` : `<p class="muted">Set your trip date in Settings. This checklist appears automatically during the final 30 days.</p>`}
      </section>
    `;
  }

  function renderSettings() {
    view.innerHTML = `
      ${viewHeader("Settings", "Tune the plan to your dates and route. Everything stays in this browser unless you export it.")}
      <form class="card stack" id="settings-form">
        <h3>Plan</h3>
        <div class="grid grid-3">
          <div class="form-group">
            <label for="start-date">Plan start date</label>
            <input class="input" id="start-date" name="startDate" type="date" value="${state.settings.startDate}" required>
            <span class="help-text">Progress stays attached to plan day numbers if this date changes.</span>
          </div>
          <div class="form-group">
            <label for="trip-date">Trip date</label>
            <input class="input" id="trip-date" name="tripDate" type="date" value="${state.settings.tripDate}" required>
          </div>
          <div class="form-group">
            <label for="weekly-hours">Weekly target hours</label>
            <input class="input" id="weekly-hours" name="weeklyTargetHours" type="number" min="1" max="30" step="0.5" value="${state.settings.weeklyTargetHours}" required>
          </div>
        </div>
        <div class="grid grid-3">
          <div class="form-group">
            <label for="experience-level">Current Spanish level</label>
            <select id="experience-level" name="experienceLevel">
              <option value="beginner" ${state.settings.experienceLevel === "beginner" ? "selected" : ""}>New beginner</option>
              <option value="elementary" ${state.settings.experienceLevel === "elementary" ? "selected" : ""}>Elementary</option>
              <option value="intermediate" ${state.settings.experienceLevel === "intermediate" ? "selected" : ""}>Intermediate</option>
              <option value="advanced" ${state.settings.experienceLevel === "advanced" ? "selected" : ""}>Advanced</option>
            </select>
          </div>
          <div class="form-group">
            <label for="preferred-session">Usual session length</label>
            <select id="preferred-session" name="preferredSessionMinutes">
              ${[5, 15, 30].map((minutes) => `<option value="${minutes}" ${state.settings.preferredSessionMinutes === minutes ? "selected" : ""}>${minutes} minutes</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label for="review-session-limit">Review batch size</label>
            <select id="review-session-limit" name="reviewSessionLimit">
              ${[5, 10, 20].map((limit) => `<option value="${limit}" ${state.settings.reviewSessionLimit === limit ? "selected" : ""}>${limit} cards</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="form-group">
          <span class="label">Likely route countries</span>
          <div class="check-grid">
            ${DATA.countries.map((country) => `
              <label class="check-option">
                <input type="checkbox" name="countries" value="${escapeHTML(country)}" ${state.settings.countries.includes(country) ? "checked" : ""}>
                ${escapeHTML(country)}
              </label>
            `).join("")}
          </div>
        </div>
        <div class="form-group">
          <label for="theme">Theme</label>
          <select id="theme" name="theme">
            <option value="system" ${state.settings.theme === "system" ? "selected" : ""}>Follow system</option>
            <option value="light" ${state.settings.theme === "light" ? "selected" : ""}>Light</option>
            <option value="dark" ${state.settings.theme === "dark" ? "selected" : ""}>Dark</option>
          </select>
        </div>
        <button class="button" type="submit">Save settings</button>
        <button class="button button-secondary" type="button" data-action="open-onboarding">Run quick setup again</button>
      </form>

      <section class="card">
        <h3>Backup and portability</h3>
        <p class="muted">Local storage is tied to this browser and site address. Export a backup before clearing browser data or changing devices.</p>
        <p class="inline-note">Last successful backup: ${state.lastBackupAt ? formatTimestamp(state.lastBackupAt) : "Not recorded yet"}</p>
        <div class="button-row">
          <button class="button button-secondary" type="button" data-action="export-backup">Export backup JSON</button>
          <button class="button button-secondary" type="button" data-action="trigger-import">Import backup JSON</button>
          <input class="hidden" id="import-file" type="file" accept="application/json,.json" data-action="import-backup">
          <button class="button button-secondary" type="button" data-action="export-csv">Export review deck CSV</button>
        </div>
      </section>

      <section class="card">
        <h3>Storage</h3>
        <p class="muted">This app has no account or server. Progress, notes, and route selections remain on your device.</p>
        <button class="button button-danger" type="button" data-action="reset-progress">Reset all progress</button>
      </section>

      <section class="card">
        <h3>App information</h3>
        <p class="muted">Spanish Travel Companion · Data format v${STATE_VERSION}</p>
        <p class="muted">${escapeHTML(pwaStatus().label)} · ${escapeHTML(pwaStatus().detail)}</p>
        ${pendingInstallPrompt ? `<button class="button button-secondary" type="button" data-action="install-app">Install app</button>` : ""}
      </section>
    `;
  }

  function formatTimestamp(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "Not recorded"
      : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
  }

  function openOnboarding() {
    openModal(`
      <div class="modal-header">
        <div><span class="badge badge-accent">Quick setup</span><h2 style="margin-top:.35rem">Shape your plan</h2></div>
        ${state.settings.onboardingComplete ? `<button class="icon-button" type="button" data-action="close-modal" aria-label="Close">×</button>` : ""}
      </div>
      <p class="muted">Set the essentials now. Everything remains editable in Settings.</p>
      <form id="onboarding-form" class="stack">
        <div class="grid grid-2">
          <div class="form-group">
            <label for="onboarding-trip-date">Trip date</label>
            <input class="input" id="onboarding-trip-date" name="tripDate" type="date" value="${state.settings.tripDate}" required>
          </div>
          <div class="form-group">
            <label for="onboarding-weekly-hours">Weekly study time</label>
            <select id="onboarding-weekly-hours" name="weeklyTargetHours">
              ${[2, 3.5, 5, 7, 10].map((hours) => `<option value="${hours}" ${state.settings.weeklyTargetHours === hours ? "selected" : ""}>${hours} hours</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="grid grid-2">
          <div class="form-group">
            <label for="onboarding-level">Current Spanish level</label>
            <select id="onboarding-level" name="experienceLevel">
              <option value="beginner" ${state.settings.experienceLevel === "beginner" ? "selected" : ""}>New beginner</option>
              <option value="elementary" ${state.settings.experienceLevel === "elementary" ? "selected" : ""}>Elementary</option>
              <option value="intermediate" ${state.settings.experienceLevel === "intermediate" ? "selected" : ""}>Intermediate</option>
              <option value="advanced" ${state.settings.experienceLevel === "advanced" ? "selected" : ""}>Advanced</option>
            </select>
          </div>
          <div class="form-group">
            <label for="onboarding-session">Usual session</label>
            <select id="onboarding-session" name="preferredSessionMinutes">
              ${[5, 15, 30].map((minutes) => `<option value="${minutes}" ${state.settings.preferredSessionMinutes === minutes ? "selected" : ""}>${minutes} minutes</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="form-group">
          <span class="label">Likely route countries</span>
          <div class="check-grid onboarding-countries">
            ${DATA.countries.map((country) => `
              <label class="check-option">
                <input type="checkbox" name="countries" value="${escapeHTML(country)}" ${state.settings.countries.includes(country) ? "checked" : ""}>
                ${escapeHTML(country)}
              </label>
            `).join("")}
          </div>
        </div>
        <button class="button" type="submit">Use this plan</button>
        ${state.settings.onboardingComplete ? "" : `<button class="button button-secondary" type="button" data-action="skip-onboarding">Use sensible defaults</button>`}
      </form>
    `);
  }

  function openModal(content) {
    modalRoot.innerHTML = `<div class="modal-backdrop" data-action="close-modal-backdrop"><section class="modal" role="dialog" aria-modal="true">${content}</section></div>`;
    lastFocusedElement = document.activeElement;
    const appShell = $(".app-shell");
    const modal = $(".modal", modalRoot);
    const heading = $("h2, h3", modalRoot);
    document.body.classList.add("modal-open");
    appShell?.setAttribute("inert", "");
    if (heading) {
      heading.id = "modal-title";
      modal?.setAttribute("aria-labelledby", heading.id);
    } else {
      modal?.setAttribute("aria-label", "Dialog");
    }
    const firstControl = $("button, input, select, textarea", modalRoot);
    if (firstControl) firstControl.focus();
  }

  function closeModal() {
    modalRoot.innerHTML = "";
    pendingImportState = null;
    document.body.classList.remove("modal-open");
    $(".app-shell")?.removeAttribute("inert");
    if (lastFocusedElement?.isConnected) lastFocusedElement.focus();
    lastFocusedElement = null;
  }

  async function downloadFile(name, content, type) {
    const blob = new Blob([content], { type });
    try {
      if (typeof File === "function" && navigator.share && navigator.canShare) {
        const file = new File([blob], name, { type });
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: name });
            return true;
          } catch (error) {
            if (error?.name === "AbortError") return false;
            console.warn("Native sharing failed; falling back to download:", error);
          }
        }
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      return true;
    } catch (error) {
      console.error("Export failed:", error);
      showToast("Export failed. Check browser download or sharing permissions.");
      return false;
    }
  }

  async function exportCSV() {
    const quote = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = [
      ["Spanish", "English", "Category", "Source", "Stage", "Due date", "Correct", "Incorrect", "Paused"],
      ...state.deck.map((card) => [
        card.spanish, card.english, card.category, card.source, card.reviewStage,
        card.dueDate, card.correctCount, card.incorrectCount, card.suspended ? "yes" : "no"
      ])
    ];
    const exported = await downloadFile(
      `spanish-review-deck-${localISO()}.csv`,
      rows.map((row) => row.map(quote).join(",")).join("\n"),
      "text/csv;charset=utf-8"
    );
    if (exported) showToast("Review deck exported.");
  }

  async function exportBackup() {
    const exportedAt = new Date().toISOString();
    const backup = { ...state, exportedAt, lastBackupAt: exportedAt, app: "Spanish Travel Companion" };
    const exported = await downloadFile(
      `spanish-companion-backup-${localISO()}.json`,
      JSON.stringify(backup, null, 2),
      "application/json"
    );
    if (exported) {
      state.lastBackupAt = exportedAt;
      saveState("Backup exported.");
      if (activeTab === "settings") renderSettings();
    }
  }

  async function importBackup(file, input) {
    if (!file) return;
    try {
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("That backup is too large. Choose a file smaller than 10 MB.");
      }
      const parsed = JSON.parse(await file.text());
      if (!parsed || typeof parsed !== "object" || !parsed.settings || !Array.isArray(parsed.deck)) {
        throw new Error("This file does not look like a Spanish Travel Companion backup.");
      }
      if (finiteNumber(parsed.version) > STATE_VERSION) {
        throw new Error("This backup was created by a newer app version and cannot be imported safely.");
      }
      showImportPreview(parsed);
    } catch (error) {
      console.error("Import failed:", error);
      showToast(error.message || "Could not import that backup.");
    } finally {
      if (input) input.value = "";
    }
  }

  function showImportPreview(parsed) {
    pendingImportState = normalizeState(parsed);
    const incoming = CORE.summarizeState(pendingImportState);
    const current = CORE.summarizeState(state);
    openModal(`
      <div class="modal-header">
        <h2>Review backup import</h2>
        <button class="icon-button" type="button" data-action="cancel-import" aria-label="Close">×</button>
      </div>
      <p>This replaces progress currently stored in this browser. Nothing is sent anywhere.</p>
      <div class="backup-comparison">
        ${renderBackupSummary("Current", current)}
        ${renderBackupSummary("Incoming", incoming)}
      </div>
      <p class="inline-note">Backup date: ${parsed.exportedAt ? escapeHTML(formatTimestamp(parsed.exportedAt)) : "Not included"} · Data format v${finiteNumber(parsed.version, 1)}</p>
      <div class="button-row">
        <button class="button" type="button" data-action="confirm-import">Replace with this backup</button>
        <button class="button button-secondary" type="button" data-action="cancel-import">Cancel</button>
      </div>
    `);
  }

  function renderBackupSummary(label, summary) {
    return `
      <div class="list-card">
        <strong>${label}</strong>
        <p class="muted">${summary.completedDays} completed days · ${summary.deckCards} phrases · ${summary.speakingLogs} speaking logs · ${summary.practisedScenarios} scenarios · ${summary.milestones} milestones</p>
      </div>
    `;
  }

  function applyPendingImport() {
    if (!pendingImportState) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingImportState));
    state = pendingImportState;
    pendingImportState = null;
    activeDayNumber = null;
    recommendation = null;
    quickSession = null;
    reviewSessionReviewed = new Set();
    reviewRetryQueue = [];
    reviewSessionCardIds = [];
    reviewSessionOutcomes = new Map();
    reviewUndo = null;
    reviewCardId = null;
    applyTheme();
    closeModal();
    saveState("Backup imported.");
    render();
  }

  function handleClick(event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const action = button.dataset.action;

    if (action === "go-tab") setActiveTab(button.dataset.tab, true);
    if (action === "build-session") {
      quickSession = buildQuickSession(Number(button.dataset.minutes));
      renderToday();
      $(".quick-session-plan")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    if (action === "open-onboarding") openOnboarding();
    if (action === "skip-onboarding") {
      state.settings.onboardingComplete = true;
      saveState("Setup complete. You can adjust it any time.");
      closeModal();
    }
    if (action === "confirm-import") applyPendingImport();
    if (action === "cancel-import") {
      pendingImportState = null;
      closeModal();
    }
    if (action === "install-app" && pendingInstallPrompt) {
      pendingInstallPrompt.prompt();
      pendingInstallPrompt.userChoice.finally(() => {
        pendingInstallPrompt = null;
        if (activeTab === "more") renderMore();
        if (activeTab === "settings") renderSettings();
      });
    }
    if (action === "open-read2speak-pdf") {
      const selected = read2SpeakFiles[button.dataset.resource];
      if (!selected) {
        showToast("Choose the licensed PDF from your device first.");
      } else {
        window.open(`${selected.url}#page=${Number(button.dataset.page)}`, "_blank", "noopener,noreferrer");
      }
    }
    if (action === "open-read2speak-unit") {
      state.read2Speak.currentUnit = Number(button.dataset.unit);
      saveState();
      renderResources();
      $(".read2speak-course")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (action === "next-read2speak-unit") {
      const course = currentRead2SpeakCourse();
      state.read2Speak.currentUnit = Math.min(course.units.length, state.read2Speak.currentUnit + 1);
      saveState(`Unit ${state.read2Speak.currentUnit} is ready.`);
      renderResources();
      $(".read2speak-course")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (action === "open-language-transfer-lesson") {
      state.languageTransfer.currentLesson = clamp(
        Number(button.dataset.lesson),
        1,
        DATA.languageTransferCourse.lessonCount
      );
      saveState();
      renderResources();
      $(".language-transfer-course")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (action === "toggle-language-transfer-current") {
      const lesson = state.languageTransfer.currentLesson;
      const wasComplete = button.dataset.complete === "true";
      setLanguageTransferLessonComplete(lesson, !wasComplete);
      if (!wasComplete) {
        const todayRecord = getDayRecord(planDayNumber(), true);
        todayRecord.completedTasks = Array.from(new Set([...todayRecord.completedTasks, "listen"]));
        if (todayRecord.completedTasks.length === VALID_TASK_IDS.length) {
          todayRecord.done = true;
          todayRecord.completedDate = localISO();
        }
      }
      saveState(wasComplete ? `Lesson ${lesson} marked incomplete.` : `Lesson ${lesson} complete.`);
      renderResources();
    }
    if (action === "return-today") {
      activeDayNumber = null;
      recommendation = null;
      renderToday();
    }
    if (action === "recommend") {
      recommendation = smartRecommendation();
      renderToday();
    }
    if (action === "fallback") showFallback();
    if (action === "catch-up") {
      const missed = findCatchUpDay();
      if (missed) {
        activeDayNumber = missed;
        recommendation = null;
        renderToday();
      } else showToast("No incomplete days in the last two weeks. Continue with today.");
    }
    if (action === "mark-day-done") {
      const task = getCurrentTask();
      const record = getDayRecord(task.day, true);
      record.completedTasks = task.subtasks.map((item) => item.id);
      record.done = true;
      record.completedDate = localISO();
      if (!record.hours) record.hours = Number((task.targetMinutes / 60).toFixed(1));
      saveState("Day marked complete.");
      renderToday();
    }
    if (action === "reveal-review") {
      reviewRevealed = true;
      renderReview();
    }
    if (action === "rate-review") rateReview(button.dataset.rating);
    if (action === "undo-review") undoReview();
    if (action === "toggle-review-direction") {
      reviewPromptDirection = reviewPromptDirection === "english" ? "spanish" : "english";
      renderReview();
    }
    if (action === "restart-review") {
      resetReviewSession();
      renderReview();
    }
    if (action === "next-review-batch") {
      resetReviewSession();
      renderReview();
    }
    if (action === "add-phrasebook") {
      const phrase = DATA.phrasebook.find((item) => item.id === button.dataset.id);
      if (phrase && !state.deck.some((card) => card.id === phrase.id)) {
        state.deck.push({
          ...phrase,
          reviewStage: 0,
          dueDate: localISO(),
          correctCount: 0,
          incorrectCount: 0,
          suspended: false,
          lastReviewed: null,
          createdAt: localISO()
        });
        saveState("Phrase added to your deck.");
        renderReview();
      }
    }
    if (action === "edit-card") openCardEditor(button.dataset.id);
    if (action === "toggle-card-suspended") {
      const card = state.deck.find((item) => item.id === button.dataset.id);
      if (card) {
        card.suspended = !card.suspended;
        reviewCardId = null;
        reviewRetryQueue = reviewRetryQueue.filter((id) => id !== card.id);
        if (card.suspended) {
          reviewSessionCardIds = reviewSessionCardIds.filter((id) => id !== card.id);
          reviewSessionReviewed.delete(card.id);
          reviewSessionOutcomes.delete(card.id);
        }
        reviewUndo = null;
        saveState(card.suspended ? "Phrase paused." : "Phrase returned to review.");
        renderReview();
      }
    }
    if (action === "delete-card") {
      const card = state.deck.find((item) => item.id === button.dataset.id);
      if (!card || !window.confirm(`Delete “${card.spanish}” from your review deck?`)) return;
      state.deck = state.deck.filter((item) => item.id !== card.id);
      reviewSessionReviewed.delete(card.id);
      reviewRetryQueue = reviewRetryQueue.filter((id) => id !== card.id);
      reviewSessionCardIds = reviewSessionCardIds.filter((id) => id !== card.id);
      reviewSessionOutcomes.delete(card.id);
      reviewUndo = null;
      if (reviewCardId === card.id) reviewCardId = null;
      saveState("Phrase deleted.");
      renderReview();
    }
    if (action === "export-csv") exportCSV();
    if (action === "set-timer") {
      timerSeconds = Number(button.dataset.seconds);
      resetSpeakingSession();
      renderSpeaking();
    }
    if (action === "toggle-timer") toggleTimer();
    if (action === "finish-speaking-pass") completeSpeakingPass();
    if (action === "start-second-speaking-pass") startSecondSpeakingPass();
    if (action === "finish-one-speaking-pass") {
      speakingSessionComplete = true;
      renderSpeaking();
    }
    if (action === "reset-speaking-session") {
      resetSpeakingSession();
      renderSpeaking();
    }
    if (action === "different-speaking-exercise") {
      const currentIndex = DATA.speakingExercises.findIndex((exercise) => exercise.id === speakingExerciseId);
      speakingExerciseId = DATA.speakingExercises[(currentIndex + 1) % DATA.speakingExercises.length].id;
      resetSpeakingSession();
      renderSpeaking();
    }
    if (action === "repeat-speaking-exercise") {
      speakingExerciseId = button.dataset.id;
      resetSpeakingSession();
      renderSpeaking();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (action === "delete-speaking-log") {
      if (!window.confirm("Delete this speaking log?")) return;
      state.speakingLogs = state.speakingLogs.filter((log) => log.id !== button.dataset.id);
      saveState("Speaking log deleted.");
      renderSpeaking();
    }
    if (action === "open-scenario") openScenario(button.dataset.id);
    if (action === "close-modal") closeModal();
    if (action === "close-modal-backdrop" && event.target === button) {
      if (!state.settings.onboardingComplete && $("#onboarding-form", modalRoot)) return;
      closeModal();
    }
    if (action === "complete-fallback") {
      const task = getCurrentTask();
      const record = getDayRecord(task.day, true);
      record.completedTasks = Array.from(new Set([...record.completedTasks, "read", "speak", "review"]));
      record.hours = Number((Number(record.hours || 0) + 0.1).toFixed(1));
      record.notes = record.notes ? `${record.notes}\nCompleted 5-minute fallback.` : "Completed 5-minute fallback.";
      saveState("Fallback logged. Small and useful.");
      closeModal();
      renderToday();
    }
    if (action === "export-backup") exportBackup();
    if (action === "trigger-import") $("#import-file")?.click();
    if (action === "reset-progress") {
      openModal(`
        <div class="modal-header"><h2>Reset all progress?</h2><button class="icon-button" type="button" data-action="close-modal" aria-label="Close">×</button></div>
        <p>This permanently removes daily records, Read2Speak and Language Transfer progress, reviews, speaking logs, scenarios, milestones, and settings from this browser.</p>
        <div class="button-row">
          <button class="button button-danger" type="button" data-action="confirm-reset">Reset everything</button>
          <button class="button button-secondary" type="button" data-action="close-modal">Cancel</button>
        </div>
      `);
    }
    if (action === "confirm-reset") {
      state = defaultState();
      activeDayNumber = null;
      localStorage.removeItem(STORAGE_KEY);
      saveState("Progress reset.");
      applyTheme();
      closeModal();
      setActiveTab("today");
      setTimeout(openOnboarding, 0);
    }
  }

  function handleChange(event) {
    const input = event.target;
    const action = input.dataset.action;
    if (action === "select-read2speak-course") {
      const course = DATA.read2SpeakCourses.find((item) => item.id === input.value);
      if (!course) return;
      clearRead2SpeakFiles();
      state.read2Speak.courseId = course.id;
      state.read2Speak.currentUnit = 1;
      saveState(`${course.level} ${course.title} selected.`);
      renderResources();
    }
    if (action === "select-read2speak-unit") {
      state.read2Speak.currentUnit = Number(input.value);
      saveState();
      renderResources();
    }
    if (action === "select-read2speak-pdf") {
      const file = input.files?.[0];
      const resource = input.dataset.resource;
      if (!file || !["ebook", "workbook"].includes(resource)) return;
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        showToast("Choose a PDF file.");
        input.value = "";
        return;
      }
      if (read2SpeakFiles[resource]?.url) URL.revokeObjectURL(read2SpeakFiles[resource].url);
      read2SpeakFiles[resource] = {
        name: file.name,
        url: URL.createObjectURL(file)
      };
      const expectedName = currentRead2SpeakCourse().title.toLowerCase();
      const expectedResource = resource === "ebook" ? "ebook" : "workbook";
      showToast(
        file.name.toLowerCase().includes(expectedName) && file.name.toLowerCase().includes(expectedResource)
          ? `${resource === "ebook" ? "eBook" : "Workbook"} ready for this session.`
          : `PDF selected. Check that it is the ${currentRead2SpeakCourse().title} ${resource === "ebook" ? "eBook" : "workbook"}.`
      );
      renderResources();
    }
    if (action === "toggle-read2speak-checkpoint") {
      const record = getRead2SpeakUnitRecord(state.read2Speak.courseId, state.read2Speak.currentUnit, true);
      const id = input.dataset.checkpointId;
      if (input.checked) {
        record.completedCheckpoints = Array.from(new Set([...record.completedCheckpoints, id]));
        record.lastStudied = localISO();
        const todayRecord = getDayRecord(planDayNumber(), true);
        todayRecord.completedTasks = Array.from(new Set([...todayRecord.completedTasks, "read"]));
        if (todayRecord.completedTasks.length === VALID_TASK_IDS.length) {
          todayRecord.done = true;
          todayRecord.completedDate = localISO();
        }
      } else {
        record.completedCheckpoints = record.completedCheckpoints.filter((checkpointId) => checkpointId !== id);
      }
      saveState(input.checked ? "Course checkpoint complete." : "");
      renderResources();
    }
    if (action === "read2speak-confidence") {
      const record = getRead2SpeakUnitRecord(state.read2Speak.courseId, state.read2Speak.currentUnit, true);
      record.confidence = clamp(Number(input.value), 1, 5);
      record.lastStudied = localISO();
      if (notesSaveTimer) flushNotesSave();
      else saveState();
    }
    if (action === "read2speak-review-date") {
      const record = getRead2SpeakUnitRecord(state.read2Speak.courseId, state.read2Speak.currentUnit, true);
      record.reviewDate = isDateString(input.value) ? input.value : null;
      if (notesSaveTimer) flushNotesSave();
      else saveState();
    }
    if (action === "read2speak-notes") {
      const record = getRead2SpeakUnitRecord(state.read2Speak.courseId, state.read2Speak.currentUnit, true);
      record.notes = input.value;
      record.lastStudied = localISO();
      if (notesSaveTimer) flushNotesSave();
      else saveState();
    }
    if (action === "toggle-daily-task") {
      const task = getCurrentTask();
      const record = getDayRecord(task.day, true);
      if (input.checked) {
        record.completedTasks = Array.from(new Set([...record.completedTasks, input.dataset.taskId]));
      } else {
        record.completedTasks = record.completedTasks.filter((id) => id !== input.dataset.taskId);
        record.done = false;
        record.completedDate = null;
      }
      if (record.completedTasks.length === 5) {
        record.done = true;
        if (!record.completedDate) record.completedDate = localISO();
      }
      saveState();
      renderToday();
    }
    if (action === "day-hours") {
      getDayRecord(getCurrentTask().day, true).hours = clamp(Number(input.value || 0), 0, 12);
      if (notesSaveTimer) flushNotesSave();
      else saveState();
    }
    if (action === "day-notes") {
      getDayRecord(getCurrentTask().day, true).notes = input.value;
      if (notesSaveTimer) flushNotesSave();
      else saveState();
    }
    if (action === "import-backup") importBackup(input.files[0], input);
    if (action === "toggle-final-prep") {
      state.finalPrep[input.dataset.id] = input.checked;
      saveState(input.checked ? "Prep item complete." : "");
      renderResources();
    }
  }

  function handleInput(event) {
    const input = event.target;
    const action = input.dataset.action;
    if (action === "range-output") {
      const output = $(`#${input.dataset.output}`);
      if (output) output.textContent = input.value;
    }
    if (action === "filter-phrasebook") {
      const list = $("#phrasebook-list");
      if (list) list.innerHTML = renderPhrasebookItems(input.value);
    }
    if (action === "filter-deck") {
      const list = $("#deck-list");
      if (list) list.innerHTML = renderDeckItems(input.value);
    }
    if (action === "day-notes") {
      getDayRecord(getCurrentTask().day, true).notes = input.value;
      scheduleNotesSave();
    }
    if (action === "day-hours") {
      getDayRecord(getCurrentTask().day, true).hours = clamp(Number(input.value || 0), 0, 12);
      scheduleNotesSave();
    }
    if (action === "read2speak-notes") {
      const record = getRead2SpeakUnitRecord(state.read2Speak.courseId, state.read2Speak.currentUnit, true);
      record.notes = input.value;
      record.lastStudied = localISO();
      scheduleNotesSave();
    }
    if (action === "read2speak-confidence") {
      const record = getRead2SpeakUnitRecord(state.read2Speak.courseId, state.read2Speak.currentUnit, true);
      record.confidence = clamp(Number(input.value), 1, 5);
      record.lastStudied = localISO();
      const output = $(`#${input.dataset.output}`);
      if (output) output.textContent = input.value;
      scheduleNotesSave();
    }
    if (action === "language-transfer-notes") {
      const lesson = String(state.languageTransfer.currentLesson);
      if (input.value.trim()) state.languageTransfer.notes[lesson] = input.value;
      else delete state.languageTransfer.notes[lesson];
      scheduleNotesSave();
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    if (form.id === "add-phrase-form") {
      const spanish = formData.get("spanish").trim();
      if (duplicateCard(spanish)) {
        showToast("That Spanish phrase is already in your deck.");
        return;
      }
      state.deck.push({
        id: uid("custom"),
        spanish,
        english: formData.get("english").trim(),
        category: formData.get("category").trim() || "Custom",
        source: "custom",
        reviewStage: 0,
        dueDate: localISO(),
        correctCount: 0,
        incorrectCount: 0,
        suspended: false,
        lastReviewed: null,
        createdAt: localISO()
      });
      saveState("Custom phrase added.");
      renderReview();
    }

    if (form.id === "edit-card-form") {
      const id = formData.get("cardId");
      const card = state.deck.find((item) => item.id === id);
      const spanish = formData.get("spanish").trim();
      if (!card) return;
      if (duplicateCard(spanish, id)) {
        showToast("That Spanish phrase is already in your deck.");
        return;
      }
      card.spanish = spanish;
      card.english = formData.get("english").trim();
      card.category = formData.get("category").trim() || "Custom";
      saveState("Phrase updated.");
      closeModal();
      renderReview();
    }

    if (form.id === "speaking-log-form") {
      const stuckPhrase = formData.get("stuckPhrase").trim();
      const stuckMeaning = formData.get("stuckMeaning").trim();
      const shouldSavePhrase = Boolean(formData.get("savePhrase"));
      const retrieval = Number(formData.get("retrieval"));
      let phraseAdded = false;
      state.speakingLogs.push({
        id: uid("speak"),
        date: localISO(),
        prompt: formData.get("prompt"),
        exerciseId: formData.get("exerciseId"),
        minutes: Number(formData.get("minutes")),
        difficulty: 6 - retrieval,
        retrieval,
        focus: formData.get("focus"),
        passes: Number(formData.get("passes")),
        improved: formData.get("improved"),
        stuckPhrase,
        notes: formData.get("notes").trim()
      });
      if (stuckPhrase && stuckMeaning && shouldSavePhrase) {
        if (!duplicateCard(stuckPhrase)) {
          state.deck.push({
            id: uid("stuck"),
            spanish: stuckPhrase,
            english: stuckMeaning,
            category: "Speaking",
            source: "speaking",
            reviewStage: 0,
            dueDate: localISO(),
            correctCount: 0,
            incorrectCount: 0,
            suspended: false,
            lastReviewed: null,
            createdAt: localISO()
          });
          phraseAdded = true;
        }
      }
      const todayRecord = getDayRecord(planDayNumber(), true);
      todayRecord.completedTasks = Array.from(new Set([...todayRecord.completedTasks, "speak"]));
      if (todayRecord.completedTasks.length === VALID_TASK_IDS.length) {
        todayRecord.done = true;
        todayRecord.completedDate = localISO();
      }
      resetSpeakingSession(true);
      saveState(shouldSavePhrase && (!stuckPhrase || !stuckMeaning)
        ? "Speaking saved. Add both the Spanish phrase and its meaning to create a review card."
        : phraseAdded
          ? "Speaking saved and phrase added to Review."
          : "Speaking practice saved.");
      renderSpeaking();
    }

    if (form.id === "scenario-form") {
      const id = formData.get("scenarioId");
      const scenario = DATA.scenarios.find((item) => item.id === id);
      if (!scenario) return;
      const stuckPhrase = formData.get("stuckPhrase").trim();
      const stuckMeaning = formData.get("stuckMeaning").trim();
      const shouldSavePhrase = Boolean(formData.get("savePhrase"));
      let phraseAdded = false;
      state.scenarios[id] = {
        confidence: Number(formData.get("confidence")),
        notes: formData.get("notes").trim(),
        completed: Boolean(formData.get("completed")),
        lastPractised: localISO()
      };
      if (shouldSavePhrase && stuckPhrase && stuckMeaning && !duplicateCard(stuckPhrase)) {
        state.deck.push({
          id: uid(`scenario-${id}`),
          spanish: stuckPhrase,
          english: stuckMeaning,
          category: scenario.category,
          source: `scenario:${id}`,
          reviewStage: 0,
          dueDate: localISO(),
          correctCount: 0,
          incorrectCount: 0,
          suspended: false,
          lastReviewed: null,
          createdAt: localISO()
        });
        phraseAdded = true;
      }
      const incompletePhrase = shouldSavePhrase && Boolean(stuckPhrase || stuckMeaning) && (!stuckPhrase || !stuckMeaning);
      saveState(incompletePhrase
        ? "Rehearsal saved. Add both the Spanish phrase and its meaning to create a review card."
        : phraseAdded
          ? "Rehearsal saved and phrase added to Review."
          : "Scenario rehearsal saved.");
      closeModal();
      renderScenarios();
    }

    if (form.classList.contains("milestone-form")) {
      const month = form.dataset.month;
      const result = formData.get("result");
      if (result) {
        state.milestones[month] = {
          result,
          confidence: Number(formData.get("confidence")),
          notes: formData.get("notes").trim(),
          date: formData.get("date")
        };
      } else {
        delete state.milestones[month];
      }
      saveState("Milestone saved.");
      renderProgress();
    }

    if (form.id === "settings-form") {
      state.settings = {
        startDate: formData.get("startDate"),
        tripDate: formData.get("tripDate"),
        weeklyTargetHours: Number(formData.get("weeklyTargetHours")),
        countries: formData.getAll("countries"),
        theme: formData.get("theme"),
        onboardingComplete: true,
        experienceLevel: formData.get("experienceLevel"),
        preferredSessionMinutes: Number(formData.get("preferredSessionMinutes")),
        reviewSessionLimit: Number(formData.get("reviewSessionLimit"))
      };
      activeDayNumber = null;
      quickSession = null;
      resetReviewSession();
      applyTheme();
      saveState("Settings saved.");
      renderSettings();
    }

    if (form.id === "onboarding-form") {
      const experienceLevel = formData.get("experienceLevel");
      state.settings = {
        ...state.settings,
        tripDate: formData.get("tripDate"),
        weeklyTargetHours: Number(formData.get("weeklyTargetHours")),
        countries: formData.getAll("countries"),
        onboardingComplete: true,
        experienceLevel,
        preferredSessionMinutes: Number(formData.get("preferredSessionMinutes"))
      };
      const hasCourseProgress = Object.values(state.read2Speak.units)
        .some((record) => record.completedCheckpoints.length);
      if (!hasCourseProgress) {
        const courseByLevel = {
          beginner: "foundations",
          elementary: "foundations",
          intermediate: "breakthrough",
          advanced: "mastery"
        };
        state.read2Speak.courseId = courseByLevel[experienceLevel];
        state.read2Speak.currentUnit = 1;
      }
      quickSession = null;
      saveState("Your plan is ready.");
      closeModal();
      render();
    }
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator) || location.protocol === "file:") return;
    navigator.serviceWorker.register("service-worker.js").then((registration) => {
      offlineReady = Boolean(registration.active);
      if (registration.waiting) showUpdate(registration.waiting);
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) showUpdate(worker);
        });
      });
    }).catch((error) => console.warn("Service worker registration failed:", error));
    navigator.serviceWorker.ready.then(() => {
      offlineReady = true;
      if (activeTab === "more") renderMore();
      if (activeTab === "settings") renderSettings();
    });

    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      location.reload();
    });
  }

  function showUpdate(worker) {
    pendingServiceWorker = worker;
    $("#update-banner").hidden = false;
  }

  function handleDocumentKeydown(event) {
    const modal = $(".modal", modalRoot);
    if (!modal && activeTab === "review" && !event.repeat && !event.altKey && !event.ctrlKey && !event.metaKey) {
      const target = event.target;
      const isInteractive = target.closest?.("input, textarea, select, button, a, summary, [contenteditable='true']");
      if (!isInteractive && (event.key === " " || event.key === "Spacebar") && reviewCardId && !reviewRevealed) {
        event.preventDefault();
        reviewRevealed = true;
        renderReview();
        return;
      }
      const ratings = { 1: "again", 2: "hard", 3: "good", 4: "easy" };
      if (!isInteractive && reviewRevealed && ratings[event.key]) {
        event.preventDefault();
        rateReview(ratings[event.key]);
        return;
      }
    }
    if (!modal) return;
    if (event.key === "Escape") {
      if (!state.settings.onboardingComplete && $("#onboarding-form", modalRoot)) return;
      event.preventDefault();
      closeModal();
      return;
    }
    if (event.key !== "Tab") return;

    const controls = $$(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      modal
    ).filter((control) => !control.hidden);
    if (!controls.length) {
      event.preventDefault();
      return;
    }
    const first = controls[0];
    const last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleExternalLink(event) {
    const link = event.target.closest('a[target="_blank"]');
    if (!link || navigator.onLine) return;
    event.preventDefault();
    showToast("This learning resource needs an internet connection.");
  }

  $$(".nav-item").forEach((button) => button.addEventListener("click", () => setActiveTab(button.dataset.tab, true)));
  view.addEventListener("click", handleClick);
  view.addEventListener("change", handleChange);
  view.addEventListener("input", handleInput);
  view.addEventListener("submit", handleSubmit);
  modalRoot.addEventListener("click", handleClick);
  modalRoot.addEventListener("input", handleInput);
  modalRoot.addEventListener("submit", handleSubmit);
  document.addEventListener("keydown", handleDocumentKeydown);
  document.addEventListener("click", handleExternalLink);
  $("#refresh-app").addEventListener("click", () => {
    if (pendingServiceWorker) pendingServiceWorker.postMessage({ type: "SKIP_WAITING" });
    else location.reload();
  });
  window.addEventListener("hashchange", () => {
    const tab = location.hash.replace("#", "");
    if (tab && tab !== activeTab) setActiveTab(tab);
  });
  window.addEventListener("pagehide", flushNotesSave);
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    pendingInstallPrompt = event;
    if (activeTab === "more") renderMore();
    if (activeTab === "settings") renderSettings();
  });
  window.addEventListener("appinstalled", () => {
    pendingInstallPrompt = null;
    showToast("App installed.");
  });
  window.addEventListener("online", () => {
    if (activeTab === "more") renderMore();
    if (activeTab === "settings") renderSettings();
    showToast("Back online.");
  });
  window.addEventListener("offline", () => {
    if (activeTab === "more") renderMore();
    if (activeTab === "settings") renderSettings();
    showToast("Offline. Saved progress and cached screens remain available.");
  });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (state.settings.theme === "system") applyTheme();
  });

  applyTheme();
  if (TEST_MODE) {
    window.APP_TEST_API = {
      normalizeState,
      showImportPreview,
      completeSpeakingTimer() {
        timerRemaining = 0;
        completeSpeakingPass();
      }
    };
  }
  setActiveTab(activeTab);
  if (!TEST_MODE) registerServiceWorker();
  if (!state.settings.onboardingComplete) setTimeout(openOnboarding, 0);
  if (startupStorageWarning) setTimeout(() => showToast(startupStorageWarning), 0);
})();
