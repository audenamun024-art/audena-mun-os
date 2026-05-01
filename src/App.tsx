import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import ErrorBoundary from "@/components/ErrorBoundary";
import RequireAuth from "@/components/auth/RequireAuth";
import Index from "./pages/Index";
import Buzz from "./pages/Buzz";
import Explore from "./pages/Explore";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";
import ProfileMenu from "./pages/ProfileMenu";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Chats from "./pages/Chats";
import Events from "./pages/Events";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
      <AuthProvider>
        <TooltipProvider>
          <ErrorBoundary>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public auth routes */}
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Hard gate — everything else requires login */}
                <Route path="/" element={<RequireAuth><Index /></RequireAuth>} />
                <Route path="/buzz" element={<RequireAuth><Buzz /></RequireAuth>} />
                <Route path="/explore" element={<RequireAuth><Explore /></RequireAuth>} />
                <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
                <Route path="/profile/:userId" element={<RequireAuth><PublicProfile /></RequireAuth>} />
                <Route path="/menu" element={<RequireAuth><ProfileMenu /></RequireAuth>} />
                <Route path="/chats" element={<RequireAuth><Chats /></RequireAuth>} />
                <Route path="/events" element={<RequireAuth><Events /></RequireAuth>} />
                {/* Public admin panel — no auth required */}
                <Route path="/admin" element={<Admin />} />

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
