import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { CourseCard } from "@/components/CourseCard";
import { NeonText } from "@/components/NeonText";
import { mockCourses, mockUser } from "@/lib/mock-data";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen cyber-grid particle-field">
      <Navbar
        userEmail={mockUser.email}
        isAdmin={true}
        onLogout={() => navigate("/")}
      />

      {/* Ambient glow orbs */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.06, 0.1, 0.06] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 right-1/4 w-[700px] h-[700px] bg-primary rounded-full blur-[200px]"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.04, 0.08, 0.04] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-0 -left-32 w-[500px] h-[500px] bg-neon-pink rounded-full blur-[180px]"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.03, 0.06, 0.03] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-neon-cyan rounded-full blur-[160px]"
        />
      </div>

      <main className="container mx-auto px-4 py-12 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-neon-cyan" />
            <span className="text-xs font-display tracking-[0.4em] uppercase text-muted-foreground">
              Welcome back, Agent
            </span>
          </div>
          <NeonText gradient className="text-4xl sm:text-5xl mb-3">
            Your Training
          </NeonText>
          <p className="text-muted-foreground max-w-md leading-relaxed">
            Continue your journey through the private training modules.
          </p>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid grid-cols-3 gap-3 mb-10 max-w-lg"
        >
          {[
            { label: "Courses", value: mockCourses.length, color: "text-primary" },
            { label: "Completed", value: mockCourses.filter(c => c.progress === 100).length, color: "text-neon-green" },
            { label: "In Progress", value: mockCourses.filter(c => c.progress > 0 && c.progress < 100).length, color: "text-neon-cyan" },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-xl p-3 text-center">
              <div className={`text-2xl font-display font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-[10px] font-display tracking-widest uppercase text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockCourses.map((course, i) => (
            <CourseCard key={course.id} course={course} index={i} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
