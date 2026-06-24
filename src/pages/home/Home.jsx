import './Home.css';
import { useState, useEffect } from 'react';
import BrowserWindow from '../../components/BrowserWindow/BrowserWindow';
import { FloatingDock } from '../../components/menu/Menu';
import SpotifyPlayer from '../../components/SpotifyPlayer/SpotifyPlayer';
import SpotifySettings from '../../components/SpotifySettings/SpotifySettings';
import { useSpotify } from '../../hooks/useSpotify';
import { IconPhotoEdit, IconClockHour4, IconBrandSpotify } from '@tabler/icons-react';

export default function Home() {
  const [openBackgrounds, setOpenBackgrounds] = useState(false);
  const [openSpotifySettings, setOpenSpotifySettings] = useState(false);
  const [selectedBg, setSelectedBg] = useState('/backgrounds/wallpaper1.gif');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Spotify player prefs (persisted)
  const [playerStyle, setPlayerStyle] = useState(() => localStorage.getItem('sp_style') || 'cover');
  const [bgMode, setBgMode] = useState(() => localStorage.getItem('sp_bgmode') || 'album');

  const { isConnected, login, logout, currentTrack, queue, togglePlay, nextTrack, prevTrack, seekTo, skipToTrack } = useSpotify();

  // Persist prefs
  const handleStyleChange = (s) => { setPlayerStyle(s); localStorage.setItem('sp_style', s); };
  const handleBgModeChange = (m) => { setBgMode(m); localStorage.setItem('sp_bgmode', m); };

  const handleLogout = () => { logout(); setOpenSpotifySettings(false); };

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Resolve background
  const isPlaying = currentTrack?.isPlaying;
  const activeBg = (() => {
    if (!isPlaying || bgMode === 'none') return selectedBg;
    if (bgMode === 'artist' && currentTrack?.artistImageUrl) return currentTrack.artistImageUrl;
    if (bgMode === 'album' && currentTrack?.albumArt) return currentTrack.albumArt;
    return selectedBg;
  })();

  const blurOverlay = isPlaying && bgMode !== 'none';
  const blurAmount  = bgMode === 'artist' ? 'backdrop-blur-[2px]' : 'backdrop-blur-sm';

  const horaAtual = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const diaAtual = currentTime.toLocaleDateString('pt-BR', { day: 'numeric' });
  const diaSemanaAtual = currentTime.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  const mesAtual = currentTime
    .toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
    .replace('.', ' ').replace(' de ', ' ').replace(' de', ' ');

  const items = [
    { title: 'Backgrounds', icon: <IconPhotoEdit />, onClick: () => setOpenBackgrounds(!openBackgrounds) },
    { title: 'Pomodoro',    icon: <IconClockHour4 />, href: '' },
    {
      title: isConnected ? 'Spotify' : 'Conectar Spotify',
      icon: <IconBrandSpotify />,
      onClick: isConnected ? () => setOpenSpotifySettings(true) : login,
    },
  ];

  const Backgrounds = [
    { title: 'Background 1', src: '/backgrounds/wallpaper1.gif' },
    { title: 'Background 2', src: '/backgrounds/wallpaper2.jpg' },
    { title: 'Background 3', src: '/backgrounds/wallpaper3.gif' },
    { title: 'Background 4', src: '/backgrounds/wallpaper4.gif' },
    { title: 'Background 5', src: '/backgrounds/wallpaper5.gif' },
    { title: 'Background 6', src: '/backgrounds/wallpaper6.gif' },
    { title: 'Background 7', src: '/backgrounds/wallpaper7.gif' },
    { title: '8Bit DarkCity', src: '/backgrounds/8BitDarkCity.gif' },
    { title: 'Cat', src: '/backgrounds/cat.jpg' },
    { title: 'PixelArtCozyGameRoom', src: '/backgrounds/PixelArtCozyGameRoom.jpg' },
    { title: 'Oriental', src: '/backgrounds/oriental.gif' },
    { title: 'Pokemon', src: '/backgrounds/pokemon.gif' },
    { title: 'PixelArt', src: '/backgrounds/wallpaper8.gif' },
    { title: 'PixelArt2', src: '/backgrounds/wallpaper9.gif' },
    { title: 'PixelArt3', src: '/backgrounds/wallpaper10.jpeg' },
    { title: 'PixelArt4', src: '/backgrounds/wallpaper11.gif' },
    { title: 'PixelArt5', src: '/backgrounds/wallpaper12.gif' },
    { title: 'StillOn', src: '/backgrounds/StillOnbyKirokaze.gif' },
    { title: 'Totoro', src: '/backgrounds/MyNeighborTotoro.gif' },
    { title: '8Bit Home', src: '/backgrounds/8Bit_Home_Games_Night.gif' },
  ];

  return (
    <main
      className="main-background bg-cover bg-center bg-no-repeat overflow-hidden max-h-screen relative transition-all duration-1000"
      style={{ backgroundImage: `url(${activeBg})` }}
    >
      {/* Overlay quando música estiver tocando */}
      {blurOverlay && (
        <div className={`absolute inset-0 bg-black/40 ${blurAmount} transition-opacity duration-1000`} />
      )}

      <section className="hour-section relative flex flex-col items-center justify-center h-screen text-center font-extralight text-white pb-20 select-none">
        <h3 className="hour text-9xl line">{horaAtual}</h3>
        <p className="text-3xl">{diaSemanaAtual} | {diaAtual} {mesAtual}</p>
      </section>

      {openBackgrounds && (
        <BrowserWindow title="Backgrounds" onClose={() => setOpenBackgrounds(false)} className="w-[400px] h-[500px]">
          <div className="flex flex-col h-full bg-white/80 backdrop-blur-sm p-6 rounded-2xl">
            <h1 className="text-2xl font-bold mb-4">Escolha um fundo:</h1>
            <div className="galeria overflow-y-auto galeria-grid pr-2">
              {Backgrounds.map((bg, index) => (
                <img
                  key={index}
                  src={bg.src}
                  alt={bg.title}
                  onClick={() => setSelectedBg(bg.src)}
                  className={`cursor-pointer rounded-lg w-full h-full object-cover border-4 ${selectedBg === bg.src ? 'border-blue-600' : 'border-transparent'}`}
                />
              ))}
            </div>
          </div>
        </BrowserWindow>
      )}

      {openSpotifySettings && (
        <SpotifySettings
          track={currentTrack}
          style={playerStyle}
          bgMode={bgMode}
          onStyleChange={handleStyleChange}
          onBgModeChange={handleBgModeChange}
          onLogout={handleLogout}
          onClose={() => setOpenSpotifySettings(false)}
        />
      )}

      <SpotifyPlayer
        track={currentTrack}
        queue={queue}
        style={playerStyle}
        onTogglePlay={togglePlay}
        onNext={nextTrack}
        onPrev={prevTrack}
        onSeek={seekTo}
        onSkipToTrack={skipToTrack}
      />

      <FloatingDock items={items} />
    </main>
  );
}
