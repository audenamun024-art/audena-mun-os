import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import EventCreate from "./pages/EventCreate";
import EventRegister from "./pages/EventRegister";
import Buzz from "./pages/Buzz";
import Rankboard from "./pages/Rankboard";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Organizer from "./pages/Organizer";
import OrganizerRegister from "./pages/OrganizerRegister";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import CrisisMode from "./pages/CrisisMode";
import ResearchBrowser from "./pages/ResearchBrowser";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/events/:id/register" element={<EventRegister />} />
            <Route path="/events/create" element={<EventCreate />} />
            <Route path="/buzz" element={<Buzz />} />
            <Route path="/rankboard" element={<Rankboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/organizer" element={<Organizer />} />
            <Route path="/organizer/register" element={<OrganizerRegister />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/crisis" element={<CrisisMode />} />
            <Route path="/research" element={<ResearchBrowser />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

