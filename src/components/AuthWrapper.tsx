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

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

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

  // Show profile completion form if profile is incomplete
  if (!isComplete && location.pathname !== "/auth") {
    return <ProfileCompletionForm onComplete={markComplete} />;
  }

  return <>{children}</>;
};

export default AuthWrapper;