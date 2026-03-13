import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { Progress as ProgressBar } from "@/components/ui/progress";

interface CourseRow {
  id: string | number;
  title: string | null;
}

interface LessonRow {
  id: string | number;
  course_id: string | number;
}

interface ProgressRow {
  lesson_id: string | number;
  completed: boolean | null;
}

interface ProfileRoleRow {
  role: string | null;
}

interface TeamMemberRow {
  team_id: string | number;
}

interface TeamCourseRow {
  course_id: string | number;
  team_id: string | number;
}

interface CourseProgress {
  id: string;
  title: string;
  completedLessons: number;
  totalLessons: number;
  percentage: number;
}

const Progress = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);

  useEffect(() => {
    const loadProgress = async () => {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError(userError?.message || "Unable to verify user session");
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

      let allowedCourseIds: string[] | null = null;

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

        const userTeamIds = ((teamMemberData || []) as TeamMemberRow[]).map((item) => String(item.team_id));

        if (userTeamIds.length === 0) {
          setCourseProgress([]);
          setLoading(false);
          return;
        }

        const { data: teamCourseData, error: teamCourseError } = await supabase
          .from("team_courses")
          .select("course_id, team_id")
          .in("team_id", userTeamIds);

        if (teamCourseError) {
          setError(teamCourseError.message);
          setLoading(false);
          return;
        }

        allowedCourseIds = Array.from(
          new Set(((teamCourseData || []) as TeamCourseRow[]).map((item) => String(item.course_id)))
        );

        if (allowedCourseIds.length === 0) {
          setCourseProgress([]);
          setLoading(false);
          return;
        }
      }

      let coursesQuery = supabase
        .from("courses")
        .select("id, title")
        .order("created_at", { ascending: false });

      if (allowedCourseIds) {
        coursesQuery = coursesQuery.in("id", allowedCourseIds);
      }

      const { data: coursesData, error: coursesError } = await coursesQuery;

      if (coursesError) {
        setError(coursesError.message);
        setLoading(false);
        return;
      }

      const courseRows = (coursesData || []) as CourseRow[];
      const scopedCourseIds = courseRows.map((course) => String(course.id));

      if (scopedCourseIds.length === 0) {
        setCourseProgress([]);
        setLoading(false);
        return;
      }

      const { data: lessonsData, error: lessonsError } = await supabase
        .from("lessons")
        .select("id, course_id");
        
      const scopedLessonRows = ((lessonsData || []) as LessonRow[]).filter((lesson) =>
        scopedCourseIds.includes(String(lesson.course_id))
      );

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
        progressRows.filter((row) => Boolean(row.completed)).map((row) => String(row.lesson_id))
      );

      const lessonsByCourse = new Map<string, LessonRow[]>();
      scopedLessonRows.forEach((lesson) => {
        const key = String(lesson.course_id);
        const list = lessonsByCourse.get(key) || [];
        list.push(lesson);
        lessonsByCourse.set(key, list);
      });

      const mapped: CourseProgress[] = courseRows.map((course) => {
        const lessons = lessonsByCourse.get(String(course.id)) || [];
        const totalLessons = lessons.length;
        const completedLessons = lessons.filter((lesson) => completedLessonIds.has(String(lesson.id))).length;
        const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        return {
          id: String(course.id),
          title: course.title || "Untitled course",
          completedLessons,
          totalLessons,
          percentage,
        };
      });

      setCourseProgress(mapped);
      setLoading(false);
    };

    void loadProgress();
  }, []);

  const summary = useMemo(() => {
    const totalLessons = courseProgress.reduce((sum, course) => sum + course.totalLessons, 0);
    const completedLessons = courseProgress.reduce((sum, course) => sum + course.completedLessons, 0);
    const overallPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return { totalLessons, completedLessons, overallPercentage };
  }, [courseProgress]);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl p-6 lg:p-10">
        <h1 className="text-2xl font-semibold text-foreground">Progress</h1>
        <p className="mt-2 text-sm text-muted-foreground">Track your completion and learning milestones.</p>

        {loading && <p className="mt-6 text-sm text-muted-foreground">Loading progress...</p>}
        {error && <p className="mt-6 text-sm text-destructive">{error}</p>}

        {!loading && !error && (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-border/40 bg-card p-5">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Completed Lessons</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{summary.completedLessons}</p>
              </div>
              <div className="rounded-xl border border-border/40 bg-card p-5">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Lessons</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{summary.totalLessons}</p>
              </div>
              <div className="rounded-xl border border-border/40 bg-card p-5">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Overall Progress</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{summary.overallPercentage}%</p>
              </div>
            </div>

            <div className="rounded-xl border border-border/40 bg-card p-5">
              <h2 className="text-lg font-semibold text-foreground">Course Wise Progress</h2>
              <div className="mt-4 space-y-4">
                {courseProgress.map((course) => (
                  <div key={course.id} className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-foreground">{course.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {course.completedLessons}/{course.totalLessons} ({course.percentage}%)
                      </p>
                    </div>
                    <ProgressBar value={course.percentage} className="h-2" />
                  </div>
                ))}
                {courseProgress.length === 0 && (
                  <p className="text-sm text-muted-foreground">No courses found.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Progress;
