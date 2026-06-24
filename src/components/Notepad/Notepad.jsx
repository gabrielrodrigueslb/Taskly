import { useState, useRef, useCallback, useEffect } from 'react';
import BrowserWindow from '../BrowserWindow/BrowserWindow';
import './Notepad.css';

const FONTS = [
  {
    id: 'normal',
    label: 'Normal',
    preview: 'Aa',
    family: "system-ui, -apple-system, sans-serif",
  },
  {
    id: 'mono',
    label: 'Mono',
    preview: '</>',
    family: "'Courier New', 'Consolas', 'Lucida Console', monospace",
  },
  {
    id: 'pixel',
    label: 'Pixel',
    preview: 'Aa',
    family: "'Press Start 2P', cursive",
  },
];

const SIZES = [
  { id: 'sm', label: 'A', px: 12 },
  { id: 'md', label: 'A', px: 15 },
  { id: 'lg', label: 'A', px: 19 },
];

const STORAGE_KEY = 'taskly_notepad';

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { text: '', font: 'normal', size: 'md' };
  } catch { return { text: '', font: 'normal', size: 'md' }; }
}

function countWords(text) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export default function Notepad({ onClose }) {
  const [state, setState] = useState(load);
  const [saved, setSaved] = useState(true);
  const saveTimer = useRef(null);
  const textareaRef = useRef(null);

  const { text, font, size } = state;
  const activeFont = FONTS.find(f => f.id === font) || FONTS[0];
  const activeSize = SIZES.find(s => s.id === size) || SIZES[1];

  // Auto-save with debounce
  const persist = useCallback((next) => {
    setState(next);
    setSaved(false);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSaved(true);
    }, 600);
  }, []);

  // Save immediately on unmount
  useEffect(() => {
    return () => {
      clearTimeout(saveTimer.current);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    };
  }, [state]);

  const handleText = (e) => persist({ ...state, text: e.target.value });
  const setFont = (id) => {
    const next = { ...state, font: id };
    setState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    textareaRef.current?.focus();
  };
  const setSize = (id) => {
    const next = { ...state, size: id };
    setState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    textareaRef.current?.focus();
  };

  const words = countWords(text);
  const chars = text.length;

  return (
    <BrowserWindow title="Bloco de Notas" onClose={onClose} initialWidth={420} initialHeight={500}>
      <div className="notepad-root">

        {/* Toolbar */}
        <div className="notepad-toolbar">
          {/* Font picker */}
          <div className="notepad-font-group">
            {FONTS.map(f => (
              <button
                key={f.id}
                className={`notepad-font-btn${font === f.id ? ' active' : ''} font-${f.id}`}
                onClick={() => setFont(f.id)}
                title={f.label}
              >
                <span className="notepad-font-preview">{f.preview}</span>
                <span className="notepad-font-label">{f.label}</span>
              </button>
            ))}
          </div>

          <div className="notepad-divider" />

          {/* Size picker */}
          <div className="notepad-size-group">
            {SIZES.map(s => (
              <button
                key={s.id}
                className={`notepad-size-btn${size === s.id ? ' active' : ''}`}
                onClick={() => setSize(s.id)}
                title={`Tamanho ${s.label}`}
                style={{ fontSize: s.px - 2 }}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Save indicator */}
          <span className={`notepad-save-dot ${saved ? 'saved' : 'unsaved'}`} title={saved ? 'Salvo' : 'Salvando...'} />
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          className={`notepad-area font-${font}`}
          value={text}
          onChange={handleText}
          placeholder="Escreva aqui..."
          style={{
            fontFamily: activeFont.family,
            fontSize: activeSize.px,
            lineHeight: font === 'pixel' ? 2.2 : 1.7,
          }}
          spellCheck={font !== 'mono'}
          autoFocus
        />

        {/* Footer */}
        <div className="notepad-footer">
          <span>{words} {words === 1 ? 'palavra' : 'palavras'}</span>
          <span>{chars} {chars === 1 ? 'caractere' : 'caracteres'}</span>
        </div>
      </div>
    </BrowserWindow>
  );
}
