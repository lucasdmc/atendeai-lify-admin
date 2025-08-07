// Teste específico para a função getClinicContext
import { LLMOrchestratorService } from './services/llmOrchestratorService.js';

async function testGetClinicContext() {
  try {
    console.log('🧪 Testando função getClinicContext...');
    
    // Testar com o número que está sendo usado no webhook
    const phoneNumber = '554730915628';
    
    console.log('📱 Buscando clínica para:', phoneNumber);
    
    // Chamar função diretamente
    const clinicContext = await LLMOrchestratorService.getClinicContext(phoneNumber);
    
    console.log('📥 Contexto da clínica:', {
      name: clinicContext.name,
      hasWorkingHours: !!clinicContext.workingHours,
      workingHoursKeys: Object.keys(clinicContext.workingHours || {}),
      agentConfig: clinicContext.agentConfig ? 'PRESENTE' : 'AUSENTE'
    });
    
    // Testar função isWithinBusinessHours com o contexto obtido
    const isWithinBusinessHours = LLMOrchestratorService.isWithinBusinessHours(clinicContext);
    
    console.log('🕒 isWithinBusinessHours:', isWithinBusinessHours);
    console.log('🕒 Tipo:', typeof isWithinBusinessHours);
    
  } catch (error) {
    console.error('❌ Erro:', error);
    console.error('❌ Stack trace:', error.stack);
  }
}

testGetClinicContext();
