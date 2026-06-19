const path = require('path');
const PDFDocument = require('pdfkit');

// PDFKit's built-in Helvetica/Times/Courier fonts only cover WinAnsi/Latin
// glyphs, so any Armenian text would render blank. DejaVu Sans includes the
// Armenian Unicode block, so we embed it and use it for all text instead.
const FONT_REGULAR = path.join(__dirname, '../assets/fonts/DejaVuSans.ttf');
const FONT_BOLD = path.join(__dirname, '../assets/fonts/DejaVuSans-Bold.ttf');

/**
 * Renders a PDFDocument to an in-memory Buffer. PDFKit streams chunks as
 * it writes, so we collect them and resolve once the document is finished.
 */
const renderToBuffer = (drawFn) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    doc.registerFont('Body', FONT_REGULAR);
    doc.registerFont('Body-Bold', FONT_BOLD);
    doc.font('Body');

    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    drawFn(doc);
    doc.end();
  });

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('hy-AM') : '—');

const drawHeader = (doc, title, subtitle) => {
  doc.fontSize(18).font('Body-Bold').text(title, { align: 'left' });
  if (subtitle) {
    doc.moveDown(0.2);
    doc.fontSize(11).font('Body').fillColor('#555').text(subtitle);
    doc.fillColor('black');
  }
  doc.moveDown(1);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').stroke();
  doc.moveDown(1);
};

const drawSection = (doc, label, body) => {
  doc.fontSize(12).font('Body-Bold').text(label);
  doc.fontSize(11).font('Body').text(body || '—', { align: 'left' });
  doc.moveDown(0.8);
};

const drawLink = (doc, label, url) => {
  if (!url) return;
  doc.fontSize(11).font('Body-Bold').text(`${label}՝ `, { continued: true });
  doc.font('Body').fillColor('#1a5fb4').text(url, { link: url, underline: true });
  doc.fillColor('black');
  doc.moveDown(0.5);
};

const drawRubricRows = (doc, rows) => {
  (rows || []).forEach((r) => {
    doc.fontSize(10.5).font('Body-Bold').text(`${r.label}`);
    doc
      .fontSize(10.5)
      .font('Body')
      .text(`Միավոր՝ ${typeof r.score === 'number' ? r.score : '—'}/5${r.comment ? `  —  ${r.comment}` : ''}`);
    doc.moveDown(0.4);
  });
};

const drawFlatRubric = (doc, title, rubric) => {
  doc.fontSize(13).font('Body-Bold').text(title);
  doc.moveDown(0.3);
  drawRubricRows(doc, rubric?.rows);
  doc
    .fontSize(11)
    .font('Body-Bold')
    .text(`Ընդհանուր միջինացված միավորը՝ ${rubric?.overallAverage ?? '—'}/5`);
  if (rubric?.generalComment) {
    doc.fontSize(10.5).font('Body').text(`Ընդհանուր մեկնաբանություն՝ ${rubric.generalComment}`);
  }
  doc.moveDown(0.8);
};

const drawTeachingRubric = (doc, title, rubric) => {
  doc.fontSize(13).font('Body-Bold').text(title);
  doc.moveDown(0.2);
  if (rubric?.headline) {
    doc
      .fontSize(10.5)
      .font('Body')
      .text(
        `Ակնկալիքների և ուղղությունների վերաբերյալ ընդհանուր պնդումներ՝ ${
          typeof rubric.headline.score === 'number' ? rubric.headline.score : '—'
        }/5${rubric.headline.comment ? ` — ${rubric.headline.comment}` : ''}`
      );
    doc.moveDown(0.4);
  }
  (rubric?.categories || []).forEach((cat) => {
    doc.fontSize(11.5).font('Body-Bold').text(cat.name);
    doc.moveDown(0.2);
    drawRubricRows(doc, cat.rows);
    doc
      .fontSize(10.5)
      .font('Body-Bold')
      .text(`Բաղադրիչի միջին միավորը՝ ${cat.categoryAverage ?? '—'}/5`);
    if (cat.categoryComment) {
      doc.fontSize(10.5).font('Body').text(`Մեկնաբանություն՝ ${cat.categoryComment}`);
    }
    doc.moveDown(0.6);
  });
  doc.fontSize(11).font('Body-Bold').text(`Ամփոփիչ միավորը (միջինացված)՝ ${rubric?.overallAverage ?? '—'}/5`);
  if (rubric?.summaryComment) {
    doc.fontSize(10.5).font('Body').text(`Ամփոփիչ դիտարկումներ՝ ${rubric.summaryComment}`);
  }
  doc.moveDown(0.8);
};

/**
 * PDF for a single LessonObservation. `observation` should already have
 * `teacher` and `ldm` populated with at least a `name` field.
 */
