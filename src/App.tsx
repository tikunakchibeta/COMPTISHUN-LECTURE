import { useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { subjects, Subject, Chapter, Lecture } from "@/data/lectures";
import SubjectSelect from "@/pages/SubjectSelect";
import ChapterSelect from "@/pages/ChapterSelect";
import LectureView from "@/pages/LectureView";

type View = 'subjects' | 'chapters' | 'lectures';

function App() {
  const [view, setView] = useState<View>('subjects');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);

  function handleSelectSubject(subject: Subject) {
    setSelectedSubject(subject);
    setSelectedChapter(null);
    setSelectedLecture(null);
    setView('chapters');
  }

  function handleSelectChapter(chapter: Chapter) {
    setSelectedChapter(chapter);
    setSelectedLecture(chapter.lectures[0] ?? null);
    setView('lectures');
  }

  function handleBack() {
    if (view === 'lectures') {
      setView('chapters');
    } else if (view === 'chapters') {
      setView('subjects');
      setSelectedSubject(null);
    }
  }

  return (
    <div className="app-root">
      {view === 'subjects' && (
        <SubjectSelect subjects={subjects} onSelect={handleSelectSubject} />
      )}
      {view === 'chapters' && selectedSubject && (
        <ChapterSelect
          subject={selectedSubject}
          onSelect={handleSelectChapter}
          onBack={handleBack}
        />
      )}
      {view === 'lectures' && selectedSubject && selectedChapter && (
        <LectureView
          subject={selectedSubject}
          chapter={selectedChapter}
          selectedLecture={selectedLecture}
          onSelectLecture={setSelectedLecture}
          onBack={handleBack}
        />
      )}
      <footer className="footer-credit">
        <div className="credit-content">
          <span className="credit-text">Crafted with precision by</span>
          <a href="https://t.me/Chetan_Baba" target="_blank" rel="noopener noreferrer" className="credit-link">
            <span className="telegram-icon">✈</span>
            @Chetan_Baba
          </a>
        </div>
      </footer>
      <Analytics />
    </div>
  );
}

export default App;
