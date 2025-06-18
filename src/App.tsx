
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Conversas from "./pages/Conversas";
import ConectarWhatsApp from "./pages/ConectarWhatsApp";
import Contextualizar from "./pages/Contextualizar";
import GestaoUsuarios from "./pages/GestaoUsuarios";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
            <Route path="/conversas" element={<Layout><Conversas /></Layout>} />
            <Route path="/conectar-whatsapp" element={<Layout><ConectarWhatsApp /></Layout>} />
            <Route path="/contextualizar" element={<Layout><Contextualizar /></Layout>} />
            <Route path="/gestao-usuarios" element={<Layout><GestaoUsuarios /></Layout>} />
            <Route path="/configuracoes" element={<Layout><Configuracoes /></Layout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
