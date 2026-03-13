import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play } from "lucide-react";

interface SecureVideoPlayerProps {
  videoUrl?: string;
  watermarkText: string;
  watermarkSubtext?: string;
}

const getYouTubeEmbedUrl = (url: string) => {
  if (!url) return null;

  const lowerUrl = url.toLowerCase();
  if (!lowerUrl.includes("youtube") && !lowerUrl.includes("youtu.be")) {
    return null;
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();

    let videoId = "";
    if (host === "youtu.be") {
      videoId = parsed.pathname.split("/").filter(Boolean)[0] || "";
    } else if (parsed.pathname.includes("/embed/")) {
      videoId = parsed.pathname.split("/embed/")[1]?.split("/")[0] || "";
    } else {
      videoId = parsed.searchParams.get("v") || "";
    }

    if (!videoId) return null;
    return `https://www.youtube-nocookie.com/embed/${videoId}?modestbranding=1&rel=0&controls=1&disablekb=1&iv_load_policy=3`;
  } catch {
    return null;
  }
};

export const SecureVideoPlayer = ({
  videoUrl,
  watermarkText,
  watermarkSubtext = "Elite Squad By Mr Nobody - Private Training",
}: SecureVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const youtubeEmbedUrl = videoUrl ? getYouTubeEmbedUrl(videoUrl) : null;

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
      className="video-container relative w-full aspect-video rounded-2xl overflow-hidden glass neon-glow-strong select-none group"
      onContextMenuCapture={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Purple ambient glow behind */}
      <div className="absolute -inset-4 rounded-3xl gradient-neon opacity-10 blur-2xl pointer-events-none" />

      {videoUrl ? (
        youtubeEmbedUrl ? (
          <div className="relative z-[8] h-full w-full" onContextMenuCapture={(e) => e.preventDefault()}>
            <iframe
              src={youtubeEmbedUrl}
              title="Lesson Video"
              width="100%"
              height="100%"
              frameBorder="0"
              className="relative z-[8]"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-cover relative z-10"
          controls
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
          playsInline
          onContextMenu={(e) => e.preventDefault()}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        )
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

      {youtubeEmbedUrl && (
        <>
          <div className="pointer-events-none youtube-top-blocker" />
          <div className="pointer-events-none youtube-watch-blocker" />
        </>
      )}

      {/* Dynamic watermark */}
      <motion.div
        className="watermark absolute pointer-events-none select-none"
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
