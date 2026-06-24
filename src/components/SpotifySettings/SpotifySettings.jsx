import { IconPlayerPlay, IconPlayerPause, IconMicrophone, IconVinyl, IconPhoto } from '@tabler/icons-react';
import BrowserWindow from '../BrowserWindow/BrowserWindow';
import './SpotifySettings.css';

const STYLES = [
  { id: 'ios',     label: 'iOS',     desc: 'Capa grande' },
  { id: 'cover',   label: 'Cover',   desc: 'Disco + capa' },
  { id: 'vinyl',   label: 'Vinyl',   desc: 'Disco girando' },
  { id: 'card',    label: 'Card',    desc: 'Dark card' },
  { id: 'compact', label: 'Compact', desc: 'Barra slim' },
];

const BG_MODES = [
  { id: 'artist', label: 'Foto do artista', desc: 'Imagem do artista, menos blur' },
  { id: 'album',  label: 'Capa do álbum',   desc: 'Album art com blur' },
  { id: 'none',   label: 'Papel de parede', desc: 'Sem override de fundo' },
];

export default function SpotifySettings({ track, style, bgMode, onStyleChange, onBgModeChange, onLogout, onClose }) {
  return (
    <BrowserWindow title="Spotify — Configurações" onClose={onClose} className="w-[380px]">
      <div className="sps-root">

        {/* Now playing preview */}
        {track && (
          <div className="sps-nowplaying">
            {track.albumArt && <img src={track.albumArt} alt="" className="sps-nowplaying-art" />}
            <div className="sps-nowplaying-info">
              <p className="sps-nowplaying-title">{track.title}</p>
              <p className="sps-nowplaying-artist">{track.artist}</p>
              <span className={`sps-badge ${track.isPlaying ? 'playing' : 'paused'}`}>
                {track.isPlaying
                  ? <><IconPlayerPlay size={10} /> Tocando</>
                  : <><IconPlayerPause size={10} /> Pausado</>}
              </span>
            </div>
          </div>
        )}

        {/* Background mode */}
        <section className="sps-section">
          <h3 className="sps-section-title">Fundo</h3>
          <div className="sps-bg-grid">
            {BG_MODES.map((m) => (
              <button
                key={m.id}
                className={`sps-bg-card ${bgMode === m.id ? 'active' : ''}`}
                onClick={() => onBgModeChange(m.id)}
              >
                <BgPreview id={m.id} track={track} />
                <p className="sps-bg-label">{m.label}</p>
                <p className="sps-bg-desc">{m.desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Player style */}
        <section className="sps-section">
          <h3 className="sps-section-title">Estilo do player</h3>
          <div className="sps-style-grid">
            {STYLES.map((s) => (
              <button
                key={s.id}
                className={`sps-style-card ${style === s.id ? 'active' : ''}`}
                onClick={() => onStyleChange(s.id)}
              >
                <StyleIcon id={s.id} />
                <p className="sps-style-label">{s.label}</p>
                <p className="sps-style-desc">{s.desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Logout */}
        <button className="sps-logout" onClick={onLogout}>
          Desconectar do Spotify
        </button>
      </div>
    </BrowserWindow>
  );
}

function BgPreview({ id, track }) {
  const art = track?.albumArt;
  const artist = track?.artistImageUrl;

  if (id === 'artist') {
    return (
      <div className="sps-bg-preview" style={{ backgroundImage: artist ? `url(${artist})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        {!artist && <span className="sps-bg-preview-icon"><IconMicrophone size={22} /></span>}
      </div>
    );
  }
  if (id === 'album') {
    return (
      <div className="sps-bg-preview" style={{ backgroundImage: art ? `url(${art})` : undefined, backgroundSize: 'cover', filter: 'blur(2px)', transform: 'scale(1.05)' }}>
        {!art && <span className="sps-bg-preview-icon"><IconVinyl size={22} /></span>}
      </div>
    );
  }
  return (
    <div className="sps-bg-preview sps-bg-preview-none">
      <span className="sps-bg-preview-icon"><IconPhoto size={22} /></span>
    </div>
  );
}

function StyleIcon({ id }) {
  if (id === 'ios') return (
    <svg viewBox="0 0 60 60" className="sps-style-icon" style={{ height: 44 }}>
      <rect x="8" y="4" width="44" height="44" rx="6" fill="#222"/>
      <rect x="8" y="50" width="44" height="8" rx="4" fill="#1a1a1a"/>
      <rect x="12" y="52" width="20" height="3" rx="1.5" fill="#444"/>
      <circle cx="44" cy="53.5" r="4" fill="#333"/>
    </svg>
  );
  if (id === 'cover') return (
    <svg viewBox="0 0 60 36" className="sps-style-icon">
      <circle cx="18" cy="18" r="14" fill="#222" stroke="#555" strokeWidth="1"/>
      <rect x="26" y="4" width="24" height="24" rx="3" fill="#333"/>
      <circle cx="18" cy="18" r="4" fill="#444"/>
    </svg>
  );
  if (id === 'vinyl') return (
    <svg viewBox="0 0 60 36" className="sps-style-icon">
      <circle cx="22" cy="18" r="15" fill="#1a1a1a" stroke="#444" strokeWidth="1"/>
      <circle cx="22" cy="18" r="5" fill="#333"/>
      <rect x="40" y="8" width="14" height="4" rx="2" fill="#555"/>
      <rect x="40" y="14" width="10" height="3" rx="1.5" fill="#444"/>
      <rect x="40" y="19" width="12" height="3" rx="1.5" fill="#444"/>
    </svg>
  );
  if (id === 'card') return (
    <svg viewBox="0 0 60 36" className="sps-style-icon">
      <rect x="4" y="4" width="52" height="28" rx="6" fill="#1a1a1a" stroke="#333" strokeWidth="1"/>
      <rect x="10" y="10" width="14" height="14" rx="2" fill="#333"/>
      <rect x="28" y="11" width="20" height="3" rx="1.5" fill="#555"/>
      <rect x="28" y="16" width="14" height="2" rx="1" fill="#444"/>
      <circle cx="30" cy="24" r="4" fill="#333"/>
      <circle cx="40" cy="24" r="3" fill="#2a2a2a"/>
      <circle cx="20" cy="24" r="3" fill="#2a2a2a"/>
    </svg>
  );
  // compact
  return (
    <svg viewBox="0 0 60 36" className="sps-style-icon">
      <rect x="4" y="8" width="52" height="20" rx="5" fill="#1a1a1a" stroke="#333" strokeWidth="1"/>
      <rect x="4" y="8" width="18" height="20" rx="5" fill="#2a2a2a"/>
      <circle cx="33" cy="18" r="5" fill="#1db954"/>
      <circle cx="20" cy="18" r="3" fill="#333"/>
      <circle cx="46" cy="18" r="3" fill="#333"/>
    </svg>
  );
}
