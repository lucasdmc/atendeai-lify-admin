-- Script para configurar as permissões corretas para todos os perfis
-- Execute este script no SQL Editor do Supabase

-- 1. Limpar permissões existentes para garantir configuração limpa
DELETE FROM role_permissions;

-- 2. Inserir permissões para ATENDENTE
INSERT INTO role_permissions (role, module_name, can_access, can_create, can_read, can_update, can_delete) VALUES
('atendente', 'conectar_whatsapp', true, true, true, true, false),
('atendente', 'agendamentos', true, true, true, true, true),
('atendente', 'conversas', true, true, true, true, true),
('atendente', 'dashboard', true, false, true, false, false);

-- 3. Inserir permissões para GESTOR
INSERT INTO role_permissions (role, module_name, can_access, can_create, can_read, can_update, can_delete) VALUES
('gestor', 'conectar_whatsapp', true, true, true, true, false),
('gestor', 'agendamentos', true, true, true, true, true),
('gestor', 'conversas', true, true, true, true, true),
('gestor', 'dashboard', true, false, true, false, false),
('gestor', 'agentes', true, true, true, true, true),
('gestor', 'contextualizar', true, true, true, true, true);

-- 4. Inserir permissões para ADMIN
INSERT INTO role_permissions (role, module_name, can_access, can_create, can_read, can_update, can_delete) VALUES
('admin', 'conectar_whatsapp', true, true, true, true, false),
('admin', 'agendamentos', true, true, true, true, true),
('admin', 'conversas', true, true, true, true, true),
('admin', 'dashboard', true, false, true, false, false),
('admin', 'agentes', true, true, true, true, true),
('admin', 'contextualizar', true, true, true, true, true),
('admin', 'gestao_usuarios', true, true, true, true, true),
('admin', 'configuracoes', true, true, true, true, true);
-- NOTA: admin NÃO tem acesso ao módulo 'clinicas'

-- 5. Inserir permissões para SUPORTE LIFY
INSERT INTO role_permissions (role, module_name, can_access, can_create, can_read, can_update, can_delete) VALUES
('suporte_lify', 'conectar_whatsapp', true, true, true, true, false),
('suporte_lify', 'agendamentos', true, true, true, true, true),
('suporte_lify', 'conversas', true, true, true, true, true),
('suporte_lify', 'dashboard', true, false, true, false, false),
('suporte_lify', 'agentes', true, true, true, true, true),
('suporte_lify', 'contextualizar', true, true, true, true, true),
('suporte_lify', 'gestao_usuarios', true, true, true, true, true),
('suporte_lify', 'configuracoes', true, true, true, true, true);
-- NOTA: suporte_lify NÃO tem acesso ao módulo 'clinicas'

-- 6. Inserir permissões para ADMIN LIFY (acesso total)
INSERT INTO role_permissions (role, module_name, can_access, can_create, can_read, can_update, can_delete) VALUES
('admin_lify', 'conectar_whatsapp', true, true, true, true, false),
('admin_lify', 'agendamentos', true, true, true, true, true),
('admin_lify', 'conversas', true, true, true, true, true),
('admin_lify', 'dashboard', true, false, true, false, false),
('admin_lify', 'agentes', true, true, true, true, true),
('admin_lify', 'contextualizar', true, true, true, true, true),
('admin_lify', 'gestao_usuarios', true, true, true, true, true),
('admin_lify', 'clinicas', true, true, true, true, true),
('admin_lify', 'configuracoes', true, true, true, true, true);

-- 7. Verificar se todas as permissões foram inseridas corretamente
SELECT 
  role,
  COUNT(*) as total_permissions,
  STRING_AGG(module_name, ', ' ORDER BY module_name) as modules
FROM role_permissions 
GROUP BY role 
ORDER BY 
  CASE role 
    WHEN 'admin_lify' THEN 1
    WHEN 'suporte_lify' THEN 2
    WHEN 'admin' THEN 3
    WHEN 'gestor' THEN 4
    WHEN 'atendente' THEN 5
    ELSE 6
  END;

-- 8. Mostrar resumo das permissões por perfil
SELECT 
  'ATENDENTE' as perfil,
  'Conectar QR Code, Agendamentos, Conversas, Dashboard' as modulos,
  'Clínica específica' as escopo
UNION ALL
SELECT 
  'GESTOR' as perfil,
  'Conectar QR Code, Agendamentos, Conversas, Dashboard, Agentes de IA, Contextualização' as modulos,
  'Clínica específica' as escopo
UNION ALL
SELECT 
  'ADMIN' as perfil,
  'Todos os módulos exceto Clínicas' as modulos,
  'Clínica específica' as escopo
UNION ALL
SELECT 
  'SUPORTE LIFY' as perfil,
  'Todos os módulos exceto Clínicas' as modulos,
  'Todas as clínicas' as escopo
UNION ALL
SELECT 
  'ADMIN LIFY' as perfil,
  'Todos os módulos' as modulos,
  'Todas as clínicas' as escopo
ORDER BY 
  CASE perfil 
    WHEN 'ADMIN LIFY' THEN 1
    WHEN 'SUPORTE LIFY' THEN 2
    WHEN 'ADMIN' THEN 3
    WHEN 'GESTOR' THEN 4
    WHEN 'ATENDENTE' THEN 5
    ELSE 6
  END; 