import { motion } from "framer-motion";
import { BookOpen, ChevronRight, Zap } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { NeonText } from "./NeonText";
import { ProgressRing } from "./ProgressRing";
import type { Course } from "@/lib/mock-data";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface CourseCardProps {
  course: Course;
  index: number;
}

export const CourseCard = ({ course, index }: CourseCardProps) => {
  const navigate = useNavigate();
  const totalLessons = course.phases.reduce((a, p) => a + p.lessons.length, 0);
  const completedLessons = course.phases.reduce(
    (a, p) => a + p.lessons.filter((l) => l.completed).length, 0
  );

  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -8, y: x * 8 });
  };

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{
        transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: "transform 0.15s ease-out",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <GlassCard
        glow
        gradient
        className="cursor-pointer group h-full"
        onClick={() => navigate(`/course/${course.id}`)}
      >
        {/* Animated gradient top bar */}
        <div className="h-1 w-full gradient-neon rounded-full mb-6 opacity-60 group-hover:opacity-100 transition-opacity" />

        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-xl gradient-neon-subtle flex items-center justify-center group-hover:neon-glow transition-shadow duration-500">
            <Zap size={18} className="text-primary" />
          </div>
          <ProgressRing progress={course.progress} size={52} strokeWidth={3} />
        </div>

        <div className="flex items-start justify-between mb-2">
          <NeonText as="h3" glow className="text-base leading-tight flex-1 mr-2">
            {course.title}
          </NeonText>
          <ChevronRight 
            className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300 shrink-0 mt-0.5" 
            size={18}
          />
        </div>

        <p className="text-sm text-muted-foreground mb-5 line-clamp-2 leading-relaxed">
          {course.description}
        </p>

        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-5">
          <div className="flex items-center gap-1.5 bg-secondary/50 px-2.5 py-1 rounded-full">
            <BookOpen size={12} />
            <span>{completedLessons}/{totalLessons} lessons</span>
          </div>
          <div className="flex items-center gap-1.5 bg-secondary/50 px-2.5 py-1 rounded-full">
            <span>{course.phases.length} phases</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative w-full h-1.5 bg-secondary/60 rounded-full overflow-hidden">
          <motion.div
            className="h-full gradient-neon rounded-full relative"
            initial={{ width: 0 }}
            animate={{ width: `${course.progress}%` }}
            transition={{ delay: index * 0.12 + 0.4, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" 
                 style={{ backgroundSize: '200% 100%' }} />
          </motion.div>
        </div>
        {course.progress === 100 && (
          <span className="text-[10px] font-display tracking-widest text-primary uppercase mt-2 inline-block">Completed</span>
        )}
      </GlassCard>
    </motion.div>
  );
};
