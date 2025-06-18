
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

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'suporte_lify' | 'atendente';
  status: boolean;
  created_at: string;
}

interface Permission {
  module_name: string;
  can_access: boolean;
}

const GestaoUsuarios = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'atendente' as const
  });
  const { toast } = useToast();

  const permissions = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'conversas', label: 'Conversas' },
    { id: 'conectar_whatsapp', label: 'Conectar WhatsApp' },
    { id: 'contextualizar', label: 'Contextualizar' },
    { id: 'gestao_usuarios', label: 'Gestão de Usuários' },
    { id: 'configuracoes', label: 'Configurações' }
  ];

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

      // Get emails from auth.users (simulated for this demo)
      const usersWithEmail = data?.map(user => ({
        ...user,
        email: `${user.name.toLowerCase().replace(' ', '.')}@example.com`
      })) || [];

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
    try {
      // Simulate user creation (in production, this would use Supabase Auth)
      const mockUser: User = {
        id: Date.now().toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: true,
        created_at: new Date().toISOString()
      };

      setUsers(prev => [...prev, mockUser]);
      setNewUser({ name: '', email: '', password: '', role: 'atendente' });
      setIsDialogOpen(false);

      toast({
        title: "Usuário criado",
        description: "O usuário foi criado com sucesso.",
      });
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o usuário.",
        variant: "destructive",
      });
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
    try {
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status: !user.status } : user
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

  const handleTogglePermission = async (userId: string, moduleId: string) => {
    // Simulate permission toggle
    toast({
      title: "Permissão atualizada",
      description: `Permissão para ${moduleId} foi atualizada.`,
    });
  };

  const getRoleLabel = (role: string) => {
    const roleLabels = {
      admin: 'Administrador',
      suporte_lify: 'Suporte Lify',
      atendente: 'Atendente'
    };
    return roleLabels[role as keyof typeof roleLabels] || role;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'suporte_lify': return 'bg-blue-100 text-blue-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                  placeholder="Senha"
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
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="suporte_lify">Suporte Lify</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleCreateUser}
                className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
              >
                Criar Usuário
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
                <TableHead>Permissões</TableHead>
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
                    <div className="flex flex-wrap gap-1">
                      {permissions.slice(0, 3).map((permission) => (
                        <Badge
                          key={permission.id}
                          variant="outline"
                          className="text-xs cursor-pointer hover:bg-gray-100"
                          onClick={() => handleTogglePermission(user.id, permission.id)}
                        >
                          {permission.label}
                        </Badge>
                      ))}
                      {permissions.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{permissions.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingUser(user)}
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
    </div>
  );
};

export default GestaoUsuarios;
