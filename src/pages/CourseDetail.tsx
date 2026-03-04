import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Layers } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { PhaseAccordion } from "@/components/PhaseAccordion";
import { NeonText } from "@/components/NeonText";
import { Button } from "@/components/ui/button";
import { mockCourses, mockUser } from "@/lib/mock-data";

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const course = mockCourses.find((c) => c.id === courseId);

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <NeonText gradient>Course not found</NeonText>
      </div>
    );
  }

  const totalLessons = course.phases.reduce((a, p) => a + p.lessons.length, 0);
  const completedLessons = course.phases.reduce(
    (a, p) => a + p.lessons.filter((l) => l.completed).length, 0
  );

  return (
    <div className="min-h-screen cyber-grid particle-field">
      <Navbar userEmail={mockUser.email} isAdmin={true} onLogout={() => navigate("/")} />

      <div className="fixed inset-0 pointer-events-none -z-10">
        <motion.div
          animate={{ opacity: [0.04, 0.08, 0.04] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary rounded-full blur-[250px]"
        />
      </div>

      <main className="container mx-auto px-4 py-8 max-w-3xl relative">
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

          <div className="glass rounded-2xl p-4 flex items-center gap-6">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="font-display text-foreground">{completedLessons}</span>
              <span>/</span>
              <span>{totalLessons} lessons</span>
            </div>
            <div className="flex-1 max-w-xs h-2 bg-secondary/60 rounded-full overflow-hidden">
              <motion.div
                className="h-full gradient-neon rounded-full relative"
                initial={{ width: 0 }}
                animate={{ width: `${course.progress}%` }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" 
                     style={{ backgroundSize: '200% 100%' }} />
              </motion.div>
            </div>
            <span className="text-sm font-display text-primary">{course.progress}%</span>
          </div>
        </motion.div>

        <div className="space-y-3">
          {course.phases.map((phase, i) => (
            <PhaseAccordion key={phase.id} phase={phase} courseId={course.id} index={i} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default CourseDetail;
