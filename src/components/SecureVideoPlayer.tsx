import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play } from "lucide-react";

interface SecureVideoPlayerProps {
  videoUrl?: string;
  watermarkText: string;
  watermarkSubtext?: string;
}

export const SecureVideoPlayer = ({
  videoUrl,
  watermarkText,
  watermarkSubtext = "Elite Squad By Mr Nobody - Private Training",
}: SecureVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", handler);
    return () => document.removeEventListener("contextmenu", handler);
  }, []);

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
      className="relative w-full aspect-video rounded-2xl overflow-hidden glass neon-glow-strong select-none group"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Purple ambient glow behind */}
      <div className="absolute -inset-4 rounded-3xl gradient-neon opacity-10 blur-2xl pointer-events-none" />

      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-cover relative z-10"
          controls
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
          playsInline
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary/80 via-card to-secondary/60 relative z-10">
          <motion.div
            className="text-center space-y-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.div 
              className="w-20 h-20 mx-auto rounded-2xl gradient-neon flex items-center justify-center animate-pulse-glow cursor-pointer relative"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Play size={28} className="text-primary-foreground ml-1" />
              <div className="absolute -inset-3 rounded-3xl gradient-neon opacity-20 blur-lg" />
            </motion.div>
            <div>
              <p className="text-xs text-muted-foreground font-display tracking-wider">DEMO MODE</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">Connect video source to stream</p>
            </div>
          </motion.div>

          {/* Scan lines overlay */}
          <div className="absolute inset-0 scan-line pointer-events-none opacity-20" />
        </div>
      )}

      {/* Dynamic watermark */}
      <motion.div
        className="absolute pointer-events-none select-none z-20"
        animate={{
          x: ["0%", "55%", "25%", "65%", "0%"],
          y: ["0%", "15%", "55%", "35%", "0%"],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        style={{ top: "10%", left: "5%" }}
      >
        <div className="text-foreground/15 font-display text-xs sm:text-sm space-y-0.5">
          <div className="tracking-wider">{watermarkText}</div>
          <div className="text-[9px] tracking-widest">{watermarkSubtext}</div>
        </div>
      </motion.div>
    </div>
  );
};
