import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import EventCreate from "./pages/EventCreate";
import EventRegister from "./pages/EventRegister";
import Buzz from "./pages/Buzz";
import Rankboard from "./pages/Rankboard";
import Profile from "./pages/Profile";
import ProfileMenu from "./pages/ProfileMenu";
import Admin from "./pages/Admin";
import Organizer from "./pages/Organizer";
import OrganizerRegister from "./pages/OrganizerRegister";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import CrisisMode from "./pages/CrisisMode";
import ResearchBrowser from "./pages/ResearchBrowser";
import Chats from "./pages/Chats";
import OrganizerProfile from "./pages/OrganizerProfile";
import EBMarksheet from "./pages/EBMarksheet";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <ErrorBoundary>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/:id" element={<EventDetail />} />
                <Route path="/buzz" element={<Buzz />} />
                <Route path="/rankboard" element={<Rankboard />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/menu" element={<ProtectedRoute><ProfileMenu /></ProtectedRoute>} />
                <Route path="/chats" element={<ProtectedRoute><Chats /></ProtectedRoute>} />
                <Route path="/events/:id/register" element={<ProtectedRoute><EventRegister /></ProtectedRoute>} />
                <Route path="/research" element={<ProtectedRoute><ResearchBrowser /></ProtectedRoute>} />
                <Route path="/organizer/register" element={<ProtectedRoute><OrganizerRegister /></ProtectedRoute>} />

                <Route path="/events/create" element={<ProtectedRoute requiredRole="organizer"><EventCreate /></ProtectedRoute>} />
                <Route path="/organizer" element={<ProtectedRoute requiredRole="organizer"><Navigate to="/organizer/profile" replace /></ProtectedRoute>} />
                <Route path="/organizer/profile" element={<ProtectedRoute requiredRole="organizer"><OrganizerProfile /></ProtectedRoute>} />
                <Route path="/organizer/dashboard" element={<ProtectedRoute requiredRole="organizer"><Organizer /></ProtectedRoute>} />
                <Route path="/crisis" element={<ProtectedRoute requiredRole="eb"><CrisisMode /></ProtectedRoute>} />
                <Route path="/eb/marksheet" element={<ProtectedRoute requiredRole="eb"><EBMarksheet /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><Admin /></ProtectedRoute>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ErrorBoundary>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
