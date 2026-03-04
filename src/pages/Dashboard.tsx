import { motion } from "framer-motion";
import { CourseCard } from "@/components/CourseCard";
import { NeonText } from "@/components/NeonText";
import { DashboardLayout } from "@/components/DashboardLayout";
import { mockCourses } from "@/lib/mock-data";
import { Sparkles } from "lucide-react";

const Dashboard = () => {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-primary" />
            <span className="text-xs font-display tracking-[0.4em] uppercase text-muted-foreground">
              Welcome back, Agent
            </span>
          </div>
          <NeonText gradient className="text-3xl sm:text-4xl mb-3">
            Your Training
          </NeonText>
          <p className="text-muted-foreground max-w-md leading-relaxed text-sm">
            Continue your journey through the private training modules.
          </p>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid grid-cols-3 gap-4 mb-10 max-w-lg"
        >
          {[
            { label: "Courses", value: mockCourses.length, color: "text-primary" },
            { label: "Completed", value: mockCourses.filter(c => c.progress === 100).length, color: "text-accent" },
            { label: "In Progress", value: mockCourses.filter(c => c.progress > 0 && c.progress < 100).length, color: "text-primary" },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-xl p-4 text-center">
              <div className={`text-2xl font-display font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-[10px] font-display tracking-widest uppercase text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>

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
