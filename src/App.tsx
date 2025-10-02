import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Exercises from "./pages/Exercises";
import Auth from "./pages/Auth";
import CreateRoutine from "./pages/CreateRoutine";
import EditRoutine from "./pages/EditRoutine";
import StartWorkout from "./pages/StartWorkout";
import CustomWorkout from "./pages/CustomWorkout";
import ActiveWorkout from "./pages/ActiveWorkout";
import WorkoutRoutines from "./pages/WorkoutRoutines";
import Social from "./pages/Social";
import Discover from "./pages/Discover";
import { Inbox } from "./pages/Inbox";
import { TrainerView } from "./pages/TrainerView";
import { ClientDetails } from "./pages/ClientDetails";
import { TrainerProfile } from "./components/TrainerProfile";
import { UserProfile } from "./components/UserProfile";
import UserProfilePage from "./pages/UserProfilePage";
import FollowersPage from "./pages/FollowersPage";
import EditProfilePage from "./pages/EditProfilePage";
import MessagesPage from "./pages/MessagesPage";
import { TrainerProfileEdit } from "./pages/TrainerProfileEdit";
import AITrainer from "./pages/AITrainer";
import { WorkoutSessionDetails } from "./pages/WorkoutSessionDetails";
import { RoutineDetails } from "./pages/RoutineDetails";
import PostPage from "./pages/PostPage";
import ExercisePage from "./pages/ExercisePage";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import EmailConfirmation from "./pages/EmailConfirmation";
import AuthWrapper from "./components/AuthWrapper";

const queryClient = new QueryClient();

const AppContent = () => {
  return (
    <BrowserRouter>
      <AuthWrapper>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/confirm-email" element={<EmailConfirmation />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/social" element={<Social />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/exercises" element={<Exercises />} />
          <Route path="/routines" element={<WorkoutRoutines />} />
          <Route path="/routines/create" element={<CreateRoutine />} />
          <Route path="/routines/:id/edit" element={<EditRoutine />} />
          <Route path="/start-workout" element={<StartWorkout />} />
          <Route path="/custom-workout" element={<CustomWorkout />} />
          <Route path="/active-workout" element={<ActiveWorkout />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/trainer" element={<TrainerView />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/ai-trainer" element={<AITrainer />} />
          <Route path="/trainer/profile/edit" element={<TrainerProfileEdit />} />
          <Route path="/trainer/:trainerId" element={<TrainerProfile />} />
          <Route path="/profile" element={<UserProfilePage />} />
          <Route path="/profile/edit" element={<EditProfilePage />} />
          <Route path="/profile/followers" element={<FollowersPage />} />
          <Route path="/profile/:userId" element={<UserProfile />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/messages/:userId" element={<MessagesPage />} />
          <Route path="/trainer/client/:clientId" element={<ClientDetails />} />
          <Route path="/workout-session/:sessionId" element={<WorkoutSessionDetails />} />
          <Route path="/routine/:routineId/day/:dayId" element={<RoutineDetails />} />
          <Route path="/post/:postId" element={<PostPage />} />
          <Route path="/exercise/:exerciseId" element={<ExercisePage />} />
          <Route path="/workouts" element={<Dashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthWrapper>
    </BrowserRouter>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
