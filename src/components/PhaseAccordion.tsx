import { motion, AnimatePresence } from "framer-motion";
import { Lock, ChevronDown, PlayCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { NeonText } from "./NeonText";
import type { Phase } from "@/lib/mock-data";
import { useNavigate } from "react-router-dom";

interface PhaseAccordionProps {
  phase: Phase;
  courseId: string;
  index: number;
}

export const PhaseAccordion = ({ phase, courseId, index }: PhaseAccordionProps) => {
  const [open, setOpen] = useState(!phase.locked);
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="glass rounded-xl overflow-hidden"
    >
      <button
        onClick={() => !phase.locked && setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-secondary/30"
        disabled={phase.locked}
      >
        <div className="flex items-center gap-3">
          {phase.locked ? (
            <Lock size={18} className="text-muted-foreground" />
          ) : (
            <div className="w-[18px] h-[18px] rounded-full gradient-neon" />
          )}
          <NeonText as="h4" className="text-sm" glow={!phase.locked}>
            {phase.title}
          </NeonText>
        </div>
        <div className="flex items-center gap-2">
          {phase.locked && (
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
              Coming Soon
            </span>
          )}
          {!phase.locked && (
            <ChevronDown
              size={16}
              className={`text-muted-foreground transition-transform duration-300 ${open ? "rotate-180" : ""}`}
            />
          )}
        </div>
      </button>

      <AnimatePresence>
        {open && !phase.locked && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-4 pb-4 space-y-1">
              {phase.lessons.map((lesson) => (
                <button
                  key={lesson.id}
                  onClick={() => navigate(`/course/${courseId}/lesson/${lesson.id}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-all group text-left"
                >
                  {lesson.completed ? (
                    <CheckCircle2 size={16} className="text-neon-green shrink-0" />
                  ) : (
                    <PlayCircle size={16} className="text-primary shrink-0 group-hover:text-neon-pink transition-colors" />
                  )}
                  <span className="text-sm text-foreground/90 flex-1">{lesson.title}</span>
                  <span className="text-xs text-muted-foreground">{lesson.duration}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
