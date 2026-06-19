/**
 * Fixed rubric definitions shared by Module 1 (teacher self-reflection) and
 * Module 2 (LDM lesson observation) per the Teach For Armenia spec.
 *
 * "Teaching expectations" rubric (spec Module 1 "ՈՒԱ լրացման դաշտեր" /
 * Module 2 section Գ "Դասավանդման Ընդհանուր Ակնկալիքների Գնահատման
 * Բաղադրիչներ") is the SAME rubric filled twice for the same lesson: once
 * by the teacher (self-rating) and once by the LDM (independent rating).
 */

const SCORE_SCALE = [
  { value: 0, label: 'Լիովին բացակայում է' },
  { value: 1, label: 'Ապահովված չէ' },
  { value: 2, label: 'Խիստ թերի է ապահովված' },
  { value: 3, label: 'Մասամբ է ապահովված' },
  { value: 4, label: 'Գրեթե ապահովված է' },
  { value: 5, label: 'Լիովին ապահովված է' },
];

const TEACHING_RUBRIC_HEADLINE = {
  label: 'Ակնկալիքների և ուղղությունների վերաբերյալ ընդհանուր պնդումներ',
  hint: 'Բերել առնվազն մեկ օրինակ, որը կհիմնավորի միավորը։',
};

const TEACHING_RUBRIC_CATEGORIES = [
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
const PLANNING_RUBRIC_HEADLINE = {
  label: 'Դասապլանի և դասի ընդհանուր պլանավորման դիտարկում',
  hint: '',
};

const PLANNING_RUBRIC_CRITERIA = [
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

// Module 2 section Ե — closing holistic meta-rubric, filled by the LDM
// after reviewing the self-reflection, planning rubric, teaching rubric,
// and coaching conversation together ("Ընդհանուր դիտարկումներ").
const OVERALL_EXPECTATIONS_CRITERIA = [
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

// Module 2 section Բ — real-time lesson timeline matrix.
const TIMELINE_PHASES = [
  'Դասի վերջնարդյունքներ',
  'Դասի սկիզբ / Նոր նյութ',
  'Գործնական աշխատանք',
  'Ինքնուրույն աշխատանք',
  'Դասի ավարտ',
];

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Normalizes + computes averages for a submitted "teaching expectations"
 * rubric object (Module 1 self-rating or Module 2-Գ), regardless of what
 * partial shape the client sent.
 */
const computeTeachingRubric = (input) => {
  const safe = input || {};
  const submittedCategories = Array.isArray(safe.categories) ? safe.categories : [];

  const categories = TEACHING_RUBRIC_CATEGORIES.map((catDef) => {
    const submitted = submittedCategories.find((c) => c && c.key === catDef.key) || {};
    const submittedRows = Array.isArray(submitted.rows) ? submitted.rows : [];

    const rows = catDef.criteria.map((label, i) => {
      const r = submittedRows[i] || {};
      return {
        label,
        score: typeof r.score === 'number' ? r.score : null,
        comment: r.comment || '',
      };
    });

    const scored = rows.filter((r) => typeof r.score === 'number');
    const categoryAverage = scored.length
      ? round2(scored.reduce((a, r) => a + r.score, 0) / scored.length)
      : null;

    return {
      key: catDef.key,
      name: catDef.name,
      rows,
      categoryComment: submitted.categoryComment || '',
      categoryAverage,
    };
  });

  const validAverages = categories.map((c) => c.categoryAverage).filter((n) => typeof n === 'number');
  const overallAverage = validAverages.length
    ? round2(validAverages.reduce((a, b) => a + b, 0) / validAverages.length)
    : null;

  return {
    headline: {
      score: typeof safe.headline?.score === 'number' ? safe.headline.score : null,
      comment: safe.headline?.comment || '',
    },
    categories,
    overallAverage,
    summaryComment: safe.summaryComment || '',
  };
};

/**
 * Generic normalizer + averager for any flat (non-categorized) rubric: a
 * fixed criteria list scored 0-5, plus an overall average and a general
 * comment. Backs both the planning rubric (Module 2-Ա) and the closing
 * "Ընդհանուր դիտարկումներ" meta-rubric (Module 2-Ե).
 */
const computeFlatRubric = (criteria, input) => {
  const safe = input || {};
  const submittedRows = Array.isArray(safe.rows) ? safe.rows : [];

  const rows = criteria.map((def, i) => {
    const r = submittedRows.find((x) => x && x.key === def.key) || submittedRows[i] || {};
    return {
      key: def.key,
      label: def.label,
      score: typeof r.score === 'number' ? r.score : null,
      comment: r.comment || '',
    };
  });

  const scored = rows.filter((r) => typeof r.score === 'number');
  const overallAverage = scored.length
    ? round2(scored.reduce((a, r) => a + r.score, 0) / scored.length)
    : null;

  return {
    headline: {
      score: typeof safe.headline?.score === 'number' ? safe.headline.score : null,
      comment: safe.headline?.comment || '',
    },
    rows,
    overallAverage,
    generalComment: safe.generalComment || '',
  };
};

/**
 * Normalizes + computes the average for a submitted planning rubric object
 * (Module 2 section Ա).
 */
const computePlanningRubric = (input) => computeFlatRubric(PLANNING_RUBRIC_CRITERIA, input);

/**
 * Normalizes + computes the average for the closing "Ընդհանուր
 * դիտարկումներ" meta-rubric (Module 2 section Ե) — filled by the LDM after
 * reviewing the teacher's self-reflection, the planning rubric, the
 * teaching-expectations rubric, and the coaching conversation.
 */
const computeOverallExpectationsRubric = (input) =>
  computeFlatRubric(OVERALL_EXPECTATIONS_CRITERIA, input);

/**
 * Grand average shown at the very bottom of the observation form: the mean
 * of the planning rubric, the teaching-expectations rubric, and the closing
 * meta-rubric overall averages (spec: "Դասապլանի և դասի ընդհանուր
 * պլանավորման դիտարկման ու Դասի դիտարկման և վերլուծության ձևաթուղթի
 * միավորների ընդհանուր միջին").
 */
const computeGrandAverage = (...averages) => {
  const valid = averages.filter((n) => typeof n === 'number');
  return valid.length ? round2(valid.reduce((a, b) => a + b, 0) / valid.length) : null;
};

/** Normalizes a 5-phase realtime timeline matrix (Module 2 section Բ). */
const normalizeTimeline = (input) => {
  const submitted = Array.isArray(input) ? input : [];
  return TIMELINE_PHASES.map((phase, i) => {
    const r = submitted.find((x) => x && x.phase === phase) || submitted[i] || {};
    return {
      phase,
      teacherActions: r.teacherActions || '',
      studentActions: r.studentActions || '',
      questionsObservations: r.questionsObservations || '',
    };
  });
};

/** Normalizes a 3-row goals/steps table (used in both Module 1 and 2-Դ). */
const normalizeGoals = (input) => {
  const submitted = Array.isArray(input) ? input : [];
  const rows = [0, 1, 2].map((i) => ({
    goal: submitted[i]?.goal || '',
    steps: submitted[i]?.steps || '',
  }));
  return rows;
};

module.exports = {
  SCORE_SCALE,
  TEACHING_RUBRIC_HEADLINE,
  TEACHING_RUBRIC_CATEGORIES,
  PLANNING_RUBRIC_HEADLINE,
  PLANNING_RUBRIC_CRITERIA,
  OVERALL_EXPECTATIONS_CRITERIA,
  TIMELINE_PHASES,
  computeTeachingRubric,
  computePlanningRubric,
  computeOverallExpectationsRubric,
  computeGrandAverage,
  normalizeTimeline,
  normalizeGoals,
};
