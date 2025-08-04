// Script para verificar e renovar token do WhatsApp Meta
import dotenv from 'dotenv';
import axios from 'axios';

// Carregar variáveis de ambiente
dotenv.config();

async function checkWhatsAppToken() {
  try {
    console.log('🔍 Verificando token do WhatsApp Meta...');
    
    const accessToken = process.env.WHATSAPP_META_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_META_PHONE_NUMBER_ID;
    
    console.log('📱 Configuração atual:');
    console.log('  - Phone Number ID:', phoneNumberId);
    console.log('  - Access Token:', accessToken ? `${accessToken.substring(0, 20)}...` : 'NÃO CONFIGURADO');
    
    if (!accessToken) {
      console.error('❌ Token de acesso não configurado!');
      return false;
    }
    
    // Testar o token fazendo uma requisição para a API
    try {
      const response = await axios.get(`https://graph.facebook.com/v18.0/${phoneNumberId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Token válido!');
      console.log('📊 Informações do número:', response.data);
      return true;
      
    } catch (error) {
      if (error.response?.status === 401) {
        console.error('❌ Token expirado ou inválido!');
        console.error('📝 Erro:', error.response.data?.error?.message);
        
        console.log('\n🔄 Para renovar o token:');
        console.log('1. Acesse: https://developers.facebook.com/apps/');
        console.log('2. Selecione seu app');
        console.log('3. Vá em "WhatsApp" > "Getting Started"');
        console.log('4. Copie o novo "Permanent access token"');
        console.log('5. Atualize a variável WHATSAPP_META_ACCESS_TOKEN no .env');
        
        return false;
      } else {
        console.error('❌ Erro ao verificar token:', error.message);
        return false;
      }
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error.message);
    return false;
  }
}

// Executar verificação
checkWhatsAppToken()
  .then(isValid => {
    if (isValid) {
      console.log('🎉 Token está funcionando corretamente!');
      process.exit(0);
    } else {
      console.log('⚠️ Token precisa ser renovado!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Erro na verificação:', error);
    process.exit(1);
  }); 