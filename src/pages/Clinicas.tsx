
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
import { Building2, Search, Edit, Trash2, Plus, MapPin, Phone, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import EditClinicModal from '@/components/clinics/EditClinicModal';
import CreateClinicModal from '@/components/clinics/CreateClinicModal';

interface Clinic {
  id: string;
  name: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  website?: string;
  is_active: boolean;
  created_at: string;
}

const Clinicas = () => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClinics(data || []);
    } catch (error) {
      console.error('Error fetching clinics:', error);
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

  const handleClinicUpdated = () => {
    fetchClinics();
  };

  const handleToggleClinicStatus = async (clinicId: string) => {
    try {
      const clinic = clinics.find(c => c.id === clinicId);
      const newStatus = !clinic?.is_active;

      const { error } = await supabase
        .from('clinics')
        .update({ is_active: newStatus })
        .eq('id', clinicId);

      if (error) throw error;

      setClinics(prev => prev.map(clinic => 
        clinic.id === clinicId ? { ...clinic, is_active: newStatus } : clinic
      ));

      toast({
        title: "Status atualizado",
        description: "O status da clínica foi atualizado.",
      });
    } catch (error) {
      console.error('Error updating clinic status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    }
  };

  const filteredClinics = clinics.filter(clinic =>
    clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clinic.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clinic.email?.toLowerCase().includes(searchTerm.toLowerCase())
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
        
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Clínica
        </Button>
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
                      {clinic.cnpj && (
                        <div className="text-sm text-gray-500">CNPJ: {clinic.cnpj}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {clinic.city && clinic.state && (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          {clinic.city}, {clinic.state}
                        </div>
                      )}
                      {clinic.address && (
                        <div className="text-xs text-gray-500">{clinic.address}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {clinic.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {clinic.phone}
                        </div>
                      )}
                      {clinic.email && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {clinic.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={clinic.is_active}
                      onCheckedChange={() => handleToggleClinicStatus(clinic.id)}
                    />
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
    </div>
  );
};

export default Clinicas;
