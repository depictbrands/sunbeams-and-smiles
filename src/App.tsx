import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import Index from "./pages/Index.tsx";

const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const ParentPortal = lazy(() => import("./pages/ParentPortal.tsx"));
const TeacherInbox = lazy(() => import("./pages/TeacherInbox.tsx"));
const Galeria = lazy(() => import("./pages/Galeria.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.tsx"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/portal-padres" element={<ParentPortal />} />
            <Route path="/admin/mensajes" element={<TeacherInbox />} />
            <Route path="/galeria" element={<Galeria />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
