import { LayoutDashboard, MessageSquare, BookOpen, TrendingUp, Settings, Users2, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/components/ThemeProvider";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const appNavItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Community", url: "/community", icon: MessageSquare },
  { title: "Courses", url: "/courses", icon: BookOpen },
  { title: "Progress", url: "/progress", icon: TrendingUp },
  { title: "Settings", url: "/settings", icon: Settings },
];

const adminNavItems = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Courses", url: "/admin/courses", icon: BookOpen },
  { title: "Members", url: "/admin/members", icon: Users2 },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

export function AppSidebar() {
  const { theme } = useTheme();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const navItems = isAdminRoute ? adminNavItems : appNavItems;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border bg-sidebar shadow-[inset_-1px_0_0_rgba(255,255,255,0.02)]"
    >
      <SidebarContent className="bg-sidebar pt-5">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-7 border-b border-sidebar-border/80 px-5 pb-7"
          >
            <div className="flex h-14 items-center">
              <span
                className="whitespace-nowrap text-[28px] font-extrabold uppercase leading-none tracking-[0.04em]"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                <span style={{ color: "#714AD6" }}>ELITE</span>
                <span className={theme === "light" ? "text-black" : "text-white"}>SQUAD</span>
              </span>
            </div>
          </motion.div>
        )}

        {collapsed && (
          <div className="mb-8 flex items-center justify-center border-b border-sidebar-border/80 pb-6">
            <span className="font-display text-sm font-bold uppercase leading-none tracking-[0.05em]">
              <span style={{ color: "#714AD6" }}>E</span>
              <span className={theme === "light" ? "text-black" : "text-white"}>S</span>
            </span>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel
            className={`px-4 font-display text-[9px] uppercase tracking-[0.3em] text-muted-foreground/60 ${
              collapsed ? "hidden" : ""
            }`}
          >
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu
              className={
                collapsed ? "flex flex-col items-center space-y-5 px-0" : "space-y-1.5 px-3"
              }
            >
              {navItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className={`relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm transition-all duration-200 ${
                          collapsed ? "mx-auto h-11 w-11 justify-center px-0 py-0" : ""
                        } ${
                          isActive
                            ? "border border-primary/25 bg-primary/10 text-primary shadow-none"
                            : "border border-transparent text-muted-foreground hover:border-border/50 hover:bg-secondary/55 hover:text-foreground"
                        }`}
                        activeClassName="bg-primary/10 text-primary"
                      >
                        {isActive && !collapsed && (
                          <motion.div
                            layoutId="activeNav"
                            className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                        <item.icon size={17} className={isActive ? "text-primary" : ""} />
                        {!collapsed && <span className="font-medium">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto space-y-3 p-4">
          <button
            onClick={() => void handleLogout()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-sidebar-border bg-secondary/50 px-3 py-2.5 text-sm text-foreground transition-all duration-200 ease-in-out hover:border-primary/25 hover:bg-secondary/70"
          >
            <LogOut size={16} />
            {!collapsed && <span>Logout</span>}
          </button>

          {!collapsed && (
            <div className="glass rounded-xl p-3 text-center">
              <div className="font-display text-[9px] uppercase tracking-widest text-muted-foreground/50">
                v2.0 - Encrypted
              </div>
            </div>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
