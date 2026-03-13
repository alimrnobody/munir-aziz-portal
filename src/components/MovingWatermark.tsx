import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

type MovingWatermarkProps = {
  text: string;
};

const getRandomPosition = () => {
  const maxX = Math.max(window.innerWidth - 320, 0);
  const maxY = Math.max(window.innerHeight - 120, 0);
  return {
    x: Math.floor(Math.random() * (maxX + 1)),
    y: Math.floor(Math.random() * (maxY + 1)),
  };
};

export const MovingWatermark = ({ text }: MovingWatermarkProps) => {
  const initial = useMemo(() => ({ x: 0, y: 0 }), []);
  const [position, setPosition] = useState(initial);

  useEffect(() => {
    setPosition(getRandomPosition());
    const interval = setInterval(() => {
      setPosition(getRandomPosition());
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[80] select-none text-3xl font-semibold text-foreground/15 md:text-5xl"
      animate={{ x: position.x, y: position.y }}
      transition={{ duration: 3.5, ease: "easeInOut" }}
    >
      {text}
    </motion.div>
  );
};
