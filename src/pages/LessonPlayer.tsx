import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { SecureVideoPlayer } from "@/components/SecureVideoPlayer";
import { NeonText } from "@/components/NeonText";
import { Button } from "@/components/ui/button";
import { mockCourses, mockUser } from "@/lib/mock-data";

const LessonPlayer = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();

  const course = mockCourses.find((c) => c.id === courseId);
  const lesson = course?.phases
    .flatMap((p) => p.lessons)
    .find((l) => l.id === lessonId);

  if (!course || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <NeonText gradient>Lesson not found</NeonText>
      </div>
    );
  }

  return (
    <div className="min-h-screen cyber-grid">
      <Navbar userEmail={mockUser.email} isAdmin={true} onLogout={() => navigate("/")} />

      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[200px]" />
      </div>

      <main className="container mx-auto px-4 py-8 max-w-4xl relative">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/course/${courseId}`)}
            className="mb-6 text-muted-foreground hover:text-foreground gap-2"
          >
            <ArrowLeft size={14} />
            Back to {course.title}
          </Button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <NeonText as="h2" glow className="text-xl sm:text-2xl mb-5">
            {lesson.title}
          </NeonText>

          <SecureVideoPlayer watermarkText={mockUser.email} />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 glass rounded-2xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <span className="text-xs font-display tracking-wider text-muted-foreground uppercase">
                Duration: {lesson.duration}
              </span>
              {lesson.completed && (
                <div className="flex items-center gap-1.5 text-primary text-xs">
                  <CheckCircle size={12} />
                  <span className="font-display tracking-wider">COMPLETED</span>
                </div>
              )}
            </div>
            <Button variant="neon" size="sm" className="gap-2">
              <CheckCircle size={14} />
              Mark Complete
            </Button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default LessonPlayer;
