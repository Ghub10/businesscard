import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useLocation } from "react-router-dom";
import App from "./App.tsx";
import { PreferenceTogglesFloating } from "./components/PreferenceToggles.tsx";
import { PreferencesProvider } from "./context/PreferencesContext.tsx";
import "./index.css";

function AppShell() {
  const { pathname } = useLocation();
  const onPublicCard = /^\/p\/[^/]+$/.test(pathname);
  return (
    <>
      <App />
      {!onPublicCard ? <PreferenceTogglesFloating /> : null}
    </>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <PreferencesProvider>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </PreferencesProvider>
    </QueryClientProvider>
  </StrictMode>
);
