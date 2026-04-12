import { useState, useRef, useEffect } from "react";
import { Subject, Chapter, Lecture, VideoSet } from "@/data/lectures";
import Plyr from "plyr";
import "plyr/dist/plyr.css";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Plyr | null>(null);

  const videoSources = selectedLecture?.videos.map((v: VideoSet) => ({
    src: v.url,
    type: 'video/mp4',
    size: parseInt(v.quality.replace('p', ''))
  })) ?? [];

  const currentIndex = chapter.lectures.findIndex(
    (l) => l.id === selectedLecture?.id
  );

  useEffect(() => {
    if (!containerRef.current || !selectedLecture || videoSources.length === 0) return;

    const videoElement = containerRef.current.querySelector("video");
    if (!videoElement) return;

    if (playerRef.current) {
      playerRef.current.destroy();
    }

    playerRef.current = new Plyr(videoElement, {
      controls: ['play-large', 'play', 'rewind', 'fast-forward', 'progress', 'current-time', 'duration', 'mute', 'volume', 'captions', 'settings', 'fullscreen'],
      settings: ['speed', 'quality'],
      keyboard: { focused: false, global: false },
      tooltips: { controls: true, seek: true },
    });

    playerRef.current.on("ready", () => {
      if (playerRef.current) {
        playerRef.current.source = {
          type: 'video',
          sources: videoSources
        };
        
        const savedTime = localStorage.getItem(`lecture-progress-${selectedLecture.id}`);
        if (savedTime) {
          const time = parseFloat(savedTime);
          if (time > 2) {
            playerRef.current.currentTime = time;
          }
        }
      }
    });

    playerRef.current.on("timeupdate", () => {
      if (selectedLecture && playerRef.current) {
        const currentTime = playerRef.current.currentTime;
        if (currentTime > 1) {
          localStorage.setItem(`lecture-progress-${selectedLecture.id}`, currentTime.toString());
        }
      }
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [selectedLecture?.id, videoSources.length]);

  useEffect(() => {
    if (playerRef.current && videoSources.length > 0) {
      const qualityIndex = videoSources.findIndex(v => v.size === parseInt(quality.replace('p', '')));
      if (qualityIndex >= 0) {
        playerRef.current.quality = qualityIndex;
      }
    }
  }, [quality, videoSources]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!playerRef.current) return;

      if (e.code === 'ArrowRight') {
        e.preventDefault();
        playerRef.current.currentTime = Math.min(
          playerRef.current.currentTime + 10,
          playerRef.current.duration
        );
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        playerRef.current.currentTime = Math.max(
          playerRef.current.currentTime - 10,
          0
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
          </div>
        </div>

        <div className="video-wrapper">
          {(chapter.name === "Projectile Motion" || chapter.name === "Relative Motion") && (
            <div className="missing-banner">
              ⚠️ Warning: Some lectures for this chapter are currently missing, Use previous year lectures.
            </div>
          )}
          {videoSources.length > 0 ? (
            <div ref={containerRef} className="plyr-container">
              <video
                key={selectedLecture?.id}
                className="video-player"
                playsInline
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

