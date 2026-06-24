import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { IconCheck, IconTarget, IconTrophy, IconChevronDown } from '@tabler/icons-react';
import BrowserWindow from '../BrowserWindow/BrowserWindow';
import './TodoList.css';

const PRIORITY = {
  critical: { label: 'Crítica', color: '#a855f7', xp: 100 },
  high:     { label: 'Alta',    color: '#ef4444', xp: 50  },
  medium:   { label: 'Média',   color: '#f59e0b', xp: 25  },
  low:      { label: 'Baixa',   color: '#22c55e', xp: 10  },
};

const PRIORITY_ORDER = ['critical', 'high', 'medium', 'low'];
const FILTERS = ['Todas', 'Ativas', 'Concluídas'];
const SORTS = [
  { id: 'manual',   label: 'Manual' },
  { id: 'priority', label: 'Prioridade' },
  { id: 'name',     label: 'A–Z Nome' },
  { id: 'newest',   label: 'Recente' },
];

// XP thresholds per level (index = level, value = XP needed to reach NEXT level)
const LEVEL_XP = [100, 150, 250, 400, 600, 900, 1300, 1800, 2400, 9999];

function getLevelData(xp) {
  let level = 0;
  let accumulated = 0;
  for (let i = 0; i < LEVEL_XP.length; i++) {
    if (xp < accumulated + LEVEL_XP[i]) {
      const progress = (xp - accumulated) / LEVEL_XP[i];
      return { level: level + 1, progress, current: xp - accumulated, needed: LEVEL_XP[i] };
    }
    accumulated += LEVEL_XP[i];
    level++;
  }
  return { level: LEVEL_XP.length + 1, progress: 1, current: 0, needed: 0 };
}

