import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LoadingOptimized } from "@/components/ui/loading-optimized";
import { ClinicProvider } from "@/contexts/ClinicContext";
import { ConversationProvider } from "@/contexts/ConversationContext";
import ErrorBoundary from "@/components/ErrorBoundary";

// Importações diretas para resolver problema de carregamento
import Auth from "./pages/Auth";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Conversas from "./pages/Conversas";
import ConversaIndividual from "./pages/ConversaIndividual";
import Contextualizar from "./pages/Contextualizar";
import GestaoUsuarios from "./pages/GestaoUsuarios";
import Agendamentos from "./pages/Agendamentos";
import Clinicas from "./pages/Clinicas";
import RequirePermission from "@/components/RequirePermission";
import AIDashboard from "./pages/AIDashboard";
import Simulacao from "./pages/Simulacao";
import WhatsAppAITest from "./pages/WhatsAppAITest";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos (substituído cacheTime por gcTime)
    },
    mutations: {
      retry: 1,
    },
  },
});



const App = () => {
  const { session, loading } = useAuth();
  const [appTimeout, setAppTimeout] = useState(false);

  // Timeout de segurança reduzido para melhor performance
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ App loading timeout - forcing render');
        setAppTimeout(true);
      }
    }, 5000); // Reduzido para 5 segundos

    return () => clearTimeout(timer);
  }, [loading]);

  // Mostrar loading otimizado durante carregamento inicial
  if (loading && !appTimeout) {
    return (
      <LoadingOptimized 
        isLoading={true}
        message="Inicializando AtendeAI..."
        showProgress={true}
        timeout={3000}
      />
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ClinicProvider>
          <ConversationProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ErrorBoundary>
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
                      path="/clinicas"
                      element={
                        <Layout>
                          <RequirePermission module="clinicas">
                            <Clinicas />
                          </RequirePermission>
                        </Layout>
                      }
                    />
                    <Route
                      path="/contextualizar"
                      element={
                        <Layout>
                          <RequirePermission module="contextualizar">
                            <Contextualizar />
                          </RequirePermission>
                        </Layout>
                      }
                    />
                    <Route
                      path="/gestao-usuarios"
                      element={
                        <Layout>
                          <RequirePermission module="gestao_usuarios">
                            <GestaoUsuarios />
                          </RequirePermission>
                        </Layout>
                      }
                    />
                    <Route
                      path="/agendamentos"
                      element={
                        <Layout>
                          <RequirePermission module="agendamentos">
                            <Agendamentos />
                          </RequirePermission>
                        </Layout>
                      }
                    />
                    <Route
                      path="/ai-dashboard"
                      element={
                        <Layout>
                          <AIDashboard />
                        </Layout>
                      }
                    />
                    <Route
                      path="/simulacao"
                      element={
                        <Layout>
                          <Simulacao />
                        </Layout>
                      }
                    />
                    <Route
                      path="/simulacao/:conversationId"
                      element={
                        <Layout>
                          <Simulacao />
                        </Layout>
                      }
                    />
                    <Route
                      path="/whatsapp-ai-test"
                      element={
                        <Layout>
                          <WhatsAppAITest />
                        </Layout>
                      }
                    />
                    <Route path="*" element={<NotFound />} />
                  </>
                )}
              </Routes>
            </ErrorBoundary>
          </BrowserRouter>
            </ConversationProvider>
        </ClinicProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
