import { useEffect, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const SESSION_SYNC_PENDING_KEY = "elite_session_sync_pending";

type AuthRouteGuardProps = {
  children: JSX.Element;
};

export const AuthRouteGuard = ({ children }: AuthRouteGuardProps) => {
  const { loading, isAuthenticated, user, refreshProfile } = useAuth();
  const location = useLocation();
  const isSessionSyncPending = sessionStorage.getItem(SESSION_SYNC_PENDING_KEY) === "1";
  const lastValidatedPathRef = useRef<string | null>(null);
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId || isSessionSyncPending) {
      return;
    }

    if (lastValidatedPathRef.current === location.pathname) {
      return;
    }

    lastValidatedPathRef.current = location.pathname;
    void refreshProfile();
  }, [isSessionSyncPending, location.pathname, refreshProfile, userId]);

  if (loading || isSessionSyncPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Verifying session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
