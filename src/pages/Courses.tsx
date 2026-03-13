import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { CourseCard } from "@/components/CourseCard";
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
  course_id: string | number;
  team_id: string | number;
}

interface ProfileRoleRow {
  role: string | null;
}

const Courses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCourses = async () => {
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

      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select("id, title, description, thumbnail")
        .order("created_at", { ascending: false });

      if (coursesError) {
        setError(coursesError.message);
        setLoading(false);
        return;
      }
      const courseRows = (coursesData || []) as CourseRow[];

      const courseTeamsMap = new Map<string, Set<string>>();
      const userTeamIds = new Set<string>();

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
          .select("course_id, team_id");

        if (teamCourseError) {
          setError(teamCourseError.message);
          setLoading(false);
          return;
        }

        ((teamMemberData || []) as TeamMemberRow[]).forEach((item) => {
          userTeamIds.add(String(item.team_id));
        });
        ((teamCourseData || []) as TeamCourseRow[]).forEach((item) => {
          const courseId = String(item.course_id);
          const teamId = String(item.team_id);
          const current = courseTeamsMap.get(courseId) || new Set<string>();
          current.add(teamId);
          courseTeamsMap.set(courseId, current);
        });
      }

      const { data: lessonsData, error: lessonsError } = await supabase
        .from("lessons")
        .select("id, course_id, title, video_url, order_index, is_locked")
        .order("order_index", { ascending: true });

      if (lessonsError) {
        setError(lessonsError.message);
        setLoading(false);
        return;
      }

      const progressResult = await supabase
        .from("progress")
        .select("lesson_id, completed")
        .eq("user_id", user.id);
      const progressRows = (progressResult.data || []) as ProgressRow[];
      const progressError = progressResult.error;

      if (progressError) {
        setError(progressError.message);
        setLoading(false);
        return;
      }

      const completedLessonIds = new Set(
        progressRows.filter((row) => Boolean(row.completed)).map((row) => String(row.lesson_id))
      );

      const lessonsByCourse = new Map<string, LessonRow[]>();
      ((lessonsData || []) as LessonRow[]).forEach((lesson) => {
        const key = String(lesson.course_id);
        const list = lessonsByCourse.get(key) || [];
        list.push(lesson);
        lessonsByCourse.set(key, list);
      });

      const mappedCourses: Course[] = courseRows.map((course) => {
        const assignedTeams = courseTeamsMap.get(String(course.id));
        const hasTeamAccess = isAdminOrOwner
          ? true
          : assignedTeams && assignedTeams.size > 0
            ? Array.from(assignedTeams).some((teamId) => userTeamIds.has(teamId))
            : false;
        const mappedLessons: Lesson[] = (lessonsByCourse.get(String(course.id)) || []).map((lesson) => ({
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

        return {
          id: String(course.id),
          title: course.title || "Untitled course",
          description: course.description || "",
          thumbnail: course.thumbnail || "",
          is_locked: false,
          access_locked: !hasTeamAccess,
          lessons: mappedLessons,
          progress: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
        };
      });

      setCourses(mappedCourses);
      setLoading(false);
    };

    void loadCourses();
  }, []);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl p-6 lg:p-10">
        <h1 className="text-2xl font-semibold text-foreground">Courses</h1>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {loading && <p className="text-sm text-muted-foreground">Loading courses...</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!loading && !error && courses.length === 0 && (
            <p className="text-sm text-muted-foreground">No courses available yet.</p>
          )}
          {courses.map((course, index) => (
            <CourseCard key={course.id} course={course} index={index} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Courses;
