import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useTheme } from "@/components/ThemeProvider";
import { LayoutDashboard, Terminal, Activity, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { MovingWatermark } from "@/components/MovingWatermark";
import { useGlobalProtection } from "@/hooks/useGlobalProtection";
import { useAuth } from "@/context/AuthContext";

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, profile } = useAuth();
  useGlobalProtection();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const [avatarFailed, setAvatarFailed] = useState(false);
  const role = profile?.role === "owner" || profile?.role === "admin" ? profile.role : "user";
  const userName = profile?.name || "";
  const userEmail = user?.email || "";
  const userAvatarUrl = profile?.avatar_url || "";
  const googleAvatarUrl = typeof user?.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : "";
  const avatarSeed = encodeURIComponent((userEmail || userName || "User").trim());
  const initialsAvatarUrl = `https://ui-avatars.com/api/?name=${avatarSeed}&background=111827&color=ffffff&bold=true`;
  const preferredAvatarUrl = userAvatarUrl || googleAvatarUrl || initialsAvatarUrl;
  const avatarUrl = avatarFailed ? initialsAvatarUrl : preferredAvatarUrl;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {role === "user" && userEmail && <MovingWatermark text={userEmail} />}
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border/60 bg-background/88 px-3 backdrop-blur-xl sm:px-4 lg:px-6"
          >
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground transition-colors hover:text-foreground" />
              <div className="hidden h-5 w-px bg-border/40 sm:flex" />
              <div className="hidden items-center gap-2 sm:flex">
                <Activity size={12} className="text-primary" />
                <span className="text-[10px] font-mono tracking-wider text-muted-foreground">
                  {isAdminRoute ? "ADMIN PANEL" : "DASHBOARD"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {!isAdminRoute && (role === "admin" || role === "owner") && (
                <Button
                  variant="neon-outline"
                  size="icon"
                  onClick={() => navigate("/admin/dashboard")}
                  className="inline-flex h-9 w-9 sm:hidden"
                >
                  <LayoutDashboard size={15} />
                </Button>
              )}
              {isAdminRoute && (
                <Button
                  variant="neon-outline"
                  size="icon"
                  onClick={() => navigate("/dashboard")}
                  className="inline-flex h-9 w-9 sm:hidden"
                >
                  <Terminal size={15} />
                </Button>
              )}
              {!isAdminRoute && (role === "admin" || role === "owner") && (
                <Button
                  variant="neon-outline"
                  size="sm"
                  onClick={() => navigate("/admin/dashboard")}
                  className="hidden gap-1.5 sm:flex"
                >
                  <LayoutDashboard size={13} />
                  <span className="text-xs">Admin</span>
                </Button>
              )}

              <button
                type="button"
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                onClick={toggleTheme}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-2xl border shadow-sm transition-colors sm:hidden ${
                  theme === "dark"
                    ? "border-white/10 bg-[#1f1f23] text-white"
                    : "border-slate-300 bg-white text-slate-900"
                }`}
              >
                {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
              </button>
              {isAdminRoute && (
                <Button
                  variant="neon-outline"
                  size="sm"
                  onClick={() => navigate("/dashboard")}
                  className="hidden gap-1.5 sm:flex"
                >
                  <Terminal size={13} />
                  <span className="text-xs">Dashboard</span>
                </Button>
              )}

              <div className="hidden items-center gap-2 rounded-full border border-border/60 bg-card/80 px-3 py-1.5 md:flex">
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="h-1.5 w-1.5 rounded-full bg-primary"
                />
                <div className="leading-tight">
                  {userName ? (
                    <>
                      <p className="text-xs font-medium text-foreground">{userName}</p>
                      <p className="text-[11px] text-muted-foreground">{userEmail}</p>
                    </>
                  ) : (
                    <p className="font-mono text-xs text-muted-foreground">{userEmail}</p>
                  )}
                </div>
              </div>

              <button
                type="button"
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                onClick={toggleTheme}
                className="relative hidden h-11 w-[84px] items-center rounded-full border border-primary/35 bg-[linear-gradient(90deg,#714AD6,#8A5AF0)] px-1 shadow-[0_10px_24px_rgba(113,74,214,0.18)] transition-all duration-300 sm:inline-flex"
              >
                <span className="relative z-10 flex w-full items-center justify-between px-2.5">
                  <Moon
                    size={18}
                    strokeWidth={2.6}
                    className={theme === "dark" ? "text-[#1F2937]" : "text-transparent"}
                  />
                  <Sun
                    size={18}
                    strokeWidth={2.6}
                    className={theme === "light" ? "text-[#1F2937]" : "text-transparent"}
                  />
                </span>
                <motion.span
                  layout
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className={`absolute top-1 flex h-9 w-9 items-center justify-center rounded-full bg-[#ffffff] shadow-[0_10px_24px_rgba(15,23,42,0.22)] ${
                    theme === "light" ? "left-1" : "left-[43px]"
                  }`}
                />
              </button>

              <button
                aria-label="Open settings"
                onClick={() => navigate("/settings")}
                className="avatar-trigger inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#714AD6] px-0 py-0"
              >
                <img
                  src={avatarUrl}
                  alt="User avatar"
                  className="h-full w-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarFailed(true)}
                />
              </button>
            </div>
          </motion.header>

          <main className="relative flex-1">
            <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
              <div className="absolute -top-40 right-1/4 h-[800px] w-[800px] rounded-full bg-primary/2 blur-[260px]" />
              <div className="absolute bottom-0 -left-40 h-[600px] w-[600px] rounded-full bg-primary/[0.015] blur-[220px]" />
              <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] rounded-full bg-primary/[0.015] blur-[220px]" />
              <div className="absolute inset-0 hex-grid opacity-[0.18]" />
            </div>
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

