import { motion } from "framer-motion";
import { Shield, LogOut, LayoutDashboard, Terminal } from "lucide-react";
import { Button } from "./ui/button";
import { NeonText } from "./NeonText";
import { useNavigate, useLocation } from "react-router-dom";

interface NavbarProps {
  userEmail?: string;
  isAdmin?: boolean;
  onLogout?: () => void;
}

export const Navbar = ({ userEmail, isAdmin, onLogout }: NavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <motion.nav
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="glass-strong sticky top-0 z-50 border-b border-border/30"
    >
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-3 group">
          <div className="relative">
            <div className="w-9 h-9 rounded-lg gradient-neon flex items-center justify-center group-hover:neon-glow-strong transition-shadow duration-500">
              <Shield className="text-primary-foreground" size={18} />
            </div>
            <div className="absolute -inset-1 rounded-lg gradient-neon opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-500" />
          </div>
          <div className="flex flex-col">
            <NeonText as="span" gradient className="text-sm sm:text-base tracking-[0.25em] leading-none">
              MR NOBODY
            </NeonText>
            <span className="text-[9px] tracking-[0.4em] text-muted-foreground uppercase font-display">
              SQUAD
            </span>
          </div>
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          {isAdmin && location.pathname !== "/admin" && (
            <Button variant="neon-outline" size="sm" onClick={() => navigate("/admin")} className="gap-1.5">
              <LayoutDashboard size={13} />
              <span className="hidden sm:inline text-xs">Admin</span>
            </Button>
          )}
          {isAdmin && location.pathname === "/admin" && (
            <Button variant="neon-outline" size="sm" onClick={() => navigate("/dashboard")} className="gap-1.5">
              <Terminal size={13} />
              <span className="hidden sm:inline text-xs">Dashboard</span>
            </Button>
          )}
          {userEmail && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/40 border border-border/30">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
              <span className="text-xs text-muted-foreground font-mono">{userEmail}</span>
            </div>
          )}
          {onLogout && (
            <Button variant="ghost" size="icon" onClick={onLogout} className="text-muted-foreground hover:text-destructive transition-colors">
              <LogOut size={15} />
            </Button>
          )}
        </div>
      </div>
    </motion.nav>
  );
};
