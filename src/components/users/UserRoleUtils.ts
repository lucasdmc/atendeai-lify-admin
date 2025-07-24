type UserRole = 'atendente' | 'gestor' | 'admin' | 'suporte_lify' | 'admin_lify';

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
    case 'atendente': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getRolePermissionDescription = (role: UserRole) => {
  const descriptions = {
    atendente: 'Acesso a: Conectar WhatsApp, Agendamentos, Conversas, Dashboard (Clínica específica)',
    gestor: 'Acesso a: Conectar WhatsApp, Agendamentos, Conversas, Dashboard, Contextualização (Clínica específica)',
    admin: 'Acesso completo a uma clínica específica (exceto módulo Clínicas)',
    suporte_lify: 'Acesso total exceto módulo Clínicas (Todas as clínicas)',
    admin_lify: 'Acesso total a todos os módulos (Todas as clínicas)'
  };
  return descriptions[role as keyof typeof descriptions] || '';
};

// Definição das permissões por módulo para cada perfil
export const rolePermissions = {
  atendente: [
    'conectar_whatsapp',  // Conectar WhatsApp
    'agendamentos',       // Agendamentos
    'conversas',          // Conversas
    'dashboard'           // Dashboard
  ],
  gestor: [
    'conectar_whatsapp',  // Conectar WhatsApp
    'agendamentos',       // Agendamentos
    'conversas',          // Conversas
    'dashboard',          // Dashboard
    'contextualizar'      // Contextualização
  ],
  admin: [
    'conectar_whatsapp',  // Conectar WhatsApp
    'agendamentos',       // Agendamentos
    'conversas',          // Conversas
    'dashboard',          // Dashboard
    'contextualizar',     // Contextualização
    'gestao_usuarios'     // Gestão de Usuários
    // NOTA: admin NÃO tem acesso ao módulo 'clinicas'
  ],
  suporte_lify: [
    'conectar_whatsapp',  // Conectar WhatsApp
    'agendamentos',       // Agendamentos
    'conversas',          // Conversas
    'dashboard',          // Dashboard
    'contextualizar',     // Contextualização
    'gestao_usuarios'     // Gestão de Usuários
    // NOTA: suporte_lify NÃO tem acesso ao módulo 'clinicas'
  ],
  admin_lify: [
    'conectar_whatsapp',  // Conectar WhatsApp
    'agendamentos',       // Agendamentos
    'conversas',          // Conversas
    'dashboard',          // Dashboard
    'contextualizar',     // Contextualização
    'gestao_usuarios',    // Gestão de Usuários
    'clinicas'            // Clínicas
  ]
};

// Função para verificar se um usuário tem acesso a um módulo específico
export const hasPermission = (userRole: string | null, moduleName: string): boolean => {
  if (!userRole) return false;
  
  const permissions = rolePermissions[userRole as keyof typeof rolePermissions];
  return permissions ? permissions.includes(moduleName) : false;
};

// Função para verificar se um usuário tem acesso a todas as clínicas
export const hasGlobalClinicAccess = (userRole: string | null): boolean => {
  return userRole === 'admin_lify' || userRole === 'suporte_lify';
};

// Função para verificar se um usuário pode gerenciar clínicas
export const canManageClinics = (userRole: string | null): boolean => {
  return userRole === 'admin_lify';
};

// Função para obter o escopo de acesso às clínicas
export const getClinicAccessScope = (userRole: string | null): 'global' | 'specific' | 'none' => {
  if (userRole === 'admin_lify' || userRole === 'suporte_lify') {
    return 'global';
  } else if (userRole === 'admin' || userRole === 'gestor' || userRole === 'atendente') {
    return 'specific';
  }
  return 'none';
};

// Função para obter a descrição do escopo de acesso
export const getClinicAccessDescription = (userRole: string | null): string => {
  switch (getClinicAccessScope(userRole)) {
    case 'global':
      return 'Acesso a todas as clínicas';
    case 'specific':
      return 'Acesso a clínica específica';
    case 'none':
      return 'Sem acesso a clínicas';
    default:
      return 'Acesso não definido';
  }
};
