import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import EditUserModal from '@/components/users/EditUserModal';
import DeleteUserModal from '@/components/users/DeleteUserModal';
import CreateUserModal from '@/components/users/CreateUserModal';
import UserTable from '@/components/users/UserTable';
import userService from '@/services/userService';
import type { User } from '@/services/userService';

type GestaoUser = User;

const GestaoUsuarios = () => {
  const [users, setUsers] = useState<GestaoUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<GestaoUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<GestaoUser | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const result = await userService.listUsers();
      
      if (result.success && result.users) {
        setUsers(result.users);
      } else {
        throw new Error(result.error || 'Erro ao carregar usuários');
      }
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

  const handleEditUser = (user: GestaoUser) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleDeleteUser = (user: GestaoUser) => {
    setDeletingUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditingUser(null);
    setIsEditModalOpen(false);
  };

  const handleCloseDeleteModal = () => {
    setDeletingUser(null);
    setIsDeleteModalOpen(false);
  };

  const handleUserUpdated = () => {
    fetchUsers();
  };

  const handleUserDeleted = () => {
    fetchUsers();
  };

  const handleToggleUserStatus = async (userId: string) => {
    // TODO: Implementar via backend quando necessário
    console.log('Toggle user status:', userId);
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "Esta funcionalidade será implementada em breve.",
    });
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
          <p className="text-gray-600 mt-2">Carregando usuários...</p>
        </div>
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
        
        <CreateUserModal onUserCreated={handleUserUpdated} />
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
          <UserTable 
            users={filteredUsers}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
            onToggleUserStatus={handleToggleUserStatus}
          />
        </CardContent>
      </Card>

      <EditUserModal
        user={editingUser}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onUserUpdated={handleUserUpdated}
      />

      <DeleteUserModal
        user={deletingUser}
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onUserDeleted={handleUserDeleted}
      />
    </div>
  );
};

export default GestaoUsuarios;
