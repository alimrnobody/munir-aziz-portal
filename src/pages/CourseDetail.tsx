import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Layers, Target } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PhaseAccordion } from "@/components/PhaseAccordion";
import { NeonText } from "@/components/NeonText";
import { ProgressRing } from "@/components/ProgressRing";
import { Button } from "@/components/ui/button";
import { mockCourses } from "@/lib/mock-data";

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const course = mockCourses.find((c) => c.id === courseId);

  if (!course) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <NeonText gradient>Course not found</NeonText>
        </div>
      </DashboardLayout>
    );
  }

  const totalLessons = course.phases.reduce((a, p) => a + p.lessons.length, 0);
  const completedLessons = course.phases.reduce(
    (a, p) => a + p.lessons.filter((l) => l.completed).length, 0
  );

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-10 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="mb-8 text-muted-foreground hover:text-foreground gap-2 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to courses
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <div className="flex items-center gap-2 mb-4">
            <Target size={14} className="text-primary" />
            <span className="text-[10px] font-display tracking-[0.4em] uppercase text-muted-foreground">
              COURSE MODULE
            </span>
          </div>

          <NeonText gradient className="text-3xl sm:text-4xl mb-4">
            {course.title}
          </NeonText>
          <p className="text-muted-foreground mb-8 leading-relaxed">{course.description}</p>

          {/* Progress card */}
          <div className="glass glass-hover rounded-2xl p-6 flex items-center gap-6">
            <ProgressRing progress={course.progress} size={64} strokeWidth={4} />
            <div className="space-y-1.5">
              <div className="text-sm text-muted-foreground">
                <span className="font-display text-foreground font-bold text-lg">{completedLessons}</span>
                <span className="text-muted-foreground mx-1">/</span>
                <span>{totalLessons} lessons completed</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Layers size={12} className="text-primary/60" />
                <span>{course.phases.length} phases</span>
              </div>
              {/* Mini progress bar */}
              <div className="w-40 h-1.5 bg-secondary/40 rounded-full overflow-hidden mt-1">
                <motion.div
                  className="h-full gradient-neon rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${course.progress}%` }}
                  transition={{ delay: 0.3, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Section divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
          <span className="text-[10px] font-display tracking-[0.3em] uppercase text-muted-foreground">
            Phases
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-border/50 to-transparent" />
        </div>

        <div className="space-y-3">
          {course.phases.map((phase, i) => (
            <PhaseAccordion key={phase.id} phase={phase} courseId={course.id} index={i} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CourseDetail;
