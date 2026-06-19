import VoiceToTextButton from './VoiceToTextButton';
import { SCORE_SCALE, computeTeachingRubricAverages, computeFlatRubricAverage } from '../../constants/teachingRubric';

/** One scored row: label + 0-5 score dropdown + comment textarea + voice button. */
function RubricRow({ row, onChange, readOnly }) {
  return (
    <div className="rubric-row">
      <p className="rubric-row-label">{row.label}</p>
      <div className="rubric-row-fields">
        <label className="rubric-row-score">
          <span>Միավոր</span>
          <select
            value={row.score ?? ''}
            disabled={readOnly}
            onChange={(e) => onChange({ ...row, score: e.target.value === '' ? null : Number(e.target.value) })}
          >
            <option value="">—</option>
            {SCORE_SCALE.map((s) => (
              <option key={s.value} value={s.value}>
                {s.value} — {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="rubric-row-comment">
          <span>Մեկնաբանություն</span>
          <textarea
            rows={2}
            value={row.comment || ''}
            disabled={readOnly}
            onChange={(e) => onChange({ ...row, comment: e.target.value })}
          />
          {!readOnly && (
            <VoiceToTextButton
              onTranscript={(text) =>
                onChange({ ...row, comment: row.comment ? `${row.comment} ${text}` : text })
              }
            />
          )}
        </label>
      </div>
    </div>
  );
}

function HeadlineBlock({ headline, hint, onChange, readOnly }) {
  if (!headline) return null;
  return (
    <div className="rubric-row rubric-headline">
      <div>
        <p className="rubric-row-label">{headline.label}</p>
        {headline.hint && <p className="muted">{headline.hint}</p>}
      </div>
      <div className="rubric-row-fields">
        <label className="rubric-row-score">
          <span>Միավոր</span>
          <select
            value={headline.score ?? ''}
            disabled={readOnly}
            onChange={(e) =>
              onChange({ ...headline, score: e.target.value === '' ? null : Number(e.target.value) })
            }
          >
            <option value="">—</option>
            {SCORE_SCALE.map((s) => (
              <option key={s.value} value={s.value}>
                {s.value} — {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="rubric-row-comment">
          <span>Մեկնաբանություն ({hint})</span>
          <textarea
            rows={2}
            value={headline.comment || ''}
            disabled={readOnly}
            onChange={(e) => onChange({ ...headline, comment: e.target.value })}
          />
          {!readOnly && (
            <VoiceToTextButton
              onTranscript={(text) =>
                onChange({ ...headline, comment: headline.comment ? `${headline.comment} ${text}` : text })
              }
            />
          )}
        </label>
      </div>
    </div>
  );
}

/**
 * The shared "teaching expectations" rubric editor: a headline statement
 * plus 3 categories of 5 criteria each, used both by the teacher (Module 1
 * self-rating) and the LDM (Module 2 section Գ).
 */
export function TeachingRubricEditor({ value, onChange, readOnly = false, title }) {
  const rubric = value || {};
  const update = (patch) => onChange(computeTeachingRubricAverages({ ...rubric, ...patch }));

  return (
    <div className="rubric-block">
      {title && <h4>{title}</h4>}
      <HeadlineBlock
        headline={rubric.headline || { score: null, comment: '' }}
        hint="Բերել առնվազն մեկ օրինակ, որը կհիմնավորի միավորը"
        readOnly={readOnly}
        onChange={(headline) => update({ headline })}
      />
      {(rubric.categories || []).map((cat, ci) => (
        <div className="rubric-category" key={cat.key}>
          <div className="rubric-category-head">
            <h5>{cat.name}</h5>
            <span className="score-pill">{cat.categoryAverage ?? '—'}/5</span>
          </div>
          {(cat.rows || []).map((row, ri) => (
            <RubricRow
              key={ri}
              row={row}
              readOnly={readOnly}
              onChange={(newRow) => {
                const categories = rubric.categories.map((c, i) =>
                  i !== ci ? c : { ...c, rows: c.rows.map((r, j) => (j === ri ? newRow : r)) }
                );
                update({ categories });
              }}
            />
          ))}
          <label>
            <span>Բաղադրիչի ընդհանուր մեկնաբանություն</span>
            <textarea
              rows={2}
              value={cat.categoryComment || ''}
              disabled={readOnly}
              onChange={(e) => {
                const categories = rubric.categories.map((c, i) =>
                  i !== ci ? c : { ...c, categoryComment: e.target.value }
                );
                update({ categories });
              }}
            />
          </label>
        </div>
      ))}
      <div className="rubric-summary">
        <span className="score-pill score-pill-lg">Ամփոփիչ միավոր՝ {rubric.overallAverage ?? '—'}/5</span>
        <label>
          <span>Ամփոփիչ դիտարկումներ/մեկնաբանություններ (եթե առկա է)</span>
          <textarea
            rows={2}
            value={rubric.summaryComment || ''}
            disabled={readOnly}
            onChange={(e) => update({ summaryComment: e.target.value })}
          />
          {!readOnly && (
            <VoiceToTextButton
              onTranscript={(text) =>
                update({ summaryComment: rubric.summaryComment ? `${rubric.summaryComment} ${text}` : text })
              }
            />
          )}
        </label>
      </div>
    </div>
  );
}

/**
 * A flat (non-categorized) rubric editor: a fixed criteria list scored 0-5
 * plus an overall average and a general comment. Used for the planning
 * rubric (Module 2-Ա) and the closing meta-rubric (Module 2-Ե).
 */
export function FlatRubricEditor({ value, onChange, readOnly = false, title, headlineLabel, headlineHint }) {
  const rubric = value || {};
  const update = (patch) => onChange(computeFlatRubricAverage({ ...rubric, ...patch }));

  return (
    <div className="rubric-block">
      {title && <h4>{title}</h4>}
      {headlineLabel && (
        <HeadlineBlock
          headline={{ label: headlineLabel, hint: headlineHint, ...(rubric.headline || { score: null, comment: '' }) }}
          hint="հիմնավորում"
          readOnly={readOnly}
          onChange={(headline) => update({ headline: { score: headline.score, comment: headline.comment } })}
        />
      )}
      {(rubric.rows || []).map((row, ri) => (
        <RubricRow
          key={row.key || ri}
          row={row}
          readOnly={readOnly}
          onChange={(newRow) => {
            const rows = rubric.rows.map((r, i) => (i === ri ? newRow : r));
            update({ rows });
          }}
        />
      ))}
      <div className="rubric-summary">
        <span className="score-pill score-pill-lg">Ընդհանուր միջինացված միավորը՝ {rubric.overallAverage ?? '—'}/5</span>
        <label>
          <span>Ընդհանուր մեկնաբանություն/դիտարկում (եթե առկա է)</span>
          <textarea
            rows={2}
            value={rubric.generalComment || ''}
            disabled={readOnly}
            onChange={(e) => update({ generalComment: e.target.value })}
          />
          {!readOnly && (
            <VoiceToTextButton
              onTranscript={(text) =>
                update({ generalComment: rubric.generalComment ? `${rubric.generalComment} ${text}` : text })
              }
            />
          )}
        </label>
      </div>
    </div>
  );
}
