import { motion, AnimatePresence } from "framer-motion";
import { Lock, ChevronDown, PlayCircle, CheckCircle2, Clock } from "lucide-react";
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
  const completedCount = phase.lessons.filter(l => l.completed).length;
  const totalCount = phase.lessons.length;

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`glass rounded-2xl overflow-hidden transition-shadow duration-500 ${
        !phase.locked ? 'hover:neon-glow' : 'opacity-70'
      }`}
    >
      <button
        onClick={() => !phase.locked && setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-secondary/20 group"
        disabled={phase.locked}
      >
        <div className="flex items-center gap-4">
          {phase.locked ? (
            <div className="w-10 h-10 rounded-xl bg-secondary/60 flex items-center justify-center">
              <Lock size={16} className="text-muted-foreground" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl gradient-neon-subtle flex items-center justify-center group-hover:neon-glow transition-shadow duration-500">
              <div className="w-3 h-3 rounded-full gradient-neon" />
            </div>
          )}
          <div>
            <NeonText as="h4" className="text-sm" glow={!phase.locked}>
              {phase.title}
            </NeonText>
            {!phase.locked && (
              <span className="text-[10px] text-muted-foreground font-display tracking-wider">
                {completedCount}/{totalCount} COMPLETED
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {phase.locked && (
            <span className="text-[10px] font-display tracking-[0.2em] text-muted-foreground bg-secondary/60 px-3 py-1.5 rounded-full uppercase">
              Coming Soon
            </span>
          )}
          {!phase.locked && (
            <ChevronDown
              size={16}
              className={`text-muted-foreground transition-transform duration-500 ${open ? "rotate-180" : ""}`}
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
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="px-5 pb-5 space-y-1">
              {phase.lessons.map((lesson, i) => (
                <motion.button
                  key={lesson.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/course/${courseId}/lesson/${lesson.id}`)}
                  className="w-full flex items-center gap-4 p-3.5 rounded-xl hover:bg-secondary/40 transition-all duration-300 group text-left"
                >
                  {lesson.completed ? (
                    <CheckCircle2 size={16} className="text-neon-green shrink-0" />
                  ) : (
                    <PlayCircle size={16} className="text-primary shrink-0 group-hover:text-neon-pink transition-colors duration-300" />
                  )}
                  <span className="text-sm text-foreground/90 flex-1 group-hover:text-foreground transition-colors">
                    {lesson.title}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock size={11} />
                    <span>{lesson.duration}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
