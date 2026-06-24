import { useState, useEffect, useRef, useCallback } from 'react';
import './SpotifyPlayer.css';

// ── Icons ─────────────────────────────────────────────────────────────────────

const IconPrev  = () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>;
const IconNext  = () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M6 18l8.5-6L6 6v12zm2.5-6 5.5 3.9V8.1L8.5 12zM16 6h2v12h-2z"/></svg>;
const IconPause = () => <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>;
const IconPlay  = () => <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M8 5v14l11-7z"/></svg>;
const IconQueue = () => <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h10v2H4z"/></svg>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(ms) {
  const s = Math.floor((ms || 0) / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ── Draggable Progress Bar ────────────────────────────────────────────────────

function ProgressBar({ progressMs, durationMs, onSeek }) {
  const trackRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [dragPct, setDragPct] = useState(null);

  const getPct = useCallback((clientX) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => setDragPct(getPct(e.clientX));
    const onUp   = (e) => {
      onSeek(getPct(e.clientX) * durationMs);
      setDragging(false);
      setDragPct(null);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, durationMs, onSeek, getPct]);

  const displayPct = dragging && dragPct !== null
    ? dragPct * 100
    : durationMs ? (progressMs / durationMs) * 100 : 0;

  return (
    <div
      ref={trackRef}
      className="sp-progress-track"
      onMouseDown={(e) => { setDragging(true); setDragPct(getPct(e.clientX)); }}
    >
      <div className="sp-progress-fill" style={{ width: `${displayPct}%`, transition: dragging ? 'none' : 'width 0.3s linear' }} />
      <div className="sp-progress-thumb" style={{ left: `${displayPct}%` }} />
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
              <p className="sp-queue-item-artist">{track.artists.map((a) => a.name).join(', ')}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Controls shared ───────────────────────────────────────────────────────────

function Controls({ track, onTogglePlay, onNext, onPrev, compact = false }) {
  return (
    <div className="sp-controls">
      <button className="sp-btn" onClick={onPrev}><IconPrev /></button>
      <button className={`sp-btn sp-btn-play ${compact ? 'sp-btn-green' : ''}`} onClick={onTogglePlay}>
        {track.isPlaying ? <IconPause /> : <IconPlay />}
      </button>
      <button className="sp-btn" onClick={onNext}><IconNext /></button>
    </div>
  );
}

// ── Style: Cover ──────────────────────────────────────────────────────────────

function CoverStyle({ track, progressMs, onTogglePlay, onNext, onPrev, onSeek, onToggleQueue }) {
  return (
    <div className="sp-cover">
      <div className="sp-cover-wave">
        {Array.from({ length: 18 }).map((_, i) => (
          <span key={i} style={{ animationDelay: `${(i * 0.07).toFixed(2)}s` }} />
        ))}
      </div>
      <div className="sp-cover-stack">
        <div className={`sp-cover-disc ${!track.isPlaying ? 'paused' : ''}`}>
          <div className="sp-cover-disc-rings">
            <div className="sp-vinyl-hole" />
          </div>
        </div>
        {track.albumArt && <img className="sp-cover-art" src={track.albumArt} alt={track.title} />}
      </div>
      <div className="sp-cover-info">
        <p className="sp-title">{track.title}</p>
        <p className="sp-artist">{track.artist}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
          <Controls track={track} onTogglePlay={onTogglePlay} onNext={onNext} onPrev={onPrev} />
          <button className="sp-icon-btn" onClick={onToggleQueue}><IconQueue /></button>
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

// ── Style: Vinyl ──────────────────────────────────────────────────────────────

function VinylStyle({ track, progressMs, onTogglePlay, onNext, onPrev, onSeek, onToggleQueue }) {
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <Controls track={track} onTogglePlay={onTogglePlay} onNext={onNext} onPrev={onPrev} />
          <button className="sp-icon-btn" onClick={onToggleQueue}><IconQueue /></button>
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

// ── Style: Card ───────────────────────────────────────────────────────────────

function CardStyle({ track, progressMs, onTogglePlay, onNext, onPrev, onSeek, onToggleQueue }) {
  return (
    <div className="sp-card">
      <div className="sp-card-top-row">
        <span />
        <button className="sp-icon-btn" onClick={onToggleQueue}><IconQueue /></button>
      </div>
      <div className="sp-card-body">
        {track.albumArt && <img className="sp-card-art" src={track.albumArt} alt="" />}
        <div className="sp-card-info">
          <p className="sp-artist">{track.artist}</p>
          <p className="sp-title sp-title-lg">{track.title}</p>
          <Controls track={track} onTogglePlay={onTogglePlay} onNext={onNext} onPrev={onPrev} />
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

// ── Style: iOS ────────────────────────────────────────────────────────────────

function IosStyle({ track, progressMs, onTogglePlay, onNext, onPrev, onSeek, onToggleQueue }) {
  return (
    <div className="sp-ios">
      {/* Album art */}
      {track.albumArt && (
        <img className="sp-ios-art" src={track.albumArt} alt={track.title} />
      )}

      {/* Controls panel */}
      <div className="sp-ios-panel">
        <div className="sp-ios-info">
          <div className="sp-ios-text">
            <p className="sp-ios-title">{track.title}</p>
            <p className="sp-ios-artist">{track.artist}</p>
          </div>
          <button className="sp-icon-btn" onClick={onToggleQueue}><IconQueue /></button>
        </div>

        <ProgressBar progressMs={progressMs} durationMs={track.durationMs} onSeek={onSeek} />
        <div className="sp-time-row" style={{ marginTop: 4 }}>
          <span>{formatTime(progressMs)}</span>
          <span>-{formatTime((track.durationMs || 0) - progressMs)}</span>
        </div>

        <div className="sp-ios-controls">
          <button className="sp-ios-btn" onClick={onPrev}><IconPrev /></button>
          <button className="sp-ios-btn sp-ios-play" onClick={onTogglePlay}>
            {track.isPlaying ? <IconPause /> : <IconPlay />}
          </button>
          <button className="sp-ios-btn" onClick={onNext}><IconNext /></button>
        </div>
      </div>
    </div>
  );
}

// ── Style: Compact ────────────────────────────────────────────────────────────

function CompactStyle({ track, progressMs, onTogglePlay, onNext, onPrev, onSeek, onToggleQueue }) {
  return (
    <div className="sp-compact">
      {track.albumArt && <img className="sp-compact-art" src={track.albumArt} alt="" />}
      <div className="sp-compact-body">
        <div className="sp-compact-top">
          <div className="sp-compact-text">
            <p className="sp-title">{track.title}</p>
            <p className="sp-artist">{track.artist}</p>
          </div>
          <button className="sp-icon-btn" onClick={onToggleQueue}><IconQueue /></button>
        </div>
        <Controls track={track} onTogglePlay={onTogglePlay} onNext={onNext} onPrev={onPrev} compact />
        <ProgressBar progressMs={progressMs} durationMs={track.durationMs} onSeek={onSeek} />
        <div className="sp-time-row">
          <span>{formatTime(progressMs)}</span>
          <span>{formatTime(track.durationMs)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Draggable Wrapper ─────────────────────────────────────────────────────────

function useDrag(key) {
  const saved = (() => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } })();
  const [pos, setPos] = useState(saved || { x: window.innerWidth - 320, y: window.innerHeight - 200 });
  const dragging = useRef(false);
  const origin   = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const wrapRef  = useRef(null);

  const onMouseDown = useCallback((e) => {
    // Ignore clicks on interactive elements
    if (e.target.closest('button, input, .sp-progress-track, .sp-queue-panel')) return;
    dragging.current = true;
    origin.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
    e.preventDefault();
  }, [pos]);

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return;
      const nx = origin.current.px + (e.clientX - origin.current.mx);
      const ny = origin.current.py + (e.clientY - origin.current.my);
      setPos({ x: nx, y: ny });
    };
    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      setPos((p) => {
        localStorage.setItem(key, JSON.stringify(p));
        return p;
      });
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [key]);

  return { pos, wrapRef, onMouseDown };
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function SpotifyPlayer({ track, queue, style, onTogglePlay, onNext, onPrev, onSeek, onSkipToTrack }) {
  const [showQueue, setShowQueue] = useState(false);
  const [progressMs, setProgressMs] = useState(0);
  const { pos, wrapRef, onMouseDown } = useDrag('sp_pos');

  useEffect(() => {
    if (track?.progressMs != null) setProgressMs(track.progressMs);
  }, [track?.progressMs]);

  useEffect(() => {
    if (!track?.isPlaying) return;
    const interval = setInterval(() => {
      setProgressMs((p) => Math.min(p + 1000, track.durationMs || p));
    }, 1000);
    return () => clearInterval(interval);
  }, [track?.isPlaying, track?.durationMs]);

  if (!track) return null;

  const toggleQueue = () => setShowQueue((v) => !v);
  const styleProps = { track, progressMs, onTogglePlay, onNext, onPrev, onSeek, onToggleQueue: toggleQueue };

  return (
    <div
      ref={wrapRef}
      className="sp-wrapper"
      style={{ left: pos.x, top: pos.y, bottom: 'unset', right: 'unset' }}
      onMouseDown={onMouseDown}
    >
      {style === 'ios'     && <IosStyle     {...styleProps} />}
      {style === 'cover'   && <CoverStyle   {...styleProps} />}
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
