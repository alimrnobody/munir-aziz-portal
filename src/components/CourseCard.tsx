import { motion } from "framer-motion";
import { BookOpen, ChevronRight, Zap, Layers } from "lucide-react";
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
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -10, y: x * 10 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: "transform 0.2s ease-out",
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      <GlassCard
        glow
        gradient
        className="cursor-pointer group h-full"
        onClick={() => navigate(`/course/${course.id}`)}
      >
        {/* Top gradient accent bar */}
        <div className="h-1 w-full rounded-full mb-6 overflow-hidden relative">
          <motion.div 
            className="h-full gradient-neon"
            initial={{ width: "30%" }}
            animate={{ width: isHovered ? "100%" : "60%" }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="flex items-start justify-between mb-5">
          <div className="w-12 h-12 rounded-xl gradient-neon-subtle flex items-center justify-center group-hover:neon-glow transition-all duration-500 relative">
            <Zap size={20} className="text-primary" />
            {isHovered && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.3 }}
                className="absolute -inset-2 rounded-xl gradient-neon blur-lg"
              />
            )}
          </div>
          <ProgressRing progress={course.progress} size={56} strokeWidth={3} />
        </div>

        <div className="flex items-start justify-between mb-3">
          <NeonText as="h3" glow className="text-base leading-tight flex-1 mr-3">
            {course.title}
          </NeonText>
          <motion.div
            animate={{ x: isHovered ? 4 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronRight 
              className="text-muted-foreground group-hover:text-primary transition-colors duration-300 shrink-0 mt-0.5" 
              size={18}
            />
          </motion.div>
        </div>

        <p className="text-sm text-muted-foreground mb-6 line-clamp-2 leading-relaxed">
          {course.description}
        </p>

        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5 bg-secondary/40 px-3 py-1.5 rounded-full border border-border/20">
            <BookOpen size={12} className="text-primary/70" />
            <span className="font-mono">{completedLessons}/{totalLessons}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-secondary/40 px-3 py-1.5 rounded-full border border-border/20">
            <Layers size={12} className="text-primary/70" />
            <span className="font-mono">{course.phases.length} phases</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative w-full h-2 bg-secondary/40 rounded-full overflow-hidden">
          <motion.div
            className="h-full gradient-neon rounded-full relative"
            initial={{ width: 0 }}
            animate={{ width: `${course.progress}%` }}
            transition={{ delay: index * 0.12 + 0.5, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer" 
                 style={{ backgroundSize: '200% 100%' }} />
          </motion.div>
        </div>
        
        {course.progress === 100 && (
          <div className="flex items-center gap-1.5 mt-3">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-display tracking-[0.2em] text-primary uppercase">Completed</span>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
};
