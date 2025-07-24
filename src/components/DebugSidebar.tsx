import { useAuth } from '@/hooks/useAuth';
import { hasPermission } from '@/components/users/UserRoleUtils';

const DebugSidebar = () => {
  const { user, userRole, userPermissions, loading } = useAuth();

  const menuItems = [
    { title: 'Dashboard', permission: 'dashboard' },
    { title: 'Conversas', permission: 'conversas' },
    { title: 'Conectar WhatsApp', permission: 'conectar_whatsapp' },
    { title: 'Agendamentos', permission: 'agendamentos' },
    { title: 'Clínicas', permission: 'clinicas' },
    { title: 'Contextualizar', permission: 'contextualizar' },
    { title: 'Gestão de Usuários', permission: 'gestao_usuarios' }
  ];

  const filteredMenuItems = menuItems.filter(item => {
    return hasPermission(userRole, item.permission);
  });

  return (
    <div className="fixed top-4 right-4 bg-white p-4 rounded-lg shadow-lg border max-w-sm z-50">
      <h3 className="font-bold text-sm mb-2">🔍 Debug Sidebar</h3>
      
      <div className="space-y-2 text-xs">
        <div>
          <strong>Loading:</strong> {loading ? '✅ Sim' : '❌ Não'}
        </div>
        
        <div>
          <strong>User:</strong> {user ? `✅ ${user.email}` : '❌ Não logado'}
        </div>
        
        <div>
          <strong>Role:</strong> {userRole ? `✅ ${userRole}` : '❌ Não definido'}
        </div>
        
        <div>
          <strong>Permissions:</strong> {userPermissions.length > 0 ? `✅ ${userPermissions.length} permissões` : '❌ Nenhuma'}
        </div>
        
        <div>
          <strong>Menu Items:</strong> {filteredMenuItems.length > 0 ? `✅ ${filteredMenuItems.length} itens` : '❌ Nenhum'}
        </div>
        
        <div className="mt-2">
          <strong>Itens do Menu:</strong>
          <ul className="mt-1 space-y-1">
            {filteredMenuItems.map((item, index) => (
              <li key={index} className="text-green-600">
                ✅ {item.title}
              </li>
            ))}
            {filteredMenuItems.length === 0 && (
              <li className="text-red-600">❌ Nenhum item visível</li>
            )}
          </ul>
        </div>
        
        <div className="mt-2">
          <strong>Permissões Detalhadas:</strong>
          <ul className="mt-1 space-y-1">
            {menuItems.map((item) => {
              const hasAccess = hasPermission(userRole, item.permission);
              return (
                <li key={item.permission} className={hasAccess ? 'text-green-600' : 'text-red-600'}>
                  {hasAccess ? '✅' : '❌'} {item.title} ({item.permission})
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DebugSidebar; 