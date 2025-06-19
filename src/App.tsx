
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import Auth from "./pages/Auth";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Conversas from "./pages/Conversas";
import ConversaIndividual from "./pages/ConversaIndividual";
import ConectarWhatsApp from "./pages/ConectarWhatsApp";
import Contextualizar from "./pages/Contextualizar";
import GestaoUsuarios from "./pages/GestaoUsuarios";
import Configuracoes from "./pages/Configuracoes";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Auth state changed:', session ? 'SIGNED_IN' : 'SIGNED_OUT', session?.user?.id);
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', session ? 'SIGNED_IN' : 'SIGNED_OUT', session?.user?.id);
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
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
