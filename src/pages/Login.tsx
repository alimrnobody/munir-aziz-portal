import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NeonText } from "@/components/NeonText";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/dashboard");
    }, 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 cyber-grid particle-field relative overflow-hidden">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.08, 0.15, 0.08] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-primary rounded-full blur-[180px]"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.06, 0.12, 0.06] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-neon-pink rounded-full blur-[150px]"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="glass-strong rounded-3xl p-8 sm:p-10 w-full max-w-md relative overflow-hidden gradient-border"
      >
        {/* Scan line effect */}
        <div className="absolute inset-0 scan-line pointer-events-none opacity-30" />

        <div className="relative z-10">
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 mx-auto mb-6 rounded-2xl gradient-neon flex items-center justify-center animate-pulse-glow relative"
            >
              <Shield size={36} className="text-primary-foreground" />
              <div className="absolute -inset-2 rounded-3xl gradient-neon opacity-20 blur-lg" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <NeonText gradient className="text-2xl sm:text-3xl mb-1">
                ELITE SQUAD
              </NeonText>
              <div className="text-[10px] font-display tracking-[0.5em] text-muted-foreground uppercase mb-4">
                BY MR NOBODY
              </div>
              <p className="text-sm text-muted-foreground">
                Authenticate to access the portal
              </p>
            </motion.div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-2"
            >
              <label className="text-[10px] font-display tracking-[0.3em] text-muted-foreground uppercase">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@mrnobody.squad"
                required
                className="bg-secondary/40 border-border/40 focus:border-primary focus:ring-primary/20 h-12 rounded-xl font-mono text-sm"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-2"
            >
              <label className="text-[10px] font-display tracking-[0.3em] text-muted-foreground uppercase">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  required
                  className="bg-secondary/40 border-border/40 focus:border-primary focus:ring-primary/20 pr-12 h-12 rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Button type="submit" variant="neon" size="lg" className="w-full h-12 rounded-xl text-sm tracking-wider" disabled={loading}>
                {loading ? (
                  <motion.div className="flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                    />
                    <span>AUTHENTICATING...</span>
                  </motion.div>
                ) : (
                  <span className="flex items-center gap-2">
                    ACCESS PORTAL
                    <ArrowRight size={16} />
                  </span>
                )}
              </Button>
            </motion.div>
          </form>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-center text-[10px] text-muted-foreground/60 mt-6 font-display tracking-wider"
          >
            SINGLE DEVICE • ENCRYPTED • MONITORED
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
