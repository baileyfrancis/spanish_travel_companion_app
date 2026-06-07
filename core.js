(function (root, factory) {
  const core = factory();
  if (typeof module === "object" && module.exports) module.exports = core;
  else root.APP_CORE = core;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const GOOD_INTERVALS = [1, 3, 7, 14, 30, 60, 90];
  const EXPERIENCE_LEVELS = ["beginner", "elementary", "intermediate", "advanced"];
  const SESSION_MINUTES = [5, 15, 30];
  const REVIEW_LIMITS = [5, 10, 20];

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function finiteNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function normalizeSettings(settings, defaults, countries) {
    const source = settings && typeof settings === "object" ? settings : {};
    return {
      startDate: typeof source.startDate === "string" ? source.startDate : defaults.startDate,
      tripDate: typeof source.tripDate === "string" ? source.tripDate : defaults.tripDate,
      weeklyTargetHours: clamp(finiteNumber(source.weeklyTargetHours, defaults.weeklyTargetHours), 1, 30),
      countries: Array.isArray(source.countries)
        ? [...new Set(source.countries.filter((country) => countries.includes(country)))]
        : [],
      theme: ["system", "light", "dark"].includes(source.theme) ? source.theme : defaults.theme,
      onboardingComplete: Boolean(source.onboardingComplete),
      experienceLevel: EXPERIENCE_LEVELS.includes(source.experienceLevel)
        ? source.experienceLevel
        : defaults.experienceLevel,
      preferredSessionMinutes: SESSION_MINUTES.includes(Number(source.preferredSessionMinutes))
        ? Number(source.preferredSessionMinutes)
        : defaults.preferredSessionMinutes,
      reviewSessionLimit: REVIEW_LIMITS.includes(Number(source.reviewSessionLimit))
        ? Number(source.reviewSessionLimit)
        : defaults.reviewSessionLimit
    };
  }

  function calculateStreaks(dates, today, daysBetween) {
    const uniqueDates = [...new Set(dates.filter(Boolean))].sort();
    if (!uniqueDates.length) return { current: 0, longest: 0 };

    let longest = 1;
    let run = 1;
    for (let index = 1; index < uniqueDates.length; index += 1) {
      if (daysBetween(uniqueDates[index - 1], uniqueDates[index]) === 1) {
        run += 1;
        longest = Math.max(longest, run);
      } else {
        run = 1;
      }
    }

    const gap = daysBetween(uniqueDates.at(-1), today);
    let current = gap <= 1 ? 1 : 0;
    if (current) {
      for (let index = uniqueDates.length - 1; index > 0; index -= 1) {
        if (daysBetween(uniqueDates[index - 1], uniqueDates[index]) === 1) current += 1;
        else break;
      }
    }
    return { current, longest };
  }

  function sortDueCards(cards, today) {
    return cards
      .filter((card) => !card.suspended && (!card.dueDate || card.dueDate <= today))
      .slice()
      .sort((a, b) =>
        String(a.dueDate || "").localeCompare(String(b.dueDate || "")) ||
        Number(b.incorrectCount || 0) - Number(a.incorrectCount || 0) ||
        String(a.createdAt || "").localeCompare(String(b.createdAt || ""))
      );
  }

  function rateReviewCard(card, rating, today, addDays) {
    const next = { ...card, lastReviewed: today };
    if (rating === "again") {
      next.incorrectCount = Number(next.incorrectCount || 0) + 1;
      next.reviewStage = Math.max(0, Number(next.reviewStage || 0) - 1);
      next.dueDate = today;
    } else if (rating === "hard") {
      next.correctCount = Number(next.correctCount || 0) + 1;
      next.dueDate = addDays(today, 1);
    } else if (rating === "good") {
      next.correctCount = Number(next.correctCount || 0) + 1;
      next.reviewStage = Math.min(Number(next.reviewStage || 0) + 1, GOOD_INTERVALS.length);
      next.dueDate = addDays(today, GOOD_INTERVALS[Math.max(0, next.reviewStage - 1)]);
    } else if (rating === "easy") {
      next.correctCount = Number(next.correctCount || 0) + 1;
      next.reviewStage = Math.min(Number(next.reviewStage || 0) + 2, GOOD_INTERVALS.length);
      next.dueDate = addDays(today, GOOD_INTERVALS[Math.min(next.reviewStage, GOOD_INTERVALS.length - 1)]);
    }
    return next;
  }

  function summarizeState(state) {
    const daily = state?.daily && typeof state.daily === "object" ? state.daily : {};
    const deck = Array.isArray(state?.deck) ? state.deck : [];
    const speakingLogs = Array.isArray(state?.speakingLogs) ? state.speakingLogs : [];
    const scenarios = state?.scenarios && typeof state.scenarios === "object" ? state.scenarios : {};
    const milestones = state?.milestones && typeof state.milestones === "object" ? state.milestones : {};
    const completedDays = Object.values(daily).filter((record) =>
      record?.done || record?.completedTasks?.length === 5
    ).length;
    return {
      completedDays,
      deckCards: deck.length,
      speakingLogs: speakingLogs.length,
      practisedScenarios: Object.keys(scenarios).length,
      milestones: Object.keys(milestones).length
    };
  }

  return {
    GOOD_INTERVALS,
    calculateStreaks,
    normalizeSettings,
    rateReviewCard,
    sortDueCards,
    summarizeState
  };
});
