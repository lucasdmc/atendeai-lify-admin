// Simular a detecção do frontend
function getRedirectUri() {
  // Simular import.meta.env.VITE_GOOGLE_REDIRECT_URI não definido
  const envVar = undefined; 
  
  if (envVar) {
    return envVar;
  }
  
  // Simular window.location para produção
  const hostname = 'atendeai.lify.com.br';
  const protocol = 'https:';
  const port = '';
  
  console.log('🔧 Simulando detecção para:', hostname);
  
  // Produção: atendeai.lify.com.br
  if (hostname === 'atendeai.lify.com.br') {
    return 'https://atendeai.lify.com.br/agendamentos';
  }
  
  // Localhost com porta específica
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const portSuffix = port ? `:${port}` : ':8080';
    return `${protocol}//${hostname}${portSuffix}/agendamentos`;
  }
  
  // Outros domínios
  return `${protocol}//${hostname}${port ? `:${port}` : ''}/agendamentos`;
}

console.log('🧪 Teste da configuração do frontend:');
console.log('✅ URL detectada:', getRedirectUri());
console.log('');
console.log('🎯 Se o problema persiste, pode ser:');
console.log('1. Cache do browser');
console.log('2. Frontend não foi atualizado em produção');
console.log('3. Alguma outra configuração sobrescrevendo');
