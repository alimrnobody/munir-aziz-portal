import { cn } from "@/lib/utils";

interface NeonTextProps {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3" | "h4" | "span" | "p";
  gradient?: boolean;
  glow?: boolean;
  className?: string;
}

export const NeonText = ({ children, as: Tag = "h1", gradient = false, glow = false, className }: NeonTextProps) => (
  <Tag className={cn(
    "font-display font-bold tracking-wider",
    gradient && "gradient-neon-text",
    glow && "neon-text",
    className
  )}>
    {children}
  </Tag>
);
