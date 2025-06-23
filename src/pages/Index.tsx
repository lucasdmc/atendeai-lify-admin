
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Sparkles, Bot, MessageSquare, BarChart3 } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-lify-gradient">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-lify-gradient">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Sparkles className="h-12 w-12 text-white" />
            <div>
              <h1 className="text-5xl font-bold text-white">Lify</h1>
              <p className="text-xl text-white/80">AtendeAÍ</p>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Painel Administrativo de Chatbots
          </h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Gerencie suas conversas, configure seu chatbot e monitore métricas em tempo real
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-white/10 backdrop-blur border-white/20 hover:bg-white/20 transition-all duration-300">
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-white mb-2" />
              <CardTitle className="text-white">Dashboard Completo</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-white/80">
                Monitore métricas em tempo real, taxa de resolução, satisfação do usuário e muito mais
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur border-white/20 hover:bg-white/20 transition-all duration-300">
            <CardHeader>
              <MessageSquare className="h-8 w-8 text-white mb-2" />
              <CardTitle className="text-white">Gestão de Conversas</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-white/80">
                Gerencie todas as conversas do WhatsApp Business em uma interface intuitiva
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur border-white/20 hover:bg-white/20 transition-all duration-300">
            <CardHeader>
              <Bot className="h-8 w-8 text-white mb-2" />
              <CardTitle className="text-white">IA Contextualizada</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-white/80">
                Configure seu chatbot com inteligência artificial especializada para sua clínica
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link to="/auth">
            <Button size="lg" className="bg-white text-lify-purple hover:bg-gray-100 px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
              Acessar Painel
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
