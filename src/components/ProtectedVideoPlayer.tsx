import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  CheckCircle2,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";
import { VideoProtectionWrapper } from "@/components/VideoProtectionWrapper";
import { useProtectedFullscreen } from "@/hooks/useProtectedFullscreen";
import { useMarkComplete } from "@/hooks/useProgress";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

type ProtectedVideoPlayerProps = {
  videoUrl: string;
  lessonId: string;
  lessonTitle: string;
  isCompleted?: boolean;
};

type WatermarkPosition = {
  left: string;
  top: string;
};

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
    return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&controls=1&disablekb=1&fs=0`;
  } catch {
    return null;
  }
};

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "00:00";

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const getRandomPercent = (min: number, max: number) =>
  `${Math.floor(Math.random() * (max - min + 1)) + min}%`;

const getRandomPosition = (): WatermarkPosition => ({
  left: getRandomPercent(5, 75),
  top: getRandomPercent(5, 75),
});

export const ProtectedVideoPlayer = ({
  videoUrl,
  lessonId,
  lessonTitle,
  isCompleted = false,
}: ProtectedVideoPlayerProps) => {
  console.log("ProtectedVideoPlayer videoUrl:", videoUrl);

  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<number | null>(null);
  const { user } = useAuth();
  const markComplete = useMarkComplete();
  const { isFullscreen, toggleFullscreen } = useProtectedFullscreen(wrapperRef, videoRef);
  const safeVideoUrl = videoUrl?.trim() || "";
  const youtubeEmbedUrl = safeVideoUrl ? getYouTubeEmbedUrl(safeVideoUrl) : null;
  const isYouTubeVideo = Boolean(youtubeEmbedUrl);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const resumeKey = `lesson-resume-${lessonId}`;
  const [showControls, setShowControls] = useState(true);
  const [watermarkPosition, setWatermarkPosition] = useState<WatermarkPosition>(getRandomPosition);

  useEffect(() => {
  const video = videoRef.current;

  if (!video) return;

  const savedTime = localStorage.getItem(resumeKey);

  if (savedTime) {
    video.currentTime = Number(savedTime);
  }
}, [resumeKey]);

  useEffect(() => {
  return () => {
    const video = videoRef.current;
    if (video) {
      localStorage.setItem(resumeKey, String(video.currentTime));
    }
  };
}, []);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        window.clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setWatermarkPosition(getRandomPosition());
    }, 4000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const video = videoRef.current;
      if (!video) return;
      if (!document.hidden) return;

      video.pause();
      setIsPlaying(false);
      setShowControls(true);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }

    if (isPlaying) {
      controlsTimeoutRef.current = window.setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (!isYouTubeVideo) {
      resetControlsTimeout();
    }
  };

  const handleTimeUpdate = () => {
  const video = videoRef.current;
  if (!video) return;

  setCurrentTime(video.currentTime);
  setProgress(video.duration ? (video.currentTime / video.duration) * 100 : 0);

  localStorage.setItem(resumeKey, String(video.currentTime));
};

  const handleLoadedMetadata = (event: React.SyntheticEvent<HTMLVideoElement>) => {
  const video = event.currentTarget;

  setDuration(video.duration || 0);

  const savedTime = localStorage.getItem(`lesson-resume-${lessonId}`);

  if (savedTime) {
    video.currentTime = Number(savedTime);
  }
};

  const handleDurationChange = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    if (event.currentTarget.duration) {
      setDuration(event.currentTarget.duration);
    }
  };

  const handleEnded = () => {
  setIsPlaying(false);
  setShowControls(true);

  localStorage.removeItem(resumeKey);

  if (!isCompleted) {
    markComplete.mutate(lessonId);
  }
};

  const handlePlayPause = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      await video.play();
    } else {
      video.pause();
    }
  };

  const handleMuteToggle = () => {
    const video = videoRef.current;
    if (!video) return;

    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleSeek = (event: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const nextProgress = Math.min(Math.max(clickX / rect.width, 0), 1);
    video.currentTime = nextProgress * duration;
    setCurrentTime(video.currentTime);
    setProgress(nextProgress * 100);
  };

  const fullscreenWatermarkStyle: CSSProperties = {
    left: watermarkPosition.left,
    top: watermarkPosition.top,
    transition: "left 3s ease-in-out, top 3s ease-in-out",
  };

  return (
    <VideoProtectionWrapper videoRef={videoRef}>
      <div
        ref={wrapperRef}
        className={cn(
          "relative aspect-video w-full overflow-hidden rounded-2xl bg-black",
          isFullscreen && "h-screen rounded-none"
        )}
        onContextMenuCapture={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onContextMenu={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          if (isPlaying && !isYouTubeVideo) {
            setShowControls(false);
          }
        }}
      >
        {isFullscreen && (
          <div
            className="video-watermark pointer-events-none absolute z-50 rounded-md bg-[rgba(0,0,0,0.35)] px-2 py-1 font-mono text-xs text-white"
            style={fullscreenWatermarkStyle}
          >
            {user?.email || "private@elite-squad.local"}
          </div>
        )}

        {safeVideoUrl ? (
          isYouTubeVideo ? (
            <div className="relative h-full w-full">
              <iframe
                src={youtubeEmbedUrl || undefined}
                title={lessonTitle}
                className="h-full w-full bg-black"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              />
              <div
                className="pointer-events-none absolute left-0 top-0 z-30 h-full w-full"
                aria-hidden="true"
              />
              <div className="pointer-events-auto absolute left-0 top-0 z-20 h-[80px] w-full" />
              <div
                className="pointer-events-auto absolute bottom-0 left-0 z-20 h-[48px] w-full"
                aria-hidden="true"
              />
              <div
                className="pointer-events-auto absolute bottom-0 right-0 z-20 h-[74px] w-[184px]"
                aria-hidden="true"
              />
              <div
                className="pointer-events-auto absolute bottom-0 right-0 z-20 h-[66px] w-[312px] rounded-tl-[28px]"
                aria-hidden="true"
              />
            </div>
          ) : (
            <video
              ref={videoRef}
              src={safeVideoUrl}
              title={lessonTitle}
              className="h-full w-full object-contain bg-black"
              controls={false}
              controlsList="nodownload nofullscreen noremoteplayback"
              disablePictureInPicture={true}
              playsInline={true}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onDurationChange={handleDurationChange}
              onEnded={handleEnded}
              onError={(event) => {
                console.log("ProtectedVideoPlayer error:", event);
              }}
              onPlay={() => {
                setIsPlaying(true);
                resetControlsTimeout();
              }}
              onPause={() => {
                setIsPlaying(false);
                setShowControls(true);
              }}
            />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-black text-sm text-white/70">
            No video available
          </div>
        )}

        {isCompleted && (
          <div className="pointer-events-none absolute right-4 top-4 z-30 inline-flex items-center gap-2 rounded-full bg-emerald-600/90 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
            <CheckCircle2 size={14} />
            <span>Completed</span>
          </div>
        )}

        {!isYouTubeVideo && (
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pb-4 pt-10 transition-opacity duration-300",
              showControls ? "opacity-100" : "opacity-0"
            )}
          >
            <div>
            <div
              className="relative mb-4 h-2 cursor-pointer rounded-full bg-white/20"
              onClick={handleSeek}
            >
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-[#714AD6]"
                style={{ width: `${progress}%` }}
              />
              <div
                className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white shadow"
                style={{ left: `calc(${progress}% - 6px)` }}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-white">
              <button
                type="button"
                onClick={() => void handlePlayPause()}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={handleMuteToggle}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>

              <div className="min-w-[96px] text-sm font-medium tabular-nums text-white/90">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>

              {!isCompleted && (
                <button
                  type="button"
                  onClick={() => markComplete.mutate(lessonId)}
                  disabled={markComplete.isPending}
                  className="rounded-lg bg-[#714AD6] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#5f3dc4] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {markComplete.isPending ? "Saving..." : "Mark Complete"}
                </button>
              )}

              <button
                type="button"
                onClick={() => void toggleFullscreen()}
                className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
              >
                {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            </div>
            </div>
          </div>
        )}
      </div>
    </VideoProtectionWrapper>
  );
};














