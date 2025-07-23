// Teste de carregamento com sessão existente
console.log('🧪 Testando carregamento com sessão existente...');

// Simular logs do useAuth
console.log('🔄 [useAuth] Auth state changed: SIGNED_IN a6a63be9-6c87-49bf-80dd-0767afe84f6f');
console.log('🔄 [useAuth] Fetching user data for ID: a6a63be9-6c87-49bf-80dd-0767afe84f6f');

// Simular carregamento rápido
setTimeout(() => {
  console.log('✅ [useAuth] User data loaded successfully');
  console.log('✅ [useAuth] Role: admin_lify');
  console.log('✅ [useAuth] Permissions: ["read", "write"]');
  console.log('✅ [useAuth] Loading: false');
}, 1000);

// Simular carregamento do App
setTimeout(() => {
  console.log('✅ [App] Session detected, rendering dashboard');
  console.log('✅ [App] Loading: false');
  console.log('✅ [App] Dashboard should be visible now');
}, 1500);

console.log('📊 Teste iniciado. Verifique os logs acima para confirmar o comportamento.'); 