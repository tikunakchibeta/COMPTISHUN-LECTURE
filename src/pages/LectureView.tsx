import { useState, useRef, useEffect } from "react";
import { Subject, Chapter, Lecture, VideoSet } from "@/data/lectures";

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
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const videoRef = useRef<HTMLVideoElement>(null);

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
      if (!videoRef.current) return;

      const v = videoRef.current;
      if (e.code === 'Space') {
        // Prevent double-trigger!
        // If the user is focused on a button, spacebar should click the button.
        // If the user is focused on the video player, HTML5 natively handles the pause/play.
        if (
          document.activeElement?.tagName === 'BUTTON' ||
          document.activeElement === videoRef.current
        ) {
          return; 
        }

        e.preventDefault(); // Stop page from scrolling down
        v.paused ? v.play() : v.pause();
      } else if (e.code === 'ArrowRight') {
        v.currentTime += 10;
      } else if (e.code === 'ArrowLeft') {
        v.currentTime -= 10;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update playback speed when state changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, currentUrl]);

  // Handle Resuming Progress
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !selectedLecture) return;

    const savedTime = localStorage.getItem(`lecture-progress-${selectedLecture.id}`);
    if (savedTime) {
      const time = parseFloat(savedTime);
      // Only seek if the time is significant (> 2s) and not at the very end
      if (time > 2) {
        video.currentTime = time;
      }
    }
  }, [selectedLecture?.id, currentUrl]);

  const handleTimeUpdate = () => {
    if (videoRef.current && selectedLecture) {
      const currentTime = videoRef.current.currentTime;
      // Don't save if we are at the very beginning or end
      if (currentTime > 1 && !videoRef.current.ended) {
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

  function seek(seconds: number) {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
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

        {/* Second row: seek + speed + quality on mobile */}
        <div className="player-controls-row" style={{ '--accent': subject.color } as React.CSSProperties}>
          <div className="seek-controls">
            <button className="control-btn" onClick={() => seek(-10)} title="Back 10s">↺ 10s</button>
            <button className="control-btn" onClick={() => seek(10)} title="Forward 10s">10s ↻</button>
          </div>

          <div className="speed-selector">
            <span className="speed-label">Speed</span>
            {[0.75, 1, 1.25, 1.5, 1.75, 2].map(s => (
              <button
                key={s}
                className={`speed-btn ${playbackSpeed === s ? 'active' : ''}`}
                onClick={() => setPlaybackSpeed(s)}
                style={playbackSpeed === s ? { background: subject.color } : {}}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        <div className="video-wrapper">
          {(chapter.name === "Projectile Motion" || chapter.name === "Relative Motion") && (
            <div className="missing-banner">
              ⚠️ Warning: Some lectures for this chapter are currently missing, Use previous year lectures.
            </div>
          )}
          {currentUrl ? (
            <video
              ref={videoRef}
              key={currentUrl}
              className="video-player"
              controls
              autoPlay={true}
              src={currentUrl}
              onTimeUpdate={handleTimeUpdate}
            >
              Your browser does not support HTML5 video.
            </video>
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

