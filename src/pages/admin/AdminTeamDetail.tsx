import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";

interface TeamRow {
  id: string | number;
  name: string | null;
}

interface TeamMemberRow {
  id: string | number;
  user_id: string | number;
}

interface ProfileRow {
  id: string | number;
  name: string | null;
  email: string | null;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
}

const AdminTeamDetail = () => {
  const navigate = useNavigate();
  const { teamId } = useParams();
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [teamName, setTeamName] = useState("");
  const [members, setMembers] = useState<TeamMember[]>([]);

  const loadTeam = useCallback(async () => {
    if (!teamId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setNotice(null);

    const { data: teamData, error: teamError } = await supabase
      .from("teams")
      .select("id, name")
      .eq("id", teamId)
      .maybeSingle();

    if (teamError) {
      setNotice({ type: "error", text: teamError.message });
      setLoading(false);
      return;
    }

    if (!teamData) {
      setNotice({ type: "error", text: "Team not found." });
      setLoading(false);
      return;
    }

    setTeamName(((teamData as TeamRow).name || "Untitled team").toString());

    const { data: teamMemberData, error: teamMemberError } = await supabase
      .from("team_members")
      .select("id, user_id")
      .eq("team_id", teamId);

    if (teamMemberError) {
      setNotice({ type: "error", text: teamMemberError.message });
      setLoading(false);
      return;
    }

    const teamMembers = (teamMemberData || []) as TeamMemberRow[];
    const userIds = teamMembers.map((item) => String(item.user_id));

    if (userIds.length === 0) {
      setMembers([]);
      setLoading(false);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, name, email")
      .in("id", userIds);

    if (profileError) {
      setNotice({ type: "error", text: profileError.message });
      setLoading(false);
      return;
    }

    const profileMap = new Map<string, ProfileRow>();
    ((profileData || []) as ProfileRow[]).forEach((profile) => {
      profileMap.set(String(profile.id), profile);
    });

    setMembers(
      teamMembers.map((member) => {
        const profile = profileMap.get(String(member.user_id));
        return {
          id: String(member.user_id),
          name: profile?.name || "Unnamed",
          email: profile?.email || "",
        };
      })
    );
    setLoading(false);
  }, [teamId]);

  useEffect(() => {
    void loadTeam();
  }, [loadTeam]);

  const removeMember = async (userId: string) => {
    if (!teamId) return;

    const { error } = await supabase.from("team_members").delete().eq("team_id", teamId).eq("user_id", userId);
    if (error) {
      setNotice({ type: "error", text: error.message });
      return;
    }

    setNotice({ type: "success", text: "Member removed from team." });
    await loadTeam();
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl p-6 lg:p-8">
        <button
          onClick={() => navigate("/admin/teams")}
          className="mb-4 flex items-center gap-1 text-sm text-gray-400 hover:text-white hover:underline"
        >
          <ArrowLeft size={14} />
          <span>Back to Teams</span>
        </button>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0F172A] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{teamName || "Team Details"}</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-white/70">
            Review members in this team and remove them when needed.
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

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0F172A] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Team Members</h2>

          {loading ? (
            <p className="mt-4 text-sm text-slate-600 dark:text-white/70">Loading team members...</p>
          ) : (
            <div className="mt-4 space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-[#111827]"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{member.name}</p>
                    <p className="text-xs text-slate-500 dark:text-white/60">{member.email}</p>
                  </div>
                  <button
                    onClick={() => void removeMember(member.id)}
                    className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white"
                  >
                    Remove
                  </button>
                </div>
              ))}

              {members.length === 0 && (
                <p className="text-sm text-slate-600 dark:text-white/70">No members are assigned to this team.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminTeamDetail;
