import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Building2, Search, Edit, Trash2, Plus, MapPin, Phone, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useClinic } from '@/contexts/ClinicContext';
import EditClinicModal from '@/components/clinics/EditClinicModal';
import CreateClinicModal from '@/components/clinics/CreateClinicModal';
import DeleteClinicModal from '@/components/clinics/DeleteClinicModal';

interface Clinic {
  id: string;
  name: string;
  address?: any | null;
  phone?: any | null;
  email?: any | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  working_hours?: any | null;
  specialties?: any | null;
  payment_methods?: any | null;
  insurance_accepted?: any | null;
  emergency_contact?: any | null;
  admin_notes?: any | null;
  logo_url?: any | null;
  primary_color?: any | null;
  secondary_color?: any | null;
  timezone: string;
  language: string;
}

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
  const { selectedClinicId, userClinicId } = useClinic();

  // Verificar se o usuário pode gerenciar clínicas
  const canManageClinics = userRole === 'admin_lify' || userRole === 'suporte_lify' || userPermissions?.includes('clinicas');

  useEffect(() => {
    fetchClinics();
  }, [selectedClinicId, userClinicId]);

  const fetchClinics = async () => {
    try {
      let query = supabase
        .from('clinics')
        .select('*')
        .order('created_at', { ascending: false });

      // Se não é admin_lify ou suporte_lify, mostrar apenas a clínica do usuário
      if (userRole !== 'admin_lify' && userRole !== 'suporte_lify' && userClinicId) {
        query = query.eq('id', userClinicId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar clínicas:', error);
        throw error;
      }

      setClinics((data || []).map(clinic => ({
        ...clinic,
        created_at: clinic.created_at || new Date().toISOString(),
        updated_at: clinic.updated_at || new Date().toISOString(),
        timezone: clinic.timezone || 'America/Sao_Paulo',
        language: clinic.language || 'pt-BR'
      })));
    } catch (error) {
      console.error('Erro ao buscar clínicas:', error);
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
    setTimeout(() => {
      fetchClinics();
    }, 500);
  };

  const filteredClinics = clinics.filter(clinic =>
    clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (clinic.address && typeof clinic.address === 'object' && clinic.address.city && 
     clinic.address.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (clinic.email && typeof clinic.email === 'object' && clinic.email.value && 
     clinic.email.value.toLowerCase().includes(searchTerm.toLowerCase()))
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
          <h1 className="text-3xl font-bold">Gestão de Clínicas</h1>
          <p className="text-gray-600 mt-2">Gerencie as clínicas do sistema</p>
        </div>
        
        {canManageClinics && (
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Clínica
          </Button>
        )}
      </div>

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
                <TableHead>Data de Criação</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClinics.map((clinic) => (
                <TableRow key={clinic.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{clinic.name}</div>
                      <div className="text-sm text-gray-500">
                        Criada em {new Date(clinic.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {clinic.address && typeof clinic.address === 'object' && (
                        <>
                          {clinic.address.city && clinic.address.state && (
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3" />
                              {clinic.address.city}, {clinic.address.state}
                            </div>
                          )}
                          {clinic.address.street && (
                            <div className="text-xs text-gray-500">{clinic.address.street}</div>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {clinic.phone && typeof clinic.phone === 'object' && clinic.phone.value && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {clinic.phone.value}
                        </div>
                      )}
                      {clinic.email && typeof clinic.email === 'object' && clinic.email.value && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {clinic.email.value}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600">
                      {new Date(clinic.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClinic(clinic)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClinic(clinic)}
                        className="text-red-600 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                        disabled={userRole !== 'admin_lify' && !userPermissions.includes('deletar_clinicas')}
                        title={
                          userRole !== 'admin_lify' && !userPermissions.includes('deletar_clinicas')
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
