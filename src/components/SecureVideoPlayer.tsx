import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface SecureVideoPlayerProps {
  videoUrl?: string;
  watermarkText: string;
  watermarkSubtext?: string;
}

export const SecureVideoPlayer = ({
  videoUrl,
  watermarkText,
  watermarkSubtext = "Mr Nobody Squad Private Training",
}: SecureVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Disable right-click
  useEffect(() => {
    const handler = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", handler);
    return () => document.removeEventListener("contextmenu", handler);
  }, []);

  // Pause on tab switch
  useEffect(() => {
    const handler = () => {
      if (document.hidden && videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  // Detect devtools
  useEffect(() => {
    const threshold = 160;
    const check = () => {
      if (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
      ) {
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      }
    };
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="relative w-full aspect-video rounded-xl overflow-hidden glass neon-glow select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-cover"
          controls
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
          playsInline
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-secondary/50">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-full gradient-neon flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="ml-1">
                <path d="M8 5v14l11-7L8 5z" fill="currentColor" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">Demo — Connect video source</p>
          </div>
        </div>
      )}

      {/* Dynamic watermark */}
      <motion.div
        className="absolute pointer-events-none select-none"
        animate={{
          x: ["0%", "60%", "30%", "70%", "0%"],
          y: ["0%", "20%", "60%", "40%", "0%"],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{ top: "10%", left: "5%" }}
      >
        <div className="text-foreground/20 font-display text-xs sm:text-sm space-y-0.5">
          <div>{watermarkText}</div>
          <div className="text-[10px]">{watermarkSubtext}</div>
        </div>
      </motion.div>
    </div>
  );
};
