import { motion } from "framer-motion";
import { CourseCard } from "@/components/CourseCard";
import { NeonText } from "@/components/NeonText";
import { DashboardLayout } from "@/components/DashboardLayout";
import { mockCourses } from "@/lib/mock-data";
import { Sparkles, BookOpen, CheckCircle, Clock, TrendingUp } from "lucide-react";

const statItems = [
  { 
    label: "Total Courses", 
    getValue: () => mockCourses.length, 
    icon: BookOpen,
    gradient: "from-neon-purple to-neon-pink"
  },
  { 
    label: "Completed", 
    getValue: () => mockCourses.filter(c => c.progress === 100).length, 
    icon: CheckCircle,
    gradient: "from-neon-pink to-neon-blue"
  },
  { 
    label: "In Progress", 
    getValue: () => mockCourses.filter(c => c.progress > 0 && c.progress < 100).length, 
    icon: Clock,
    gradient: "from-neon-blue to-neon-purple"
  },
  { 
    label: "Avg Progress", 
    getValue: () => Math.round(mockCourses.reduce((a, c) => a + c.progress, 0) / mockCourses.length) + "%", 
    icon: TrendingUp,
    gradient: "from-neon-purple to-neon-cyan"
  },
];

const Dashboard = () => {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-10 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <div className="flex items-center gap-2 mb-4">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles size={16} className="text-primary" />
            </motion.div>
            <span className="text-xs font-display tracking-[0.4em] uppercase text-muted-foreground">
              Welcome back, Agent
            </span>
          </div>
          <NeonText gradient className="text-3xl sm:text-4xl lg:text-5xl mb-3">
            Your Training Hub
          </NeonText>
          <p className="text-muted-foreground max-w-lg leading-relaxed text-sm">
            Continue your journey through the private training modules. Track progress and unlock new phases.
          </p>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {statItems.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.15 + i * 0.08, duration: 0.5 }}
            >
              <div className="glass glass-hover rounded-2xl p-5 group cursor-default relative overflow-hidden">
                {/* Subtle gradient accent */}
                <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${stat.gradient} opacity-40 group-hover:opacity-80 transition-opacity duration-500`} />
                
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors duration-300">
                    <stat.icon size={18} className="text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                  </div>
                </div>
                <div className="text-2xl font-display font-bold text-foreground mb-1">
                  {stat.getValue()}
                </div>
                <div className="text-[10px] font-display tracking-[0.2em] uppercase text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Section label */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-3 mb-6"
        >
          <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
          <span className="text-[10px] font-display tracking-[0.4em] uppercase text-muted-foreground">
            Active Courses
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-border/50 to-transparent" />
        </motion.div>

        {/* Course grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {mockCourses.map((course, i) => (
            <CourseCard key={course.id} course={course} index={i} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
