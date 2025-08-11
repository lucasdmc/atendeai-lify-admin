// Script de teste para verificar a contextualização - VERSÃO SIMPLIFICADA
import { createClient } from '@supabase/supabase-js';

// Configuração direta do Supabase (sem variáveis de ambiente)
const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M';

async function testContextualization() {
  try {
    console.log('🧪 [TESTE] Iniciando teste de contextualização SIMPLIFICADO...');
    
    // Configurar Supabase diretamente
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ [TESTE] Supabase configurado');
    
    // Buscar todas as clínicas
    console.log('🔍 [TESTE] Buscando clínicas no banco...');
    const { data: clinics, error } = await supabase
      .from('clinics')
      .select('*');
    
    if (error) {
      console.error('❌ [TESTE] Erro ao buscar clínicas:', error);
      return;
    }
    
    console.log(`✅ [TESTE] ${clinics.length} clínicas encontradas:`);
    clinics.forEach(clinic => {
      console.log(`   - ${clinic.name} (ID: ${clinic.id})`);
      console.log(`     WhatsApp: ${clinic.whatsapp_phone}`);
      console.log(`     Tem contextualização: ${clinic.has_contextualization}`);
      console.log(`     JSON: ${clinic.contextualization_json ? 'SIM' : 'NÃO'}`);
      if (clinic.contextualization_json) {
        console.log(`     Estrutura: ${Object.keys(clinic.contextualization_json).join(', ')}`);
      }
      console.log('');
    });
    
    // Testar contextualização para cada clínica
    for (const clinic of clinics) {
      if (clinic.has_contextualization && clinic.contextualization_json) {
        console.log(`🧪 [TESTE] Testando contextualização para: ${clinic.name}`);
        
        try {
          // Testar extração direta dos dados
          const jsonContext = clinic.contextualization_json;
          const clinica = jsonContext.clinica || {};
          const agente = jsonContext.agente_ia || {};
          
          console.log(`✅ [TESTE] Dados extraídos para ${clinic.name}:`);
          console.log(`   - Nome: ${clinica.informacoes_basicas?.nome || 'NÃO CONFIGURADO'}`);
          console.log(`   - Agente: ${agente.configuracao?.nome || 'NÃO CONFIGURADO'}`);
          console.log(`   - Saudação: ${agente.configuracao?.saudacao_inicial ? 'CONFIGURADA' : 'NÃO CONFIGURADA'}`);
          console.log(`   - Despedida: ${agente.configuracao?.mensagem_despedida ? 'CONFIGURADA' : 'NÃO CONFIGURADA'}`);
          console.log(`   - Profissionais: ${clinica.profissionais?.length || 0}`);
          console.log(`   - Serviços: ${clinica.servicos?.length || 0}`);
          
          // Testar se as mensagens estão corretas
          if (agente.configuracao?.saudacao_inicial) {
            console.log(`   - Saudação atual: "${agente.configuracao.saudacao_inicial}"`);
          }
          
          if (agente.configuracao?.mensagem_despedida) {
            console.log(`   - Despedida atual: "${agente.configuracao.mensagem_despedida}"`);
          }
          
        } catch (contextError) {
          console.error(`❌ [TESTE] Erro ao extrair dados para ${clinic.name}:`, contextError.message);
        }
        
        console.log('');
      }
    }
    
    // Testar mapeamento de WhatsApp
    console.log('🧪 [TESTE] Testando mapeamento de WhatsApp...');
    const testNumbers = [
      '+554730915628',
      '554730915628',
      '+554730915628',
      '4730915628'
    ];
    
    for (const number of testNumbers) {
      console.log(`🔍 [TESTE] Testando número: ${number}`);
      
      // Normalizar número
      const normalizedPhone = number.replace(/\D/g, '');
      const fullPhone = normalizedPhone.startsWith('55') ? `+${normalizedPhone}` : `+55${normalizedPhone}`;
      
      console.log(`   Número normalizado: ${fullPhone}`);
      
      // Buscar clínica
      const { data: clinic, error: searchError } = await supabase
        .from('clinics')
        .select('name, whatsapp_phone, id')
        .eq('whatsapp_phone', fullPhone)
        .single();
      
      if (searchError && searchError.code !== 'PGRST116') {
        console.error(`   Erro na busca: ${searchError.message}`);
      } else if (clinic) {
        console.log(`   ✅ Clínica encontrada: ${clinic.name} (ID: ${clinic.id})`);
      } else {
        console.log(`   ⚠️ Nenhuma clínica encontrada`);
      }
    }
    
    console.log('✅ [TESTE] Teste concluído!');
    
  } catch (error) {
    console.error('❌ [TESTE] Erro no teste:', error);
  }
}

// Executar teste
testContextualization();
