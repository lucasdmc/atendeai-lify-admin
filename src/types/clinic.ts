/**
 * Interface Clinic baseada na estrutura real da tabela clinics
 * Gerada automaticamente baseada na consulta ao banco
 */

export interface Clinic {
  id: string;
  name: string;
  address?: object | null;
  phone?: object | null;
  email?: object | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  working_hours?: object | null;
  specialties?: object | null;
  payment_methods?: object | null;
  insurance_accepted?: object | null;
  emergency_contact?: object | null;
  admin_notes?: object | null;
  logo_url?: object | null;
  primary_color?: object | null;
  secondary_color?: object | null;
  timezone?: string;
  language?: string;
}

/**
 * Interface simplificada para componentes que só precisam de id e name
 */
export interface ClinicBasic {
  id: string;
  name: string;
} 