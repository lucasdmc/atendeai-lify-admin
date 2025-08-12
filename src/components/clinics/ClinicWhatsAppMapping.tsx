import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ClinicWhatsAppService, ClinicWhatsAppMapping } from '@/services/clinicWhatsAppService';
import { isValidMetaPhoneNumberId, normalizeDisplayPhone } from '@/utils/metaPhoneNumberValidation';
import { MetaApiService, MetaPhoneNumber } from '@/services/metaApiService';

interface Props {
  clinicId: string;
  defaultDisplayPhone?: string | null;
}

const getStorageKey = (clinicId: string) => `clinic_whatsapp_selection:${clinicId}`;

export const ClinicWhatsAppMappingForm: React.FC<Props> = ({ clinicId, defaultDisplayPhone }) => {
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [displayPhone, setDisplayPhone] = useState(defaultDisplayPhone || '');
  const [loading, setLoading] = useState(false);
  const [metaNumbers, setMetaNumbers] = useState<MetaPhoneNumber[] | null>(null);
  const { toast } = useToast();

  // Carregar mapeamento existente ou última seleção local
  useEffect(() => {
    (async () => {
      try {
        const existing = await ClinicWhatsAppService.getMappingByClinicId(clinicId);
        if (existing) {
          setPhoneNumberId(existing.phone_number_id || '');
          setDisplayPhone(existing.display_phone_number || '');
        } else {
          // Tentar última seleção local
          try {
            const raw = localStorage.getItem(getStorageKey(clinicId));
            if (raw) {
              const last = JSON.parse(raw) as { phone_number_id?: string; display_phone_number?: string };
              if (last?.phone_number_id) setPhoneNumberId(last.phone_number_id);
              if (!displayPhone && last?.display_phone_number) setDisplayPhone(last.display_phone_number);
            } else if (!displayPhone && defaultDisplayPhone) {
              setDisplayPhone(defaultDisplayPhone);
            }
          } catch {
            if (!displayPhone && defaultDisplayPhone) setDisplayPhone(defaultDisplayPhone);
          }
        }
      } catch (err: any) {
        toast({ title: 'Erro', description: err.message || 'Falha ao carregar mapeamento WhatsApp', variant: 'destructive' });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicId]);

  // Atualizar displayPhone quando o telefone da clínica mudar e o campo estiver vazio
  useEffect(() => {
    if (!displayPhone && defaultDisplayPhone) {
      setDisplayPhone(defaultDisplayPhone);
    }
  }, [defaultDisplayPhone]);

  const persistLocalSelection = (id: string, display: string) => {
    try {
      localStorage.setItem(getStorageKey(clinicId), JSON.stringify({ phone_number_id: id, display_phone_number: display, updated_at: new Date().toISOString() }));
    } catch {}
  };

  const handleAutofill = () => {
    if (!defaultDisplayPhone) {
      toast({ title: 'Telefone da clínica não informado', description: 'Preencha o telefone da clínica acima.', variant: 'destructive' });
      return;
    }
    const normalized = normalizeDisplayPhone(defaultDisplayPhone);
    setDisplayPhone(normalized);
    persistLocalSelection(phoneNumberId, normalized);
    toast({ title: 'Autofill aplicado', description: 'Número exibido preenchido com o telefone da clínica.' });
  };

  const handleFetchMetaNumbers = async () => {
    try {
      setLoading(true);
      const nums = await MetaApiService.listPhoneNumbers();
      setMetaNumbers(nums);
      toast({ title: 'Números carregados', description: `${nums.length} números encontrados` });
    } catch (err: any) {
      toast({ title: 'Erro ao buscar números', description: err.message || 'Verifique o token e waba_id', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMetaNumber = (n: MetaPhoneNumber) => {
    const normalized = normalizeDisplayPhone(n.display_phone_number);
    setPhoneNumberId(n.id);
    setDisplayPhone(normalized);
    setMetaNumbers(null);
    persistLocalSelection(n.id, normalized);
  };

  const handleSave = async () => {
    if (!isValidMetaPhoneNumberId(phoneNumberId)) {
      toast({ title: 'Phone Number ID inválido', description: 'Informe apenas dígitos (10-20 caracteres).', variant: 'destructive' });
      return;
    }
    try {
      setLoading(true);
      const normalizedDisplay = normalizeDisplayPhone(displayPhone) || normalizeDisplayPhone(defaultDisplayPhone || '');
      const payload: ClinicWhatsAppMapping = {
        clinic_id: clinicId,
        phone_number_id: phoneNumberId.trim(),
        display_phone_number: normalizedDisplay || null,
      };
      await ClinicWhatsAppService.upsertMapping(payload);
      persistLocalSelection(payload.phone_number_id, normalizedDisplay || '');
      toast({ title: 'Sucesso', description: 'Mapeamento WhatsApp salvo com sucesso' });
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message || 'Falha ao salvar mapeamento', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Label htmlFor="phone_number_id">Phone Number ID (Meta)</Label>
          <Input id="phone_number_id" value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} placeholder="ex: 123456789012345" />
        </div>
        <Button type="button" variant="outline" onClick={handleFetchMetaNumbers} disabled={loading}>
          {loading ? 'Buscando...' : 'Buscar da Meta'}
        </Button>
      </div>

      {metaNumbers && (
        <div className="border rounded p-2 space-y-2">
          <div className="text-sm font-medium">Selecione um número disponível</div>
          <div className="space-y-1 max-h-40 overflow-auto">
            {metaNumbers.map((n) => (
              <button key={n.id} type="button" onClick={() => handleSelectMetaNumber(n)} className="w-full text-left px-2 py-1 hover:bg-muted rounded">
                {n.display_phone_number} — {n.verified_name || 'Sem nome'} (id: {n.id})
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Label htmlFor="display_phone">Número exibido (opcional)</Label>
          <Input id="display_phone" value={displayPhone} onChange={(e) => setDisplayPhone(e.target.value)} placeholder="+55XXXXXXXXXXX" />
        </div>
        <Button type="button" variant="outline" onClick={handleAutofill}>
          Usar telefone da clínica
        </Button>
      </div>
      <div className="flex justify-end">
        <Button type="button" onClick={handleSave} disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar Mapeamento WhatsApp'}
        </Button>
      </div>
    </div>
  );
};
