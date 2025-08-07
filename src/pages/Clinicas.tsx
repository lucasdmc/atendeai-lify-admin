import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Plus, Brain, Phone, Edit, Trash2 } from 'lucide-react';
import { ClinicForm } from '../components/clinics/ClinicForm';
import { ClinicService, Clinic } from '../services/clinicService';
import { useToast } from '../hooks/use-toast';

const Clinicas: React.FC = () => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadClinics();
  }, []);

  const loadClinics = async () => {
    try {
      setLoading(true);
      const data = await ClinicService.getClinics();
      setClinics(data);
    } catch (error) {
      console.error('❌ Erro ao carregar clínicas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as clínicas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (clinicData: Partial<Clinic>) => {
    try {
      console.log('🚀 [Clinicas] Recebendo dados do formulário:', clinicData);
      console.log('🔍 [Clinicas] simulation_mode:', clinicData.simulation_mode);
      console.log('🔍 [Clinicas] whatsapp_phone:', clinicData.whatsapp_phone);
      console.log('🔍 [Clinicas] contextualization_json:', clinicData.contextualization_json);
      
      if (editingClinic) {
        console.log('🔄 [Clinicas] Atualizando clínica existente:', editingClinic.id);
        const result = await ClinicService.updateClinic(editingClinic.id, clinicData);
        console.log('✅ [Clinicas] Clínica atualizada:', result);
        toast({
          title: "Sucesso",
          description: "Clínica atualizada com sucesso!",
        });
      } else {
        console.log('🆕 [Clinicas] Criando nova clínica');
        const result = await ClinicService.createClinic(clinicData as Omit<Clinic, 'id' | 'created_at' | 'updated_at'>);
        console.log('✅ [Clinicas] Clínica criada:', result);
        toast({
          title: "Sucesso",
          description: "Clínica criada com sucesso!",
        });
      }
      
      setShowForm(false);
      setEditingClinic(null);
      loadClinics();
    } catch (error) {
      console.error('❌ [Clinicas] Erro ao salvar clínica:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a clínica",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (clinic: Clinic) => {
    setEditingClinic(clinic);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta clínica?')) return;
    
    try {
      await ClinicService.deleteClinic(id);
      toast({
        title: "Sucesso",
        description: "Clínica excluída com sucesso!",
      });
      loadClinics();
    } catch (error) {
      console.error('❌ Erro ao excluir clínica:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a clínica",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingClinic(null);
  };

  if (showForm) {
    return (
      <div className="container mx-auto p-6">
        <ClinicForm
          clinic={editingClinic || null}
          onSave={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Clínicas</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Clínica
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Carregando clínicas...</p>
        </div>
      ) : clinics.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Nenhuma clínica encontrada</p>
            <Button onClick={() => setShowForm(true)} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Clínica
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clinics.map((clinic) => (
            <Card key={clinic.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{clinic.name}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(clinic)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(clinic.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{clinic.whatsapp_phone}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-muted-foreground" />
                    <Badge variant={clinic.has_contextualization ? "default" : "secondary"}>
                      {clinic.has_contextualization ? "Contextualização Ativa" : "Genérica"}
                    </Badge>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Criada em: {new Date(clinic.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Clinicas;
