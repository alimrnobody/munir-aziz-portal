import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

interface CourseControlRow {
  id: string | number;
  title: string | null;
}

interface CourseControl {
  id: string;
  title: string;
}

interface TeamRow {
  id: string | number;
  name: string | null;
}

interface Team {
  id: string;
  name: string;
}

interface TeamCourseRow {
  course_id: string | number;
  team_id: string | number;
}

const AdminCourseControl = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [courses, setCourses] = useState<CourseControl[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamsByCourse, setSelectedTeamsByCourse] = useState<Record<string, string[]>>({});
  const [savingAccessCourseId, setSavingAccessCourseId] = useState<string | null>(null);

  useEffect(() => {
    const loadCourseControls = async () => {
      setLoading(true);
      setNotice(null);

      const teamsResult = await supabase.from("teams").select("id, name").order("name", { ascending: true });
      if (teamsResult.error) {
        setNotice({ type: "error", text: teamsResult.error.message });
        setLoading(false);
        return;
      }

      const loadedTeams = ((teamsResult.data || []) as TeamRow[]).map((team) => ({
        id: String(team.id),
        name: team.name || "Untitled team",
      }));
      setTeams(loadedTeams);

      const result = await supabase.from("courses").select("id, title").order("title", { ascending: true });

      if (result.error) {
        setNotice({ type: "error", text: result.error.message });
        setLoading(false);
        return;
      }

      setCourses(
        ((result.data || []) as CourseControlRow[]).map((course) => ({
          id: String(course.id),
          title: course.title || "Untitled course",
        }))
      );

      const teamCoursesResult = await supabase.from("team_courses").select("course_id, team_id");
      if (teamCoursesResult.error) {
        setNotice({ type: "error", text: teamCoursesResult.error.message });
        setLoading(false);
        return;
      }

      const nextSelectedTeamsByCourse: Record<string, string[]> = {};
      ((teamCoursesResult.data || []) as TeamCourseRow[]).forEach((assignment) => {
        const courseId = String(assignment.course_id);
        if (!nextSelectedTeamsByCourse[courseId]) nextSelectedTeamsByCourse[courseId] = [];
        nextSelectedTeamsByCourse[courseId].push(String(assignment.team_id));
      });
      setSelectedTeamsByCourse(nextSelectedTeamsByCourse);
      setLoading(false);
    };

    void loadCourseControls();
  }, []);

  const toggleSelectedTeam = (courseId: string, teamId: string) => {
    setSelectedTeamsByCourse((prev) => {
      const current = prev[courseId] || [];
      const next = current.includes(teamId)
        ? current.filter((id) => id !== teamId)
        : [...current, teamId];

      return {
        ...prev,
        [courseId]: next,
      };
    });
  };

  const saveCourseAccess = async (courseId: string) => {
    setSavingAccessCourseId(courseId);
    setNotice(null);

    const { error: deleteError } = await supabase.from("team_courses").delete().eq("course_id", courseId);
    if (deleteError) {
      setNotice({ type: "error", text: deleteError.message });
      setSavingAccessCourseId(null);
      return;
    }

    const selectedTeams = selectedTeamsByCourse[courseId] || [];
    if (selectedTeams.length > 0) {
      const { error: insertError } = await supabase.from("team_courses").insert(
        selectedTeams.map((teamId) => ({
          course_id: courseId,
          team_id: teamId,
        }))
      );

      if (insertError) {
        setNotice({ type: "error", text: insertError.message });
        setSavingAccessCourseId(null);
        return;
      }
    }

    setNotice({
      type: "success",
      text:
        selectedTeams.length > 0
          ? "Course access updated for selected teams."
          : "No teams selected. This course will remain locked for all users.",
    });
    setSavingAccessCourseId(null);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl p-6 lg:p-8">
        <button
          onClick={() => navigate("/admin/settings")}
          className="mb-4 flex items-center gap-1 text-sm text-gray-400 hover:text-white hover:underline"
        >
          <span>←</span>
          <span>Back to Settings</span>
        </button>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0F172A] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Course Control</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-white/70">
            Grant course access to teams from one place.
          </p>
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

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-[#0F172A] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
          {loading ? (
            <p className="text-sm text-slate-600 dark:text-white/70">Loading course controls...</p>
          ) : (
            <div className="space-y-3">
              {courses.map((course) => {
                return (
                  <div
                    key={course.id}
                    className="rounded-xl border border-slate-200 p-4 dark:border-white/10 dark:bg-[#111827]"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{course.title}</p>
                    </div>

                    <div className="mt-4 rounded-lg border border-slate-200 p-4 dark:border-white/10">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">Grant Access to Teams</p>
                          <p className="text-xs text-slate-500 dark:text-white/60">
                            Users in selected teams will see this course as unlocked.
                          </p>
                        </div>
                        <button
                          onClick={() => void saveCourseAccess(course.id)}
                          disabled={savingAccessCourseId === course.id}
                          className="rounded-lg border border-slate-300 px-3 py-1 text-sm text-slate-700 dark:border-white/10 dark:bg-[#0F172A] dark:text-white/80"
                        >
                          {savingAccessCourseId === course.id ? "Saving..." : "Save Access"}
                        </button>
                      </div>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {teams.map((team) => (
                          <label
                            key={`${course.id}-${team.id}`}
                            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 dark:border-white/10 dark:bg-[#0F172A] dark:text-white/80"
                          >
                            <input
                              type="checkbox"
                              checked={(selectedTeamsByCourse[course.id] || []).includes(team.id)}
                              onChange={() => toggleSelectedTeam(course.id, team.id)}
                            />
                            <span>{team.name}</span>
                          </label>
                        ))}
                        {teams.length === 0 && (
                          <p className="text-sm text-slate-600 dark:text-white/70">No teams available yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {courses.length === 0 && (
                <p className="text-sm text-slate-600 dark:text-white/70">No courses available yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminCourseControl;
