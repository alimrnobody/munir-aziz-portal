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
  const userId = user?.id ?? null;
  const profileRole = profile?.role ?? null;
  const hasProfile = Boolean(profile);
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

      if (!userId || !hasProfile) {
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
      const isAdminOrOwner = profileRole === "owner" || profileRole === "admin";

      if (!isAdminOrOwner) {
        const { data: teamMemberData, error: teamMemberError } = await supabase
          .from("team_members")
          .select("team_id")
          .eq("user_id", userId);

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
        .eq("user_id", userId);

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
  }, [authLoading, hasProfile, lessonId, navigate, profileRole, userId]);

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

    if (!userId) {
      setActionError("Unable to verify user");
      setMarkingComplete(false);
      return;
    }

    const completedAt = new Date().toISOString();

    const existing = await supabase
      .from("progress")
      .select("lesson_id, completed")
      .eq("user_id", userId)
      .eq("lesson_id", lesson.id)
      .maybeSingle();

    if (existing.error) {
      setActionError(existing.error.message);
      setMarkingComplete(false);
      return;
    }

    if (!existing.data) {
      const { error: insertError } = await supabase.from("progress").insert({
        user_id: userId,
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
        .eq("user_id", userId)
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
      <div className="p-4 lg:px-6 lg:py-5 xl:px-8 2xl:px-10">
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

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start xl:gap-6 2xl:gap-7">
          <motion.div
            className="min-w-0 flex-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-3 flex items-center gap-2">
              <Monitor size={14} className="text-primary" />
              <span className="text-[10px] font-display tracking-[0.3em] uppercase text-muted-foreground">
                NOW PLAYING
              </span>
            </div>

            <NeonText as="h2" glow className="mb-4 text-xl sm:text-2xl">
              {lesson.order_index}. {lesson.title}
            </NeonText>

            <div className="relative overflow-hidden rounded-[26px] border border-border/20 bg-card shadow-[0_18px_48px_rgba(15,23,42,0.16)] ring-1 ring-white/5">
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
            className="w-full shrink-0 lg:w-[258px] xl:w-[282px] 2xl:w-[296px]"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="sticky top-[4.75rem] rounded-[22px] border border-border/15 bg-card/80 p-3 shadow-[0_10px_32px_rgba(15,23,42,0.08)] backdrop-blur-xl">
              <div className="flex items-center justify-between gap-2 px-1 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-1.5 rounded-full bg-primary shadow-[0_0_0_1px_rgba(113,74,214,0.18)]" />
                  <h3 className="text-[11px] font-display tracking-[0.25em] uppercase text-muted-foreground">
                    Lessons
                  </h3>
                </div>
                <span className="rounded-full border border-border/20 bg-background/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {course.lessons.length}
                </span>
              </div>
              <div className="max-h-[calc(100vh-8.75rem)] space-y-2 overflow-y-auto pr-1">
                {course.lessons.map((l) => {
                  const isActive = l.id === lessonId;
                  return (
                    <button
                      key={l.id}
                      onClick={() => !l.is_locked && navigate(`/course/${course.id}/lesson/${l.id}`)}
                      className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm transition-all duration-200 ${
                        isActive
                          ? "border-2 border-black/80 bg-background/55 text-foreground shadow-[0_10px_22px_rgba(0,0,0,0.14)] ring-1 ring-black/50 dark:border-white/90 dark:ring-white/45 dark:shadow-[0_10px_22px_rgba(255,255,255,0.12)]"
                          : "border-border/10 bg-background/45 text-muted-foreground hover:border-border/25 hover:bg-secondary/18 hover:text-foreground"
                      } ${l.is_locked ? "cursor-not-allowed opacity-60" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/15 bg-background/65 text-[11px] font-semibold text-foreground/80 shadow-sm">
                          {l.order_index}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {l.is_locked ? (
                              <Lock size={13} className="shrink-0 text-muted-foreground" />
                            ) : l.completed ? (
                              <CheckCircle size={13} className="shrink-0 text-primary" />
                            ) : isActive ? (
                              <motion.div
                                animate={{ scale: [1, 1.15, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="shrink-0"
                              >
                                <PlayCircle size={13} className="text-primary" />
                              </motion.div>
                            ) : (
                              <PlayCircle size={13} className="shrink-0 opacity-30" />
                            )}
                            <span className="truncate text-[13px] font-medium leading-5">{l.title}</span>
                          </div>
                          <p className="mt-1 truncate pl-5 text-[11px] text-muted-foreground/80">
                            {l.completed ? "Completed lesson" : isActive ? "Currently playing" : "Tap to open lesson"}
                          </p>
                        </div>
                      </div>
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
