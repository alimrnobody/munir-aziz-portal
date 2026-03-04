import { useState } from "react";
import { motion } from "framer-motion";
import { Users, BookOpen, Upload, Lock, Unlock, Trash2, Plus } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { GlassCard } from "@/components/GlassCard";
import { NeonText } from "@/components/NeonText";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <div className="min-h-screen cyber-grid">
      <Navbar userEmail={mockUser.email} isAdmin={true} onLogout={() => navigate("/")} />

      <main className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <NeonText gradient className="text-2xl sm:text-3xl mb-1">
            Admin Panel
          </NeonText>
          <p className="text-muted-foreground text-sm">Manage users, courses, and content.</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {([
            { key: "users" as Tab, label: "Users", icon: Users },
            { key: "courses" as Tab, label: "Courses", icon: BookOpen },
          ]).map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={tab === key ? "neon" : "neon-outline"}
              size="sm"
              onClick={() => setTab(key)}
            >
              <Icon size={14} />
              {label}
            </Button>
          ))}
        </div>

        {tab === "users" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-4">
              <NeonText as="h3" glow className="text-lg">User Management</NeonText>
              <Button variant="neon" size="sm"><Plus size={14} /> Add User</Button>
            </div>

            <GlassCard className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left py-3 px-4 font-display text-xs tracking-wider text-muted-foreground uppercase">Name</th>
                    <th className="text-left py-3 px-4 font-display text-xs tracking-wider text-muted-foreground uppercase">Email</th>
                    <th className="text-left py-3 px-4 font-display text-xs tracking-wider text-muted-foreground uppercase">Status</th>
                    <th className="text-right py-3 px-4 font-display text-xs tracking-wider text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mockUsers.map((user) => (
                    <tr key={user.id} className="border-b border-border/10 hover:bg-secondary/20 transition-colors">
                      <td className="py-3 px-4 text-foreground">{user.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          user.status === "active"
                            ? "bg-neon-green/10 text-neon-green"
                            : "bg-destructive/10 text-destructive"
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          </motion.div>
        )}

        {tab === "courses" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-4">
              <NeonText as="h3" glow className="text-lg">Course Management</NeonText>
              <Button variant="neon" size="sm"><Plus size={14} /> New Course</Button>
            </div>

            <div className="space-y-4">
              {mockCourses.map((course) => (
                <GlassCard key={course.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <NeonText as="h4" glow className="text-sm mb-1">{course.title}</NeonText>
                    <p className="text-xs text-muted-foreground">{course.phases.length} phases • {course.phases.reduce((a, p) => a + p.lessons.length, 0)} lessons</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {course.phases.map((phase) => (
                      <Button key={phase.id} variant="neon-outline" size="sm" className="text-xs">
                        {phase.locked ? <Lock size={12} /> : <Unlock size={12} />}
                        {phase.title.replace(/Phase \d+ — /, "")}
                      </Button>
                    ))}
                    <Button variant="ghost" size="sm" className="text-neon-cyan">
                      <Upload size={12} /> Upload
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
