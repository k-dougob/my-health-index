(function (global) {
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function asNumberOrZero(value) {
    return typeof value === "number" && !Number.isNaN(value) ? value : 0;
  }

  function isValidNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function getFoodDailyScore(fruit, veg) {
    const servings = fruit + veg;
    if (servings >= 5) return 2.0;
    if (servings >= 4) return 1.6;
    if (servings >= 3) return 1.2;
    if (servings >= 2) return 0.8;
    if (servings >= 1) return 0.4;
    return 0.0;
  }

  function getMovementScore(steps) {
    if (steps >= 15000) return 1.5;
    if (steps >= 13000) return 1.4;
    if (steps >= 12000) return 1.3;
    if (steps >= 10000) return 1.2;
    if (steps >= 8500) return 1.05;
    if (steps >= 7000) return 0.9;
    if (steps >= 5500) return 0.7;
    if (steps >= 4000) return 0.5;
    if (steps >= 2500) return 0.3;
    return 0.0;
  }

  function getExerciseDailyScore(minutes) {
    if (minutes >= 45) return 0.9;
    if (minutes >= 30) return 0.75;
    if (minutes >= 20) return 0.55;
    if (minutes >= 10) return 0.3;
    if (minutes >= 1) return 0.15;
    return 0.0;
  }

  function getActivityComboBonus(steps, exercise) {
    if (steps >= 8000 && exercise >= 30) return 0.25;
    if (steps >= 6000 && exercise >= 20) return 0.15;
    if (steps >= 5000 && exercise >= 10) return 0.1;
    return 0.0;
  }

  function getStepEquivalentMinutes(steps) {
    const baseMovement = Math.max(0, (steps - 4000) / 200);
    const purposefulWalking = Math.max(0, (steps - 8000) / 120);
    return baseMovement + purposefulWalking;
  }

  function getWeeklyActivityMetric(last7Entries) {
    const exerciseMinutes = last7Entries.reduce(
      (sum, entry) => sum + asNumberOrZero(entry.exercise),
      0
    );
    const stepMinutes = last7Entries.reduce(
      (sum, entry) => sum + getStepEquivalentMinutes(asNumberOrZero(entry.steps)),
      0
    );
    const totalMinutes = exerciseMinutes + stepMinutes;

    if (totalMinutes >= 300) {
      return { totalMinutes, weeklyActivityScore: 1.0, weeklyActivityStatus: "Very active week" };
    }
    if (totalMinutes >= 150) {
      return { totalMinutes, weeklyActivityScore: 0.9, weeklyActivityStatus: "On target" };
    }
    if (totalMinutes >= 120) {
      return { totalMinutes, weeklyActivityScore: 0.75, weeklyActivityStatus: "Nearly there" };
    }
    if (totalMinutes >= 90) {
      return { totalMinutes, weeklyActivityScore: 0.6, weeklyActivityStatus: "Building" };
    }
    if (totalMinutes >= 60) {
      return { totalMinutes, weeklyActivityScore: 0.4, weeklyActivityStatus: "Some activity" };
    }
    if (totalMinutes >= 30) {
      return { totalMinutes, weeklyActivityScore: 0.2, weeklyActivityStatus: "Low" };
    }
    return { totalMinutes, weeklyActivityScore: 0.0, weeklyActivityStatus: "Very low" };
  }

  function getWeeklyExerciseMetric(last7Entries) {
    const activityMetric = getWeeklyActivityMetric(last7Entries);
    return {
      totalMinutes: activityMetric.totalMinutes,
      weeklyActivityScore: activityMetric.weeklyActivityScore,
      weeklyActivityStatus: activityMetric.weeklyActivityStatus,
      weeklyExerciseScore: activityMetric.weeklyActivityScore,
      weeklyExerciseStatus: activityMetric.weeklyActivityStatus
    };
  }

  function getSleepDailyScore(hours) {
    if (hours < 5.5) return 0.0;
    if (hours < 6) return 0.5;
    if (hours < 6.5) return 1.0;
    if (hours < 7) return 1.4;
    if (hours <= 9) return 2.0;
    if (hours <= 9.5) return 1.7;
    if (hours <= 10) return 1.3;
    return 1.0;
  }

  function getAlcoholDailyScore(units) {
    if (units <= 0) return 1.0;
    if (units <= 1) return 0.9;
    if (units <= 2) return 0.8;
    if (units <= 3) return 0.6;
    if (units <= 4) return 0.4;
    if (units <= 5) return 0.2;
    return 0.0;
  }

  function getMoodScore(mood) {
    if (!isValidNumber(mood)) return 0.5;
    return clamp((mood - 1) / 4, 0, 1);
  }

  function getBalanceBonus(foodScore, dailyActivityScore, sleepScore, dailyAlcoholScore) {
    let goodDomains = 0;
    if (foodScore >= 1.6) goodDomains += 1;
    if (dailyActivityScore >= 1.4) goodDomains += 1;
    if (sleepScore >= 1.7) goodDomains += 1;
    if (dailyAlcoholScore >= 0.8) goodDomains += 1;

    if (goodDomains === 4) return 1.5;
    if (goodDomains === 3) return 1.0;
    if (goodDomains === 2) return 0.6;
    if (goodDomains === 1) return 0.2;
    return 0.0;
  }

  function calculateDailyScore(entry) {
    const fruit = asNumberOrZero(entry.fruit);
    const veg = asNumberOrZero(entry.veg);
    const steps = asNumberOrZero(entry.steps);
    const exercise = asNumberOrZero(entry.exercise);
    const sleep = asNumberOrZero(entry.sleep);
    const alcohol = asNumberOrZero(entry.alcohol);
    const mood = entry.mood;

    const foodScore = getFoodDailyScore(fruit, veg);
    const movementScore = getMovementScore(steps);
    const exerciseDailyScore = getExerciseDailyScore(exercise);
    const comboBonus = getActivityComboBonus(steps, exercise);
    const dailyActivityScore = clamp(movementScore + exerciseDailyScore + comboBonus, 0, 2.0);
    const sleepScore = getSleepDailyScore(sleep);
    const dailyAlcoholScore = getAlcoholDailyScore(alcohol);
    const moodScore = getMoodScore(mood);
    const balanceBonus = getBalanceBonus(foodScore, dailyActivityScore, sleepScore, dailyAlcoholScore);
    const total = clamp(
      foodScore +
      dailyActivityScore +
      sleepScore +
      dailyAlcoholScore +
      moodScore +
      balanceBonus,
      0,
      10
    );

    return {
      foodScore,
      dailyActivityScore,
      movementScore,
      exerciseDailyScore,
      comboBonus,
      sleepScore,
      dailyAlcoholScore,
      moodScore,
      balanceBonus,
      total
    };
  }

  function averageScore(entries) {
    if (!entries.length) return null;
    return entries.reduce((sum, item) => sum + item.total, 0) / entries.length;
  }

  function getWeeklyAlcoholMetric(last7Entries) {
    const totalUnits = last7Entries.reduce((sum, entry) => sum + asNumberOrZero(entry.alcohol), 0);
    const alcoholFreeDays = last7Entries.reduce((count, entry) => count + (asNumberOrZero(entry.alcohol) <= 0 ? 1 : 0), 0);

    if (totalUnits === 0) return { totalUnits, alcoholFreeDays, weeklyAlcoholScore: 1.0, weeklyAlcoholStatus: "Alcohol-free week" };
    if (totalUnits <= 4) return { totalUnits, alcoholFreeDays, weeklyAlcoholScore: 0.9, weeklyAlcoholStatus: "Very low intake" };
    if (totalUnits <= 8) return { totalUnits, alcoholFreeDays, weeklyAlcoholScore: 0.75, weeklyAlcoholStatus: "Low intake" };
    if (totalUnits <= 12) return { totalUnits, alcoholFreeDays, weeklyAlcoholScore: 0.55, weeklyAlcoholStatus: "Moderate intake" };
    if (totalUnits <= 18) return { totalUnits, alcoholFreeDays, weeklyAlcoholScore: 0.3, weeklyAlcoholStatus: "Higher intake" };
    return { totalUnits, alcoholFreeDays, weeklyAlcoholScore: 0.0, weeklyAlcoholStatus: "Very high intake" };
  }

  function weightedAverage(segments) {
    const validSegments = segments.filter(segment => segment.avg !== null && segment.avg !== undefined);
    if (!validSegments.length) return null;
    const totalWeight = validSegments.reduce((sum, segment) => sum + segment.weight, 0);
    if (totalWeight <= 0) return null;
    return validSegments.reduce((sum, segment) => sum + (segment.avg * segment.weight), 0) / totalWeight;
  }

  function getScoreInterpretation(value) {
    if (value === null || value === undefined) return "Not enough data yet for this score view.";
    if (value >= 9.0) return "Excellent day, strongly aligned with healthy behaviours";
    if (value >= 8.0) return "Very good day, a strong overall pattern";
    if (value >= 6.5) return "Good day, several behaviours are in a healthy range";
    if (value >= 5.0) return "Mixed day, some healthy foundations are there";
    return "Below target today, with room to improve";
  }

  function calculateHealthScore(entries, todayDate) {
    if (!entries.length) {
      return {
        todayScore: null,
        sevenDayScore: null,
        overallScore: null,
        gaugeScore: 0,
        interpretation: "Not enough data yet for this score view.",
        scoreCards: [],
        breakdownByView: { today: null, "7d": null, all: null },
        todayComponents: null,
        segmentAverages: { last30: null, days31to90: null, older: null },
        weeklyExercise: getWeeklyExerciseMetric([]),
        weeklyAlcohol: getWeeklyAlcoholMetric([])
      };
    }

    const scoredEntries = entries.map(entry => ({ date: entry.date, ...calculateDailyScore(entry) }));
    const componentKeys = [
      "foodScore",
      "dailyActivityScore",
      "movementScore",
      "exerciseDailyScore",
      "comboBonus",
      "sleepScore",
      "dailyAlcoholScore",
      "moodScore",
      "balanceBonus",
      "total"
    ];

    const averageComponents = (rows) => {
      if (!rows.length) return null;
      const result = {};
      componentKeys.forEach(key => {
        result[key] = rows.reduce((sum, row) => sum + asNumberOrZero(row[key]), 0) / rows.length;
      });
      return result;
    };

    const todayComponents = scoredEntries.find(item => item.date === todayDate) || null;
    const todayScore = todayComponents ? todayComponents.total : null;
    const last7Scored = scoredEntries.slice(-7);
    const last7Raw = entries.slice(-7);
    const sevenDayScore = averageScore(last7Scored);

    const last30Scored = scoredEntries.slice(-30);
    const days31to90Scored = scoredEntries.slice(-90, -30);
    const olderScored = scoredEntries.slice(0, -90);

    const last30Avg = averageScore(last30Scored);
    const days31to90Avg = averageScore(days31to90Scored);
    const olderAvg = averageScore(olderScored);
    const overallScore = weightedAverage([
      { avg: last30Avg, weight: 0.5 },
      { avg: days31to90Avg, weight: 0.3 },
      { avg: olderAvg, weight: 0.2 }
    ]);

    return {
      todayScore,
      sevenDayScore,
      overallScore,
      gaugeScore: todayScore ?? 0,
      interpretation: getScoreInterpretation(todayScore),
      scoreCards: [
        { title: "Today", value: todayScore, caption: "Daily score" },
        { title: "Last 7 days", value: sevenDayScore, caption: "Average daily score" },
        { title: "Overall", value: overallScore, caption: "Weighted long-term score" }
      ],
      breakdownByView: {
        today: todayComponents,
        "7d": averageComponents(last7Scored),
        all: averageComponents(scoredEntries)
      },
      todayComponents,
      segmentAverages: {
        last30: last30Avg,
        days31to90: days31to90Avg,
        older: olderAvg
      },
      weeklyExercise: getWeeklyExerciseMetric(last7Raw),
      weeklyAlcohol: getWeeklyAlcoholMetric(last7Raw)
    };
  }

  global.HealthScoring = {
    calculateDailyScore,
    calculateHealthScore,
    getScoreInterpretation,
    getWeeklyActivityMetric,
    getWeeklyExerciseMetric,
    getWeeklyAlcoholMetric
  };
})(window);
