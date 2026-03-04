import { motion } from "framer-motion";
import { Shield, LogOut, LayoutDashboard } from "lucide-react";
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
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass-strong sticky top-0 z-50 border-b border-border/50"
    >
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 group">
          <Shield className="text-primary group-hover:text-neon-pink transition-colors" size={24} />
          <NeonText as="span" gradient className="text-base sm:text-lg tracking-widest">
            MR NOBODY SQUAD
          </NeonText>
        </button>

        <div className="flex items-center gap-3">
          {isAdmin && location.pathname !== "/admin" && (
            <Button variant="neon-outline" size="sm" onClick={() => navigate("/admin")}>
              <LayoutDashboard size={14} />
              <span className="hidden sm:inline">Admin</span>
            </Button>
          )}
          {userEmail && (
            <span className="text-xs text-muted-foreground hidden md:block">{userEmail}</span>
          )}
          {onLogout && (
            <Button variant="ghost" size="icon" onClick={onLogout}>
              <LogOut size={16} />
            </Button>
          )}
        </div>
      </div>
    </motion.nav>
  );
};
