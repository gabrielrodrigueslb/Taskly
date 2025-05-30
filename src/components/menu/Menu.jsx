import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { IconLayoutNavbarCollapse } from "@tabler/icons-react";

export const FloatingDock = ({ items }) => {
  // const [mobileOpen, setMobileOpen] = useState(false);
  const mouseX = useMotionValue(Infinity);

  const handleClick = (item) => {
    if (item.onClick) item.onClick();
    if (item.href) window.location.href = item.href;
  };

  return (
    <>
      {/* Desktop Dock */}
      <div className=" fixed left-1/2 -translate-x-1/2 bottom-5 z-50">
        <motion.div
          onMouseMove={(e) => mouseX.set(e.pageX)}
          onMouseLeave={() => mouseX.set(Infinity)}
          className="flex items-end gap-4 px-4 pb-3 h-16 rounded-2xl bg-gray-50 dark:bg-neutral-900 shadow-lg"
        >
          {items.map((item) => (
            <DockItem key={item.title} item={item} mouseX={mouseX} onClick={() => handleClick(item)} />
          ))}
        </motion.div>
      </div>

      {/* Mobile Dock */}
      {/* <div className="md:hidden fixed left-1/2 -translate-x-1/2 bottom-5 z-50">
        <div className="relative">
          <AnimatePresence>
            {mobileOpen && (
              <motion.div className="absolute inset-x-0 bottom-full mb-2 flex flex-col gap-2">
                {items.map((item, idx) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10, transition: { delay: idx * 0.05 } }}
                    transition={{ delay: (items.length - 1 - idx) * 0.05 }}
                  >
                    <button
                      onClick={() => handleClick(item)}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 dark:bg-neutral-900"
                    >
                      <div className="h-4 w-4">{item.icon}</div>
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 dark:bg-neutral-800"
          >
            <IconLayoutNavbarCollapse className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
          </button>
        </div>
      </div> */}
    </>
  );
};

function DockItem({ item, mouseX, onClick }) {
  const ref = useRef(null);
  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const size = useSpring(useTransform(distance, [-150, 0, 150], [40, 80, 40]), {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const iconSize = useSpring(useTransform(distance, [-150, 0, 150], [20, 40, 20]), {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const [hovered, setHovered] = useState(false);

  return (
    <button onClick={onClick} className="focus:outline-none">
      <motion.div
        ref={ref}
        style={{ width: size, height: size }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative flex items-center justify-center rounded-full bg-gray-200 dark:bg-neutral-800 cursor-pointer"
        onClick={item.onClick}
      >
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 2, x: "-50%" }}
              className="absolute -top-8 left-1/2 w-fit rounded-md border px-2 py-0.5 text-xs whitespace-pre text-neutral-700 dark:border-neutral-900 dark:bg-neutral-800 dark:text-white "
            >
              {item.title}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          style={{ width: iconSize, height: iconSize }}
          className="flex items-center justify-center text-white"
        >
          {item.icon}
        </motion.div>
      </motion.div>
    </button>
  );
}
