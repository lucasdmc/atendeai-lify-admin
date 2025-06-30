import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LoadingPage } from "@/components/ui/loading";
import Auth from "./pages/Auth";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Conversas from "./pages/Conversas";
import ConversaIndividual from "./pages/ConversaIndividual";
import ConectarWhatsApp from "./pages/ConectarWhatsApp";
import Contextualizar from "./pages/Contextualizar";
import GestaoUsuarios from "./pages/GestaoUsuarios";
import Agendamentos from "./pages/Agendamentos";
import Configuracoes from "./pages/Configuracoes";
import Clinicas from "./pages/Clinicas";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Agentes from "./pages/Agentes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

const App = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return <LoadingPage text="Carregando aplicação..." />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
