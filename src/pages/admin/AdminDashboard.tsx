import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Activity, BarChart3, CheckCircle2, Users } from "lucide-react";

interface ProfileRow {
  id: string | number;
  name: string | null;
  email: string | null;
}

interface LessonRow {
  id: string | number;
  course_id: string | number;
}

interface CourseRow {
  id: string | number;
  title: string | null;
}

interface ProgressRow {
  user_id: string | number;
  lesson_id: string | number;
  completed: boolean | null;
  created_at?: string | null;
}

interface ActivityDay {
  key: string;
  count: number;
  date: Date;
  monthLabel: string;
  dayIndex: number;
}

interface UserActivity {
  id: string;
  name: string;
  email: string;
  completedLessons: number;
  progressPercentage: number;
}

interface CoursePerformance {
  id: string;
  title: string;
  completedLessons: number;
  totalLessons: number;
  completionRate: number;
}

const mondayFirstDayIndex = (date: Date) => (date.getDay() + 6) % 7;

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activityNotice, setActivityNotice] = useState("");
  const [platformStats, setPlatformStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    lessonsCompleted: 0,
    averageProgress: 0,
  });
  const [activityDays, setActivityDays] = useState<ActivityDay[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [topLearners, setTopLearners] = useState<UserActivity[]>([]);
  const [coursePerformance, setCoursePerformance] = useState<CoursePerformance[]>([]);

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      setError("");
      setActivityNotice("");

      const [profilesResult, lessonsResult, coursesResult, progressResult] = await Promise.all([
        supabase.from("profiles").select("id, name, email").order("name", { ascending: true }),
        supabase.from("lessons").select("id, course_id"),
        supabase.from("courses").select("id, title").order("title", { ascending: true }),
        supabase.from("progress").select("user_id, lesson_id, completed, created_at"),
      ]);

      const results = [profilesResult, lessonsResult, coursesResult, progressResult];
      const firstError = results.find((result) => result.error)?.error;

      if (firstError) {
        if (/created_at/i.test(firstError.message)) {
          setActivityNotice("Global heatmap needs progress.created_at in Supabase. Other analytics are still shown.");

          const fallbackProgressResult = await supabase
            .from("progress")
            .select("user_id, lesson_id, completed");

          if (fallbackProgressResult.error) {
            setError(fallbackProgressResult.error.message);
            setLoading(false);
            return;
          }

          const profiles = (profilesResult.data || []) as ProfileRow[];
          const lessons = (lessonsResult.data || []) as LessonRow[];
          const courses = (coursesResult.data || []) as CourseRow[];
          const progress = (fallbackProgressResult.data || []) as ProgressRow[];

          applyAnalytics(profiles, lessons, courses, progress, false);
          setLoading(false);
          return;
        }

        setError(firstError.message);
        setLoading(false);
        return;
      }

      const profiles = (profilesResult.data || []) as ProfileRow[];
      const lessons = (lessonsResult.data || []) as LessonRow[];
      const courses = (coursesResult.data || []) as CourseRow[];
      const progress = (progressResult.data || []) as ProgressRow[];

      applyAnalytics(profiles, lessons, courses, progress, true);
      setLoading(false);
    };

    const applyAnalytics = (
      profiles: ProfileRow[],
      lessons: LessonRow[],
      courses: CourseRow[],
      progress: ProgressRow[],
      canBuildHeatmap: boolean
    ) => {
      const totalUsers = profiles.length;
      const totalLessons = lessons.length;
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setHours(0, 0, 0, 0);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

      const completedProgress = progress.filter((item) => Boolean(item.completed));
      const lessonsCompleted = completedProgress.length;
      const userCompletedLessons = new Map<string, Set<string>>();

      completedProgress.forEach((item) => {
        const userKey = String(item.user_id);
        const current = userCompletedLessons.get(userKey) || new Set<string>();
        current.add(String(item.lesson_id));
        userCompletedLessons.set(userKey, current);
      });

      const activeUsers = canBuildHeatmap
        ? new Set(
            completedProgress
              .filter((item) => item.created_at && new Date(item.created_at) >= sevenDaysAgo)
              .map((item) => String(item.user_id))
          ).size
        : 0;

      const mappedUserActivity: UserActivity[] = profiles.map((profile) => {
        const completedLessonsForUser = userCompletedLessons.get(String(profile.id))?.size || 0;
        const progressPercentage = totalLessons > 0 ? Math.round((completedLessonsForUser / totalLessons) * 100) : 0;

        return {
          id: String(profile.id),
          name: profile.name || "Unnamed",
          email: profile.email || "",
          completedLessons: completedLessonsForUser,
          progressPercentage,
        };
      });

      const averageProgress =
        mappedUserActivity.length > 0
          ? Math.round(
              mappedUserActivity.reduce((sum, item) => sum + item.progressPercentage, 0) / mappedUserActivity.length
            )
          : 0;

      const lessonsByCourse = new Map<string, LessonRow[]>();
      lessons.forEach((lesson) => {
        const key = String(lesson.course_id);
        const current = lessonsByCourse.get(key) || [];
        current.push(lesson);
        lessonsByCourse.set(key, current);
      });

      const coursePerformanceData: CoursePerformance[] = courses.map((course) => {
        const courseLessons = lessonsByCourse.get(String(course.id)) || [];
        const lessonIds = new Set(courseLessons.map((lesson) => String(lesson.id)));
        const completedForCourse = completedProgress.filter((item) => lessonIds.has(String(item.lesson_id))).length;
        const possibleCompletions = totalUsers * courseLessons.length;
        const completionRate =
          possibleCompletions > 0 ? Math.round((completedForCourse / possibleCompletions) * 100) : 0;

        return {
          id: String(course.id),
          title: course.title || "Untitled course",
          completedLessons: completedForCourse,
          totalLessons: courseLessons.length,
          completionRate,
        };
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 363);
      const activityCountByDay = new Map<string, number>();

      if (canBuildHeatmap) {
        completedProgress.forEach((item) => {
          if (!item.created_at) return;

          const completedDate = new Date(item.created_at);
          completedDate.setHours(0, 0, 0, 0);
          if (completedDate < startDate || completedDate > today) return;

          const key = completedDate.toISOString().slice(0, 10);
          activityCountByDay.set(key, (activityCountByDay.get(key) || 0) + 1);
        });
      }

      const nextActivityDays: ActivityDay[] = [];
      for (let index = 0; index < 364; index += 1) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + index);
        const key = date.toISOString().slice(0, 10);
        nextActivityDays.push({
          key,
          count: activityCountByDay.get(key) || 0,
          date,
          monthLabel: date.toLocaleString("en-US", { month: "short" }),
          dayIndex: mondayFirstDayIndex(date),
        });
      }

      setPlatformStats({
        totalUsers,
        activeUsers,
        lessonsCompleted,
        averageProgress,
      });
      setUserActivity(mappedUserActivity);
      setTopLearners(
        [...mappedUserActivity]
          .sort((a, b) => b.progressPercentage - a.progressPercentage || b.completedLessons - a.completedLessons)
          .slice(0, 5)
      );
      setCoursePerformance(
        coursePerformanceData.sort((a, b) => b.completionRate - a.completionRate || b.completedLessons - a.completedLessons)
      );
      setActivityDays(nextActivityDays);
    };

    void loadAnalytics();
  }, []);

  const activityColumns = useMemo(() => {
    const columns: ActivityDay[][] = [];
    for (let index = 0; index < activityDays.length; index += 7) {
      columns.push(activityDays.slice(index, index + 7));
    }
    return columns;
  }, [activityDays]);

  const monthMarkers = useMemo(
    () =>
      activityColumns.map((column, index) => {
        const firstDay = column[0];
        const previousDay = index > 0 ? activityColumns[index - 1][0] : null;
        if (!firstDay) return "";
        if (!previousDay || firstDay.date.getMonth() !== previousDay.date.getMonth()) {
          return firstDay.monthLabel;
        }
        return "";
      }),
    [activityColumns]
  );

  const getActivityTone = (count: number) => {
    if (count >= 6) return "bg-emerald-500";
    if (count >= 4) return "bg-emerald-400";
    if (count >= 2) return "bg-emerald-300";
    if (count === 1) return "bg-emerald-200 dark:bg-emerald-600";
    return "bg-slate-200 dark:bg-white/[0.08]";
  };

  const statCards = [
    { label: "Total Users", value: platformStats.totalUsers, icon: Users },
    { label: "Active Users (7d)", value: platformStats.activeUsers, icon: Activity },
    { label: "Lessons Completed", value: platformStats.lessonsCompleted, icon: CheckCircle2 },
    { label: "Average Progress", value: `${platformStats.averageProgress}%`, icon: BarChart3 },
  ];

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl p-6 lg:p-10">
        <div className="mb-8 rounded-2xl border border-slate-200/90 bg-white p-7 shadow-sm dark:border-white/10 dark:bg-[#0F172A] dark:shadow-[0_10px_30px_rgba(0,0,0,0.28)]">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Admin Dashboard</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-white/68">
            Platform analytics, learning activity, and course performance.
          </p>
        </div>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-sm dark:border-white/10 dark:bg-[#0F172A] dark:text-white/70 dark:shadow-[0_10px_30px_rgba(0,0,0,0.28)]">
            Loading analytics...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-8">
            {activityNotice && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                {activityNotice}
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {statCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0F172A] dark:shadow-[0_10px_30px_rgba(0,0,0,0.28)]"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-600 dark:text-white/68">{card.label}</p>
                    <div className="rounded-xl bg-[rgba(113,74,214,0.14)] p-2.5 text-[#714AD6]">
                      <card.icon size={17} />
                    </div>
                  </div>
                  <p className="mt-6 text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">{card.value}</p>
                </div>
              ))}
            </div>

            <section className="rounded-2xl border border-slate-200/90 bg-white p-7 shadow-sm dark:border-white/10 dark:bg-[#0F172A] dark:shadow-[0_10px_30px_rgba(0,0,0,0.28)]">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Global Activity</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-white/68">
                    Lesson completion activity across the last 12 months.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-white/60">
                  <span>Less</span>
                  <span className="h-3 w-3 rounded-[4px] bg-slate-200 dark:bg-white/[0.08]" />
                  <span className="h-3 w-3 rounded-[4px] bg-emerald-200 dark:bg-emerald-600" />
                  <span className="h-3 w-3 rounded-[4px] bg-emerald-300" />
                  <span className="h-3 w-3 rounded-[4px] bg-emerald-400" />
                  <span className="h-3 w-3 rounded-[4px] bg-emerald-500" />
                  <span>More</span>
                </div>
              </div>

              <div className="overflow-hidden">
                <div className="w-full">
                  <div className="mb-4 ml-12 grid grid-flow-col gap-1 text-sm font-medium text-slate-500 dark:text-white/60">
                    {monthMarkers.map((label, index) => (
                      <div key={`${label || "blank"}-${index}`} className="w-4">
                        {label}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <div className="mt-1 grid grid-rows-7 gap-1 text-sm font-medium text-slate-500 dark:text-white/60">
                      {["Mon", "", "Wed", "", "Fri", "", "Sun"].map((label, index) => (
                        <div key={`${label}-${index}`} className="flex h-4 items-center">
                          {label}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-flow-col gap-1">
                      {activityColumns.map((column, columnIndex) => (
                        <div key={`column-${columnIndex}`} className="grid grid-rows-7 gap-1">
                          {Array.from({ length: 7 }, (_, rowIndex) => {
                            const day = column.find((item) => item.dayIndex === rowIndex);

                            return day ? (
                              <div
                                key={day.key}
                                title={`${day.date.toLocaleDateString()} - ${day.count} completions`}
                                className={`h-4 w-4 rounded-[4px] ${getActivityTone(day.count)}`}
                              />
                            ) : (
                              <div key={`empty-${columnIndex}-${rowIndex}`} className="h-4 w-4 rounded-[4px] bg-transparent" />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
              <section className="rounded-2xl border border-slate-200/90 bg-white p-7 shadow-sm dark:border-white/10 dark:bg-[#0F172A] dark:shadow-[0_10px_30px_rgba(0,0,0,0.28)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">User Activity</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-white/68">
                      Completion and progress for each user.
                    </p>
                  </div>
                </div>

                <div className="mt-5 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-white/10 dark:text-white/60">
                        <th className="pb-3 font-medium">Name</th>
                        <th className="pb-3 font-medium">Email</th>
                        <th className="pb-3 font-medium">Lessons Completed</th>
                        <th className="pb-3 font-medium">Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userActivity.map((user) => (
                        <tr key={user.id} className="border-b border-slate-100 dark:border-white/5">
                          <td className="py-3 text-slate-950 dark:text-white">{user.name}</td>
                          <td className="py-3 text-slate-600 dark:text-white/70">{user.email}</td>
                          <td className="py-3 text-slate-950 dark:text-white">{user.completedLessons}</td>
                          <td className="py-3 text-slate-950 dark:text-white">{user.progressPercentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {userActivity.length === 0 && (
                    <p className="pt-4 text-sm text-slate-500 dark:text-white/60">No user analytics available yet.</p>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200/90 bg-white p-7 shadow-sm dark:border-white/10 dark:bg-[#0F172A] dark:shadow-[0_10px_30px_rgba(0,0,0,0.28)]">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Top Learners</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-white/68">
                  Highest progress users across the platform.
                </p>
                <div className="mt-5 space-y-4">
                  {topLearners.map((learner, index) => (
                    <div key={learner.id} className="rounded-xl border border-slate-200/90 p-4 dark:border-white/10">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-950 dark:text-white">
                            #{index + 1} {learner.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-white/60">{learner.email}</p>
                        </div>
                        <p className="text-sm font-semibold text-[#714AD6]">{learner.progressPercentage}%</p>
                      </div>
                      <div className="mt-3">
                        <ProgressBar value={learner.progressPercentage} className="h-2" />
                      </div>
                      <p className="mt-2 text-xs text-slate-500 dark:text-white/60">
                        {learner.completedLessons} lessons completed
                      </p>
                    </div>
                  ))}
                  {topLearners.length === 0 && (
                    <p className="text-sm text-slate-500 dark:text-white/60">No learner data available yet.</p>
                  )}
                </div>
              </section>
            </div>

            <section className="rounded-2xl border border-slate-200/90 bg-white p-7 shadow-sm dark:border-white/10 dark:bg-[#0F172A] dark:shadow-[0_10px_30px_rgba(0,0,0,0.28)]">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Course Performance Overview</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-white/68">
                Completion performance of each course across all users.
              </p>
              <div className="mt-5 space-y-4">
                {coursePerformance.map((course) => (
                  <div key={course.id} className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-950 dark:text-white">{course.title}</p>
                        <p className="text-xs text-slate-500 dark:text-white/60">
                          {course.completedLessons} completions across {course.totalLessons} lessons
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-slate-950 dark:text-white">{course.completionRate}%</p>
                    </div>
                    <ProgressBar value={course.completionRate} className="h-2" />
                  </div>
                ))}
                {coursePerformance.length === 0 && (
                  <p className="text-sm text-slate-500 dark:text-white/60">No course performance data available yet.</p>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
