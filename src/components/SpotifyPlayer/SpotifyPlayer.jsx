import { useState, useEffect } from 'react';
import './SpotifyPlayer.css';

const STYLES = ['vinyl', 'card', 'compact'];

// ── Icons ────────────────────────────────────────────────────────────────────

const IconPrev  = () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>;
const IconNext  = () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M6 18l8.5-6L6 6v12zm2.5-6 5.5 3.9V8.1L8.5 12zM16 6h2v12h-2z"/></svg>;
const IconPause = () => <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>;
const IconPlay  = () => <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M8 5v14l11-7z"/></svg>;
const IconQueue = () => <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h10v2H4z"/></svg>;
const IconPaint = () => <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37-1.34-1.34a1 1 0 0 0-1.41 0L9 12.25 11.75 15l8.96-8.96a1 1 0 0 0 0-1.41z"/></svg>;

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(ms) {
  const s = Math.floor((ms || 0) / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function ProgressBar({ progressMs, durationMs, onSeek }) {
  const pct = durationMs ? (progressMs / durationMs) * 100 : 0;

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    onSeek(ratio * durationMs);
  };

  return (
    <div className="sp-progress-track" onClick={handleClick}>
      <div className="sp-progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

// ── Queue Panel ───────────────────────────────────────────────────────────────

function QueuePanel({ queue, onSkipToTrack, onClose }) {
  return (
    <div className="sp-queue-panel">
      <div className="sp-queue-header">
        <span>Fila</span>
        <button onClick={onClose}>✕</button>
      </div>
      <div className="sp-queue-list">
        {queue.length === 0 && <p className="sp-queue-empty">Fila vazia</p>}
        {queue.map((track, i) => (
          <button key={`${track.uri}-${i}`} className="sp-queue-item" onClick={() => onSkipToTrack(track.uri)}>
            <img src={track.album.images[2]?.url || track.album.images[0]?.url} alt="" />
            <div className="sp-queue-item-info">
              <p className="sp-queue-item-title">{track.name}</p>
              <p className="sp-queue-item-artist">{track.artists.map(a => a.name).join(', ')}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Style: Vinyl ──────────────────────────────────────────────────────────────

function VinylStyle({ track, progressMs, onTogglePlay, onNext, onPrev, onSeek, onCycleStyle, onToggleQueue }) {
  return (
    <div className="sp-vinyl">
      <div className={`sp-vinyl-disc ${!track.isPlaying ? 'paused' : ''}`}>
        <div className="sp-vinyl-rings">
          {track.albumArt && <div className="sp-vinyl-art"><img src={track.albumArt} alt="" /></div>}
          <div className="sp-vinyl-hole" />
        </div>
      </div>
      <div className="sp-vinyl-info">
        <p className="sp-title">{track.title}</p>
        <p className="sp-artist">{track.artist}</p>
        <div className="sp-controls">
          <button className="sp-btn" onClick={onPrev}><IconPrev /></button>
          <button className="sp-btn sp-btn-play" onClick={onTogglePlay}>
            {track.isPlaying ? <IconPause /> : <IconPlay />}
          </button>
          <button className="sp-btn" onClick={onNext}><IconNext /></button>
        </div>
        <ProgressBar progressMs={progressMs} durationMs={track.durationMs} onSeek={onSeek} />
        <div className="sp-time-row">
          <span>{formatTime(progressMs)}</span>
          <div className="sp-action-btns">
            <button className="sp-icon-btn" onClick={onToggleQueue}><IconQueue /></button>
            <button className="sp-icon-btn" onClick={onCycleStyle}><IconPaint /></button>
          </div>
          <span>{formatTime(track.durationMs)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Style: Card ───────────────────────────────────────────────────────────────

function CardStyle({ track, progressMs, onTogglePlay, onNext, onPrev, onSeek, onCycleStyle, onToggleQueue }) {
  return (
    <div className="sp-card">
      <div className="sp-card-top-row">
        <button className="sp-icon-btn" onClick={onToggleQueue}><IconQueue /></button>
        <button className="sp-icon-btn" onClick={onCycleStyle}><IconPaint /></button>
      </div>
      <div className="sp-card-body">
        {track.albumArt && <img className="sp-card-art" src={track.albumArt} alt="" />}
        <div className="sp-card-info">
          <p className="sp-artist">{track.artist}</p>
          <p className="sp-title sp-title-lg">{track.title}</p>
          <div className="sp-controls sp-controls-card">
            <button className="sp-btn" onClick={onPrev}><IconPrev /></button>
            <button className="sp-btn sp-btn-play" onClick={onTogglePlay}>
              {track.isPlaying ? <IconPause /> : <IconPlay />}
            </button>
            <button className="sp-btn" onClick={onNext}><IconNext /></button>
          </div>
        </div>
      </div>
      <ProgressBar progressMs={progressMs} durationMs={track.durationMs} onSeek={onSeek} />
      <div className="sp-time-row">
        <span>{formatTime(progressMs)}</span>
        <span>{formatTime(track.durationMs)}</span>
      </div>
    </div>
  );
}

// ── Style: Compact ────────────────────────────────────────────────────────────

function CompactStyle({ track, progressMs, onTogglePlay, onNext, onPrev, onSeek, onCycleStyle, onToggleQueue }) {
  return (
    <div className="sp-compact">
      {track.albumArt && <img className="sp-compact-art" src={track.albumArt} alt="" />}
      <div className="sp-compact-body">
        <div className="sp-compact-top">
          <div className="sp-compact-text">
            <p className="sp-title">{track.title}</p>
            <p className="sp-artist">{track.artist}</p>
          </div>
          <div className="sp-compact-actions">
            <button className="sp-icon-btn" onClick={onToggleQueue}><IconQueue /></button>
            <button className="sp-icon-btn" onClick={onCycleStyle}><IconPaint /></button>
          </div>
        </div>
        <div className="sp-controls sp-controls-compact">
          <button className="sp-btn" onClick={onPrev}><IconPrev /></button>
          <button className="sp-btn sp-btn-play sp-btn-green" onClick={onTogglePlay}>
            {track.isPlaying ? <IconPause /> : <IconPlay />}
          </button>
          <button className="sp-btn" onClick={onNext}><IconNext /></button>
        </div>
        <ProgressBar progressMs={progressMs} durationMs={track.durationMs} onSeek={onSeek} />
        <div className="sp-time-row">
          <span>{formatTime(progressMs)}</span>
          <span>{formatTime(track.durationMs)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function SpotifyPlayer({ track, queue, onTogglePlay, onNext, onPrev, onSeek, onSkipToTrack }) {
  const [style, setStyle] = useState(() => localStorage.getItem('sp_style') || 'vinyl');
  const [showQueue, setShowQueue] = useState(false);
  const [progressMs, setProgressMs] = useState(0);

  // Sync progress from polling
  useEffect(() => {
    if (track?.progressMs != null) setProgressMs(track.progressMs);
  }, [track?.progressMs]);

  // Tick progress locally between polls
  useEffect(() => {
    if (!track?.isPlaying) return;
    const interval = setInterval(() => {
      setProgressMs((p) => Math.min(p + 1000, track.durationMs || p));
    }, 1000);
    return () => clearInterval(interval);
  }, [track?.isPlaying, track?.durationMs]);

  if (!track) return null;

  const cycleStyle = () => {
    const next = STYLES[(STYLES.indexOf(style) + 1) % STYLES.length];
    setStyle(next);
    localStorage.setItem('sp_style', next);
  };

  const toggleQueue = () => setShowQueue((v) => !v);

  const styleProps = {
    track, progressMs, onTogglePlay, onNext, onPrev,
    onSeek, onCycleStyle: cycleStyle, onToggleQueue: toggleQueue,
  };

  return (
    <div className="sp-wrapper">
      {style === 'vinyl'   && <VinylStyle   {...styleProps} />}
      {style === 'card'    && <CardStyle    {...styleProps} />}
      {style === 'compact' && <CompactStyle {...styleProps} />}

      {showQueue && (
        <QueuePanel
          queue={queue}
          onSkipToTrack={(uri) => { onSkipToTrack(uri); setShowQueue(false); }}
          onClose={() => setShowQueue(false)}
        />
      )}
    </div>
  );
}
