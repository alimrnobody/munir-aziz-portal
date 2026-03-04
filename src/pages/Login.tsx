import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Eye, EyeOff, ArrowRight, Fingerprint, Lock } from "lucide-react";
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
  const [statusText, setStatusText] = useState("SYSTEM READY");

  useEffect(() => {
    const texts = ["SYSTEM READY", "AWAITING CREDENTIALS", "SECURE CONNECTION"];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % texts.length;
      setStatusText(texts[i]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusText("AUTHENTICATING...");
    setTimeout(() => {
      setLoading(false);
      navigate("/dashboard");
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background layers */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Grid */}
        <div className="absolute inset-0 cyber-grid opacity-40" />
        
        {/* Floating orbs */}
        <motion.div
          animate={{ 
            scale: [1, 1.4, 1], 
            opacity: [0.06, 0.18, 0.06],
            x: [0, 30, 0],
            y: [0, -20, 0]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary rounded-full blur-[200px]"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.3, 1], 
            opacity: [0.04, 0.12, 0.04],
            x: [0, -20, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-neon-pink rounded-full blur-[180px]"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1], 
            opacity: [0.03, 0.08, 0.03],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute top-1/2 right-1/3 w-[400px] h-[400px] bg-neon-blue rounded-full blur-[160px]"
        />

        {/* Particle field */}
        <div className="absolute inset-0 particle-field" />
      </div>

      {/* Login card */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="glass-strong rounded-3xl p-8 sm:p-12 w-full max-w-md relative overflow-hidden gradient-border"
      >
        {/* Scan line effect */}
        <div className="absolute inset-0 scan-line pointer-events-none opacity-20" />
        
        {/* Holographic shimmer */}
        <div className="absolute inset-0 gradient-holographic pointer-events-none opacity-30" />

        <div className="relative z-10">
          {/* Logo section */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 180, damping: 15 }}
              className="relative inline-flex"
            >
              <div className="w-24 h-24 mx-auto mb-8 rounded-2xl gradient-neon flex items-center justify-center animate-pulse-glow relative">
                <Shield size={40} className="text-primary-foreground" />
                <div className="absolute -inset-3 rounded-3xl gradient-neon opacity-15 blur-xl" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <NeonText gradient className="text-2xl sm:text-3xl mb-2 tracking-widest">
                ELITE SQUAD
              </NeonText>
              <div className="text-[10px] font-display tracking-[0.5em] text-muted-foreground uppercase mb-6">
                BY MR NOBODY
              </div>
              
              {/* Status indicator */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/30 border border-border/20">
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-primary"
                />
                <AnimatePresence mode="wait">
                  <motion.span
                    key={statusText}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-[9px] font-mono tracking-widest text-muted-foreground"
                  >
                    {statusText}
                  </motion.span>
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-2"
            >
              <label className="text-[10px] font-display tracking-[0.3em] text-muted-foreground uppercase flex items-center gap-2">
                <Fingerprint size={10} className="text-primary" />
                Identifier
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@elitesquad.io"
                required
                className="bg-secondary/30 border-border/30 focus:border-primary/60 focus:ring-primary/20 h-12 rounded-xl font-mono text-sm placeholder:text-muted-foreground/40"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="space-y-2"
            >
              <label className="text-[10px] font-display tracking-[0.3em] text-muted-foreground uppercase flex items-center gap-2">
                <Lock size={10} className="text-primary" />
                Access Key
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="bg-secondary/30 border-border/30 focus:border-primary/60 focus:ring-primary/20 pr-12 h-12 rounded-xl placeholder:text-muted-foreground/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors duration-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="pt-2"
            >
              <Button type="submit" variant="neon" size="lg" className="w-full h-13 rounded-xl text-sm tracking-[0.2em]" disabled={loading}>
                {loading ? (
                  <motion.div className="flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                    />
                    <span className="tracking-[0.3em]">VERIFYING...</span>
                  </motion.div>
                ) : (
                  <span className="flex items-center gap-3">
                    ACCESS PORTAL
                    <ArrowRight size={16} />
                  </span>
                )}
              </Button>
            </motion.div>
          </form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center mt-8 space-y-2"
          >
            <div className="h-px w-full bg-gradient-to-r from-transparent via-border/40 to-transparent" />
            <p className="text-[9px] text-muted-foreground/50 font-mono tracking-wider pt-2">
              ENCRYPTED • SINGLE DEVICE • MONITORED
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
