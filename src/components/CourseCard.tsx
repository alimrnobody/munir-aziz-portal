import { motion } from "framer-motion";
import { BookOpen, ChevronRight } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { NeonText } from "./NeonText";
import type { Course } from "@/lib/mock-data";
import { useNavigate } from "react-router-dom";

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

  return (
    <GlassCard
      glow
      className="cursor-pointer group"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      onClick={() => navigate(`/course/${course.id}`)}
    >
      {/* Gradient top bar */}
      <div className="h-1 w-full gradient-neon rounded-full mb-4" />

      <div className="flex items-start justify-between mb-3">
        <NeonText as="h3" glow className="text-lg">
          {course.title}
        </NeonText>
        <ChevronRight className="text-muted-foreground group-hover:text-primary transition-colors" />
      </div>

      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {course.description}
      </p>

      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
        <BookOpen size={14} />
        <span>{completedLessons}/{totalLessons} lessons</span>
        <span className="text-muted-foreground/50">•</span>
        <span>{course.phases.length} phases</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full gradient-neon rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${course.progress}%` }}
          transition={{ delay: index * 0.1 + 0.3, duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1">{course.progress}% complete</p>
    </GlassCard>
  );
};
