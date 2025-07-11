import React, { useState, useEffect } from 'react';
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
import { Building2, Search, Edit, Trash2, Plus, MapPin, Phone, Mail, Bug } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import EditClinicModal from '@/components/clinics/EditClinicModal';
import CreateClinicModal from '@/components/clinics/CreateClinicModal';
import DeleteClinicModal from '@/components/clinics/DeleteClinicModal';
import { testClinicCreation, checkUserPermissions, testClinicViewing } from '@/utils/clinicTest';
import { Clinic } from '@/types/clinic';
import { canCreateClinics, canEditClinics, canDeleteClinics } from '@/components/users/UserRoleUtils';

const Clinicas = () => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingClinic, setDeletingClinic] = useState<Clinic | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { toast } = useToast();
  const { userRole, userPermissions } = useAuth();

  useEffect(() => {
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    console.log('🔄 Buscando clínicas...');
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('📡 Resposta do Supabase:', { data, error });

      if (error) {
        console.error('❌ Erro ao buscar clínicas:', error);
        throw error;
      }

      console.log('✅ Clínicas carregadas:', data);
      console.log('📊 Número de clínicas:', data?.length || 0);
      
      setClinics((data as Clinic[]) || []);
    } catch (error) {
      console.error('❌ Erro completo ao buscar clínicas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as clínicas.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClinic = (clinic: Clinic) => {
    setEditingClinic(clinic);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditingClinic(null);
    setIsEditModalOpen(false);
  };

  const handleDeleteClinic = (clinic: Clinic) => {
    setDeletingClinic(clinic);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setDeletingClinic(null);
    setIsDeleteModalOpen(false);
  };

  const handleClinicUpdated = () => {
    console.log('🔄 Atualizando lista de clínicas após criação/edição...');
    // Aguardar um pouco para garantir que o banco foi atualizado
    setTimeout(() => {
      fetchClinics();
    }, 500);
  };

  const handleToggleClinicStatus = async (clinicId: string) => {
    // Função removida - campo is_active não existe na tabela
    toast({
      title: "Funcionalidade não disponível",
      description: "Ativação/desativação de clínicas não está implementada.",
      variant: "destructive",
    });
  };

  const handleTestClinicCreation = async () => {
    console.log('🧪 Iniciando teste de criação de clínica...');
    
    // Verificar permissões do usuário
    const userInfo = await checkUserPermissions();
    console.log('👤 Informações do usuário:', userInfo);
    
    // Executar teste completo
    await testClinicCreation();
    
    toast({
      title: "Teste Executado",
      description: "Verifique o console do navegador para ver os resultados do teste.",
    });
  };

  const handleTestClinicViewing = async () => {
    console.log('🧪 Iniciando teste de visualização de clínica...');
    
    // Verificar permissões do usuário
    const userInfo = await checkUserPermissions();
    console.log('👤 Informações do usuário:', userInfo);
    
    // Executar teste completo
    await testClinicViewing();
    
    toast({
      title: "Teste Executado",
      description: "Verifique o console do navegador para ver os resultados do teste.",
    });
  };

  const filteredClinics = clinics.filter(clinic =>
    // Filtrar a Clínica Principal (não mostrar na lista)
    clinic.id !== '00000000-0000-0000-0000-000000000001' &&
    clinic.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  console.log('📊 Estado atual das clínicas:');
  console.log('🔍 Total de clínicas:', clinics.length);
  console.log('🔍 Clínicas filtradas:', filteredClinics.length);
  console.log('🔍 Termo de busca:', searchTerm);
  console.log('🔍 Clínicas:', clinics);

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
          <h1 className="text-3xl font-bold">Gestão de Clínicas</h1>
          <p className="text-gray-600 mt-2">Gerencie as clínicas do sistema</p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Botão de teste - apenas em desenvolvimento */}
          {process.env.NODE_ENV === 'development' && (
            <>
              <Button 
                variant="outline"
                onClick={handleTestClinicCreation}
                className="text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                <Bug className="h-4 w-4 mr-2" />
                Testar Criação
              </Button>
              <Button 
                variant="outline"
                onClick={handleTestClinicViewing}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Bug className="h-4 w-4 mr-2" />
                Testar Visualização
              </Button>
            </>
          )}
          
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            disabled={!canCreateClinics(userRole)}
            className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Clínica
          </Button>
        </div>
      </div>

      {/* Debug Info - apenas em desenvolvimento */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4">
            <div className="text-sm">
              <div><strong>Debug Info:</strong></div>
              <div>Role: {userRole}</div>
              <div>Permissions: {userPermissions.join(', ')}</div>
              <div>Can create clinics: {canCreateClinics(userRole) ? '✅' : '❌'}</div>
              <div>Can edit clinics: {canEditClinics(userRole) ? '✅' : '❌'}</div>
              <div>Can delete clinics: {canDeleteClinics(userRole) ? '✅' : '❌'}</div>
              <div>Total clinics in DB: {clinics.length}</div>
              <div>Visible clinics: {filteredClinics.length}</div>
              <div>Admin Lify oculta: {clinics.some(c => c.id === '00000000-0000-0000-0000-000000000001') ? '✅' : '❌'}</div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-orange-500" />
              Lista de Clínicas
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar clínicas..."
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
                <TableHead>Localização</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClinics.map((clinic) => (
                <TableRow key={clinic.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{clinic.name}</div>
                      <div className="text-sm text-gray-500">ID: {clinic.id}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3" />
                        {clinic.timezone || 'Não informado'}
                      </div>
                      {clinic.address && (
                        <div className="text-xs text-gray-500">Endereço configurado</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {clinic.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          Telefone configurado
                        </div>
                      )}
                      {clinic.email && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          Email configurado
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">Ativa</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClinic(clinic)}
                        disabled={!canEditClinics(userRole)}
                        title={!canEditClinics(userRole) ? 'Você não tem permissão para editar clínicas' : 'Editar clínica'}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClinic(clinic)}
                        className="text-red-600 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                        disabled={
                          clinic.id === '00000000-0000-0000-0000-000000000001' ||
                          !canDeleteClinics(userRole)
                        }
                        title={
                          clinic.id === '00000000-0000-0000-0000-000000000001'
                            ? 'Admin Lify não pode ser excluída'
                            : !canDeleteClinics(userRole)
                            ? 'Você não tem permissão para excluir clínicas'
                            : 'Excluir clínica'
                        }
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

      <CreateClinicModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onClinicCreated={handleClinicUpdated}
      />

      <EditClinicModal
        clinic={editingClinic}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onClinicUpdated={handleClinicUpdated}
      />

      <DeleteClinicModal
        clinic={deletingClinic}
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onClinicDeleted={handleClinicUpdated}
      />
    </div>
  );
};

export default Clinicas;
