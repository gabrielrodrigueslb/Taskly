import './SpotifyPlayer.css';

export default function SpotifyPlayer({ track }) {
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
        {track.isPlaying && (
          <div className="waveform">
            <span /><span /><span /><span /><span />
          </div>
        )}
      </div>
    </div>
  );
}
