import { Subject, Chapter } from "@/data/lectures";

interface Props {
  subject: Subject;
  onSelect: (c: Chapter) => void;
  onBack: () => void;
}

export default function ChapterSelect({ subject, onSelect, onBack }: Props) {
  return (
    <div className="page-full">
      <div className="top-bar" style={{ '--accent': subject.color } as React.CSSProperties}>
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
        <div className="top-bar-title">
          <span className="top-badge" style={{ background: subject.color }}>{subject.shortName}</span>
          <span>{subject.name}</span>
        </div>
      </div>

      <div className="chapter-content">
        <h2 className="section-heading">Select a Chapter</h2>
        <div className="chapter-grid">
          {subject.chapters.map((chapter, idx) => (
            <button
              key={chapter.id}
              className="chapter-card"
              style={{ '--accent': subject.color } as React.CSSProperties}
              onClick={() => onSelect(chapter)}
            >
              <span className="chapter-num">{String(idx + 1).padStart(2, '0')}</span>
              <div className="chapter-info">
                <div className="chapter-header-row">
                  <span className="chapter-name">{chapter.name}</span>
                  {(chapter.name === "Projectile Motion" || chapter.name === "Relative Motion") && (
                    <span className="missing-badge">Lectures Missing ⚠️</span>
                  )}
                </div>
                <span className="chapter-count">{chapter.lectures.length} lectures</span>
              </div>
              <span className="chapter-arrow">›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
