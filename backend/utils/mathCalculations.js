/**
 * Shared numeric helpers used across observations and competency evaluations.
 */

/**
 * Average of a list of numeric scores, rounded to 2 decimal places.
 * Returns null when the list is empty so callers can distinguish
 * "no data" from "scored zero".
 */
const computeAverage = (scores = []) => {
  const valid = scores.filter((n) => typeof n === 'number' && !Number.isNaN(n));
  if (valid.length === 0) return null;
  const sum = valid.reduce((acc, n) => acc + n, 0);
  return Math.round((sum / valid.length) * 100) / 100;
};

/**
 * Average score across an array of { score } / { competency, score } entries.
 */
const computeEntriesAverage = (entries = []) =>
  computeAverage(entries.map((entry) => entry.score));

/**
 * Given a chronologically-ordered list of average scores, returns the
 * direction and magnitude of change between the first and last entries.
 */
const computeTrend = (averageScores = []) => {
  const valid = averageScores.filter((n) => typeof n === 'number' && !Number.isNaN(n));
  if (valid.length < 2) {
    return { direction: 'flat', change: 0 };
  }

  const first = valid[0];
  const last = valid[valid.length - 1];
  const change = Math.round((last - first) * 100) / 100;

  let direction = 'flat';
  if (change > 0) direction = 'up';
  if (change < 0) direction = 'down';

  return { direction, change };
};

/**
 * Groups competency evaluations by competency name and averages the score
 * for each, producing the data shape the CompetencyMatrix view needs.
 */
const buildCompetencyMatrix = (evaluations = []) => {
  const byCompetency = {};

  evaluations.forEach((evaluation) => {
    (evaluation.competencies || []).forEach(({ name, score }) => {
      if (!byCompetency[name]) byCompetency[name] = [];
      byCompetency[name].push(score);
    });
  });

  return Object.entries(byCompetency).map(([name, scores]) => ({
    name,
    average: computeAverage(scores),
    trend: computeTrend(scores),
    samples: scores.length,
  }));
};

module.exports = {
  computeAverage,
  computeEntriesAverage,
  computeTrend,
  buildCompetencyMatrix,
};
