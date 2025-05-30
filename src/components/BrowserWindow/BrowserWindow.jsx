import { useRef, useState, useEffect } from 'react';
import { IconX } from '@tabler/icons-react';

export default function BrowserWindow({
  children,
  title = 'My Window',
  onClose,
}) {
  const windowRef = useRef(null);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const [size, setSize] = useState({ width: 400, height: 300 });
  const [resizing, setResizing] = useState(false);
  const resizeStart = useRef({ mouseX: 0, mouseY: 0, width: 0, height: 0 });

  const handleMouseDown = (e) => {
    setDragging(true);
    setOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e) => {
    if (dragging) {
      setPosition({
        x: e.clientX - offset.x,
        y: e.clientY - offset.y,
      });
    } else if (resizing) {
      const dx = e.clientX - resizeStart.current.mouseX;
      const dy = e.clientY - resizeStart.current.mouseY;
      setSize({
        width: Math.max(200, resizeStart.current.width + dx),
        height: Math.max(150, resizeStart.current.height + dy),
      });
    }
  };

  const handleMouseUp = () => {
    setDragging(false);
    setResizing(false);
  };

  const handleResizeMouseDown = (e) => {
    e.stopPropagation();
    setResizing(true);
    resizeStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      width: size.width,
      height: size.height,
    };
  };

  // 👉 Adiciona e remove eventos no document
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  });

  return (
    <div
      ref={windowRef}
      className="bg-white rounded-md shadow-lg border border-gray-300 absolute select-none"
      style={{
        top: position.y,
        left: position.x,
        width: size.width,
        height: size.height,
        zIndex: 999,
      }}
    >
      {/* Barra de título */}
      <div
        className="bg-gray-200 px-4 py-2 cursor-move rounded-t-md flex justify-between items-center"
        onMouseDown={handleMouseDown}
      >
        <span className="font-semibold">{title}</span>
        <div className="flex gap-1">
          <div
            onClick={onClose}
            className="cursor-pointer w-4 h-4 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors duration-200 text-white"
          ><IconX/></div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className=" flex flex-col h-[calc(100%-40px)]">{children}</div>

      {/* Alça de redimensionamento */}
      <div
        onMouseDown={handleResizeMouseDown}
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-transparent"
      ></div>
    </div>
  );
}
