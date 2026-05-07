import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { BookOpen, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface LessonRow {
  id: string | number;
  course_id: string | number;
}

interface ProgressRow {
  lesson_id: string | number;
  completed: boolean | null;
  completed_at: string | null;
  created_at: string | null;
}

interface ActivityDay {
  key: string;
  count: number;
  date: Date;
  monthLabel: string;
  dayIndex: number;
}

interface ProfileRoleRow {
  role: string | null;
}

interface TeamMemberRow {
  team_id: string | number;
}

interface TeamCourseRow {
  course_id: string | number;
}

const mondayFirstDayIndex = (date: Date) => (date.getDay() + 6) % 7;

const Dashboard = () => {
  const [totalLessons, setTotalLessons] = useState(0);
  const [completedLessons, setCompletedLessons] = useState(0);
  const [activityDays, setActivityDays] = useState<ActivityDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOverview = async () => {
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

      let accessibleCourseIds: string[] | null = null;

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
          setTotalLessons(0);
          setCompletedLessons(0);
          setActivityDays([]);
          setLoading(false);
          return;
        }

        const { data: teamCourseData, error: teamCourseError } = await supabase
          .from("team_courses")
          .select("course_id")
          .in("team_id", userTeamIds);

        if (teamCourseError) {
          setError(teamCourseError.message);
          setLoading(false);
          return;
        }

        accessibleCourseIds = Array.from(
          new Set(((teamCourseData || []) as TeamCourseRow[]).map((item) => String(item.course_id)))
        );

        if (accessibleCourseIds.length === 0) {
          setTotalLessons(0);
          setCompletedLessons(0);
          setActivityDays([]);
          setLoading(false);
          return;
        }
      }

      let lessonsQuery = supabase.from("lessons").select("id, course_id");
      if (accessibleCourseIds) {
        lessonsQuery = lessonsQuery.in("course_id", accessibleCourseIds);
      }

      const { data: lessonsData, error: lessonsError } = await lessonsQuery;

      if (lessonsError) {
        setError(lessonsError.message);
        setLoading(false);
        return;
      }

      let progressRows: ProgressRow[] = [];
      let hasActivityTimestamp = true;

      const { data: progressData, error: progressError } = await supabase
        .from("progress")
        .select("lesson_id, completed, completed_at, created_at")
        .eq("user_id", user.id);

      if (progressError) {
        if (/completed_at/i.test(progressError.message)) {
          const { data: fallbackProgressData, error: fallbackProgressError } = await supabase
            .from("progress")
            .select("lesson_id, completed, created_at")
            .eq("user_id", user.id);

          if (fallbackProgressError) {
            if (/created_at/i.test(fallbackProgressError.message)) {
              hasActivityTimestamp = false;
              const { data: finalFallbackData, error: finalFallbackError } = await supabase
                .from("progress")
                .select("lesson_id, completed")
                .eq("user_id", user.id);

              if (finalFallbackError) {
                setError(finalFallbackError.message);
                setLoading(false);
                return;
              }

              progressRows = (finalFallbackData || []) as ProgressRow[];
            } else {
              setError(fallbackProgressError.message);
              setLoading(false);
              return;
            }
          } else {
            progressRows = (fallbackProgressData || []) as ProgressRow[];
          }
        } else {
          setError(progressError.message);
          setLoading(false);
          return;
        }
      } else {
        progressRows = (progressData || []) as ProgressRow[];
      }

      const lessonRows = (lessonsData || []) as LessonRow[];
      const scopedLessonIds = new Set(lessonRows.map((lesson) => String(lesson.id)));
      const completedCount = new Set(
        progressRows
          .filter((item) => Boolean(item.completed) && scopedLessonIds.has(String(item.lesson_id)))
          .map((item) => String(item.lesson_id))
      ).size;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 363);

      const activityCountByDay = new Map<string, number>();
      if (hasActivityTimestamp) {
        progressRows
          .filter(
            (item) =>
              Boolean(item.completed) &&
              scopedLessonIds.has(String(item.lesson_id)) &&
              (item.completed_at || item.created_at)
          )
          .forEach((item) => {
            const timestamp = item.completed_at || item.created_at;
            const completedDate = new Date(timestamp as string);
            completedDate.setHours(0, 0, 0, 0);
            if (completedDate < startDate || completedDate > today) {
              return;
            }
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

      setTotalLessons(lessonRows.length);
      setCompletedLessons(completedCount);
      setActivityDays(nextActivityDays);
      if (!hasActivityTimestamp) {
        setError("Activity chart needs progress.completed_at or progress.created_at in Supabase. Stats are still working.");
      }

      setLoading(false);
    };

    void loadOverview();
  }, []);

  const remainingLessons = Math.max(totalLessons - completedLessons, 0);
  const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const statItems = useMemo(
    () => [
      {
        label: "Total Lessons",
        value: totalLessons,
        icon: BookOpen,
      },
      {
        label: "Completed",
        value: completedLessons,
        icon: CheckCircle,
      },
      {
        label: "Remaining",
        value: remainingLessons,
        icon: Clock,
      },
      {
        label: "Overall Progress",
        value: `${overallProgress}%`,
        icon: TrendingUp,
      },
    ],
    [completedLessons, overallProgress, remainingLessons, totalLessons]
  );

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
    if (count >= 4) return "bg-emerald-500";
    if (count === 3) return "bg-emerald-400";
    if (count === 2) return "bg-emerald-300";
    if (count === 1) return "bg-emerald-200 dark:bg-emerald-600";
    return "bg-slate-200 dark:bg-white/[0.08]";
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-10">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.5 }}
          className="mb-10 rounded-[20px] border border-border/60 bg-card p-4 shadow-sm sm:mb-12 sm:p-7"
        >
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Activity</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Your lesson completion streak across the last 12 months.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
              <span>Less</span>
              <span className="h-3 w-3 rounded-[4px] bg-slate-200 dark:bg-white/[0.08]" />
              <span className="h-3 w-3 rounded-[4px] bg-emerald-200 dark:bg-emerald-600" />
              <span className="h-3 w-3 rounded-[4px] bg-emerald-300" />
              <span className="h-3 w-3 rounded-[4px] bg-emerald-400" />
              <span className="h-3 w-3 rounded-[4px] bg-emerald-500" />
              <span>More</span>
            </div>
          </div>

          <div className="heatmap-scroll overflow-x-auto pb-2">
            <div className="min-w-[720px]">
              <div className="mb-4 ml-12 grid grid-flow-col gap-1 text-sm font-medium text-muted-foreground">
                {monthMarkers.map((label, index) => (
                  <div key={`${label || "blank"}-${index}`} className="w-4">
                    {label}
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <div className="mt-1 grid grid-rows-7 gap-1 text-sm font-medium text-muted-foreground">
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
                            title={`${day.date.toLocaleDateString()} - ${day.count} completed`}
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
        </motion.section>

        <div className="mb-10 grid grid-cols-1 gap-4 sm:mb-12 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {statItems.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.15 + i * 0.08, duration: 0.5 }}
            >
              <div className="cursor-default rounded-[14px] border border-slate-200/90 bg-white p-5 text-gray-900 shadow-sm transition-all duration-200 ease-in-out hover:border-[#5627FF] dark:border-white/10 dark:bg-[#0b1220] dark:text-white sm:p-6">
                <div className="mb-3 flex items-center justify-between">
                  <div className="rounded-[10px] bg-[rgba(86,39,255,0.15)] p-[10px] text-gray-700 dark:text-[#5627FF]">
                    <stat.icon size={18} />
                  </div>
                </div>
                <div className="mb-1 text-[28px] font-semibold tracking-tight text-gray-950 dark:text-white sm:text-[32px]">{stat.value}</div>
                <div className="text-xs uppercase tracking-[0.1em] text-gray-500 dark:text-white/50">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {loading && <p className="mt-6 text-sm text-muted-foreground">Loading dashboard overview...</p>}
        {error && <p className="mt-6 text-sm text-destructive">{error}</p>}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
