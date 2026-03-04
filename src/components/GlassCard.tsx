import { cn } from "@/lib/utils";
import { motion, type HTMLMotionProps } from "framer-motion";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  glow?: boolean;
  children: React.ReactNode;
}

export const GlassCard = ({ className, glow = false, children, ...props }: GlassCardProps) => (
  <motion.div
    className={cn(
      "glass rounded-xl p-6 transition-all duration-300",
      glow && "neon-glow hover:neon-glow-strong",
      className
    )}
    whileHover={{ y: -2 }}
    {...props}
  >
    {children}
  </motion.div>
);
