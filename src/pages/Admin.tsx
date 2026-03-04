import { useState } from "react";
import { motion } from "framer-motion";
import { Users, BookOpen, Upload, Lock, Unlock, Trash2, Plus, ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { GlassCard } from "@/components/GlassCard";
import { NeonText } from "@/components/NeonText";
import { Button } from "@/components/ui/button";
import { mockCourses, mockUser } from "@/lib/mock-data";
import { useNavigate } from "react-router-dom";

type Tab = "users" | "courses";

const mockUsers = [
  { id: "1", email: "agent@mrnobody.squad", name: "Agent Zero", status: "active" },
  { id: "2", email: "shadow@mrnobody.squad", name: "Shadow", status: "active" },
  { id: "3", email: "ghost@mrnobody.squad", name: "Ghost", status: "suspended" },
];

const Admin = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("users");

  return (
    <div className="min-h-screen cyber-grid particle-field">
      <Navbar userEmail={mockUser.email} isAdmin={true} onLogout={() => navigate("/")} />

      <div className="fixed inset-0 pointer-events-none -z-10">
        <motion.div
          animate={{ opacity: [0.04, 0.08, 0.04] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary rounded-full blur-[200px]"
        />
      </div>

      <main className="container mx-auto px-4 py-10 relative">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck size={14} className="text-neon-cyan" />
            <span className="text-[10px] font-display tracking-[0.4em] uppercase text-muted-foreground">
              ADMIN CONTROL CENTER
            </span>
          </div>
          <NeonText gradient className="text-3xl sm:text-4xl mb-2">
            Admin Panel
          </NeonText>
          <p className="text-muted-foreground text-sm">Manage users, courses, and content.</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {([
            { key: "users" as Tab, label: "Users", icon: Users },
            { key: "courses" as Tab, label: "Courses", icon: BookOpen },
          ]).map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={tab === key ? "neon" : "neon-outline"}
              size="sm"
              onClick={() => setTab(key)}
              className="gap-1.5"
            >
              <Icon size={13} />
              {label}
            </Button>
          ))}
        </div>

        {tab === "users" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center justify-between mb-5">
              <NeonText as="h3" glow className="text-lg">User Management</NeonText>
              <Button variant="neon" size="sm" className="gap-1.5"><Plus size={13} /> Add User</Button>
            </div>

            <GlassCard glow className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/20">
                    <th className="text-left py-3.5 px-4 font-display text-[10px] tracking-[0.2em] text-muted-foreground uppercase">Name</th>
                    <th className="text-left py-3.5 px-4 font-display text-[10px] tracking-[0.2em] text-muted-foreground uppercase">Email</th>
                    <th className="text-left py-3.5 px-4 font-display text-[10px] tracking-[0.2em] text-muted-foreground uppercase">Status</th>
                    <th className="text-right py-3.5 px-4 font-display text-[10px] tracking-[0.2em] text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mockUsers.map((user, i) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b border-border/10 hover:bg-secondary/20 transition-colors duration-300"
                    >
                      <td className="py-3.5 px-4 text-foreground font-medium">{user.name}</td>
                      <td className="py-3.5 px-4 text-muted-foreground font-mono text-xs">{user.email}</td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-display tracking-wider px-2.5 py-1 rounded-full ${
                          user.status === "active"
                            ? "bg-neon-green/10 text-neon-green border border-neon-green/20"
                            : "bg-destructive/10 text-destructive border border-destructive/20"
                        }`}>
                          {user.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 size={14} />
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          </motion.div>
        )}

        {tab === "courses" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center justify-between mb-5">
              <NeonText as="h3" glow className="text-lg">Course Management</NeonText>
              <Button variant="neon" size="sm" className="gap-1.5"><Plus size={13} /> New Course</Button>
            </div>

            <div className="space-y-4">
              {mockCourses.map((course, i) => (
                <GlassCard
                  key={course.id}
                  glow
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <NeonText as="h4" glow className="text-sm mb-1">{course.title}</NeonText>
                    <p className="text-xs text-muted-foreground">
                      {course.phases.length} phases • {course.phases.reduce((a, p) => a + p.lessons.length, 0)} lessons
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {course.phases.map((phase) => (
                      <Button key={phase.id} variant="neon-outline" size="sm" className="text-xs gap-1">
                        {phase.locked ? <Lock size={11} /> : <Unlock size={11} />}
                        {phase.title.replace(/Phase \d+ — /, "")}
                      </Button>
                    ))}
                    <Button variant="ghost" size="sm" className="text-neon-cyan gap-1 text-xs">
                      <Upload size={11} /> Upload
                    </Button>
                  </div>
                </GlassCard>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Admin;
