
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bot, Shield, Globe, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


const Configuracoes = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // Since there's no settings table, we'll use default values
      const defaultSettings = {
        bot_name: 'Assistente Virtual',
        language: 'pt-BR',
        welcome_message: 'Olá! Como posso ajudá-lo hoje?',
        clinic_name: '',
        clinic_cnpj: '',
        clinic_address: '',
        clinic_phone: '',
        clinic_email: '',
        security_level: 'medium'
      };
      
      setSettings(defaultSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // For now, just save to local state since there's no settings table
      // In a real app, you would save these to a proper settings table
      console.log('Settings saved:', settings);
      
      toast({
        title: "Configurações salvas",
        description: "Todas as configurações foram salvas localmente.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-gray-600 mt-2">Configure as opções gerais do sistema e chatbot</p>
        </div>
        
        <Button 
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Configurações do Chatbot */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-orange-500" />
              Configurações do Chatbot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nome do Bot</label>
                <Input
                  value={settings.bot_name || ''}
                  onChange={(e) => updateSetting('bot_name', e.target.value)}
                  placeholder="Nome do assistente virtual"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Idioma</label>
                <Select 
                  value={settings.language || 'pt-BR'} 
                  onValueChange={(value) => updateSetting('language', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                    <SelectItem value="en-US">English (US)</SelectItem>
                    <SelectItem value="es-ES">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Mensagem de Boas-vindas</label>
              <Textarea
                value={settings.welcome_message || ''}
                onChange={(e) => updateSetting('welcome_message', e.target.value)}
                placeholder="Digite a mensagem que será exibida quando alguém iniciar uma conversa..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Informações da Clínica */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-orange-500" />
              Informações da Clínica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nome da Clínica</label>
                <Input
                  value={settings.clinic_name || ''}
                  onChange={(e) => updateSetting('clinic_name', e.target.value)}
                  placeholder="Nome da clínica"
                />
              </div>
              <div>
                <label className="text-sm font-medium">CNPJ</label>
                <Input
                  value={settings.clinic_cnpj || ''}
                  onChange={(e) => updateSetting('clinic_cnpj', e.target.value)}
                  placeholder="00.000.000/0000-00"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Endereço</label>
              <Input
                value={settings.clinic_address || ''}
                onChange={(e) => updateSetting('clinic_address', e.target.value)}
                placeholder="Endereço completo da clínica"
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Telefone</label>
                <Input
                  value={settings.clinic_phone || ''}
                  onChange={(e) => updateSetting('clinic_phone', e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <label className="text-sm font-medium">E-mail</label>
                <Input
                  type="email"
                  value={settings.clinic_email || ''}
                  onChange={(e) => updateSetting('clinic_email', e.target.value)}
                  placeholder="contato@clinica.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Segurança */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-orange-500" />
              Configurações de Segurança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nível de Segurança</label>
                <Select 
                  value={settings.security_level || 'medium'} 
                  onValueChange={(value) => updateSetting('security_level', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixo</SelectItem>
                    <SelectItem value="medium">Médio</SelectItem>
                    <SelectItem value="high">Alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Autenticação 2FA</label>
                  <p className="text-xs text-gray-500">Ativar autenticação de dois fatores</p>
                </div>
                <Switch />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Log de Atividades</label>
                <p className="text-xs text-gray-500">Registrar todas as atividades do sistema</p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Backup Automático</label>
                <p className="text-xs text-gray-500">Fazer backup dos dados automaticamente</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Configuracoes;
