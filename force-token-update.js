import { execSync } from 'child_process';

const NEW_TOKEN = 'EAASAuWYr9JgBPJ1i9ItaEW6lZAxzXxt7WusW4udjYRogZBwd6TYyyPsYPP3Yl6ZBbud5ujTOryLmg4b8WugZBvdO04ZB4XDrBl08mG0qEAWrFwSITXr3j4mv6qK5OoIDWG2VMnVQwA8YhKNR9wYhs5OYliZAgVWez0gXKEv6PDhM2LIeMB5sMhImTWz87erUSbK6RRro2xMaO6VUX9yGYYu7RvYgrQv1SQpHUNVI2hdeomXxW9ty7SJibADAZDZD';

async function forceTokenUpdate() {
  console.log('🔄 Forçando atualização do token no Railway...');
  
  try {
    // Atualizar a variável de ambiente
    console.log('📝 Atualizando variável WHATSAPP_META_ACCESS_TOKEN...');
    execSync(`railway variables --set "WHATSAPP_META_ACCESS_TOKEN=${NEW_TOKEN}" --service atendeai-lify-backend`, { stdio: 'inherit' });
    
    console.log('✅ Token atualizado!');
    
    // Aguardar um pouco
    console.log('⏳ Aguardando 30 segundos para o Railway aplicar as mudanças...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    // Fazer um novo deploy
    console.log('🚀 Iniciando novo deploy...');
    execSync('railway up', { stdio: 'inherit' });
    
    console.log('✅ Deploy concluído!');
    console.log('📱 Agora envie uma mensagem no WhatsApp para testar.');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

forceTokenUpdate().then(() => {
  console.log('\n✅ Processo concluído!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro:', error);
  process.exit(1);
}); 