import './SpotifyPlayer.css';

function IconPrev() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
      <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
    </svg>
  );
}

function IconNext() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
      <path d="M6 18l8.5-6L6 6v12zm2.5-6 5.5 3.9V8.1L8.5 12zM16 6h2v12h-2z" />
    </svg>
  );
}

function IconPause() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

export default function SpotifyPlayer({ track, onTogglePlay, onNext, onPrev }) {
  if (!track) return null;

  return (
    <div className="spotify-player">
      <div className={`vinyl-disc ${!track.isPlaying ? 'paused' : ''}`}>
        <div className="vinyl-rings">
          {track.albumArt && (
            <div className="vinyl-art">
              <img src={track.albumArt} alt={track.title} />
            </div>
          )}
          <div className="vinyl-hole" />
        </div>
      </div>

      <div className="track-info">
        <p className="track-title">{track.title}</p>
        <p className="track-artist">{track.artist}</p>

        <div className="controls">
          <button className="ctrl-btn" onClick={onPrev} title="Anterior">
            <IconPrev />
          </button>
          <button className="ctrl-btn ctrl-play" onClick={onTogglePlay} title={track.isPlaying ? 'Pausar' : 'Play'}>
            {track.isPlaying ? <IconPause /> : <IconPlay />}
          </button>
          <button className="ctrl-btn" onClick={onNext} title="Próxima">
            <IconNext />
          </button>
        </div>
      </div>
    </div>
  );
}
