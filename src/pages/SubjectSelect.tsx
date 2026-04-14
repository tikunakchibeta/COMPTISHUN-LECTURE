import { Subject } from "@/data/lectures";

interface Props {
  subjects: Subject[];
  onSelect: (s: Subject) => void;
}

const ICONS: Record<string, string> = {
  physics: '⚛',
  'physical-inorganic-chemistry': '🧪',
  'organic-chemistry': '⌬',
  mathematics: '⺎',
};

export default function SubjectSelect({ subjects, onSelect }: Props) {
  return (
    <div className="page-center">
      <div className="hero-header">
        <div className="hero-badge">Master Praveen 2025-26</div>
        <h1 className="hero-title">PRAVEEN BATCH</h1>
        <p className="hero-subtitle">
          Select a subject to begin &bull; Crafted by <a href="https://t.me/Chetan_Baba" target="_blank" rel="noopener noreferrer" style={{ color: '#a5b4fc', textDecoration: 'none', fontWeight: 600 }}>@Chetan_Baba</a>
        </p>
      </div>

      <div className="subject-grid">
        {subjects.map((subject) => (
          <button
            key={subject.id}
            className="subject-card"
            style={{ '--accent': subject.color } as React.CSSProperties}
            onClick={() => onSelect(subject)}
          >
            <div className="subject-icon">{ICONS[subject.id] ?? '📚'}</div>
            <div className="subject-info">
              <span className="subject-badge">{subject.shortName}</span>
              <h2 className="subject-name">{subject.name}</h2>
              <p className="subject-meta">
                {subject.chapters.length} chapters &middot;{' '}
                {subject.chapters.reduce((a, c) => a + c.lectures.length, 0)} lectures
              </p>
            </div>
            <div className="subject-arrow">›</div>
          </button>
        ))}
      </div>
    </div>
  );
}
