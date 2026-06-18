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

/**
 * PDF for a single LessonObservation. `observation` should already have
 * `teacher` and `ldm` populated with at least a `name` field.
 */
const generateObservationPdf = (observation) =>
  renderToBuffer((doc) => {
    drawHeader(
      doc,
      'Դասի դիտարկման հաշվետվություն',
      `${observation.teacher?.name || 'Անհայտ ուսուցիչ'} — ${fmtDate(observation.date)}`
    );

    drawSection(doc, 'Դիտարկող', observation.ldm?.name || 'Անհայտ մասնագետ');
    drawSection(doc, 'Առարկա / Դասարան', `${observation.subject || '—'} / ${observation.grade || '—'}`);
    drawLink(doc, 'Դասի պլան', observation.lessonPlanLink);
    drawLink(doc, 'Տեսաձայնագրություն', observation.recordingLink);
    drawSection(doc, 'Ուժեղ կողմեր', observation.strengths);
    drawSection(doc, 'Աջակցության կարիք ունեցող ուղղություններ', observation.areasForGrowth);

    doc.fontSize(12).font('Body-Bold').text('Կարողունակությունների գնահատում');
    doc.moveDown(0.3);
    (observation.competencyScores || []).forEach((c) => {
      doc
        .fontSize(11)
        .font('Body')
        .text(`• ${c.competency}: ${c.score}/5${c.notes ? ` — ${c.notes}` : ''}`);
    });
    doc.moveDown(0.5);
    doc.fontSize(11).font('Body-Bold').text(`Ընդհանուր գնահատական՝ ${observation.overallScore ?? '—'}/5`);
    doc.moveDown(0.8);

    drawSection(doc, 'Երաշանավորություններ', observation.recommendations);
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
