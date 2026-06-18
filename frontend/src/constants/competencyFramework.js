// Mirrors backend/utils/competencyFramework.js — the fixed, spec-mandated
// 18-competency / 5-category leadership framework and the official 0-5
// rating scale. Keep both copies in sync if the framework ever changes.

export const SCORE_SCALE = [
  { value: 0, label: 'Լիովին բացակայում է' },
  { value: 1, label: 'Ապահովված չէ' },
  { value: 2, label: 'Խիստ թերի է ապահովված' },
  { value: 3, label: 'Մասամբ է ապահովված' },
  { value: 4, label: 'Գրեթե ապահովված է' },
  { value: 5, label: 'Լիովին ապահովված է' },
];

export const COMPETENCY_CATEGORIES = [
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

export const ALL_COMPETENCIES = COMPETENCY_CATEGORIES.flatMap((c) => c.competencies);

/** Blank {name, score: null, notes: ''} rows for all 18, grouped by category — for rendering a fresh evaluation form. */
export const emptyCategorizedScores = () =>
  COMPETENCY_CATEGORIES.map((cat) => ({
    key: cat.key,
    name: cat.name,
    rows: cat.competencies.map((name) => ({ name, score: '', notes: '' })),
  }));
