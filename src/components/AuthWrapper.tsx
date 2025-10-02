import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { ProfileCompletionForm } from "@/components/ProfileCompletionForm";

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper = ({ children }: AuthWrapperProps) => {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading, isComplete, markComplete } = useProfileCompletion();
  const navigate = useNavigate();
  const location = useLocation();

  // Allow access to auth and email confirmation pages without authentication
  const isPublicRoute = location.pathname === "/auth" || location.pathname === "/confirm-email";

  useEffect(() => {
    if (!loading && !user && !isPublicRoute) {
      navigate("/auth");
    }
  }, [user, loading, navigate, isPublicRoute]);

  // For public routes, just render children
  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Show profile completion form if profile is incomplete (but not while still loading)
  if (!profileLoading && !isComplete) {
    return <ProfileCompletionForm onComplete={markComplete} />;
  }

  return <>{children}</>;
};

export default AuthWrapper;