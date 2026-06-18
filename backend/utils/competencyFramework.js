/**
 * Single source of truth for the 18-competency leadership evaluation
 * framework (Teach For Armenia spec, Module 3). Mirrored in the frontend
 * at frontend/src/constants/competencyFramework.js — keep both in sync.
 */

// The official 0-5 evaluation scale used everywhere in the system.
const SCORE_SCALE = [
  { value: 0, label: 'Լիովին բացակայում է' },
  { value: 1, label: 'Ապահովված չէ' },
  { value: 2, label: 'Խիստ թերի է ապահովված' },
  { value: 3, label: 'Մասամբ է ապահովված' },
  { value: 4, label: 'Գրեթե ապահովված է' },
  { value: 5, label: 'Լիովին ապահովված է' },
];

// 5 categories x 18 competencies, in spec order.
const COMPETENCY_CATEGORIES = [
  {
    key: 'self-leadership',
    name: 'Անձնային Առաջնորդություն և Ինքնակարգավորում',
    competencies: [
      'Ինքնաճանաչում',
      'Ինքնակարգավորում',
      'Տոկունություն և ճկունություն',
      'Հետաքրքրվածություն',
      'Ինքնուրույն ուսումնառություն',
      'Հետադարձ կապի և բարելավման մշակույթ',
    ],
  },
  {
    key: 'strategic-thinking',
    name: 'Ռազմավարական Մտածողություն և Լուծումներ',
    competencies: ['Մեծ տեսլական և իրադրության գնահատում', 'Երկարաժամկետ որոշումների կայացում', 'Լուծումնամետ գործունեություն'],
  },
  {
    key: 'communication',
    name: 'Հաղորդակցություն և Սոցիալական Ազդեցություն',
    competencies: ['Հաղորդակցություն', 'Հարաբերությունների կառուցում ու ցանցի ընդլայնում', 'Բարդ խոսակցությունների վարում'],
  },
  {
    key: 'management',
    name: 'Կառավարում և Արդյունքամետություն',
    competencies: ['Պլանավորում և ռեսուրսների կառավարում', 'Ինքնավարություն', 'Արդյունքամետ գործունեություն'],
  },
  {
    key: 'data-judgment',
    name: 'Տվյալների Վերլուծություն և Կշռադատում',
    competencies: ['Հետևողական մշտադիտարկում', 'Դադար և կշռադատում', 'Սովորածի համադրում և կիրառում'],
  },
];

// Flat ordered list of all 18 competency names (used for validation / matrix rows).
const ALL_COMPETENCIES = COMPETENCY_CATEGORIES.flatMap((c) => c.competencies);

const categoryForCompetency = (name) =>
  COMPETENCY_CATEGORIES.find((c) => c.competencies.includes(name)) || null;

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Builds the grouped 18-row matrix + category/overall averages from ONE
 * evaluation's `competencies: [{name, score, notes}]` array, per the
 * spec's two-step formula (section 4-B):
 *   1. Category average = sum of that category's competency scores / count
 *   2. Overall average   = sum of all 18 competency scores / 18
 */
const buildCategorizedMatrix = (competencies = []) => {
  const byName = {};
  competencies.forEach(({ name, score, notes }) => {
    byName[name] = { score, notes };
  });

  const categories = COMPETENCY_CATEGORIES.map((cat) => {
    const rows = cat.competencies.map((name) => ({
      name,
      score: byName[name]?.score ?? null,
      notes: byName[name]?.notes ?? '',
    }));
    const scored = rows.filter((r) => typeof r.score === 'number');
    const categoryAverage = scored.length
      ? round2(scored.reduce((a, r) => a + r.score, 0) / scored.length)
      : null;
    return { key: cat.key, name: cat.name, rows, categoryAverage };
  });

  const allScored = ALL_COMPETENCIES.map((name) => byName[name]?.score).filter(
    (s) => typeof s === 'number'
  );
  const overallAverage = allScored.length ? round2(allScored.reduce((a, b) => a + b, 0) / 18) : null;

  return { categories, overallAverage, completed: allScored.length, total: ALL_COMPETENCIES.length };
};

module.exports = {
  SCORE_SCALE,
  COMPETENCY_CATEGORIES,
  ALL_COMPETENCIES,
  categoryForCompetency,
  buildCategorizedMatrix,
};
