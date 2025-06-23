
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tag } from 'lucide-react';
import { appointmentLabels, AppointmentLabel } from '@/utils/appointmentLabels';
import { Control } from 'react-hook-form';

interface LabelSelectorProps {
  control: Control<any>;
  name: string;
}

const LabelSelector = ({ control, name }: LabelSelectorProps) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Tipo de Agendamento *</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {Object.values(appointmentLabels).map((labelConfig) => (
                <SelectItem key={labelConfig.label} value={labelConfig.label}>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={labelConfig.color}>
                      <Tag className="h-3 w-3 mr-1" />
                      {labelConfig.name}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
      rules={{ required: 'Tipo de agendamento é obrigatório' }}
    />
  );
};

export default LabelSelector;
