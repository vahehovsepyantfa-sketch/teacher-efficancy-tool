// Mirrors backend/utils/observationRubrics.js — the shared "teaching
// expectations" rubric used by both Module 1 (teacher self-rating) and
// Module 2 section Գ (LDM rating), plus the rest of Module 2's sections.
// Keep both copies in sync if the spec rubric ever changes.

export const SCORE_SCALE = [
  { value: 0, label: 'Լիովին բացակայում է' },
  { value: 1, label: 'Ապահովված չէ' },
  { value: 2, label: 'Խիստ թերի է ապահովված' },
  { value: 3, label: 'Մասամբ է ապահովված' },
  { value: 4, label: 'Գրեթե ապահովված է' },
  { value: 5, label: 'Լիովին ապահովված է' },
];

export const TEACHING_RUBRIC_HEADLINE = {
  label: 'Ակնկալիքների և ուղղությունների վերաբերյալ ընդհանուր պնդումներ',
  hint: 'Բերել առնվազն մեկ օրինակ, որը կհիմնավորի միավորը։',
};

export const TEACHING_RUBRIC_CATEGORIES = [
  {
    key: 'academicPreparedness',
    name: 'Ակադեմիական պատրաստվածություն',
    criteria: [
      'Դասի համար սահմանված վերջնարդյունքները թիրախային և իրատեսական են տվյալ դասի իրականացման համար',
      'Նոր նյութի բովանդակությունը և հիմնական դրույթները ներկայացվում են համակարգված տրամաբանությամբ և հստակ',
      'Դասի տարբեր փուլերում նախատեսված նյութը մատուցում է մատչելի լեզվով, համապատասխան օրինակներով և դիդակտիկ նյութերով',
      'Սահմանված առաջադրանքները/հանձնարարությունները բխում են թեմայից և վերջնարդյունքներից (կամ հարցադրումները և առաջադրանքները խթանում են քննական մտածողության հմտությունների զարգացումը)',
      'Դասի թեման կապվում է անցած նյութերի, հարակից առարկաների կամ կյանքի իրական օրինակների հետ՝ խթանելով թեմայի ամբողջական ըմբռնումը',
    ],
  },
  {
    key: 'teachingSkills',
    name: 'Դասավանդման հմտություններ',
    criteria: [
      'Դասն ամբողջությամբ իրականացվում է ՈւՀԴ/ ՈւՀՁ կառուցվածքով՝ դասի փուլերի միջև փոխակապվածության ապահովմամբ',
      'Նյութի ներկայացման բազմաբնույթ եղանակներ և մեթոդներ են կիրառվում',
      'Ընկալման ստուգման տարատեսակ տեխնիկաներ են կիրառվում բոլոր աշակերտներին ներգրավելու համար',
      'Իրականացնում է ուղղորդված աշխատանք՝ հստակ հետադարձ կապերով, ամփոփումներով և արդյունքների գնահատմամբ',
      'Ցուցաբերվում է արդյունավետ ժամանակի կառավարում',
    ],
  },
  {
    key: 'classroomCulture',
    name: 'Դասարանային կարգապահություն և մշակույթ',
    criteria: [
      'Սահմանվել են դասարանային ակնկալիքներ, նորմեր ու ընթացակարգերը, ապահովվում է վերջիններիս տեսանելիությունը, կիրառությունը և հետևողականությունը',
      'Սովորող-ուսուցիչ, սովորող-սովորող փոխհարաբերությունները դրական են, հարգալից ու ջերմ',
      'Ուսուցիչը դասի բոլոր փուլերում հնարավորություն է տալիս սովորողներին ներգրավվելու ուսումնական գործընթացի մեջ՝ հարցերի, առաջադրանքների, թիմային և ինքնուրույն աշխատանքի միջոցով',
      'Հրահանգները տրվում են ամբողջական, հստակ ու հասկանալի և հնարավորություն են տալիս բոլոր սովորողներին ներգրավվել գործընթացներին',
      'Դասի ընթացքում ապահովվում են սովորողների ՍՀ հմտությունների և առաջնորդական կարողունակությունների զարգացման նախապայմանները (ՍՀՈւ բաղադրիչների և Առաջնորդական կարողունակությունների կապը)',
    ],
  },
];

// Module 2 section Ա — planning rubric (flat, no sub-categories).
export const PLANNING_RUBRIC_HEADLINE = {
  label: 'Դասապլանի և դասի ընդհանուր պլանավորման դիտարկում',
  hint: '',
};

