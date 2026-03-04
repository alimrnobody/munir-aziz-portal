import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Layers } from "lucide-react";
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
            className="mb-8 text-muted-foreground hover:text-foreground gap-2"
          >
            <ArrowLeft size={14} />
            Back to courses
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <div className="flex items-center gap-2 mb-3">
            <Layers size={14} className="text-primary" />
            <span className="text-[10px] font-display tracking-[0.4em] uppercase text-muted-foreground">
              COURSE MODULE
            </span>
          </div>

          <NeonText gradient className="text-3xl sm:text-4xl mb-3">
            {course.title}
          </NeonText>
          <p className="text-muted-foreground mb-6 leading-relaxed">{course.description}</p>

          <div className="glass rounded-2xl p-5 flex items-center gap-6">
            <ProgressRing progress={course.progress} size={56} strokeWidth={4} />
            <div>
              <div className="text-sm text-muted-foreground">
                <span className="font-display text-foreground">{completedLessons}</span> / {totalLessons} lessons completed
              </div>
              <div className="text-xs text-muted-foreground mt-1">{course.phases.length} phases</div>
            </div>
          </div>
        </motion.div>

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
