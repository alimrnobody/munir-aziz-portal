import { motion } from "framer-motion";
import type { Course } from "@/lib/course-types";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";

interface CourseCardProps {
  course: Course;
  index: number;
}

export const CourseCard = ({ course, index }: CourseCardProps) => {
  const navigate = useNavigate();
  const thumbnail = course.thumbnail?.trim() || "";
  const imageSrc = thumbnail || "/placeholder.svg";
  const progress = Math.max(0, Math.min(100, course.progress || 0));
  const locked = Boolean(course.access_locked);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
    >
      <div
        className={`h-full overflow-hidden rounded-[14px] border bg-white transition-all duration-200 ease-in-out border-[rgba(113,74,214,0.35)] shadow-[0_0_20px_rgba(113,74,214,0.15)] dark:bg-[#0F172A] ${
          locked
            ? "cursor-not-allowed opacity-80"
            : "cursor-pointer hover:border-[#714AD6] hover:shadow-[0_0_30px_rgba(113,74,214,0.25)]"
        }`}
        onClick={() => {
          if (!locked) {
            navigate(`/course/${course.id}`);
          }
        }}
      >
        <div className="relative w-full aspect-video bg-slate-100">
          <img
            src={imageSrc}
            alt={course.title}
            className={`h-full w-full object-cover transition-all duration-200 ${
              locked ? "scale-[1.02] blur-[1.5px] brightness-50" : ""
            }`}
          />
          {locked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/55 text-white">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-black/35 backdrop-blur-sm">
                <Lock size={24} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold tracking-[0.18em] uppercase">Private Course</p>
                <p className="mt-1 text-xs text-white/70">Locked until access is enabled</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-5 dark:bg-[#0F172A]">
          <div className="mb-2 flex items-start justify-between gap-3">
            <h3 className="text-[30px] font-semibold leading-tight text-slate-900 dark:text-white">
              {course.title}
            </h3>
            {locked && <Lock size={18} className="mt-1 shrink-0 text-[#ef4444]" />}
          </div>

          <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-slate-700 dark:text-white/70">
            {course.description}
          </p>

          <div className="space-y-2">
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-slate-800 transition-all duration-300 dark:bg-[#714AD6]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-white/80">{progress}%</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
