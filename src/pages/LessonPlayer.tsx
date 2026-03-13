import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle, PlayCircle, Monitor, Lock, FileAudio, FileImage, FileText } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ProtectedVideoPlayer } from "@/components/ProtectedVideoPlayer";
import { NeonText } from "@/components/NeonText";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import type { Course, Lesson, LessonResource } from "@/lib/course-types";

interface CourseRow {
  id: string | number;
  title: string | null;
  description: string | null;
  thumbnail: string | null;
}

interface LessonRow {
  id: string | number;
  course_id: string | number;
  title: string | null;
  video_url: string | null;
  order_index: number | null;
  is_locked: boolean | null;
}

interface ProgressRow {
  lesson_id: string | number;
  completed: boolean | null;
}

interface TeamMemberRow {
  team_id: string | number;
}

interface TeamCourseRow {
  team_id: string | number;
}

interface LessonResourceRow {
  id: string | number;
  lesson_id: string | number;
  title: string | null;
  file_url: string | null;
  file_type: string | null;
  created_at: string | null;
}

const getResourceIcon = (fileType: string) => {
  if (fileType.startsWith("audio/")) return FileAudio;
  if (fileType.startsWith("image/")) return FileImage;
  return FileText;
};

const LessonPlayer = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resources, setResources] = useState<LessonResource[]>([]);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [actionError, setActionError] = useState("");
  useEffect(() => {
    const loadCourse = async () => {
      if (authLoading) {
        return;
      }

      if (!lessonId) {
        setLoading(false);
        return;
      }

      if (!user || !profile) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      const { data: lessonRow, error: lessonError } = await supabase
        .from("lessons")
        .select("id, course_id, title, video_url, order_index, is_locked")
        .eq("id", lessonId)
        .maybeSingle();

      if (lessonError) {
        setError(lessonError.message);
        setLoading(false);
        return;
      }

      if (!lessonRow) {
        setCourse(null);
        setLoading(false);
        return;
      }

      const resolvedCourseId = String((lessonRow as LessonRow).course_id);
      const isAdminOrOwner = profile.role === "owner" || profile.role === "admin";

      if (!isAdminOrOwner) {
        const { data: teamMemberData, error: teamMemberError } = await supabase
          .from("team_members")
          .select("team_id")
          .eq("user_id", user.id);

        if (teamMemberError) {
          setError(teamMemberError.message);
          setLoading(false);
          return;
        }

        const { data: teamCourseData, error: teamCourseError } = await supabase
          .from("team_courses")
          .select("team_id")
          .eq("course_id", resolvedCourseId);

        if (teamCourseError) {
          setError(teamCourseError.message);
          setLoading(false);
          return;
        }

        const userTeamIds = new Set(
          ((teamMemberData || []) as TeamMemberRow[]).map((item) => String(item.team_id))
        );
        const assignedTeamIds = new Set(
          ((teamCourseData || []) as TeamCourseRow[]).map((item) => String(item.team_id))
        );
        const hasAccess =
          assignedTeamIds.size > 0 &&
          Array.from(assignedTeamIds).some((teamId) => userTeamIds.has(teamId));

        if (!hasAccess) {
          navigate("/courses", { replace: true });
          return;
        }
      }

      const { data: courseRow, error: courseError } = await supabase
        .from("courses")
        .select("id, title, description, thumbnail")
        .eq("id", resolvedCourseId)
        .maybeSingle();

      if (courseError) {
        setError(courseError.message);
        setLoading(false);
        return;
      }

      if (!courseRow) {
        setCourse(null);
        setLoading(false);
        return;
      }

      const { data: lessonsData, error: lessonsError } = await supabase
        .from("lessons")
        .select("id, course_id, title, video_url, order_index, is_locked")
        .eq("course_id", resolvedCourseId)
        .order("order_index", { ascending: true });

      if (lessonsError) {
        setError(lessonsError.message);
        setLoading(false);
        return;
      }

      const { data: progressData, error: progressError } = await supabase
        .from("progress")
        .select("lesson_id, completed")
        .eq("user_id", user.id);

      if (progressError) {
        setError(progressError.message);
        setLoading(false);
        return;
      }

      const progressRows = (progressData || []) as ProgressRow[];
      const completedLessonIds = new Set(
        progressRows.filter((p) => Boolean(p.completed)).map((p) => String(p.lesson_id))
      );

      const mappedLessons: Lesson[] = ((lessonsData || []) as LessonRow[])
        .filter((lesson) => !lesson.is_locked)
        .map((lesson) => ({
        id: String(lesson.id),
        course_id: String(lesson.course_id),
        title: lesson.title || "Untitled lesson",
        video_url: lesson.video_url || "",
        order_index: lesson.order_index || 0,
        is_locked: Boolean(lesson.is_locked),
        completed: completedLessonIds.has(String(lesson.id)),
      }));

      const totalLessons = mappedLessons.length;
      const completedLessons = mappedLessons.filter((lesson) => lesson.completed).length;

      setCourse({
        id: String((courseRow as CourseRow).id),
        title: (courseRow as CourseRow).title || "Untitled course",
        description: (courseRow as CourseRow).description || "",
        thumbnail: (courseRow as CourseRow).thumbnail || "",
        is_locked: false,
        lessons: mappedLessons,
        progress: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
      });
      setLoading(false);
    };

    void loadCourse();
  }, [authLoading, lessonId, navigate, profile, user]);

  useEffect(() => {
    const loadLessonResources = async () => {
      if (!lessonId) {
        setResources([]);
        return;
      }

      const { data, error: resourcesError } = await supabase
        .from("lesson_resources")
        .select("id, lesson_id, title, file_url, file_type, created_at")
        .eq("lesson_id", lessonId)
        .order("created_at", { ascending: true });

      if (resourcesError) {
        setActionError(resourcesError.message);
        return;
      }

      setResources(
        ((data || []) as LessonResourceRow[]).map((resource) => ({
          id: String(resource.id),
          lesson_id: String(resource.lesson_id),
          title: resource.title || "Untitled resource",
          file_url: resource.file_url || "",
          file_type: resource.file_type || "",
          created_at: resource.created_at || "",
        }))
      );
    };

    void loadLessonResources();
  }, [lessonId]);

  const getResourcePublicUrl = (path: string) =>
    supabase.storage.from("lesson-resources").getPublicUrl(path).data.publicUrl;

  const lesson = useMemo(() => course?.lessons.find((l) => l.id === lessonId), [course, lessonId]);

  const handleMarkComplete = async () => {
    if (!lesson) return;

    setActionError("");
    setMarkingComplete(true);

    if (!user) {
      setActionError("Unable to verify user");
      setMarkingComplete(false);
      return;
    }

    const completedAt = new Date().toISOString();

    const existing = await supabase
      .from("progress")
      .select("lesson_id, completed")
      .eq("user_id", user.id)
      .eq("lesson_id", lesson.id)
      .maybeSingle();

    if (existing.error) {
      setActionError(existing.error.message);
      setMarkingComplete(false);
      return;
    }

    if (!existing.data) {
      const { error: insertError } = await supabase.from("progress").insert({
        user_id: user.id,
        lesson_id: lesson.id,
        completed: true,
        completed_at: completedAt,
      });

      if (insertError) {
        setActionError(insertError.message);
        setMarkingComplete(false);
        return;
      }
    } else if (!existing.data.completed) {
      const { error: updateError } = await supabase
        .from("progress")
        .update({ completed: true, completed_at: completedAt })
        .eq("user_id", user.id)
        .eq("lesson_id", lesson.id);

      if (updateError) {
        setActionError(updateError.message);
        setMarkingComplete(false);
        return;
      }
    }

    setCourse((prev) => {
      if (!prev) return prev;
      const updatedLessons = prev.lessons.map((item) =>
        item.id === lesson.id ? { ...item, completed: true } : item
      );
      const totalLessons = updatedLessons.length;
      const completedLessons = updatedLessons.filter((item) => item.completed).length;

      return {
        ...prev,
        lessons: updatedLessons,
        progress: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
      };
    });

    setMarkingComplete(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-sm text-muted-foreground">Loading lesson...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!course || !lesson) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <NeonText gradient>Lesson not found</NeonText>
        </div>
      </DashboardLayout>
    );
  }

  if (lesson.is_locked) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[70vh] items-center justify-center p-6">
          <div className="flex w-full max-w-xl flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-[#0F172A] px-8 py-12 text-center shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-black/30">
              <Lock size={26} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">This lesson is locked</h2>
              <p className="mt-2 text-sm text-white/70">Contact your admin to get access</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  console.log("VIDEO URL BEING PASSED:", lesson?.video_url);

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/course/${course.id}`)}
            className="mb-4 text-muted-foreground hover:text-foreground gap-2 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to {course.title}
          </Button>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-6">
          <motion.div
            className="flex-1 min-w-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Monitor size={14} className="text-primary" />
              <span className="text-[10px] font-display tracking-[0.3em] uppercase text-muted-foreground">
                NOW PLAYING
              </span>
            </div>

            <NeonText as="h2" glow className="text-xl sm:text-2xl mb-5">
              {lesson.order_index}. {lesson.title}
            </NeonText>

            <div className="rounded-2xl overflow-hidden neon-glow relative">
              {lesson.video_url?.trim() ? (
                <ProtectedVideoPlayer
                  videoUrl={lesson.video_url}
                  lessonId={lesson.id}
                  lessonTitle={lesson.title}
                  isCompleted={lesson.completed}
                />
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-2xl bg-black/80 text-sm text-white/70">
                  Loading video...
                </div>
              )}
            </div>

            {resources.length > 0 && (
              <div className="mt-4 rounded-2xl border border-border/20 bg-card p-5">
                <h3 className="text-sm font-semibold text-foreground">Resources</h3>
                <div className="mt-3 space-y-2">
                  {resources.map((resource) => {
                    const ResourceIcon = getResourceIcon(resource.file_type);
                    return (
                      <a
                        key={resource.id}
                        href={getResourcePublicUrl(resource.file_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 rounded-lg border border-border/20 px-3 py-2 text-sm text-foreground transition hover:bg-secondary/20"
                      >
                        <ResourceIcon size={16} className="shrink-0 text-[#714AD6]" />
                        <span className="truncate">{resource.title}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4 glass glass-hover rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-mono">Lesson {lesson.order_index}</span>
                </div>
                {lesson.completed && (
                  <div className="flex items-center gap-1.5 text-primary text-xs">
                    <CheckCircle size={13} />
                    <span className="font-display tracking-[0.15em]">COMPLETED</span>
                  </div>
                )}
              </div>
              <Button
                variant="neon"
                size="sm"
                className="gap-2"
                onClick={() => void handleMarkComplete()}
                disabled={markingComplete || lesson.completed}
              >
                <CheckCircle size={14} />
                {lesson.completed ? "Completed" : markingComplete ? "Saving..." : "Mark Complete"}
              </Button>
            </motion.div>
            {actionError && <p className="mt-2 text-xs text-destructive">{actionError}</p>}
          </motion.div>

          <motion.div
            className="w-full lg:w-80 xl:w-96 shrink-0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="glass rounded-2xl overflow-hidden sticky top-20 border border-border/10">
              <div className="p-4 border-b border-border/15 flex items-center gap-2">
                <div className="w-1 h-4 rounded-full gradient-neon" />
                <h3 className="text-[11px] font-display tracking-[0.25em] uppercase text-muted-foreground">
                  Lessons
                </h3>
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                {course.lessons.map((l) => {
                  const isActive = l.id === lessonId;
                  return (
                    <button
                      key={l.id}
                      onClick={() => !l.is_locked && navigate(`/course/${course.id}/lesson/${l.id}`)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all duration-300 text-sm border-b border-border/5 ${
                        isActive
                          ? "bg-primary/8 border-l-2 border-l-primary text-foreground"
                          : "hover:bg-secondary/20 text-muted-foreground hover:text-foreground"
                      } ${l.is_locked ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      {l.is_locked ? (
                        <Lock size={14} className="text-muted-foreground shrink-0" />
                      ) : l.completed ? (
                        <CheckCircle size={14} className="text-primary shrink-0" />
                      ) : isActive ? (
                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                          <PlayCircle size={14} className="text-primary shrink-0" />
                        </motion.div>
                      ) : (
                        <PlayCircle size={14} className="shrink-0 opacity-30" />
                      )}
                      <span className="flex-1 truncate text-[13px]">{l.order_index}. {l.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LessonPlayer;
