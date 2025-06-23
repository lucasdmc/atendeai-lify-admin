
export type AppointmentLabel = 'consulta' | 'retorno' | 'reagendamento';

export interface LabelConfig {
  label: AppointmentLabel;
  name: string;
  color: string;
  googleCalendarColorId: string;
}

export const appointmentLabels: Record<AppointmentLabel, LabelConfig> = {
  consulta: {
    label: 'consulta',
    name: 'Consulta',
    color: 'bg-green-100 text-green-800 border-green-200',
    googleCalendarColorId: '2', // Verde (Sálvia)
  },
  retorno: {
    label: 'retorno',
    name: 'Retorno',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    googleCalendarColorId: '1', // Azul (Pavão)
  },
  reagendamento: {
    label: 'reagendamento',
    name: 'Reagendamento',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    googleCalendarColorId: '5', // Amarelo (Banana)
  },
};

export const getLabelConfig = (label: AppointmentLabel): LabelConfig => {
  return appointmentLabels[label];
};

export const getLabelFromString = (labelString: string): AppointmentLabel => {
  return (labelString as AppointmentLabel) || 'consulta';
};
