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
      "glass rounded-2xl p-6 transition-all duration-500 relative overflow-hidden",
      glow && "neon-glow hover:neon-glow-strong",
      gradient && "gradient-border",
      className
    )}
    whileHover={{ y: -4, transition: { duration: 0.3, ease: "easeOut" } }}
    {...props}
  >
    {/* Subtle inner highlight */}
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.03] via-transparent to-transparent pointer-events-none" />
    <div className="relative z-10">{children}</div>
  </motion.div>
);