const generateObservationPdf = (observation) =>
  renderToBuffer((doc) => {
    drawHeader(
      doc,
      'Դասի դիտարկման և վերլուծության հաշվետվություն',
      `${observation.teacher?.name || 'Անհայտ ուսուցիչ'} — ${fmtDate(observation.date)}`
    );

    drawSection(doc, 'Դիտարկող (ԱԶՂ)', observation.ldm?.name || 'Անհայտ մասնագետ');
    drawSection(doc, 'Առարկա / Դասարան', `${observation.subject || '—'} / ${observation.grade || '—'}`);
    drawLink(doc, 'Դասի պլան', observation.lessonPlanLink);
    drawLink(doc, 'Տեսաձայնագրություն', observation.recordingLink);
    doc.moveDown(0.4);

    drawFlatRubric(doc, 'Ա. Դասապլանի և դասի ընդհանուր պլանավորման դիտարկում', observation.planningRubric);

    doc.fontSize(13).font('Body-Bold').text('Բ. Դասալսման ընթացքում իրական ժամանակի ժրոնիկոն');
    doc.moveDown(0.3);
    (observation.timeline || []).forEach((row) => {
      doc.fontSize(11).font('Body-Bold').text(row.phase);
      doc.fontSize(10.5).font('Body').text(`Ուսուցիչ-առաջնորդի գործողություններ՝ ${row.teacherActions || '—'}`);
      doc.fontSize(10.5).font('Body').text(`Աշակերտի գործողություններ՝ ${row.studentActions || '—'}`);
      doc.fontSize(10.5).font('Body').text(`Հարցեր / դիտարկումներ՝ ${row.questionsObservations || '—'}`);
      doc.moveDown(0.4);
    });
    doc.moveDown(0.4);

    drawTeachingRubric(
      doc,
      'Գ. Դասավանդման Ընդհանուր Ակնկալիքների Գնահատման Բաղադրիչներ',
      observation.teachingRubric
    );

    doc.fontSize(13).font('Body-Bold').text('Դ. Քոուչինգի և Վերլուծական Զրույցի Բաժին');
    doc.moveDown(0.3);
    const coaching = observation.coaching || {};
    drawSection(doc, 'Ինչպե՞ս է զգացել դասի սկզբում', coaching.feltAtStart);
    drawSection(doc, 'Ինքնանդրադարձի ներկայացում ՈՒԱ-ի կողմից', coaching.selfReflectionSummary);
    drawSection(doc, 'Դասի ընթացքում նկատված ուժեղ կողմերը', coaching.strengthsObserved);
    drawSection(doc, 'Դասի ընթացքում նկատված բարելավող կողմեր', coaching.improvementsObserved);
    drawSection(doc, 'Հարցեր ուսուցչին իր բարելավող կողմերը վերլուծելու համար', coaching.questionsForTeacher);
    drawSection(doc, 'Գործնական աշխատանքի իրականացում ըստ բարելավման ուղղությունների', coaching.practicalWorkPlan);
    drawSection(doc, 'ՈՒԱ-ի զգացողության ստուգում (խոսակցության ավարտին)', coaching.feltAtEnd);

    doc.fontSize(11.5).font('Body-Bold').text('Հաջորդիվ դասերի համար սահմանված նպատակներ/քայլեր');
    doc.moveDown(0.2);
    (coaching.goals || []).forEach((g, i) => {
      doc.fontSize(10.5).font('Body-Bold').text(`Նպատակ ${i + 1}. ${g.goal || '—'}`);
      doc.fontSize(10.5).font('Body').text(`Քայլեր/գործողություններ՝ ${g.steps || '—'}`);
      doc.moveDown(0.3);
    });
    drawSection(doc, 'Անհրաժեշտ ռեսուրսներ և ուղղորդումներ', coaching.resourcesAndGuidance);
    doc.moveDown(0.4);

    drawFlatRubric(doc, 'Ե. Ընդհանուր դիտարկումներ', observation.overallExpectations);

    doc
      .fontSize(13)
      .font('Body-Bold')
      .text(`Դասապլանի, դասավանդման և ընդհանուր դիտարկումների ընդհանուր միջին՝ ${observation.grandAverage ?? '—'}/5`);
  });

/**
 * PDF for a single CompetencyEvaluation, including the per-category
 * averages computed at submission time (see utils/competencyFramework.js).
 */
const generateEvaluationPdf = (evaluation) =>
  renderToBuffer((doc) => {
    drawHeader(
      doc,
      'Առաջնորդական կարողունակությունների գնահատման հաշվետվություն',
      `${evaluation.teacher?.name || 'Անհայտ ուսուցիչ'} — ${evaluation.period}`
    );

    drawSection(doc, 'Գնահատող', evaluation.evaluator?.name || 'Անհայտ մասնագետ');

    doc.fontSize(12).font('Body-Bold').text('Կարողունակություններ');
    doc.moveDown(0.3);
    (evaluation.competencies || []).forEach((c) => {
      doc
        .fontSize(11)
        .font('Body')
        .text(`• ${c.name}: ${c.score}/5${c.notes ? ` — ${c.notes}` : ''}`);
    });
    doc.moveDown(0.6);

    if ((evaluation.categoryAverages || []).length) {
      doc.fontSize(12).font('Body-Bold').text('Միջինացված գնահատականներ ըստ խմբերի');
      doc.moveDown(0.3);
      evaluation.categoryAverages.forEach((cat) => {
        doc
          .fontSize(11)
          .font('Body')
          .text(`• ${cat.name}: ${cat.average ?? '—'}/5`);
      });
      doc.moveDown(0.6);
    }

    doc.fontSize(12).font('Body-Bold').text(`Ընդհանուր միջին գնահատական՝ ${evaluation.averageScore ?? '—'}/5`);
  });

module.exports = {
  generateObservationPdf,
  generateEvaluationPdf,
};
