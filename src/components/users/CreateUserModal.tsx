import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getRolePermissionDescription } from './UserRoleUtils';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

interface CreateUserModalProps {
  onUserCreated: () => void;
}

const CreateUserModal = ({ onUserCreated }: CreateUserModalProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'atendente' as UserRole
  });
  const { toast } = useToast();

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingUser(true);
    try {
      console.log('Criando usuário:', newUser);
      const cleanEmail = newUser.email.trim().toLowerCase();
      
      // Verificar se o email já existe
      const { data: existingUser, error: checkError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', cleanEmail)
        .single();

      if (existingUser) {
        throw new Error('Este email já está em uso.');
      }

      // Gerar um UUID para o usuário (simulando auth.users)
      const userId = crypto.randomUUID();
      
      // Criar o perfil diretamente na tabela user_profiles
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          email: cleanEmail,
          name: newUser.name,
          role: newUser.role,
          status: true
        });

      if (insertError) {
        console.error('Erro ao inserir perfil:', insertError);
        throw insertError;
      }

      console.log('Usuário criado com sucesso:', userId);
      onUserCreated();

      // Limpar o formulário
      setNewUser({ name: '', email: '', password: '', role: 'atendente' });
      setIsDialogOpen(false);

      toast({
        title: "Usuário criado",
        description: `Usuário ${newUser.name} criado com função ${getRolePermissionDescription(newUser.role)}.`,
      });

    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      
      let errorMessage = "Não foi possível criar o usuário.";
      
      if (error.message?.includes('já está em uso')) {
        errorMessage = "Este email já está em uso.";
      } else if (error.message?.includes('Password should be at least 6 characters')) {
        errorMessage = "A senha deve ter pelo menos 6 caracteres.";
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = "Email inválido.";
      } else if (error.message?.includes('Email address is invalid')) {
        errorMessage = "Formato de email inválido. Use um email válido.";
      }

      toast({
        title: "Erro ao criar usuário",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCreatingUser(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600">
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Novo Usuário</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nome</label>
            <Input
              value={newUser.name}
              onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nome completo"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
              placeholder="email@exemplo.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Senha</label>
            <Input
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Senha (mínimo 6 caracteres)"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Função</label>
            <Select value={newUser.role} onValueChange={(value: UserRole) => setNewUser(prev => ({ ...prev, role: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="atendente">Atendente</SelectItem>
                <SelectItem value="gestor">Gestor</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="suporte_lify">Suporte Lify</SelectItem>
                <SelectItem value="admin_lify">Administrador Lify</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-600 mt-1">
              {getRolePermissionDescription(newUser.role)}
            </p>
          </div>
          <Button 
            onClick={handleCreateUser}
            disabled={isCreatingUser}
            className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
          >
            {isCreatingUser ? 'Criando...' : 'Criar Usuário'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserModal;
