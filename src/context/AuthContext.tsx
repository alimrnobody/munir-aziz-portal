/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  status: string | null;
  avatar_url: string | null;
  session_version: number | null;
};

const SESSION_VERSION_STORAGE_KEY = "elite_session_version";
const SESSION_USER_STORAGE_KEY = "elite_session_user_id";
const SESSION_SYNC_PENDING_KEY = "elite_session_sync_pending";

const getStoredSessionVersion = (userId: string) => {
  const storedUserId = localStorage.getItem(SESSION_USER_STORAGE_KEY);
  const storedVersion = localStorage.getItem(SESSION_VERSION_STORAGE_KEY);

  if (storedUserId !== userId || storedVersion === null) {
    return null;
  }

  const parsed = Number(storedVersion);
  return Number.isFinite(parsed) ? parsed : null;
};

const storeSessionVersion = (userId: string, version: number | null) => {
  localStorage.setItem(SESSION_USER_STORAGE_KEY, userId);
  localStorage.setItem(SESSION_VERSION_STORAGE_KEY, String(version ?? 0));
};

const clearStoredSessionVersion = () => {
  localStorage.removeItem(SESSION_USER_STORAGE_KEY);
  localStorage.removeItem(SESSION_VERSION_STORAGE_KEY);
};

type AuthContextValue = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAuthenticated: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  isAuthenticated: false,
  refreshProfile: async () => undefined,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAuthState = useCallback(async (nextUser?: User | null) => {
    setLoading(true);

    const authUser = typeof nextUser !== "undefined"
      ? nextUser
      : (await supabase.auth.getUser()).data.user ?? null;

    setUser(authUser);

    if (!authUser) {
      setProfile(null);
      clearStoredSessionVersion();
      setLoading(false);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, name, email, role, status, avatar_url, session_version")
      .eq("id", authUser.id)
      .maybeSingle();

    if (profileError || !profileData) {
      clearStoredSessionVersion();
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    const typedProfile = profileData as Profile;
    if (typedProfile.status !== "active") {
      clearStoredSessionVersion();
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    const isSessionSyncPending = sessionStorage.getItem(SESSION_SYNC_PENDING_KEY) === "1";
    if (isSessionSyncPending) {
      setProfile(typedProfile);
      setLoading(false);
      return;
    }

    const storedSessionVersion = getStoredSessionVersion(authUser.id);
    const dbSessionVersion = typedProfile.session_version ?? 0;

    if (storedSessionVersion === null) {
      storeSessionVersion(authUser.id, dbSessionVersion);
    } else if (storedSessionVersion !== dbSessionVersion) {
      clearStoredSessionVersion();
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    setProfile(typedProfile);
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;

    const safeLoadAuthState = async (nextUser?: User | null) => {
      await loadAuthState(nextUser);
      if (!mounted) {
        return;
      }
    };

    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;
      await safeLoadAuthState(session?.user ?? null);
    };

    const handleProfileUpdated = () => {
      void safeLoadAuthState();
    };

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      void safeLoadAuthState(session?.user ?? null);
    });

    window.addEventListener("profile-updated", handleProfileUpdated);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener("profile-updated", handleProfileUpdated);
    };
  }, [loadAuthState]);

  const refreshProfile = useCallback(async () => {
    await loadAuthState();
  }, [loadAuthState]);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      isAuthenticated: Boolean(user && profile && profile.status === "active"),
      refreshProfile,
    }),
    [loading, profile, refreshProfile, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
