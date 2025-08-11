import dotenv from 'dotenv';
import { ClinicContextManager } from './services/core/clinicContextManager.js';
import { LLMOrchestratorService } from './services/core/llmOrchestratorService.js';

dotenv.config();

async function testProductionVsLocal() {
  console.log('🔍 COMPARAÇÃO PRODUÇÃO vs LOCAL');
  console.log('=================================');
  console.log('🔍 Identificando EXATAMENTE onde está a diferença');
  
  try {
    // 1. Inicializar serviços
    console.log('\n1️⃣ Inicializando serviços...');
    await ClinicContextManager.initialize();
    console.log('✅ ClinicContextManager inicializado');
    
    // 2. Buscar clínica
    console.log('\n2️⃣ Buscando clínica CardioPrime...');
    const clinicName = await ClinicContextManager.getClinicByWhatsApp('+554730915628');
    console.log('✅ Clínica encontrada:', clinicName);
    
    if (!clinicName) {
      console.log('❌ Nenhuma clínica encontrada');
      return;
    }
    
    // 3. Carregar contexto COMPLETO
    console.log('\n3️⃣ Carregando contexto COMPLETO...');
    const context = await ClinicContextManager.getClinicContext(clinicName);
    
    console.log('📊 CONTEXTO CARREGADO:');
    console.log('   - Nome:', context?.name);
    console.log('   - Serviços:', context?.services?.length || 0);
    console.log('   - Profissionais:', context?.professionals?.length || 0);
    console.log('   - ServicesDetails:', !!context?.servicesDetails);
    console.log('   - ProfessionalsDetails:', !!context?.professionalsDetails);
    
    // 4. VERIFICAR SE OS DADOS ESTÃO LÁ
    console.log('\n4️⃣ VERIFICANDO SE OS DADOS ESTÃO LÁ:');
    
    if (context?.servicesDetails) {
      console.log('📋 SERVIÇOS DETALHADOS ENCONTRADOS:');
      console.log('   - Consultas:', context.servicesDetails.consultas?.length || 0);
      console.log('   - Exames:', context.servicesDetails.exames?.length || 0);
      console.log('   - Procedimentos:', context.servicesDetails.procedimentos?.length || 0);
      
      if (context.servicesDetails.exames) {
        console.log('   🔬 EXAMES COM PREÇOS:');
        context.servicesDetails.exames.forEach((exame, i) => {
          console.log(`      ${i + 1}. ${exame.nome} - R$ ${exame.preco_particular || 'N/A'}`);
        });
      }
    } else {
      console.log('❌ ServicesDetails NÃO encontrado!');
    }
    
    if (context?.professionalsDetails) {
      console.log('👨‍⚕️ PROFISSIONAIS DETALHADOS ENCONTRADOS:');
      context.professionalsDetails.forEach((prof, i) => {
        console.log(`   ${i + 1}. ${prof.nome_completo || prof.nome_exibicao || prof.nome}`);
      });
    } else {
      console.log('❌ ProfessionalsDetails NÃO encontrado!');
    }
    
    // 5. SIMULAR O QUE O LLM RECEBE
    console.log('\n5️⃣ SIMULANDO O QUE O LLM RECEBE...');
    
    const systemPrompt = LLMOrchestratorService.prepareSystemPrompt(context, {});
    
    // 6. VERIFICAR SE AS INFORMAÇÕES ESTÃO NO PROMPT
    console.log('\n6️⃣ VERIFICANDO INFORMAÇÕES NO PROMPT:');
    
    const hasServices = systemPrompt.includes('Consulta Cardiológica') || 
                       systemPrompt.includes('Ecocardiograma') ||
                       systemPrompt.includes('Teste Ergométrico');
    
    const hasProfessionals = systemPrompt.includes('Dr. Roberto Silva') || 
                            systemPrompt.includes('Dra. Maria Fernanda');
    
    const hasDetailedServices = systemPrompt.includes('SERVIÇOS DISPONÍVEIS (INFORMAÇÕES COMPLETAS)');
    const hasDetailedProfessionals = systemPrompt.includes('PROFISSIONAIS DA CLÍNICA (INFORMAÇÕES COMPLETAS)');
    
    const hasPrices = systemPrompt.includes('preco_particular') || 
                     systemPrompt.includes('250') || 
                     systemPrompt.includes('200') ||
                     systemPrompt.includes('180');
    
    console.log('🔍 VERIFICAÇÕES:');
    console.log('   - Tem serviços no prompt:', hasServices);
    console.log('   - Tem profissionais no prompt:', hasProfessionals);
    console.log('   - Tem seção de serviços detalhados:', hasDetailedServices);
    console.log('   - Tem seção de profissionais detalhados:', hasDetailedProfessionals);
    console.log('   - Tem preços no prompt:', hasPrices);
    
    // 7. DEBUG: Verificar estrutura completa
    console.log('\n7️⃣ DEBUG: ESTRUTURA COMPLETA:');
    
    console.log('📋 ESTRUTURA DO CONTEXTO:');
    console.log('   - context.keys:', Object.keys(context || {}));
    console.log('   - context.services:', context?.services);
    console.log('   - context.professionals:', context?.professionals);
    console.log('   - context.servicesDetails:', context?.servicesDetails ? 'EXISTE' : 'NÃO EXISTE');
    console.log('   - context.professionalsDetails:', context?.professionalsDetails ? 'EXISTE' : 'NÃO EXISTE');
    
    // 8. RESULTADO FINAL
    console.log('\n🎯 RESULTADO FINAL:');
    
    const hasCompleteContext = hasServices && hasProfessionals && hasDetailedServices && hasDetailedProfessionals;
    
    if (hasCompleteContext) {
      console.log('✅ CONTEXTUALIZAÇÃO COMPLETA FUNCIONANDO LOCALMENTE!');
      console.log('   PROBLEMA: Em produção não está funcionando');
      console.log('   DIFERENÇA IDENTIFICADA:');
      console.log('   - Local: ✅ Funciona perfeitamente');
      console.log('   - Produção: ❌ Não funciona');
      console.log('   CAUSA: Deploy não atualizou ou cache do Railway');
    } else {
      console.log('❌ CONTEXTUALIZAÇÃO INCOMPLETA LOCALMENTE!');
      console.log('   PROBLEMA: Código não está funcionando nem localmente');
      console.log('   CAUSA: Erro no código ou dados');
    }
    
    // 9. RECOMENDAÇÕES
    console.log('\n💡 RECOMENDAÇÕES:');
    if (hasCompleteContext) {
      console.log('   1. Forçar novo deploy no Railway');
      console.log('   2. Verificar se todos os arquivos foram atualizados');
      console.log('   3. Limpar cache do Railway se possível');
      console.log('   4. Verificar variáveis de ambiente em produção');
    } else {
      console.log('   1. Corrigir o código primeiro');
      console.log('   2. Verificar se os dados estão no banco');
      console.log('   3. Testar localmente antes do deploy');
    }
    
  } catch (error) {
    console.error('💥 ERRO NO TESTE:', error);
  }
}

testProductionVsLocal();
