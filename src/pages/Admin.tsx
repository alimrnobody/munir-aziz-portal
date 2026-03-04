import { useState } from "react";
import { motion } from "framer-motion";
import { Users, BookOpen, Upload, Lock, Unlock, Trash2, Plus, ShieldCheck, UserCheck, UserX } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { GlassCard } from "@/components/GlassCard";
import { NeonText } from "@/components/NeonText";
import { Button } from "@/components/ui/button";
import { mockCourses } from "@/lib/mock-data";

type Tab = "users" | "courses";

const mockUsers = [
  { id: "1", email: "agent@elitesquad.io", name: "Agent Zero", status: "active" },
  { id: "2", email: "shadow@elitesquad.io", name: "Shadow", status: "active" },
  { id: "3", email: "ghost@elitesquad.io", name: "Ghost", status: "suspended" },
];

const Admin = () => {
  const [tab, setTab] = useState<Tab>("users");

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-10 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={14} className="text-primary" />
            <span className="text-[10px] font-display tracking-[0.4em] uppercase text-muted-foreground">
              CONTROL CENTER
            </span>
          </div>
          <NeonText gradient className="text-3xl sm:text-4xl mb-2">
            Admin Panel
          </NeonText>
          <p className="text-muted-foreground text-sm">Manage users, courses, and content.</p>
        </motion.div>

        {/* Tab bar */}
        <div className="flex gap-2 mb-8 p-1 glass rounded-xl w-fit">
          {([
            { key: "users" as Tab, label: "Users", icon: Users },
            { key: "courses" as Tab, label: "Courses", icon: BookOpen },
          ]).map(({ key, label, icon: Icon }) => (
            <Button 
              key={key} 
              variant={tab === key ? "neon" : "ghost"} 
              size="sm" 
              onClick={() => setTab(key)} 
              className={`gap-1.5 transition-all duration-300 ${tab !== key ? 'text-muted-foreground' : ''}`}
            >
              <Icon size={13} />
              {label}
            </Button>
          ))}
        </div>

        {tab === "users" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center justify-between mb-6">
              <NeonText as="h3" glow className="text-lg">User Management</NeonText>
              <Button variant="neon" size="sm" className="gap-1.5"><Plus size={13} /> Add User</Button>
            </div>
            <GlassCard glow className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/15">
                    <th className="text-left py-4 px-5 font-display text-[10px] tracking-[0.2em] text-muted-foreground/70 uppercase">Name</th>
                    <th className="text-left py-4 px-5 font-display text-[10px] tracking-[0.2em] text-muted-foreground/70 uppercase">Email</th>
                    <th className="text-left py-4 px-5 font-display text-[10px] tracking-[0.2em] text-muted-foreground/70 uppercase">Status</th>
                    <th className="text-right py-4 px-5 font-display text-[10px] tracking-[0.2em] text-muted-foreground/70 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mockUsers.map((user, i) => (
                    <motion.tr key={user.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                      className="border-b border-border/8 hover:bg-secondary/15 transition-colors duration-300 group">
                      <td className="py-4 px-5 text-foreground font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-secondary/40 flex items-center justify-center">
                            <span className="text-xs font-display text-primary">{user.name[0]}</span>
                          </div>
                          {user.name}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-muted-foreground font-mono text-xs">{user.email}</td>
                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-display tracking-wider px-3 py-1.5 rounded-full ${
                          user.status === "active"
                            ? "bg-primary/8 text-primary border border-primary/15"
                            : "bg-destructive/8 text-destructive border border-destructive/15"
                        }`}>
                          {user.status === "active" ? <UserCheck size={10} /> : <UserX size={10} />}
                          {user.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive transition-colors h-8 w-8 opacity-0 group-hover:opacity-100">
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
            <div className="flex items-center justify-between mb-6">
              <NeonText as="h3" glow className="text-lg">Course Management</NeonText>
              <Button variant="neon" size="sm" className="gap-1.5"><Plus size={13} /> New Course</Button>
            </div>
            <div className="space-y-4">
              {mockCourses.map((course, i) => (
                <GlassCard key={course.id} glow initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <NeonText as="h4" glow className="text-sm mb-1.5">{course.title}</NeonText>
                    <p className="text-xs text-muted-foreground font-mono">
                      {course.phases.length} phases • {course.phases.reduce((a, p) => a + p.lessons.length, 0)} lessons
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {course.phases.map((phase) => (
                      <Button key={phase.id} variant="neon-outline" size="sm" className="text-xs gap-1.5">
                        {phase.locked ? <Lock size={11} /> : <Unlock size={11} />}
                        {phase.title.replace(/Phase \d+ — /, "")}
                      </Button>
                    ))}
                    <Button variant="ghost" size="sm" className="text-primary gap-1.5 text-xs">
                      <Upload size={11} /> Upload
                    </Button>
                  </div>
                </GlassCard>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Admin;
