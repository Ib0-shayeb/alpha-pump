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
import { TrainerProfileEdit } from "./pages/TrainerProfileEdit";
import AITrainer from "./pages/AITrainer";
import { WorkoutSessionDetails } from "./pages/WorkoutSessionDetails";
import { RoutineDetails } from "./pages/RoutineDetails";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import EmailConfirmation from "./pages/EmailConfirmation";
import AuthWrapper from "./components/AuthWrapper";

const queryClient = new QueryClient();

const AppContent = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/confirm-email" element={<EmailConfirmation />} />
        <Route path="/" element={<AuthWrapper><Dashboard /></AuthWrapper>} />
        <Route path="/social" element={<AuthWrapper><Social /></AuthWrapper>} />
        <Route path="/discover" element={<AuthWrapper><Discover /></AuthWrapper>} />
        <Route path="/exercises" element={<AuthWrapper><Exercises /></AuthWrapper>} />
        <Route path="/routines" element={<AuthWrapper><WorkoutRoutines /></AuthWrapper>} />
        <Route path="/routines/create" element={<AuthWrapper><CreateRoutine /></AuthWrapper>} />
        <Route path="/routines/:id/edit" element={<AuthWrapper><EditRoutine /></AuthWrapper>} />
        <Route path="/start-workout" element={<AuthWrapper><StartWorkout /></AuthWrapper>} />
        <Route path="/custom-workout" element={<AuthWrapper><CustomWorkout /></AuthWrapper>} />
        <Route path="/active-workout" element={<AuthWrapper><ActiveWorkout /></AuthWrapper>} />
        <Route path="/inbox" element={<AuthWrapper><Inbox /></AuthWrapper>} />
        <Route path="/trainer" element={<AuthWrapper><TrainerView /></AuthWrapper>} />
        <Route path="/settings" element={<AuthWrapper><Settings /></AuthWrapper>} />
        <Route path="/ai-trainer" element={<AuthWrapper><AITrainer /></AuthWrapper>} />
        <Route path="/trainer/profile/edit" element={<AuthWrapper><TrainerProfileEdit /></AuthWrapper>} />
        <Route path="/trainer/:trainerId" element={<AuthWrapper><TrainerProfile /></AuthWrapper>} />
        <Route path="/trainer/client/:clientId" element={<AuthWrapper><ClientDetails /></AuthWrapper>} />
        <Route path="/workout-session/:sessionId" element={<AuthWrapper><WorkoutSessionDetails /></AuthWrapper>} />
        <Route path="/routine/:routineId/day/:dayId" element={<AuthWrapper><RoutineDetails /></AuthWrapper>} />
        <Route path="/workouts" element={<AuthWrapper><Dashboard /></AuthWrapper>} />
        <Route path="/profile" element={<AuthWrapper><Dashboard /></AuthWrapper>} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
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
