import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

type AdminRouteGuardProps = {
  children: JSX.Element;
};

export const AdminRouteGuard = ({ children }: AdminRouteGuardProps) => {
  const { loading, isAuthenticated, profile } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Verifying admin access...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (profile?.role !== "admin" && profile?.role !== "owner") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
