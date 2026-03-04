import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle, PlayCircle, Clock } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { SecureVideoPlayer } from "@/components/SecureVideoPlayer";
import { NeonText } from "@/components/NeonText";
import { Button } from "@/components/ui/button";
import { mockCourses, mockUser } from "@/lib/mock-data";

const LessonPlayer = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();

  const course = mockCourses.find((c) => c.id === courseId);
  const allLessons = course?.phases.flatMap((p) => p.lessons) || [];
  const lesson = allLessons.find((l) => l.id === lessonId);
  const currentPhase = course?.phases.find((p) => p.lessons.some((l) => l.id === lessonId));

  if (!course || !lesson) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <NeonText gradient>Lesson not found</NeonText>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/course/${courseId}`)}
            className="mb-4 text-muted-foreground hover:text-foreground gap-2"
          >
            <ArrowLeft size={14} />
            Back to {course.title}
          </Button>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Video Player */}
          <motion.div
            className="flex-1 min-w-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <NeonText as="h2" glow className="text-xl sm:text-2xl mb-4">
              {lesson.title}
            </NeonText>

            <div className="rounded-2xl overflow-hidden neon-glow">
              <SecureVideoPlayer watermarkText={mockUser.email} />
            </div>

            <div className="mt-4 glass rounded-2xl p-4 flex items-center justify-between">
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
            </div>
          </motion.div>

          {/* Right: Lesson List & Phase Navigation */}
          <motion.div
            className="w-full lg:w-80 xl:w-96 shrink-0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="glass rounded-2xl overflow-hidden sticky top-20">
              <div className="p-4 border-b border-border/20">
                <h3 className="text-xs font-display tracking-[0.3em] uppercase text-muted-foreground">
                  {currentPhase?.title || "Lessons"}
                </h3>
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                {course.phases.map((phase) => (
                  <div key={phase.id}>
                    {course.phases.length > 1 && (
                      <div className="px-4 py-2 bg-secondary/20">
                        <span className="text-[10px] font-display tracking-[0.2em] uppercase text-muted-foreground">
                          {phase.title}
                        </span>
                      </div>
                    )}
                    {phase.lessons.map((l) => {
                      const isActive = l.id === lessonId;
                      return (
                        <button
                          key={l.id}
                          onClick={() => navigate(`/course/${courseId}/lesson/${l.id}`)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 text-sm ${
                            isActive
                              ? "bg-primary/10 border-l-2 border-primary text-foreground"
                              : "hover:bg-secondary/30 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {l.completed ? (
                            <CheckCircle size={14} className="text-primary shrink-0" />
                          ) : isActive ? (
                            <PlayCircle size={14} className="text-primary shrink-0" />
                          ) : (
                            <PlayCircle size={14} className="shrink-0 opacity-40" />
                          )}
                          <span className="flex-1 truncate">{l.title}</span>
                          <div className="flex items-center gap-1 text-xs opacity-60">
                            <Clock size={10} />
                            <span>{l.duration}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LessonPlayer;
