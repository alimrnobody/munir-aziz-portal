import { useCallback, useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/sonner";

interface Member {
  id: string;
  name: string;
  email: string;
  status: string;
  role: "owner" | "admin" | "user";
}

interface Team {
  id: string;
  name: string;
}

interface TeamRow {
  id: string | number;
  name: string | null;
}

interface TeamMemberRow {
  team_id: string | number;
  user_id: string | number;
}

interface MemberRow {
  id: string | number;
  name: string | null;
  email: string | null;
  status: string | null;
  role: "owner" | "admin" | "user" | null;
}

interface SupabaseLikeError {
  message?: string;
  details?: string;
  hint?: string;
}

const isOwnerMember = (member: Member) => member.role === "owner";
const canModifyRole = (currentUserRole: "owner" | "admin" | "user", member: Member, currentUserId: string) =>
  currentUserRole === "owner" && member.role !== "owner" && member.id !== currentUserId;
const canModifyMember = (currentUserRole: "owner" | "admin" | "user", member: Member) =>
  !(currentUserRole !== "owner" && member.role === "owner") && member.role !== "owner";

const getReadableError = (error: unknown): string => {
  if (!error) return "Unknown error";
  if (error instanceof Error) return error.message || "Unknown error";
  const typed = error as SupabaseLikeError;
  const parts = [typed.message, typed.details, typed.hint].filter(Boolean);
  return parts.length ? parts.join(" | ") : "Unknown error";
};

const AdminMembers = () => {
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberPassword, setNewMemberPassword] = useState("");
  const [teamByMember, setTeamByMember] = useState<Record<string, string>>({});
  const [teamsByMember, setTeamsByMember] = useState<Record<string, Team[]>>({});
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState<"owner" | "admin" | "user">("user");
  const [roleLoadingByMember, setRoleLoadingByMember] = useState<Record<string, boolean>>({});

  const showError = (text: string) => {
    setNotice({ type: "error", text });
    toast.error(text);
  };
  const showSuccess = (text: string) => {
    setNotice({ type: "success", text });
    toast.success(text);
  };
  const loadCurrentUserRole = useCallback(async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw userError || new Error("User not found");

    setCurrentUserId(userData.user.id);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (profileError) throw profileError;

    const role = profile?.role === "owner" || profile?.role === "admin" ? profile.role : "user";
    setCurrentUserRole(role);
  }, []);

  const loadTeams = useCallback(async () => {
    const { data, error } = await supabase.from("teams").select("id, name").order("name", { ascending: true });
    if (error) throw error;
    const loadedTeams = ((data || []) as TeamRow[]).map((item) => ({ id: String(item.id), name: item.name || "" }));
    setTeams(loadedTeams);
    return loadedTeams;
  }, []);

  const loadTeamMemberships = useCallback(async (availableTeams: Team[]) => {
    const { data, error } = await supabase.from("team_members").select("team_id, user_id");
    if (error) throw error;

    const teamMap = new Map(availableTeams.map((team) => [team.id, team]));
    const nextTeamsByMember: Record<string, Team[]> = {};

    ((data || []) as TeamMemberRow[]).forEach((item) => {
      const userId = String(item.user_id);
      const team = teamMap.get(String(item.team_id));
      if (!team) return;
      if (!nextTeamsByMember[userId]) nextTeamsByMember[userId] = [];
      nextTeamsByMember[userId].push(team);
    });

    setTeamsByMember(nextTeamsByMember);
  }, []);

  const loadMembers = useCallback(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, email, status, role")
      .order("name", { ascending: true });

    if (error) throw error;

    setMembers(
      ((data || []) as MemberRow[]).map((item) => ({
        id: String(item.id),
        name: item.name || "",
        email: item.email || "",
        status: item.status || "active",
        role: item.role === "owner" || item.role === "admin" ? item.role : "user",
      }))
    );
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setNotice(null);
    try {
      const loadedTeams = await loadTeams();
      await Promise.all([loadCurrentUserRole(), loadMembers(), loadTeamMemberships(loadedTeams)]);
    } catch (error: unknown) {
      showError(getReadableError(error) || "Unable to load members data");
    } finally {
      setLoading(false);
    }
  }, [loadCurrentUserRole, loadMembers, loadTeamMemberships, loadTeams]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const handleAddUser = async () => {
    if (!newMemberEmail.trim() || !newMemberPassword.trim()) {
      showError("Email and password are required");
      return;
    }
    const email = newMemberEmail.trim();
    const name = newMemberName.trim() || email.split("@")[0];
    const password = newMemberPassword;
    setAddUserLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) {
        const detailedMessage = getReadableError(error);
        if (/already|registered|exists/i.test(detailedMessage)) {
          showError("User already exists");
        } else {
          showError(detailedMessage);
        }
        return;
      }

      const userId = data.user?.id;
      if (!userId) {
        showError("User created but no user id returned");
        return;
      }

      const { error: roleError } = await supabase
        .from("profiles")
        .update({ role: "user" })
        .eq("id", userId);

      if (roleError) {
        showError(roleError.message || "User created but failed to set default role");
        return;
      }

      setNewMemberName("");
      setNewMemberEmail("");
      setNewMemberPassword("");
      showSuccess("User created successfully");
      await new Promise((resolve) => setTimeout(resolve, 700));
      await loadMembers();
    } catch (error: unknown) {
      showError(getReadableError(error));
    } finally {
      setAddUserLoading(false);
    }
  };

  const suspendMember = async (memberId: string) => {
    const member = members.find((item) => item.id === memberId);
    if (currentUserRole !== "owner" && member?.role === "owner") {
      return showError("Admin cannot modify owner");
    }
    const { error } = await supabase.from("profiles").update({ status: "suspended" }).eq("id", memberId);
    if (error) return showError(error.message);
    showSuccess("Member suspended");
    await loadMembers();
  };

  const deleteMember = async (memberId: string) => {
    const member = members.find((item) => item.id === memberId);
    if (currentUserRole !== "owner" && member?.role === "owner") {
      return showError("Admin cannot modify owner");
    }
    const { error } = await supabase.from("profiles").delete().eq("id", memberId);
    if (error) return showError(error.message);
    showSuccess("Member deleted");
    await loadMembers();
  };

  const assignTeam = async (memberId: string) => {
    const member = members.find((item) => item.id === memberId);
    if (currentUserRole !== "owner" && member?.role === "owner") {
      return showError("Admin cannot modify owner");
    }
    const teamId = teamByMember[memberId];
    if (!teamId) return;

    if ((teamsByMember[memberId] || []).some((team) => team.id === teamId)) {
      return showError("Member is already in this team");
    }

    const { error } = await supabase.from("team_members").insert({
      team_id: teamId,
      user_id: memberId,
    });
    if (error) return showError(error.message);
    setTeamByMember((prev) => ({ ...prev, [memberId]: "" }));
    showSuccess("Team assigned");
    await loadTeamMemberships(teams);
  };

  const updateMemberRole = async (memberId: string, nextRole: "admin" | "user") => {
    if (currentUserRole !== "owner") {
      showError("Only owner can change roles");
      return;
    }

    const member = members.find((item) => item.id === memberId);
    if (!member) return;

    if (member.id === currentUserId) {
      showError("Owner cannot change their own role");
      return;
    }

    if (member.role === "owner") {
      showError("Owner role cannot be modified");
      return;
    }

    setRoleLoadingByMember((prev) => ({ ...prev, [memberId]: true }));
    const { error } = await supabase.from("profiles").update({ role: nextRole }).eq("id", memberId);
    setRoleLoadingByMember((prev) => ({ ...prev, [memberId]: false }));

    if (error) {
      showError(error.message);
      return;
    }

    showSuccess("Role updated");
    await loadMembers();
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:bg-[#0F172A] dark:border-white/10 dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] sm:p-6">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Members</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-white/70">Manage users and assign them to teams.</p>
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-white/70">
            Signed in role: {currentUserRole}
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

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-600 dark:bg-[#0F172A] dark:border-white/10 dark:text-white/70 dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
            Loading members...
          </div>
        )}

        {!loading && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:bg-[#0F172A] dark:border-white/10 dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] sm:p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Add Member</h2>
              <form
                autoComplete="off"
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleAddUser();
                }}
                className="mt-4 grid gap-3 md:grid-cols-4"
              >
                <input
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Name"
                  autoComplete="off"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:bg-[#111827] dark:text-white dark:border-white/10 placeholder:dark:text-white/40"
                />
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="Email"
                  autoComplete="off"
                  required
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:bg-[#111827] dark:text-white dark:border-white/10 placeholder:dark:text-white/40"
                />
                <input
                  type="password"
                  value={newMemberPassword}
                  onChange={(e) => setNewMemberPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete="new-password"
                  required
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:bg-[#111827] dark:text-white dark:border-white/10 placeholder:dark:text-white/40"
                />
                <button
                  type="submit"
                  disabled={addUserLoading}
                  className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm text-white transition hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100 disabled:active:scale-100 md:w-auto"
                >
                  {addUserLoading ? "Adding..." : "Add User"}
                </button>
              </form>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:bg-[#0F172A] dark:border-white/10 dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] sm:p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Member List</h2>
              <div className="mt-4 space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="grid gap-2 rounded-lg border border-slate-200 p-3 md:grid-cols-[1fr_1.3fr_auto_1.2fr_auto_auto] dark:border-white/10 dark:bg-[#0F172A]"
                  >
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{member.name || "Unnamed"}</p>
                    <p className="break-all text-sm text-slate-600 dark:text-white/70">{member.email}</p>
                    {canModifyRole(currentUserRole, member, currentUserId) ? (
                      <select
                        value={member.role}
                        disabled={Boolean(roleLoadingByMember[member.id])}
                        onChange={(e) =>
                          void updateMemberRole(
                            member.id,
                            e.target.value as "admin" | "user"
                          )
                        }
                        className="rounded-lg border border-slate-300 px-2 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#111827] dark:text-white dark:border-white/10"
                      >
                        <option value="admin">Admin</option>
                        <option value="user">User</option>
                      </select>
                    ) : (
                      isOwnerMember(member) ? (
                        <p className="rounded-lg border border-slate-200 px-2 py-2 text-sm text-slate-600 dark:border-white/10 dark:bg-[#111827] dark:text-white/70">
                          owner
                        </p>
                      ) : (
                        <p className="rounded-lg border border-slate-200 px-2 py-2 text-sm text-slate-600 dark:border-white/10 dark:bg-[#111827] dark:text-white/70">
                          {member.role}
                        </p>
                      )
                    )}
                    {canModifyMember(currentUserRole, member) ? (
                      <>
                        <div>
                          <select
                            value={teamByMember[member.id] || ""}
                            onChange={(e) =>
                              setTeamByMember((prev) => ({ ...prev, [member.id]: e.target.value }))
                            }
                            className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm dark:bg-[#111827] dark:text-white dark:border-white/10"
                          >
                            <option value="">Assign team</option>
                            {teams.map((team) => (
                              <option key={team.id} value={team.id}>
                                {team.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          onClick={() => void assignTeam(member.id)}
                          className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm font-medium text-slate-700 dark:border-white/10 dark:bg-[#111827] dark:text-white/80 md:w-auto"
                        >
                          Assign Team
                        </button>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <button
                            onClick={() => void suspendMember(member.id)}
                            className="w-full rounded-lg border border-amber-300 bg-transparent px-3 py-2 text-sm font-medium text-amber-700 dark:border-white/10 dark:bg-[#111827] dark:text-white/80 sm:w-auto"
                          >
                            Suspend
                          </button>
                          <button
                            onClick={() => void deleteMember(member.id)}
                            className="w-full rounded-lg border border-rose-300 bg-transparent px-3 py-2 text-sm font-medium text-rose-700 dark:border-white/10 dark:bg-[#111827] dark:text-white/80 sm:w-auto"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500 dark:border-white/10 dark:bg-[#111827] dark:text-white/50">
                          Protected account
                        </div>
                        <div className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500 dark:border-white/10 dark:bg-[#111827] dark:text-white/50">
                          Team changes disabled
                        </div>
                        <div className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500 dark:border-white/10 dark:bg-[#111827] dark:text-white/50">
                          Owner protected
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {members.length === 0 && <p className="text-sm text-slate-600 dark:text-white/70">No members found.</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminMembers;
