import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, PencilLine, Plus } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
}

interface CourseRow {
  id: string | number;
  title: string | null;
  description: string | null;
  thumbnail: string | null;
}

interface LessonCountRow {
  id: string | number;
  course_id: string | number;
}

const AdminCourses = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessonCountByCourse, setLessonCountByCourse] = useState<Record<string, number>>({});
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseDescription, setNewCourseDescription] = useState("");

  const loadCourses = useCallback(async () => {
    const [coursesResult, lessonsResult] = await Promise.all([
      supabase.from("courses").select("id, title, description, thumbnail").order("created_at", { ascending: false }),
      supabase.from("lessons").select("id, course_id"),
    ]);

    if (coursesResult.error) throw coursesResult.error;
    if (lessonsResult.error) throw lessonsResult.error;

    const nextCourses = ((coursesResult.data || []) as CourseRow[]).map((item) => ({
      id: String(item.id),
      title: item.title || "",
      description: item.description || "",
      thumbnail: item.thumbnail || "",
    }));

    const nextLessonCountByCourse: Record<string, number> = {};
    ((lessonsResult.data || []) as LessonCountRow[]).forEach((lesson) => {
      const courseId = String(lesson.course_id);
      nextLessonCountByCourse[courseId] = (nextLessonCountByCourse[courseId] || 0) + 1;
    });

    setCourses(nextCourses);
    setLessonCountByCourse(nextLessonCountByCourse);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setNotice(null);
      try {
        await loadCourses();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load courses";
        setNotice({ type: "error", text: message });
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [loadCourses]);

  const totalLessons = useMemo(
    () => Object.values(lessonCountByCourse).reduce((sum, count) => sum + count, 0),
    [lessonCountByCourse]
  );

  const createCourse = async () => {
    if (!newCourseTitle.trim()) return;

    const { error } = await supabase.from("courses").insert({
      title: newCourseTitle.trim(),
      description: newCourseDescription.trim(),
      thumbnail: "",
    });

    if (error) {
      setNotice({ type: "error", text: error.message });
      return;
    }

    setNewCourseTitle("");
    setNewCourseDescription("");
    setNotice({ type: "success", text: "Course created" });
    await loadCourses();
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0F172A] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Courses</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-white/70">
                Create courses here, then manage each course on its own dedicated page.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:w-auto">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center dark:border-white/10 dark:bg-[#111827]">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-white/45">Courses</p>
                <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">{courses.length}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center dark:border-white/10 dark:bg-[#111827]">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-white/45">Lessons</p>
                <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">{totalLessons}</p>
              </div>
            </div>
          </div>
        </div>

        {notice && (
          <div
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              notice.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {notice.text}
          </div>
        )}

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0F172A] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Create Course</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                value={newCourseTitle}
                onChange={(e) => setNewCourseTitle(e.target.value)}
                placeholder="Course title"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-white/10 dark:bg-[#111827] dark:text-white placeholder:dark:text-white/40"
              />
              <input
                value={newCourseDescription}
                onChange={(e) => setNewCourseDescription(e.target.value)}
                placeholder="Course description"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-white/10 dark:bg-[#111827] dark:text-white placeholder:dark:text-white/40"
              />
            </div>
            <button
              onClick={() => void createCourse()}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white sm:w-auto"
            >
              <Plus size={14} />
              <span>Create Course</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0F172A] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] sm:p-6">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Manage Existing Courses</h2>
                <p className="text-sm text-slate-600 dark:text-white/70">
                  Open a course to edit details, lessons, thumbnails, and resources.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600 dark:border-white/10 dark:bg-[#111827] dark:text-white/70">
                Loading courses...
              </div>
            ) : courses.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-600 dark:border-white/10 dark:text-white/65">
                No courses created yet.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {courses.map((course) => {
                  const lessonCount = lessonCountByCourse[course.id] || 0;
                  return (
                    <div
                      key={course.id}
                      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:border-slate-300 hover:shadow-[0_14px_28px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#0F172A] dark:hover:border-white/15"
                    >
                      <div className="aspect-[16/9] w-full overflow-hidden border-b border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-[#111827]">
                        {course.thumbnail ? (
                          <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-slate-400 dark:text-white/25">
                            <BookOpen size={28} />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col bg-white p-4 dark:bg-[#0F172A]">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-base font-semibold text-slate-900 dark:text-white">{course.title}</h3>
                            <p className="mt-1 line-clamp-3 text-sm text-slate-600 dark:text-white/65">
                              {course.description || "No description added yet."}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full border border-[#5627FF]/14 bg-[#5627FF]/6 px-2.5 py-1 text-[11px] font-medium text-[#5627FF] dark:border-[#5627FF]/18 dark:bg-[#5627FF]/8 dark:text-[#8AA8FF]">
                            {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}
                          </span>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-white/45">Manage Course</span>
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/courses/${course.id}`)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#5627FF]/20 bg-[#5627FF]/10 px-3 py-1.5 text-xs font-medium text-white transition hover:border-[#5627FF]/30 hover:bg-[#5627FF] dark:border-[#5627FF]/25 dark:bg-[#5627FF]/90 dark:hover:bg-[#441FD1]"
                          >
                            <PencilLine size={13} />
                            <span>Edit</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminCourses;


