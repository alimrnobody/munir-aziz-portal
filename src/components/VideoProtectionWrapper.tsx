import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { useAuth } from "@/context/AuthContext";

type WatermarkPosition = {
  left: string;
  top: string;
};

type VideoProtectionWrapperProps = {
  children: ReactNode;
  videoRef: RefObject<HTMLVideoElement | null>;
};

const getRandomPercent = (min: number, max: number) =>
  `${Math.floor(Math.random() * (max - min + 1)) + min}%`;

const getRandomPosition = (): WatermarkPosition => ({
  left: getRandomPercent(5, 75),
  top: getRandomPercent(5, 75),
});

export const VideoProtectionWrapper = ({ children, videoRef }: VideoProtectionWrapperProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const blinkTimeoutRef = useRef<number | null>(null);
  const { user } = useAuth();
  const [watermarkPosition, setWatermarkPosition] = useState<WatermarkPosition>(getRandomPosition);
  const [watermarkVisible, setWatermarkVisible] = useState(true);

  const watermarkText = useMemo(
    () => user?.email || "private@elite-squad.local",
    [user?.email]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const isBlockedCombo =
        key === "f12" ||
        key === "printscreen" ||
        (event.ctrlKey && key === "s") ||
        (event.ctrlKey && key === "u") ||
        (event.ctrlKey && event.shiftKey && ["i", "j", "c"].includes(key));

      if (isBlockedCombo) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const moveInterval = window.setInterval(() => {
      setWatermarkPosition(getRandomPosition());
    }, 4000);

    const blinkInterval = window.setInterval(() => {
      setWatermarkVisible(false);
      blinkTimeoutRef.current = window.setTimeout(() => {
        setWatermarkVisible(true);
      }, 300);
    }, 7000);

    return () => {
      window.clearInterval(moveInterval);
      window.clearInterval(blinkInterval);
      if (blinkTimeoutRef.current) {
        window.clearTimeout(blinkTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const wrapper = wrapperRef.current;
      const videoElement = videoRef.current;

      if (!wrapper || !videoElement) return;
      if (document.fullscreenElement !== videoElement) return;

      void document.exitFullscreen().catch(() => undefined).finally(() => {
        void wrapper.requestFullscreen?.().catch(() => undefined);
      });
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [videoRef]);

  const watermarkStyle: CSSProperties = {
    left: watermarkPosition.left,
    top: watermarkPosition.top,
    opacity: watermarkVisible ? 1 : 0,
    transition: "left 3s ease-in-out, top 3s ease-in-out, opacity 0.3s ease-in-out",
  };

  return (
    <div
      ref={wrapperRef}
      className="video-protection-wrapper relative w-full select-none"
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onDragStart={(event) => {
        event.preventDefault();
      }}
    >
      {children}
      <div
        className="video-watermark pointer-events-none absolute z-40 rounded-md bg-[rgba(0,0,0,0.35)] px-2 py-1 font-mono text-xs text-white"
        style={watermarkStyle}
      >
        {watermarkText}
      </div>
    </div>
  );
};
