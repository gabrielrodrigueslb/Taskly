import { useState, useEffect, useRef, useCallback } from 'react';
import { IconRefresh, IconPlayerPlay, IconPlayerPause, IconPlayerSkipForward } from '@tabler/icons-react';
import BrowserWindow from '../BrowserWindow/BrowserWindow';
import './Pomodoro.css';

const MODES = [
  { id: 'work',       label: 'Foco',        minutes: 25, color: '#ef4444' },
  { id: 'short',      label: 'Pausa curta', minutes: 5,  color: '#22c55e' },
  { id: 'long',       label: 'Pausa longa', minutes: 15, color: '#3b82f6' },
];

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.8);
  } catch { /* ignore */ }
}

export default function Pomodoro({ onClose }) {
  const [modeIdx, setModeIdx]   = useState(0);
  const [seconds, setSeconds]   = useState(MODES[0].minutes * 60);
  const [running, setRunning]   = useState(false);
  const [cycles, setCycles]     = useState(0);
  const intervalRef             = useRef(null);

  const mode     = MODES[modeIdx];
  const total    = mode.minutes * 60;
  const progress = 1 - seconds / total;
  const radius   = 80;
  const circ     = 2 * Math.PI * radius;

  const switchMode = useCallback((idx) => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setModeIdx(idx);
    setSeconds(MODES[idx].minutes * 60);
  }, []);

  const reset = useCallback(() => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setSeconds(mode.minutes * 60);
  }, [mode]);

  const toggle = useCallback(() => setRunning((r) => !r), []);

  useEffect(() => {
    if (!running) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          beep();
          // Auto-advance: work → short (every 4 = long)
          if (modeIdx === 0) {
            const newCycles = cycles + 1;
            setCycles(newCycles);
            const next = newCycles % 4 === 0 ? 2 : 1;
            setTimeout(() => switchMode(next), 500);
          } else {
            setTimeout(() => switchMode(0), 500);
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, modeIdx, cycles, switchMode]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <BrowserWindow title="Pomodoro" onClose={onClose} initialWidth={320} initialHeight={420}>
      <div className="pom-root">
        {/* Mode tabs */}
        <div className="pom-tabs">
          {MODES.map((m, i) => (
            <button
              key={m.id}
              className={`pom-tab ${modeIdx === i ? 'active' : ''}`}
              style={modeIdx === i ? { background: m.color, color: '#fff' } : {}}
              onClick={() => switchMode(i)}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* SVG ring timer */}
        <div className="pom-ring-wrap">
          <svg width="200" height="200" viewBox="0 0 200 200">
            {/* Track */}
            <circle cx="100" cy="100" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
            {/* Progress */}
            <circle
              cx="100" cy="100" r={radius}
              fill="none"
              stroke={mode.color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - progress)}
              transform="rotate(-90 100 100)"
              style={{ transition: 'stroke-dashoffset 0.8s linear' }}
            />
          </svg>
          <div className="pom-time">
            <span className="pom-digits">{mm}:{ss}</span>
            <span className="pom-mode-label">{mode.label}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="pom-controls">
          <button className="pom-btn pom-reset" onClick={reset} title="Reiniciar">
            <IconRefresh size={16} />
          </button>
          <button
            className="pom-btn pom-play"
            style={{ background: mode.color }}
            onClick={toggle}
          >
            {running ? <IconPlayerPause size={22} /> : <IconPlayerPlay size={22} />}
          </button>
          <button
            className="pom-btn pom-next"
            onClick={() => switchMode((modeIdx + 1) % MODES.length)}
            title="Próximo modo"
          >
            <IconPlayerSkipForward size={16} />
          </button>
        </div>

        {/* Cycle counter */}
        <div className="pom-cycles">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`pom-dot ${i < cycles % 4 || (cycles % 4 === 0 && cycles > 0) ? 'done' : ''}`} style={{ background: i < cycles % 4 ? mode.color : undefined }} />
          ))}
          <span className="pom-cycle-label">{Math.floor(cycles / 4)} sessões completas</span>
        </div>
      </div>
    </BrowserWindow>
  );
}
