const PDFDocument = require('pdfkit');

/**
 * Renders a PDFDocument to an in-memory Buffer. PDFKit streams chunks as
 * it writes, so we collect them and resolve once the document is finished.
 */
const renderToBuffer = (drawFn) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    drawFn(doc);
    doc.end();
  });

const drawHeader = (doc, title, subtitle) => {
  doc.fontSize(18).font('Helvetica-Bold').text(title, { align: 'left' });
  if (subtitle) {
    doc.moveDown(0.2);
    doc.fontSize(11).font('Helvetica').fillColor('#555').text(subtitle);
    doc.fillColor('black');
  }
  doc.moveDown(1);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').stroke();
  doc.moveDown(1);
};

const drawSection = (doc, label, body) => {
  doc.fontSize(12).font('Helvetica-Bold').text(label);
  doc.fontSize(11).font('Helvetica').text(body || '—', { align: 'left' });
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
      'Lesson Observation Report',
      `${observation.teacher?.name || 'Unknown teacher'} — ${new Date(
        observation.date
      ).toLocaleDateString()}`
    );

    drawSection(doc, 'Observed by', observation.ldm?.name || 'Unknown LDM');
    drawSection(doc, 'Subject / Grade', `${observation.subject || '—'} / ${observation.grade || '—'}`);
    drawSection(doc, 'Strengths', observation.strengths);
    drawSection(doc, 'Areas for Growth', observation.areasForGrowth);

    doc.fontSize(12).font('Helvetica-Bold').text('Competency Scores');
    doc.moveDown(0.3);
    (observation.competencyScores || []).forEach((c) => {
      doc.fontSize(11).font('Helvetica').text(`• ${c.competency}: ${c.score}/5${c.notes ? ` — ${c.notes}` : ''}`);
    });
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica-Bold').text(`Overall score: ${observation.overallScore ?? '—'}/5`);
    doc.moveDown(0.8);

    drawSection(doc, 'Recommendations', observation.recommendations);
  });

/**
 * PDF for a single CompetencyEvaluation.
 */
const generateEvaluationPdf = (evaluation) =>
  renderToBuffer((doc) => {
    drawHeader(
      doc,
      'Competency Evaluation Report',
      `${evaluation.teacher?.name || 'Unknown teacher'} — ${evaluation.period}`
    );

    drawSection(doc, 'Evaluated by', evaluation.evaluator?.name || 'Unknown evaluator');

    doc.fontSize(12).font('Helvetica-Bold').text('Competencies');
    doc.moveDown(0.3);
    (evaluation.competencies || []).forEach((c) => {
      doc.fontSize(11).font('Helvetica').text(`• ${c.name}: ${c.score}/5${c.notes ? ` — ${c.notes}` : ''}`);
    });
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica-Bold').text(`Average score: ${evaluation.averageScore ?? '—'}/5`);
  });

module.exports = {
  generateObservationPdf,
  generateEvaluationPdf,
};
