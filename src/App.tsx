import { BrowserRouter, Route, Routes } from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";
import Index from "./pages/Index.tsx";

const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const ParentPortal = lazy(() => import("./pages/ParentPortal.tsx"));
const TeacherInbox = lazy(() => import("./pages/TeacherInbox.tsx"));
const Galeria = lazy(() => import("./pages/Galeria.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.tsx"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy.tsx"));

// Defer global UI providers (toasts, tooltips) until after the page is interactive.
const DeferredProviders = lazy(() => import("./components/DeferredProviders"));

const App = () => {
  const [providersReady, setProvidersReady] = useState(false);

  useEffect(() => {
    const trigger = () => setProvidersReady(true);
    const idle = (window as any).requestIdleCallback;
    const handle = idle
      ? idle(trigger, { timeout: 4000 })
      : window.setTimeout(trigger, 2500);
    return () => {
      if (idle && (window as any).cancelIdleCallback) {
        (window as any).cancelIdleCallback(handle);
      } else {
        clearTimeout(handle as number);
      }
    };
  }, []);

  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/portal-padres" element={<ParentPortal />} />
          <Route path="/admin/mensajes" element={<TeacherInbox />} />
          <Route path="/galeria" element={<Galeria />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/privacidad" element={<PrivacyPolicy />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      {providersReady && (
        <Suspense fallback={null}>
          <DeferredProviders />
        </Suspense>
      )}
    </BrowserRouter>
  );
};

export default App;