// ── Custom priority select ────────────────────────────
function PrioritySelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const p = PRIORITY[value];

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div className="pri-select" ref={ref}>
      <button
        className="pri-select-btn"
        style={{ borderColor: p.color }}
        onClick={() => setOpen(v => !v)}
        type="button"
      >
        <span className="pri-dot" style={{ background: p.color }} />
        <span className="pri-btn-label" style={{ color: p.color }}>{p.label}</span>
        <IconChevronDown size={12} className={`pri-chevron${open ? ' open' : ''}`} />
      </button>

      {open && (
        <div className="pri-dropdown">
          {PRIORITY_ORDER.map(key => {
            const opt = PRIORITY[key];
            return (
              <button
                key={key}
                className={`pri-option${value === key ? ' selected' : ''}`}
                onClick={() => { onChange(key); setOpen(false); }}
                type="button"
              >
                <span className="pri-dot" style={{ background: opt.color }} />
                <span className="pri-option-label">{opt.label}</span>
                <span className="pri-option-xp" style={{ color: opt.color }}>+{opt.xp}xp</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const CONFETTI_COLORS = ['#a855f7', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#ec4899'];

function ConfettiBurst({ onDone }) {
  const particles = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      dx: (Math.cos((i * 30) * Math.PI / 180) * 55).toFixed(1),
      dy: (Math.sin((i * 30) * Math.PI / 180) * 55).toFixed(1),
      delay: i * 25,
    })), []);

  useEffect(() => {
    const t = setTimeout(onDone, 900);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="confetti-burst" aria-hidden="true">
      {particles.map(p => (
        <span
          key={p.id}
          className="confetti-particle"
          style={{
            '--dx': `${p.dx}px`,
            '--dy': `${p.dy}px`,
            '--color': p.color,
            '--delay': `${p.delay}ms`,
          }}
        />
      ))}
    </div>
  );
}

function loadState() {
  try {
    return JSON.parse(localStorage.getItem('taskly_todos_v2')) || { todos: [], xp: 0, completed: 0 };
  } catch { return { todos: [], xp: 0, completed: 0 }; }
}

function saveState(state) {
  localStorage.setItem('taskly_todos_v2', JSON.stringify(state));
}

export default function TodoList({ onClose }) {
  const [state, setState] = useState(loadState);
  const [input, setInput] = useState('');
  const [inputPriority, setInputPriority] = useState('medium');
  const [filter, setFilter] = useState('Todas');
  const [sort, setSort] = useState('manual');
  const [bursts, setBursts] = useState([]);
  const [levelUpMsg, setLevelUpMsg] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const inputRef = useRef(null);
  const levelUpTimer = useRef(null);

  const { todos, xp, completed } = state;
  const lvData = getLevelData(xp);

  const persist = useCallback((next) => {
    setState(next);
    saveState(next);
  }, []);

  const addTodo = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    const todo = {
      id: Date.now(),
      text,
      done: false,
      priority: inputPriority,
      createdAt: Date.now(),
    };
    persist({ ...state, todos: [todo, ...state.todos] });
    setInput('');
    inputRef.current?.focus();
  }, [input, inputPriority, state, persist]);

  const toggle = useCallback((id) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    const nowDone = !todo.done;
    const delta = PRIORITY[todo.priority].xp * (nowDone ? 1 : -1);
    const newXp = Math.max(0, xp + delta);
    const prevLevel = getLevelData(xp).level;
    const nextLevel = getLevelData(newXp).level;

    persist({
      ...state,
      todos: todos.map(t => t.id === id ? { ...t, done: nowDone } : t),
      xp: newXp,
      completed: Math.max(0, completed + (nowDone ? 1 : -1)),
    });

    if (nowDone) {
      setBursts(b => [...b, { id, key: Date.now() }]);
      if (nextLevel > prevLevel) {
        clearTimeout(levelUpTimer.current);
        setLevelUpMsg(`Nível ${nextLevel} desbloqueado!`);
        levelUpTimer.current = setTimeout(() => setLevelUpMsg(null), 2500);
      }
    }
  }, [todos, xp, completed, state, persist]);

  const remove = useCallback((id) => {
    persist({ ...state, todos: todos.filter(t => t.id !== id) });
  }, [todos, state, persist]);

  const clearDone = useCallback(() => {
    persist({ ...state, todos: todos.filter(t => !t.done) });
  }, [todos, state, persist]);

  // Drag & drop
  const handleDragStart = (e, id) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, id) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (id !== dragOverId) setDragOverId(id);
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) return;
    const from = todos.findIndex(t => t.id === dragId);
    const to   = todos.findIndex(t => t.id === targetId);
    if (from === -1 || to === -1) return;
    const next = [...todos];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    persist({ ...state, todos: next });
    setDragId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => { setDragId(null); setDragOverId(null); };

  const visible = useMemo(() => {
    const filtered = todos.filter(t => {
      if (filter === 'Ativas')     return !t.done;
      if (filter === 'Concluídas') return t.done;
      return true;
    });
    if (sort === 'priority') return [...filtered].sort((a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority));
    if (sort === 'name')     return [...filtered].sort((a, b) => a.text.localeCompare(b.text));
    if (sort === 'newest')   return [...filtered].sort((a, b) => b.createdAt - a.createdAt);
    return filtered;
  }, [todos, filter, sort]);

  const doneCount = todos.filter(t => t.done).length;

  return (
    <BrowserWindow title="Tarefas" onClose={onClose} initialWidth={390} initialHeight={570}>
      <div className="todo-root">

        {/* XP / Level bar */}
        <div className="todo-xp-panel">
          <div className="todo-xp-header">
            <span className="todo-level-badge">Nv. {lvData.level}</span>
            <span className="todo-xp-text">{xp} XP</span>
            <span className="todo-completed-badge"><IconCheck size={11} strokeWidth={3} /> {completed}</span>
          </div>
          <div className="todo-xp-track">
            <div className="todo-xp-fill" style={{ width: `${lvData.progress * 100}%` }} />
          </div>
          <div className="todo-xp-sub">
            {lvData.needed > 0
              ? `${lvData.current} / ${lvData.needed} XP para Nv. ${lvData.level + 1}`
              : 'Nível máximo!'}
          </div>
        </div>

        {/* Level-up toast */}
        {levelUpMsg && (
          <div className="todo-levelup">
            <IconTrophy size={14} /> {levelUpMsg}
          </div>
        )}

        {/* Input row */}
        <div className="todo-input-row">
          <input
            ref={inputRef}
            className="todo-input"
            placeholder="Nova tarefa..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTodo()}
          />
          <PrioritySelect value={inputPriority} onChange={setInputPriority} />
          <button className="todo-add-btn" onClick={addTodo}>+</button>
        </div>

        {/* Filters + sort */}
        <div className="todo-controls-row">
          <div className="todo-filters">
            {FILTERS.map(f => (
              <button key={f} className={`todo-filter ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f}
              </button>
            ))}
          </div>
          <select className="todo-sort-select" value={sort} onChange={e => setSort(e.target.value)}>
            {SORTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>

        {/* Task list */}
        <div className="todo-list">
          {visible.length === 0 && (
            <p className="todo-empty">
              {filter === 'Todas'
                ? <><IconTarget size={14} style={{ display:'inline', verticalAlign:'middle', marginRight: 4 }} /> Nenhuma tarefa. Bora!</>
                : 'Nada aqui.'}
            </p>
          )}
          {visible.map(t => {
            const p = PRIORITY[t.priority];
            const burst = bursts.find(b => b.id === t.id);
            const isDragging = dragId === t.id;
            const isOver    = dragOverId === t.id;
            return (
              <div
                key={t.id}
                className={`todo-item${t.done ? ' done' : ''}${isDragging ? ' dragging' : ''}${isOver ? ' drag-over' : ''}`}
                style={{ '--pc': p.color }}
                draggable={sort === 'manual'}
                onDragStart={e => handleDragStart(e, t.id)}
                onDragOver={e => handleDragOver(e, t.id)}
                onDrop={e => handleDrop(e, t.id)}
                onDragEnd={handleDragEnd}
              >
                {sort === 'manual' && (
                  <span className="todo-handle" title="Arrastar">⠿</span>
                )}

                {/* Priority stripe */}
                <span className="todo-pri-dot" style={{ background: p.color }} title={`${p.icon} ${p.label}`} />

                {/* Checkbox */}
                <button className={`todo-check${t.done ? ' checked' : ''}`} onClick={() => toggle(t.id)}>
                  {t.done && <IconCheck size={11} strokeWidth={3} className="todo-check-mark" />}
                </button>

                {/* Confetti */}
                {burst && (
                  <ConfettiBurst
                    key={burst.key}
                    onDone={() => setBursts(b => b.filter(x => x.id !== t.id))}
                  />
                )}

                <span className="todo-text">{t.text}</span>

                <span className="todo-xp-badge" style={{ color: p.color }}>+{p.xp}xp</span>

                <button className="todo-del" onClick={() => remove(t.id)} title="Remover">✕</button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {todos.length > 0 && (
          <div className="todo-footer">
            <span>{todos.length - doneCount} restante{todos.length - doneCount !== 1 ? 's' : ''}</span>
            {doneCount > 0 && (
              <button className="todo-clear" onClick={clearDone}>Limpar concluídas</button>
            )}
          </div>
        )}
      </div>
    </BrowserWindow>
  );
}
