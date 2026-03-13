import { DashboardLayout } from "@/components/DashboardLayout";
import { useNavigate } from "react-router-dom";

const AdminSettings = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl p-6 lg:p-8">
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:bg-[#0F172A] dark:border-white/10 dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Settings</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-white/70">
            Admin configuration modules will appear here as the portal expands.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:bg-[#0F172A] dark:border-white/10 dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Course Control</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-white/70">
                Manage course availability and lock state from a dedicated admin screen.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/admin/course-control")}
            className="mt-6 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Manage Courses
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:bg-[#0F172A] dark:border-white/10 dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Teams</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-white/70">
                Manage member groups.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/admin/teams")}
            className="mt-6 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Manage Teams
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminSettings;
