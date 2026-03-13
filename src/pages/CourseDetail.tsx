import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Target } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { NeonText } from "@/components/NeonText";
import { ProgressRing } from "@/components/ProgressRing";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import type { Course, Lesson } from "@/lib/course-types";

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

interface ProfileRoleRow {
  role: string | null;
}

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCourse = async () => {
      if (!courseId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError(userError?.message || "Unable to verify user");
        setLoading(false);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      const profileRole = ((profileData || {}) as ProfileRoleRow).role || "user";
      const isAdminOrOwner = profileRole === "owner" || profileRole === "admin";

      const { data: courseRow, error: courseError } = await supabase
        .from("courses")
        .select("id, title, description, thumbnail")
        .eq("id", courseId)
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
          .eq("course_id", courseId);

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

      const { data: lessonsData, error: lessonsError } = await supabase
        .from("lessons")
        .select("id, course_id, title, video_url, order_index, is_locked")
        .eq("course_id", courseId)
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

      const lessonRows = (lessonsData || []) as LessonRow[];
      const progressRows = (progressData || []) as ProgressRow[];
      const completedLessonIds = new Set(
        progressRows.filter((p) => Boolean(p.completed)).map((p) => String(p.lesson_id))
      );

      const mappedLessons: Lesson[] = lessonRows
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
  }, [courseId, navigate]);

  const { totalLessons, completedLessons } = useMemo(() => {
    const total = course?.lessons.length || 0;
    const completed = course?.lessons.filter((lesson) => lesson.completed).length || 0;
    return { totalLessons: total, completedLessons: completed };
  }, [course]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-sm text-muted-foreground">Loading course...</p>
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

  if (!course) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <NeonText gradient>Course not found</NeonText>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-10 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/courses")}
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

          <h1 className="mb-4 text-3xl font-semibold text-gray-900 dark:text-white sm:text-4xl">
            {course.title}
          </h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">{course.description}</p>

          <div className="glass glass-hover rounded-2xl p-6 flex items-center gap-6">
            <ProgressRing progress={course.progress} size={64} strokeWidth={4} />
            <div className="space-y-1.5">
              <div className="text-sm text-muted-foreground">
                <span className="font-display text-foreground font-bold text-lg">{completedLessons}</span>
                <span className="text-muted-foreground mx-1">/</span>
                <span>{totalLessons} lessons completed</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <BookOpen size={12} className="text-primary/60" />
                <span>{totalLessons} total lessons</span>
              </div>
              <div className="w-40 h-1.5 bg-secondary/40 rounded-full overflow-hidden mt-1">
                <motion.div
                  className="h-full rounded-full bg-[#714AD6]"
                  initial={{ width: 0 }}
                  animate={{ width: `${course.progress}%` }}
                  transition={{ delay: 0.3, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
          <span className="text-[10px] font-display tracking-[0.3em] uppercase text-muted-foreground">
            Lessons
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-border/50 to-transparent" />
        </div>

        <div className="space-y-3">
          {course.lessons.length === 0 && <p className="text-sm text-muted-foreground">No lessons added yet.</p>}
          {course.lessons.map((lesson) => (
            <button
              key={lesson.id}
              onClick={() => navigate(`/course/${course.id}/lesson/${lesson.id}`)}
              disabled={lesson.is_locked}
              className={`w-full rounded-xl px-4 py-3 text-left text-white transition ${
                lesson.is_locked
                  ? "bg-[#714AD6]/70 cursor-not-allowed"
                  : "bg-[#714AD6] hover:bg-[#5f3dc4]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-white">{lesson.order_index}. {lesson.title}</p>
                <span className="text-xs text-white">
                  {lesson.is_locked ? "Locked" : lesson.completed ? "Completed" : "Open"}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CourseDetail;
