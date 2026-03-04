import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
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
    <div className="min-h-screen cyber-grid">
      <Navbar userEmail={mockUser.email} isAdmin={true} onLogout={() => navigate("/")} />

      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-20 left-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dashboard")}
          className="mb-6 text-muted-foreground"
        >
          <ArrowLeft size={16} />
          Back to courses
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <NeonText gradient className="text-2xl sm:text-3xl mb-2">
            {course.title}
          </NeonText>
          <p className="text-muted-foreground mb-4">{course.description}</p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{completedLessons}/{totalLessons} lessons completed</span>
            <div className="flex-1 max-w-xs h-1.5 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className="h-full gradient-neon rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${course.progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <span>{course.progress}%</span>
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
