import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Fingerprint, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const SESSION_VERSION_STORAGE_KEY = "elite_session_version";
const SESSION_USER_STORAGE_KEY = "elite_session_user_id";
const SESSION_SYNC_PENDING_KEY = "elite_session_sync_pending";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("SYSTEM READY");
  const [errorMessage, setErrorMessage] = useState("");

  const validateLoginInputs = (rawEmail: string, rawPassword: string) => {
    const trimmedEmail = rawEmail.trim().toLowerCase();
    const trimmedPassword = rawPassword.trim();

    if (!trimmedEmail) {
      return {
        valid: false,
        email: trimmedEmail,
        password: trimmedPassword,
        error: "Email is required",
      };
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      return {
        valid: false,
        email: trimmedEmail,
        password: trimmedPassword,
        error: "Enter a valid email address",
      };
    }

    if (!trimmedPassword) {
      return {
        valid: false,
        email: trimmedEmail,
        password: trimmedPassword,
        error: "Password is required",
      };
    }

    return {
      valid: true,
      email: trimmedEmail,
      password: trimmedPassword,
      error: "",
    };
  };

  const validateAuthorizedEmail = useCallback(
    async (user: User, rotateSessionVersion = false) => {
      if (!user.id) {
        sessionStorage.removeItem(SESSION_SYNC_PENDING_KEY);
        await supabase.auth.signOut();
        setErrorMessage("Access not granted by administrator");
        setStatusText("AUTH FAILED");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, status, session_version")
        .eq("id", user.id)
        .single();

      if (error || !profile) {
        sessionStorage.removeItem(SESSION_SYNC_PENDING_KEY);
        await supabase.auth.signOut();
        setErrorMessage("Access not granted by administrator");
        setStatusText("AUTH FAILED");
        return;
      }

      if (profile.status !== "active") {
        sessionStorage.removeItem(SESSION_SYNC_PENDING_KEY);
        await supabase.auth.signOut();
        setErrorMessage("Your account is not active");
        setStatusText("AUTH FAILED");
        return;
      }

      if (rotateSessionVersion) {
        const nextSessionVersion = (profile.session_version ?? 0) + 1;
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ session_version: nextSessionVersion })
          .eq("id", user.id);

        if (updateError) {
          sessionStorage.removeItem(SESSION_SYNC_PENDING_KEY);
          await supabase.auth.signOut();
          setErrorMessage(updateError.message || "Unable to activate secure session");
          setStatusText("AUTH FAILED");
          return;
        }

        localStorage.setItem(SESSION_USER_STORAGE_KEY, user.id);
        localStorage.setItem(SESSION_VERSION_STORAGE_KEY, String(nextSessionVersion));
        sessionStorage.removeItem(SESSION_SYNC_PENDING_KEY);
        window.dispatchEvent(new Event("profile-updated"));
      } else {
        sessionStorage.removeItem(SESSION_SYNC_PENDING_KEY);
      }

      navigate("/dashboard", { replace: true });
    },
    [navigate]
  );

  useEffect(() => {
    const texts = ["SYSTEM READY", "AWAITING CREDENTIALS", "SECURE CONNECTION"];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % texts.length;
      setStatusText(texts[i]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkExistingSession = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        sessionStorage.removeItem(SESSION_SYNC_PENDING_KEY);
        return;
      }

      await validateAuthorizedEmail(data.user, false);
    };

    void checkExistingSession();
  }, [validateAuthorizedEmail]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateLoginInputs(email, password);
    setEmail(validation.email);
    setPassword(validation.password);
    setErrorMessage("");

    if (!validation.valid) {
      setStatusText("AUTH FAILED");
      setErrorMessage(validation.error);
      return;
    }

    setLoading(true);
    setStatusText("AUTHENTICATING...");
    sessionStorage.setItem(SESSION_SYNC_PENDING_KEY, "1");

    const { error } = await supabase.auth.signInWithPassword({
      email: validation.email,
      password: validation.password,
    });

    if (error) {
      sessionStorage.removeItem(SESSION_SYNC_PENDING_KEY);
      setLoading(false);
      setStatusText("AUTH FAILED");
      setErrorMessage(error.message || "Unable to sign in");
      return;
    }

    setLoading(false);
    setStatusText("ACCESS GRANTED");

    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      sessionStorage.removeItem(SESSION_SYNC_PENDING_KEY);
      setStatusText("AUTH FAILED");
      setErrorMessage("Unable to verify account after login.");
      return;
    }

    await validateAuthorizedEmail(data.user, true);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 cyber-grid opacity-40" />

        <motion.div
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.06, 0.18, 0.06],
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-1/4 top-1/4 h-[600px] w-[600px] rounded-full bg-primary blur-[200px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.04, 0.12, 0.04],
            x: [0, -20, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 right-1/4 h-[500px] w-[500px] rounded-full bg-neon-pink blur-[180px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.03, 0.08, 0.03],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute right-1/3 top-1/2 h-[400px] w-[400px] rounded-full bg-neon-blue blur-[160px]"
        />

        <div className="absolute inset-0 particle-field" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="gradient-border glass-strong relative w-full max-w-md overflow-hidden rounded-3xl p-8 sm:px-12 sm:py-8"
      >
        <div className="pointer-events-none absolute inset-0 scan-line opacity-20" />
        <div className="pointer-events-none absolute inset-0 gradient-holographic opacity-30" />

        <div className="relative z-10">
          <div className="mb-12 text-center">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <img
                src="/munir-logo.png"
                alt="Munir Aziz LMS Portal"
                className="mx-auto mb-6 h-auto max-w-[260px] object-contain sm:max-w-[300px]"
              />

              <div className="inline-flex items-center gap-2 rounded-full border border-border/20 bg-secondary/30 px-4 py-1.5">
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="h-1.5 w-1.5 rounded-full bg-primary"
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
              <label className="flex items-center gap-2 text-[10px] font-display uppercase tracking-[0.3em] text-muted-foreground">
                <Fingerprint size={10} className="text-primary" />
                Identifier
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@elitesquad.io"
                required
                className="h-12 rounded-xl border-border/30 bg-secondary/30 font-mono text-sm placeholder:text-muted-foreground/40 focus:border-primary/60 focus:ring-primary/20"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="space-y-2"
            >
              <label className="flex items-center gap-2 text-[10px] font-display uppercase tracking-[0.3em] text-muted-foreground">
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
                  className="h-12 rounded-xl border-border/30 bg-secondary/30 pr-12 placeholder:text-muted-foreground/40 focus:border-primary/60 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-visibility-btn absolute right-4 top-1/2 -translate-y-1/2 transition-colors duration-300"
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
              <button
                type="submit"
                className="flex h-[52px] w-full items-center justify-center rounded-xl font-semibold text-white transition-all duration-200 ease-in-out hover:-translate-y-px hover:bg-[#441FD1] disabled:opacity-70 disabled:hover:translate-y-0"
                style={{
                  backgroundColor: "#5627FF",
                  letterSpacing: "0.08em",
                }}
                disabled={loading}
              >
                {loading ? (
                  <motion.div className="flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"
                    />
                    <span className="tracking-[0.3em]">VERIFYING...</span>
                  </motion.div>
                ) : (
                  <span>ACCESS PORTAL →</span>
                )}
              </button>
            </motion.div>

            {errorMessage && <p className="text-center text-xs text-destructive">{errorMessage}</p>}
          </form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8 space-y-2 text-center"
          >
            <div className="h-px w-full bg-gradient-to-r from-transparent via-border/40 to-transparent" />
            <p className="pt-2 font-mono text-[9px] tracking-wider text-muted-foreground/50">
              ENCRYPTED • SINGLE DEVICE • MONITORED
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
