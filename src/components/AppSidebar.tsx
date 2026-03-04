import { LayoutDashboard, BookOpen, TrendingUp, Users2, Settings } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { NeonText } from "./NeonText";
import { Shield } from "lucide-react";
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
    <Sidebar collapsible="icon" className="border-r border-border/30">
      <SidebarContent className="pt-4">
        {/* Logo */}
        {!collapsed && (
          <div className="px-4 pb-4 mb-2 border-b border-border/20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg gradient-neon flex items-center justify-center shrink-0">
                <Shield className="text-primary-foreground" size={16} />
              </div>
              <div className="flex flex-col">
                <NeonText as="span" gradient className="text-xs tracking-[0.2em] leading-none">
                  MR NOBODY
                </NeonText>
                <span className="text-[8px] tracking-[0.3em] text-muted-foreground uppercase font-display">
                  SQUAD
                </span>
              </div>
            </div>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-[9px] tracking-[0.3em] uppercase font-display text-muted-foreground/70">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location.pathname === item.url && item.title === "Dashboard";
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 text-sm ${
                          isActive
                            ? "bg-primary/10 text-primary neon-glow"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                        }`}
                        activeClassName="bg-primary/10 text-primary"
                      >
                        <item.icon size={18} className={isActive ? "text-primary" : ""} />
                        {!collapsed && <span className="font-medium">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
