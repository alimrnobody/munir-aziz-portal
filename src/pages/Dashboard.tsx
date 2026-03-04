import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { CourseCard } from "@/components/CourseCard";
import { NeonText } from "@/components/NeonText";
import { mockCourses, mockUser } from "@/lib/mock-data";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen cyber-grid">
      <Navbar
        userEmail={mockUser.email}
        isAdmin={true}
        onLogout={() => navigate("/")}
      />

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 right-1/3 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-neon-pink/5 rounded-full blur-[120px]" />
      </div>

      <main className="container mx-auto px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <NeonText as="h2" glow className="text-sm text-muted-foreground mb-1 font-normal tracking-[0.3em] uppercase">
            Welcome back
          </NeonText>
          <NeonText gradient className="text-3xl sm:text-4xl">
            Your Training
          </NeonText>
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
