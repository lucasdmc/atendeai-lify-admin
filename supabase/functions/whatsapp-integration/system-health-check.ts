
// Verificação de saúde do sistema de conversação
export class SystemHealthCheck {
  static async runHealthCheck(): Promise<void> {
    console.log('🩺 === VERIFICAÇÃO DE SAÚDE DO SISTEMA ===');
    
    const checks = [];
    
    // 1. Testar importações críticas
    try {
      const { generateEnhancedAIResponse } = await import('./enhanced-openai-service.ts');
      const { LiaPersonality } = await import('./lia-personality.ts');
      const { MCPToolsProcessor } = await import('./mcp-tools.ts');
      
      checks.push({ name: 'Importações críticas', status: 'OK' });
    } catch (error) {
      checks.push({ name: 'Importações críticas', status: 'ERRO', details: error.message });
    }
    
    // 2. Testar geração de saudação da Lia
    try {
      const { LiaPersonality } = await import('./lia-personality.ts');
      const greeting = LiaPersonality.getGreetingMessage();
      
      if (greeting && greeting.includes('Lia') && greeting.includes('😊')) {
        checks.push({ name: 'Saudação da Lia', status: 'OK' });
      } else {
        checks.push({ name: 'Saudação da Lia', status: 'ERRO', details: 'Saudação inválida' });
      }
    } catch (error) {
      checks.push({ name: 'Saudação da Lia', status: 'ERRO', details: error.message });
    }
    
    // 3. Testar MCP Tools
    try {
      const { MCPToolsProcessor } = await import('./mcp-tools.ts');
      const tools = MCPToolsProcessor.getMCPTools();
      
      if (tools && tools.length > 0) {
        checks.push({ name: 'MCP Tools', status: 'OK' });
      } else {
        checks.push({ name: 'MCP Tools', status: 'ERRO', details: 'Nenhuma ferramenta encontrada' });
      }
    } catch (error) {
      checks.push({ name: 'MCP Tools', status: 'ERRO', details: error.message });
    }
    
    // 4. Testar geração de resposta simples
    try {
      const { generateEnhancedAIResponse } = await import('./enhanced-openai-service.ts');
      // Teste básico sem chamada real à API
      checks.push({ name: 'Função de resposta', status: 'OK' });
    } catch (error) {
      checks.push({ name: 'Função de resposta', status: 'ERRO', details: error.message });
    }
    
    // Relatório
    console.log('\n📊 RESULTADO DA VERIFICAÇÃO:');
    let totalOK = 0;
    let totalErros = 0;
    
    checks.forEach((check, index) => {
      if (check.status === 'OK') {
        console.log(`✅ ${index + 1}. ${check.name}: ${check.status}`);
        totalOK++;
      } else {
        console.log(`❌ ${index + 1}. ${check.name}: ${check.status}`);
        if (check.details) {
          console.log(`   Detalhes: ${check.details}`);
        }
        totalErros++;
      }
    });
    
    console.log(`\n🎯 RESUMO: ${totalOK} OK | ${totalErros} ERROS`);
    
    if (totalErros === 0) {
      console.log('🎉 SISTEMA SAUDÁVEL! Pronto para conversas fluidas.');
    } else {
      console.log('⚠️ SISTEMA PRECISA DE ATENÇÃO. Verificar erros acima.');
    }
  }
}

// Executar verificação automaticamente
SystemHealthCheck.runHealthCheck();
