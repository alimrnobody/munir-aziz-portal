import { cn } from "@/lib/utils";
import { motion, type HTMLMotionProps } from "framer-motion";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  glow?: boolean;
  gradient?: boolean;
  children: React.ReactNode;
}

export const GlassCard = ({ className, glow = false, gradient = false, children, ...props }: GlassCardProps) => (
  <motion.div
    className={cn(
      "glass rounded-2xl p-6 transition-all duration-500 relative overflow-hidden group/card",
      glow && "hover:neon-glow",
      gradient && "gradient-border",
      className
    )}
    whileHover={{ y: -6, transition: { duration: 0.3, ease: "easeOut" } }}
    {...props}
  >
    {/* Inner highlight shimmer */}
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.04] via-transparent to-white/[0.01] pointer-events-none" />
    
    {/* Hover glow effect */}
    <div className="absolute -inset-px rounded-2xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 pointer-events-none bg-gradient-to-br from-primary/5 via-transparent to-neon-pink/5" />
    
    <div className="relative z-10">{children}</div>
  </motion.div>
);
