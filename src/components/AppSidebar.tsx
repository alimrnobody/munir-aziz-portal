import { LayoutDashboard, BookOpen, TrendingUp, Users2, Settings, Shield, Zap } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { NeonText } from "./NeonText";
import { motion } from "framer-motion";
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

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Courses", url: "/dashboard", icon: BookOpen },
  { title: "Progress", url: "/dashboard", icon: TrendingUp },
  { title: "Community", url: "/dashboard", icon: Users2 },
  { title: "Settings", url: "/dashboard", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-border/20">
      <SidebarContent className="pt-4">
        {/* Logo */}
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="px-4 pb-5 mb-2 border-b border-border/15"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl gradient-neon flex items-center justify-center shrink-0 animate-pulse-glow">
                <Shield className="text-primary-foreground" size={16} />
              </div>
              <div className="flex flex-col">
                <NeonText as="span" gradient className="text-xs tracking-[0.2em] leading-none">
                  ELITE SQUAD
                </NeonText>
                <span className="text-[7px] tracking-[0.3em] text-muted-foreground uppercase font-display mt-0.5">
                  BY MR NOBODY
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {collapsed && (
          <div className="flex justify-center pb-4 mb-2 border-b border-border/15">
            <div className="w-8 h-8 rounded-lg gradient-neon flex items-center justify-center">
              <Zap className="text-primary-foreground" size={14} />
            </div>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-[9px] tracking-[0.3em] uppercase font-display text-muted-foreground/60 px-4">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2 space-y-1">
              {navItems.map((item, i) => {
                const isActive = location.pathname === item.url && item.title === "Dashboard";
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 text-sm relative ${
                          isActive
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                        }`}
                        activeClassName="bg-primary/10 text-primary"
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeNav"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-primary"
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

        {/* Bottom decoration */}
        {!collapsed && (
          <div className="mt-auto p-4">
            <div className="glass rounded-xl p-3 text-center">
              <div className="text-[9px] font-display tracking-widest text-muted-foreground/50 uppercase">
                v2.0 • Encrypted
              </div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
