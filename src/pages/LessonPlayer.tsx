import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
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

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/course/${courseId}`)}
          className="mb-6 text-muted-foreground"
        >
          <ArrowLeft size={16} />
          Back to {course.title}
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <NeonText as="h2" glow className="text-xl sm:text-2xl mb-4">
            {lesson.title}
          </NeonText>

          <SecureVideoPlayer
            watermarkText={mockUser.email}
          />

          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Duration: {lesson.duration}</span>
            <Button variant="neon" size="sm">
              Mark as Complete
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default LessonPlayer;
