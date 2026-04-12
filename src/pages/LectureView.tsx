import { useState, useRef, useEffect } from "react";
import { Subject, Chapter, Lecture, VideoSet } from "@/data/lectures";
import ReactPlayer from "react-player";

interface Props {
  subject: Subject;
  chapter: Chapter;
  selectedLecture: Lecture | null;
  onSelectLecture: (l: Lecture) => void;
  onBack: () => void;
}

type Quality = '480p' | '720p' | '1080p';

export default function LectureView({
  subject,
  chapter,
  selectedLecture,
  onSelectLecture,
  onBack,
}: Props) {
  const [quality, setQuality] = useState<Quality>('720p');
  const playerRef = useRef<ReactPlayer>(null);

  const currentUrl = selectedLecture?.videos.find(
    (v: VideoSet) => v.quality === quality
  )?.url ?? selectedLecture?.videos[0]?.url ?? null;

  const availableQualities = selectedLecture?.videos.map((v: VideoSet) => v.quality) ?? [];

  const currentIndex = chapter.lectures.findIndex(
    (l) => l.id === selectedLecture?.id
  );

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!playerRef.current) return;

      const player = playerRef.current as ReactPlayer;
      if (e.code === 'Space') {
        if (
          document.activeElement?.tagName === 'BUTTON' ||
          document.activeElement?.closest('.react-player')
        ) {
          return;
        }

        e.preventDefault();
        playerRef.current.togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        player.seekTo(player.getCurrentTime() + 10, 'seconds');
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        player.seekTo(player.getCurrentTime() - 10, 'seconds');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle Resuming Progress
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !selectedLecture) return;

    const savedTime = localStorage.getItem(`lecture-progress-${selectedLecture.id}`);
    if (savedTime) {
      const time = parseFloat(savedTime);
      if (time > 2) {
        player.seekTo(time, 'seconds');
      }
    }
  }, [selectedLecture?.id, currentUrl]);

  const handleProgress = (state: { playedSeconds: number }) => {
    if (playerRef.current && selectedLecture) {
      const currentTime = state.playedSeconds;
      if (currentTime > 1) {
        localStorage.setItem(`lecture-progress-${selectedLecture.id}`, currentTime.toString());
      }
    }
  };

  function goNext() {
    if (currentIndex < chapter.lectures.length - 1) {
      onSelectLecture(chapter.lectures[currentIndex + 1]);
    }
  }

  function goPrev() {
    if (currentIndex > 0) {
      onSelectLecture(chapter.lectures[currentIndex - 1]);
    }
  }

  return (
    <div className="lecture-layout">
      <div
        className="lecture-sidebar"
        style={{ '--accent': subject.color } as React.CSSProperties}
      >
        <div className="sidebar-header">
          <button className="back-btn" onClick={onBack}>
            ← Chapters
          </button>
          <div className="sidebar-chapter-info">
            <span className="top-badge" style={{ background: subject.color }}>
              {subject.shortName}
            </span>
            <h3 className="sidebar-chapter-name">{chapter.name}</h3>
          </div>
        </div>

        <div className="lecture-list">
          {chapter.lectures.map((lecture, idx) => (
            <button
              key={lecture.id}
              className={`lecture-list-item ${lecture.id === selectedLecture?.id ? 'active' : ''}`}
              onClick={() => onSelectLecture(lecture)}
              style={{ '--accent': subject.color } as React.CSSProperties}
            >
              <span className="lecture-num">{idx + 1}</span>
              <span className="lecture-title">{lecture.title}</span>
              {lecture.id === selectedLecture?.id && (
                <span className="playing-dot" style={{ background: subject.color }} />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="lecture-main">
        <div
          className="lecture-top-bar"
          style={{ '--accent': subject.color } as React.CSSProperties}
        >
          <div className="lecture-title-row">
            <h2 className="lecture-main-title">
              {chapter.name} — {selectedLecture?.title ?? ''}
            </h2>
            <div className="quality-selector">
              {(['480p', '720p', '1080p'] as Quality[]).map((q) => (
                <button
                  key={q}
                  className={`quality-btn ${quality === q ? 'active' : ''} ${!availableQualities.includes(q) ? 'disabled' : ''
                    }`}
                  style={quality === q ? { background: subject.color, borderColor: subject.color } : {}}
                  disabled={!availableQualities.includes(q)}
                  onClick={() => setQuality(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="video-wrapper">
          {(chapter.name === "Projectile Motion" || chapter.name === "Relative Motion") && (
            <div className="missing-banner">
              ⚠️ Warning: Some lectures for this chapter are currently missing, Use previous year lectures.
            </div>
          )}
          {currentUrl ? (
            <div className="player-wrapper">
              <ReactPlayer
                ref={playerRef}
                key={currentUrl}
                className="video-player"
                url={currentUrl}
                playing
                controls
                onProgress={handleProgress}
                width="100%"
                height="100%"
                config={{ file: { attributes: { controlsList: 'nodownload' } } }}
              />
            </div>
          ) : (
            <div className="no-video">No video available</div>
          )}
        </div>

        <div className="nav-controls">
          <button
            className="nav-btn"
            onClick={goPrev}
            disabled={currentIndex <= 0}
            style={{ '--accent': subject.color } as React.CSSProperties}
          >
            ‹ Previous
          </button>
          <div className="nav-info">
            <span>Lecture {currentIndex + 1} of {chapter.lectures.length}</span>
          </div>
          <button
            className="nav-btn"
            onClick={goNext}
            disabled={currentIndex >= chapter.lectures.length - 1}
            style={{ '--accent': subject.color } as React.CSSProperties}
          >
            Next ›
          </button>
        </div>
      </div>
    </div>
  );
}

