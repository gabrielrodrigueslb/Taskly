import './Home.css';
import BrowserWindow from '../../components/BrowserWindow/BrowserWindow';
import { FloatingDock } from '../../components/menu/Menu';
import { IconPhotoEdit, IconClockHour4, IconMusic } from '@tabler/icons-react';
import { useState } from 'react';

export default function Home() {
  const [openBackgrounds, setOpenBackgrounds] = useState(false);
  const [selectedBg, setSelectedBg] = useState(
    'src/assets/backgrounds/wallpaper1.gif',
  );

  function toggleBackgrounds() {
    setOpenBackgrounds(!openBackgrounds);
  }

  const items = [
    {
      title: 'Backgrounds',
      icon: <IconPhotoEdit />,
      onClick: toggleBackgrounds, // Apenas esse item executa a função
    },
    {
      title: 'Pomodoro',
      icon: <IconClockHour4 />,
      href: '', // Esse navega normalmente
    },
    {
      title: 'Músicas',
      icon: <IconMusic />,
      href: '', // Esse navega normalmente
    },
  ];

  const Backgrounds = [
    {
      title: 'Background 1',
      src: './backgrounds/wallpaper1.gif',
    },
    {
      title: 'Background 2',
      src: './backgrounds/wallpaper2.jpg',
    },
    {
      title: 'Background 3',
      src: './backgrounds/wallpaper3.gif',
    },
    {
      title: 'Background 4',
      src: './backgrounds/wallpaper4.gif',
    },
    {
      title: 'Background 5',
      src: './backgrounds/wallpaper5.gif',
    },
    {
      title: 'Background 6',
      src: './backgrounds/wallpaper6.gif',
    },
    {
      title: 'Background 7',
      src: './backgrounds/wallpaper7.gif',
    },
  ];
  const dataAtual = new Date();

  const horaAtual = dataAtual.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const diaAtual = dataAtual.toLocaleDateString('pt-BR', {
    day: 'numeric',
  });
  const diaSemanaAtual = dataAtual
    .toLocaleDateString('pt-BR', {
      weekday: 'short',
    })
    .replace('.', '');
  const mesAtual = dataAtual
    .toLocaleDateString('pt-BR', {
      month: 'short',
      year: 'numeric',
    })
    .replace('.', ' ')
    .replace(' de ', ' ')
    .replace(' de', ' ');

  return (
    <>
      <main
        className={`main-background bg-[url(${selectedBg})] bg-cover bg-center bg-no-repeat overflow-x-hidden overflow-y-hidden max-h-screen relative`}
        style={{
          backgroundImage: selectedBg
            ? `url(${selectedBg})`
            : './backgrounds/wallpaper1.gif',
        }}
      >
        <section className="hour-section flex flex-col items-center justify-center h-screen text-center  font-extralight text-white pb-20 select-none">
          <h3 className=" hour text-9xl line">{horaAtual}</h3>
          <p className="text-3xl">
            {diaSemanaAtual} | {diaAtual} {mesAtual}
          </p>
        </section>

        {openBackgrounds && (
          <BrowserWindow
            title="Backgrounds"
            onClose={toggleBackgrounds}
            className="w-[400px] h-[500px]"
          >
            <div className="flex flex-col h-full max-w-300 bg-white/80 backdrop-blur-sm p-6 rounded-2xl ">
              <h1 className="text-2xl font-bold mb-4">Escolha um fundo:</h1>

              <div className="galeria overflow-y-auto galeria-grid pr-2">
                {Backgrounds.map((bg, index) => (
                  <img
                    key={index}
                    src={bg.src}
                    alt={`Fundo ${index + 1}`}
                    onClick={() => setSelectedBg(bg.src)}
                    className={`cursor-pointer rounded-lg w-full h-auto object-cover border-4 ${
                      selectedBg === bg.src
                        ? 'border-blue-600'
                        : 'border-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>
          </BrowserWindow>
        )}

        <FloatingDock items={items} />
      </main>
    </>
  );
}
