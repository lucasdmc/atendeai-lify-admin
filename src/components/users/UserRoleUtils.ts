
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

export const getRoleLabel = (role: string) => {
  const roleLabels = {
    admin_lify: 'Administrador Lify',
    suporte_lify: 'Suporte Lify',
    admin: 'Administrador',
    gestor: 'Gestor',
    atendente: 'Atendente'
  };
  return roleLabels[role as keyof typeof roleLabels] || role;
};

export const getRoleColor = (role: string) => {
  switch (role) {
    case 'admin_lify': return 'bg-purple-100 text-purple-800';
    case 'suporte_lify': return 'bg-blue-100 text-blue-800';
    case 'admin': return 'bg-red-100 text-red-800';
    case 'gestor': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-green-100 text-green-800';
  }
};

export const getRolePermissionDescription = (role: UserRole) => {
  const descriptions = {
    atendente: 'Acesso a: Dashboard, Conversas e Agendamentos',
    gestor: 'Acesso a: Dashboard, Conversas, WhatsApp, Agentes, Agendamentos, Contextualizar e Configurações',
    admin: 'Acesso completo a uma clínica específica',
    suporte_lify: 'Acesso total exceto criação de clínicas',
    admin_lify: 'Acesso total incluindo criação de clínicas'
  };
  return descriptions[role] || '';
};

export const rolePermissions = {
  atendente: ['dashboard', 'conversas', 'agendamentos'],
  gestor: ['dashboard', 'conversas', 'conectar_whatsapp', 'agentes', 'agendamentos', 'contextualizar', 'configuracoes'],
  admin: ['dashboard', 'conversas', 'conectar_whatsapp', 'agentes', 'contextualizar', 'gestao_usuarios', 'agendamentos', 'configuracoes'],
  suporte_lify: ['dashboard', 'conversas', 'conectar_whatsapp', 'agentes', 'contextualizar', 'gestao_usuarios', 'agendamentos', 'clinicas', 'configuracoes'],
  admin_lify: ['dashboard', 'conversas', 'conectar_whatsapp', 'agentes', 'contextualizar', 'gestao_usuarios', 'agendamentos', 'clinicas', 'criar_clinicas', 'configuracoes']
};
