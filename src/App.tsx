import { Suspense, lazy, useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LoadingPage } from "@/components/ui/loading";
import { ClinicProvider } from "@/contexts/ClinicContext";

// Lazy loading para melhorar performance
const Auth = lazy(() => import("./pages/Auth"));
const Layout = lazy(() => import("./components/Layout"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Conversas = lazy(() => import("./pages/Conversas"));
const ConversaIndividual = lazy(() => import("./pages/ConversaIndividual"));
const ConectarWhatsApp = lazy(() => import("./pages/ConectarWhatsApp"));
const Contextualizar = lazy(() => import("./pages/Contextualizar"));
const GestaoUsuarios = lazy(() => import("./pages/GestaoUsuarios"));
const Agendamentos = lazy(() => import("./pages/Agendamentos"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const Clinicas = lazy(() => import("./pages/Clinicas"));
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Agentes = lazy(() => import("./pages/Agentes"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos (antigo cacheTime)
    },
    mutations: {
      retry: 1,
    },
  },
});

// Componente de loading otimizado
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

const App = () => {
  const { session, loading } = useAuth();
  const [appTimeout, setAppTimeout] = useState(false);

  // Timeout de segurança para evitar loading infinito
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ App loading timeout - forcing render');
        setAppTimeout(true);
      }
    }, 15000); // 15 segundos

    return () => clearTimeout(timer);
  }, [loading]);

  if (loading && !appTimeout) {
    return <LoadingPage text="Carregando aplicação..." />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ClinicProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {!session ? (
                  <>
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/" element={<Index />} />
                    <Route path="*" element={<Navigate to="/auth" replace />} />
                  </>
                ) : (
                  <>
                    <Route path="/auth" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route
                      path="/dashboard"
                      element={
                        <Layout>
                          <Dashboard />
                        </Layout>
                      }
                    />
                    <Route
                      path="/conversas"
                      element={
                        <Layout>
                          <Conversas />
                        </Layout>
                      }
                    />
                    <Route
                      path="/conversas/:conversationId"
                      element={
                        <Layout>
                          <ConversaIndividual />
                        </Layout>
                      }
                    />
                    <Route
                      path="/conectar-whatsapp"
                      element={
                        <Layout>
                          <ConectarWhatsApp />
                        </Layout>
                      }
                    />
                    <Route
                      path="/agentes"
                      element={
                        <Layout>
                          <Agentes />
                        </Layout>
                      }
                    />
                    <Route
                      path="/clinicas"
                      element={
                        <Layout>
                          <Clinicas />
                        </Layout>
                      }
                    />
                    <Route
                      path="/contextualizar"
                      element={
                        <Layout>
                          <Contextualizar />
                        </Layout>
                      }
                    />
                    <Route
                      path="/gestao-usuarios"
                      element={
                        <Layout>
                          <GestaoUsuarios />
                        </Layout>
                      }
                    />
                    <Route
                      path="/agendamentos"
                      element={
                        <Layout>
                          <Agendamentos />
                        </Layout>
                      }
                    />
                    <Route
                      path="/configuracoes"
                      element={
                        <Layout>
                          <Configuracoes />
                        </Layout>
                      }
                    />
                    <Route path="*" element={<NotFound />} />
                  </>
                )}
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ClinicProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
