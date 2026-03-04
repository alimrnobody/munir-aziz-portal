import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Eye, EyeOff } from "lucide-react";
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
    // Mock login — will be replaced with Supabase auth
    setTimeout(() => {
      setLoading(false);
      navigate("/dashboard");
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 cyber-grid">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-neon-pink/10 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-strong rounded-2xl p-8 w-full max-w-md relative overflow-hidden"
      >
        {/* Gradient border top */}
        <div className="absolute top-0 left-0 right-0 h-0.5 gradient-neon" />

        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-neon flex items-center justify-center animate-pulse-glow"
          >
            <Shield size={32} className="text-primary-foreground" />
          </motion.div>

          <NeonText gradient className="text-2xl mb-2">
            MR NOBODY SQUAD
          </NeonText>
          <p className="text-sm text-muted-foreground">Access the private training portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-display tracking-wider text-muted-foreground uppercase">
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="agent@mrnobody.squad"
              required
              className="bg-secondary/50 border-border/50 focus:border-primary focus:ring-primary/20"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-display tracking-wider text-muted-foreground uppercase">
              Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-secondary/50 border-border/50 focus:border-primary focus:ring-primary/20 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <Button type="submit" variant="neon" size="lg" className="w-full" disabled={loading}>
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
              />
            ) : (
              "ACCESS PORTAL"
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