export const PLANNING_RUBRIC_CRITERIA = [
  {
    key: 'lessonOutcomes',
    label:
      'Դասի վերջնարդյունքներ — դասի համար սահմանված ակադեմիական վերջնարդյունքները թիրախային են և իրատեսական, առաջնորդական վերջնարդյունքների համար նշված են հստակ քայլեր (դիտարկվում է ըստ նպատակահարմարության)',
  },
  {
    key: 'structure',
    label:
      'Դասի կառուցվածք և փուլերի փոխկապվածություն — դասի բոլոր 5 փուլերը ներկայացված են և բխում են դասի առարկայական (և առաջնորդական) վերջնարդյունքներից ու նոր նյութից, փուլերի ժամաբաշխումն իրատեսական է և տրամաբանական',
  },
  {
    key: 'newMaterial',
    label:
      'Նոր նյութի բովանդակություն և կարևոր դրույթներ — հստակորեն ներկայացված են դասի կարևոր դրույթները, հասկացությունները, սահմանումներն ու օրինակները, պարզ են բացատրման մեթոդները, բոլոր հավելյալ նյութերը կցված են ակտիվ հղմամբ, առկա են ընթացիկ ընկալման ստուգումներ',
  },
  {
    key: 'tasksAndQuestions',
    label:
      'Հարցեր/հանձնարարություններ/առաջադրանքներ և ընկալման ստուգում — եռամակարդակ են և համապատասխանում են Բլում-Անդերսոնի աստիճանակարգին, առկա են դասի տարբեր փուլերում, խթանում են քննական մտածողության հմտությունների զարգացումը',
  },
  {
    key: 'instructions',
    label:
      'Հրահանգներ — դասի համապատասխան փուլերում առկա են բովանդակային և տեխնիկական հրահանգներ, ձևակերպված հստակ տրամաբանությամբ (ի՞նչ անել, ինչպե՞ս անել, որքա՞ն ժամանակ է հատկացված, ի՞նչ անել ավարտելուց հետո), առկա են հրահանգների ընկալման ստուգումներ',
  },
];

// Module 2 section Բ — real-time lesson timeline matrix.
export const TIMELINE_PHASES = [
  'Դասի վերջնարդյունքներ',
  'Դասի սկիզբ / Նոր նյութ',
  'Գործնական աշխատանք',
  'Ինքնուրույն աշխատանք',
  'Դասի ավարտ',
];

// Module 2 section Ե — closing holistic meta-rubric.
export const OVERALL_EXPECTATIONS_CRITERIA = [
  {
    key: 'planningSkill',
    label:
      'Իրականացվում է դասի մանրամասն և ՈւՀԴ/ՈւՀՁ պահանջներին համապատասխան պլանավորում՝ նկատի ունենալով սովորողների կարիքները/առկա տվյալները (Պլանավորման հմտություն)',
  },
  {
    key: 'effectiveExecutionSkill',
    label: 'Ապահովվում է դասի արդյունավետ կազմակերպում և իրականացում (Արդյունավետ գործելու հմտություն)',
  },
  {
    key: 'analyticalSkill',
    label:
      'Դրսևորվում են ինքնանդրադարձի և ինքնավերլուծության զարգացած հմտություններ (Վերլուծական հմտություններ)',
  },
  {
    key: 'feedbackResponsivenessSkill',
    label:
      'Հետադարձ կապի հանդեպ դրսևորվում է բացության և հետևողականություն բարելավման ուղղությունների հարցում (Հետադարձ պլանավորման հմտություն)',
  },
  {
    key: 'synthesisAndAdvancementSkill',
    label:
      'Դրսևորվում են թիրախային նպատակների և քայլերի վերհանման, մասնագիտական և առաջնորդական կարողունակությունների զարգացման հմտություններ (Սովորածը ամփոփելու հմտություն և առաջխաղացում)',
  },
];

export const round2 = (n) => Math.round(n * 100) / 100;

/** Blank teaching-rubric value the editor/form can start from. */
export const emptyTeachingRubric = () => ({
  headline: { score: null, comment: '' },
  categories: TEACHING_RUBRIC_CATEGORIES.map((cat) => ({
    key: cat.key,
    name: cat.name,
    rows: cat.criteria.map((label) => ({ label, score: null, comment: '' })),
    categoryComment: '',
    categoryAverage: null,
  })),
  overallAverage: null,
  summaryComment: '',
});

/** Blank flat-rubric value (planning rubric / overall-expectations rubric). */
export const emptyFlatRubric = (criteria) => ({
  headline: { score: null, comment: '' },
  rows: criteria.map((c) => ({ key: c.key, label: c.label, score: null, comment: '' })),
  overallAverage: null,
  generalComment: '',
});

/** Blank 5-phase timeline. */
export const emptyTimeline = () =>
  TIMELINE_PHASES.map((phase) => ({ phase, teacherActions: '', studentActions: '', questionsObservations: '' }));

/** Blank 3-row goals/steps table. */
export const emptyGoals = () => [
  { goal: '', steps: '' },
  { goal: '', steps: '' },
  { goal: '', steps: '' },
];

/** Live client-side average for a categorized teaching rubric (server recomputes authoritatively on save). */
export const computeTeachingRubricAverages = (rubric) => {
  const categories = (rubric.categories || []).map((cat) => {
    const scored = (cat.rows || []).filter((r) => typeof r.score === 'number');
    const categoryAverage = scored.length ? round2(scored.reduce((a, r) => a + r.score, 0) / scored.length) : null;
    return { ...cat, categoryAverage };
  });
  const validAverages = categories.map((c) => c.categoryAverage).filter((n) => typeof n === 'number');
  const overallAverage = validAverages.length
    ? round2(validAverages.reduce((a, b) => a + b, 0) / validAverages.length)
    : null;
  return { ...rubric, categories, overallAverage };
};

/** Live client-side average for a flat rubric. */
export const computeFlatRubricAverage = (rubric) => {
  const scored = (rubric.rows || []).filter((r) => typeof r.score === 'number');
  const overallAverage = scored.length ? round2(scored.reduce((a, r) => a + r.score, 0) / scored.length) : null;
  return { ...rubric, overallAverage };
};
