import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";

interface TeamRow {
  id: string | number;
  name: string | null;
  created_at: string | null;
}

interface Team {
  id: string;
  name: string;
  created_at: string;
}

const AdminTeams = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [newTeamName, setNewTeamName] = useState("");

  const loadTeams = useCallback(async () => {
    setLoading(true);
    setNotice(null);

    const { data, error } = await supabase.from("teams").select("id, name, created_at").order("created_at", {
      ascending: false,
    });

    if (error) {
      setNotice({ type: "error", text: error.message });
      setLoading(false);
      return;
    }

    setTeams(
      ((data || []) as TeamRow[]).map((team) => ({
        id: String(team.id),
        name: team.name || "Untitled team",
        created_at: team.created_at || "",
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadTeams();
  }, [loadTeams]);

  const createTeam = async () => {
    if (!newTeamName.trim()) return;

    const { error } = await supabase.from("teams").insert({ name: newTeamName.trim() });
    if (error) {
      setNotice({ type: "error", text: error.message });
      return;
    }

    setNewTeamName("");
    setNotice({ type: "success", text: "Team created successfully." });
    await loadTeams();
  };

  const deleteTeam = async (teamId: string) => {
    const { error } = await supabase.from("teams").delete().eq("id", teamId);
    if (error) {
      setNotice({ type: "error", text: error.message });
      return;
    }

    setNotice({ type: "success", text: "Team deleted successfully." });
    await loadTeams();
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
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Teams</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-white/70">
            Create and manage member groups across the portal.
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

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0F172A] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Create Team</h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Team name"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-white/10 dark:bg-[#111827] dark:text-white"
            />
            <button
              onClick={() => void createTeam()}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              Create Team
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0F172A] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Team List</h2>

          {loading ? (
            <p className="mt-4 text-sm text-slate-600 dark:text-white/70">Loading teams...</p>
          ) : (
            <div className="mt-4 space-y-3">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-[#111827]"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{team.name}</p>
                    <p className="text-xs text-slate-500 dark:text-white/60">
                      Created {team.created_at ? new Date(team.created_at).toLocaleDateString() : "recently"}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/admin/teams/${team.id}`)}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 dark:border-white/10 dark:bg-[#111827] dark:text-white/80"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => void deleteTeam(team.id)}
                      className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}

              {teams.length === 0 && (
                <p className="text-sm text-slate-600 dark:text-white/70">No teams created yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminTeams;
