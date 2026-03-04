import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useTheme } from "@/components/ThemeProvider";
import { Moon, Sun, LogOut, LayoutDashboard, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { mockUser } from "@/lib/mock-data";
import { motion } from "framer-motion";

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="h-14 flex items-center justify-between px-4 border-b border-border/30 glass-strong sticky top-0 z-50"
          >
            <div className="flex items-center gap-2">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            </div>
            <div className="flex items-center gap-2">
              {location.pathname !== "/admin" && (
                <Button variant="neon-outline" size="sm" onClick={() => navigate("/admin")} className="gap-1.5 hidden sm:flex">
                  <LayoutDashboard size={13} />
                  <span className="text-xs">Admin</span>
                </Button>
              )}
              {location.pathname === "/admin" && (
                <Button variant="neon-outline" size="sm" onClick={() => navigate("/dashboard")} className="gap-1.5 hidden sm:flex">
                  <Terminal size={13} />
                  <span className="text-xs">Dashboard</span>
                </Button>
              )}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/40 border border-border/30">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-xs text-muted-foreground font-mono">{mockUser.email}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-muted-foreground hover:text-foreground transition-colors relative overflow-hidden"
              >
                <motion.div
                  key={theme}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                </motion.div>
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="text-muted-foreground hover:text-destructive transition-colors">
                <LogOut size={15} />
              </Button>
            </div>
          </motion.header>

          {/* Page content */}
          <main className="flex-1 relative">
            {/* Ambient background */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
              <div className="absolute -top-32 right-1/4 w-[700px] h-[700px] bg-primary/5 rounded-full blur-[200px]" />
              <div className="absolute bottom-0 -left-32 w-[500px] h-[500px] bg-neon-pink/4 rounded-full blur-[180px]" />
            </div>
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
