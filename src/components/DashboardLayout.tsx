import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useTheme } from "@/components/ThemeProvider";
import { Moon, Sun, LogOut, LayoutDashboard, Terminal, Activity } from "lucide-react";
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
            className="h-14 flex items-center justify-between px-4 lg:px-6 border-b border-border/20 glass-strong sticky top-0 z-50"
          >
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
              <div className="hidden sm:flex h-5 w-px bg-border/30" />
              <div className="hidden sm:flex items-center gap-2">
                <Activity size={12} className="text-primary" />
                <span className="text-[10px] font-mono tracking-wider text-muted-foreground">
                  {location.pathname === "/admin" ? "ADMIN PANEL" : "DASHBOARD"}
                </span>
              </div>
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
              
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/30 border border-border/20">
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-primary"
                />
                <span className="text-xs text-muted-foreground font-mono">{mockUser.email}</span>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-muted-foreground hover:text-foreground transition-colors relative overflow-hidden h-9 w-9"
              >
                <motion.div
                  key={theme}
                  initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, type: "spring" }}
                >
                  {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
                </motion.div>
              </Button>
              
              <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="text-muted-foreground hover:text-destructive transition-colors h-9 w-9">
                <LogOut size={14} />
              </Button>
            </div>
          </motion.header>

          {/* Page content */}
          <main className="flex-1 relative">
            {/* Ambient background */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
              <div className="absolute -top-40 right-1/4 w-[800px] h-[800px] bg-primary/4 rounded-full blur-[250px]" />
              <div className="absolute bottom-0 -left-40 w-[600px] h-[600px] bg-neon-pink/3 rounded-full blur-[200px]" />
              <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-neon-blue/2 rounded-full blur-[200px]" />
              <div className="absolute inset-0 hex-grid opacity-30" />
            </div>
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
