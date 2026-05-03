import { motion } from "framer-motion";

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export const ProgressRing = ({ progress, size = 48, strokeWidth = 4, className = "" }: ProgressRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const brandBlue = "#5627FF";

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth={strokeWidth}
          opacity={0.4}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={brandBlue}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 4px rgba(86, 39, 255, 0.35))" }}
        />
      </svg>
      <span className="absolute text-xs font-display font-bold text-foreground">
        {progress}%
      </span>
    </div>
  );
};
