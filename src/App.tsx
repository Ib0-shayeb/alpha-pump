import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Exercises from "./pages/Exercises";
import Auth from "./pages/Auth";
import CreateRoutine from "./pages/CreateRoutine";
import StartWorkout from "./pages/StartWorkout";
import CustomWorkout from "./pages/CustomWorkout";
import ActiveWorkout from "./pages/ActiveWorkout";
import WorkoutRoutines from "./pages/WorkoutRoutines";
import { Inbox } from "./pages/Inbox";
import { TrainerView } from "./pages/TrainerView";
import { ClientDetails } from "./pages/ClientDetails";
import NotFound from "./pages/NotFound";
import AuthWrapper from "./components/AuthWrapper";

const queryClient = new QueryClient();

const AppContent = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<AuthWrapper><Dashboard /></AuthWrapper>} />
        <Route path="/exercises" element={<AuthWrapper><Exercises /></AuthWrapper>} />
        <Route path="/routines" element={<AuthWrapper><WorkoutRoutines /></AuthWrapper>} />
        <Route path="/routines/create" element={<AuthWrapper><CreateRoutine /></AuthWrapper>} />
        <Route path="/start-workout" element={<AuthWrapper><StartWorkout /></AuthWrapper>} />
        <Route path="/custom-workout" element={<AuthWrapper><CustomWorkout /></AuthWrapper>} />
        <Route path="/active-workout" element={<AuthWrapper><ActiveWorkout /></AuthWrapper>} />
        <Route path="/inbox" element={<AuthWrapper><Inbox /></AuthWrapper>} />
        <Route path="/trainer" element={<AuthWrapper><TrainerView /></AuthWrapper>} />
        <Route path="/trainer/client/:clientId" element={<AuthWrapper><ClientDetails /></AuthWrapper>} />
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
