import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

const queryClient = new QueryClient();

/**
 * Bundles non-critical global providers (react-query, toasts, tooltips) into a
 * single chunk that is loaded after the page becomes interactive. Keeping these
 * out of the initial bundle reduces main-thread parse/eval cost on first paint.
 */
const DeferredProviders = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
    </TooltipProvider>
  </QueryClientProvider>
);

export default DeferredProviders;
