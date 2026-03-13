import { useCallback, useEffect, useState, type RefObject } from "react";

export const useProtectedFullscreen = (
  wrapperRef: RefObject<HTMLDivElement | null>,
  videoRef: RefObject<HTMLVideoElement | null>
) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const enterFullscreen = useCallback(async () => {
    try {
      if (wrapperRef.current) {
        await wrapperRef.current.requestFullscreen();
        setIsFullscreen(true);
      }

      if (videoRef.current) {
        await videoRef.current.play();
      }
    } catch {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
  }, [videoRef, wrapperRef]);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      setIsFullscreen(false);
    } catch {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (isFullscreen) {
      await exitFullscreen();
      return;
    }

    await enterFullscreen();
  }, [enterFullscreen, exitFullscreen, isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  return {
    isFullscreen,
    toggleFullscreen,
    enterFullscreen,
    exitFullscreen,
  };
};
