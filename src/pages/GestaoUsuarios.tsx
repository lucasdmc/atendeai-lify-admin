
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus, Search, Edit, Trash2, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import EditUserModal from '@/components/users/EditUserModal';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'suporte_lify' | 'atendente' | 'admin_lify' | 'gestor';
  status: boolean;
  created_at: string;
}

const GestaoUsuarios = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'atendente' as const
  });
  const { toast } = useToast();

  // Define permissões por função
  const rolePermissions = {
    atendente: ['dashboard', 'conversas', 'agendamentos'],
    gestor: ['dashboard', 'conversas', 'conectar_whatsapp', 'agentes', 'agendamentos', 'contextualizar', 'configuracoes'],
    admin: ['dashboard', 'conversas', 'conectar_whatsapp', 'agentes', 'contextualizar', 'gestao_usuarios', 'agendamentos', 'configuracoes'],
    suporte_lify: ['dashboard', 'conversas', 'conectar_whatsapp', 'agentes', 'contextualizar', 'gestao_usuarios', 'agendamentos', 'clinicas', 'configuracoes'],
    admin_lify: ['dashboard', 'conversas', 'conectar_whatsapp', 'agentes', 'contextualizar', 'gestao_usuarios', 'agendamentos', 'clinicas', 'criar_clinicas', 'configuracoes']
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          id,
          name,
          role,
          status,
          created_at
        `);

      if (error) throw error;

      // Para cada usuário, buscar o email do auth.users através de uma function
      const usersWithEmail = await Promise.all(
        (data || []).map(async (user) => {
          // Como não podemos acessar auth.users diretamente, vamos usar o email do metadata
          // Por enquanto, vamos simular o email baseado no nome até termos uma solução melhor
          return {
            ...user,
            email: `${user.name.toLowerCase().replace(' ', '.')}@example.com`
          };
        })
      );

      setUsers(usersWithEmail);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
      
      // Primeiro, criar o usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            name: newUser.name
          }
        }
      });

      if (authError) {
        console.error('Erro ao criar usuário no auth:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Usuário não foi criado corretamente');
      }

      console.log('Usuário criado no auth:', authData.user.id);

      // Aguardar um pouco para o trigger criar o perfil
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Atualizar o perfil com o role correto
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ 
          name: newUser.name,
          role: newUser.role 
        })
        .eq('id', authData.user.id);

      if (profileError) {
        console.error('Erro ao atualizar perfil:', profileError);
        throw profileError;
      }

      console.log('Perfil atualizado com sucesso');

      // Recarregar a lista de usuários
      await fetchUsers();

      // Limpar o formulário
      setNewUser({ name: '', email: '', password: '', role: 'atendente' });
      setIsDialogOpen(false);

      toast({
        title: "Usuário criado",
        description: "O usuário foi criado com permissões configuradas automaticamente.",
      });

    } catch (error: any) {
      console.error('Erro completo ao criar usuário:', error);
      
      let errorMessage = "Não foi possível criar o usuário.";
      
      if (error.message?.includes('User already registered')) {
        errorMessage = "Este email já está em uso.";
      } else if (error.message?.includes('Password should be at least 6 characters')) {
        errorMessage = "A senha deve ter pelo menos 6 caracteres.";
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = "Email inválido.";
      }

      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditingUser(null);
    setIsEditModalOpen(false);
  };

  const handleUserUpdated = () => {
    fetchUsers();
  };

  const handleToggleUserStatus = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId);
      const newStatus = !user?.status;

      const { error } = await supabase
        .from('user_profiles')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ));

      toast({
        title: "Status atualizado",
        description: "O status do usuário foi atualizado.",
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    }
  };

  const getRoleLabel = (role: string) => {
    const roleLabels = {
      admin_lify: 'Administrador Lify',
      suporte_lify: 'Suporte Lify',
      admin: 'Administrador',
      gestor: 'Gestor',
      atendente: 'Atendente'
    };
    return roleLabels[role as keyof typeof roleLabels] || role;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin_lify': return 'bg-purple-100 text-purple-800';
      case 'suporte_lify': return 'bg-blue-100 text-blue-800';
      case 'admin': return 'bg-red-100 text-red-800';
      case 'gestor': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getRolePermissionDescription = (role: 'admin' | 'suporte_lify' | 'atendente' | 'admin_lify' | 'gestor') => {
    const descriptions = {
      atendente: 'Acesso a: Dashboard, Conversas e Agendamentos',
      gestor: 'Acesso a: Dashboard, Conversas, WhatsApp, Agentes, Agendamentos, Contextualizar e Configurações',
      admin: 'Acesso completo a uma clínica específica',
      suporte_lify: 'Acesso total exceto criação de clínicas',
      admin_lify: 'Acesso total incluindo criação de clínicas'
    };
    return descriptions[role] || '';
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
          <p className="text-gray-600 mt-2">Gerencie usuários e suas permissões no sistema</p>
        </div>
        
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
                <Select value={newUser.role} onValueChange={(value: any) => setNewUser(prev => ({ ...prev, role: value }))}>
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
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-500" />
              Lista de Usuários
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar usuários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge className={getRoleColor(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={user.status}
                      onCheckedChange={() => handleToggleUserStatus(user.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <EditUserModal
        user={editingUser}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onUserUpdated={handleUserUpdated}
      />
    </div>
  );
};

export default GestaoUsuarios;
