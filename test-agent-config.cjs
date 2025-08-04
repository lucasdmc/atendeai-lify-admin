const fs = require('fs');
const path = require('path');

// Carregar o JSON de contextualização da CardioPrime
const contextualizationPath = path.join(__dirname, 'src/data/contextualizacao-cardioprime.json');
const contextualizationData = JSON.parse(fs.readFileSync(contextualizationPath, 'utf8'));

console.log('🔍 TESTE DE CONFIGURAÇÕES DO AGENTE IA');
console.log('=' .repeat(60));

// Simular a função getClinicContext melhorada
function simulateEnhancedGetClinicContext(context) {
  const clinica = context.clinica || {};
  const localizacao = clinica.localizacao || {};
  const contatos = clinica.contatos || {};
  const servicos = context.servicos || {};
  const profissionais = context.profissionais || [];

  // Construir endereço completo
  let enderecoCompleto = '';
  if (localizacao.endereco_principal) {
    const end = localizacao.endereco_principal;
    enderecoCompleto = `${end.logradouro || ''}, ${end.numero || ''}${end.complemento ? ` - ${end.complemento}` : ''}, ${end.bairro || ''}, ${end.cidade || ''} - ${end.estado || ''}, CEP: ${end.cep || ''}`.trim();
  }

  // Extrair telefone principal
  const telefone = contatos.telefone_principal || contatos.whatsapp || '';

  // Extrair serviços
  const servicosList = [];
  if (servicos.consultas) {
    servicosList.push(...servicos.consultas.map(s => s.nome));
  }
  if (servicos.exames) {
    servicosList.push(...servicos.exames.map(s => s.nome));
  }

  // Extrair profissionais
  const profissionaisList = profissionais.map(p => p.nome_completo);

  return {
    name: clinica.informacoes_basicas?.nome || 'Clínica Médica',
    address: enderecoCompleto,
    phone: telefone,
    services: servicosList,
    professionals: profissionaisList,
    specialties: clinica.informacoes_basicas?.especialidades_secundarias || [],
    description: clinica.informacoes_basicas?.descricao || '',
    mission: clinica.informacoes_basicas?.missao || '',
    values: clinica.informacoes_basicas?.valores || [],
    differentiators: clinica.informacoes_basicas?.diferenciais || [],
    workingHours: clinica.horario_funcionamento || {},
    paymentMethods: context.formas_pagamento || {},
    insurance: context.convenios || [],
    insuranceDetails: context.convenios || [],
    emails: contatos.emails_departamentos || {},
    website: contatos.website || '',
    mainEmail: contatos.email_principal || '',
    bookingPolicies: context.politicas?.agendamento || {},
    servicePolicies: context.politicas?.atendimento || {},
    additionalInfo: context.informacoes_adicionais || {},
    professionalsDetails: context.profissionais || [],
    servicesDetails: context.servicos || {},
    agentConfig: context.agente_ia?.configuracao || {},
    agentBehavior: context.agente_ia?.comportamento || {},
    agentRestrictions: context.agente_ia?.restricoes || {}
  };
}

// Simular a função prepareSystemPrompt melhorada
function simulateEnhancedSystemPrompt(clinicContext, userProfile = null) {
  // Configurações do agente IA do JSON
  const agentConfig = clinicContext.agentConfig || {};
  const agentBehavior = clinicContext.agentBehavior || {};
  const agentRestrictions = clinicContext.agentRestrictions || {};
  
  // Nome do agente (padrão ou do JSON)
  const agentName = agentConfig.nome || 'Assistente Virtual';
  
  // Personalidade do agente (padrão ou do JSON)
  const agentPersonality = agentConfig.personalidade || 'profissional, empática e prestativa';
  
  // Tom de comunicação (padrão ou do JSON)
  const communicationTone = agentConfig.tom_comunicacao || 'Formal mas acessível';
  
  // Nível de formalidade (padrão ou do JSON)
  const formalityLevel = agentConfig.nivel_formalidade || 'Médio';
  
  // Saudação inicial (padrão ou do JSON)
  const initialGreeting = agentConfig.saudacao_inicial || `Olá! Sou o ${agentName}, assistente virtual da ${clinicContext.name}. Como posso ajudá-lo hoje?`;
  
  // Mensagem de despedida (padrão ou do JSON)
  const farewellMessage = agentConfig.mensagem_despedida || 'Obrigado por escolher nossa clínica. Até breve!';
  
  // Mensagem fora do horário (padrão ou do JSON)
  const outOfHoursMessage = agentConfig.mensagem_fora_horario || 'No momento estamos fora do horário de atendimento. Retornaremos seu contato no próximo horário comercial.';
  
  // Restrições específicas
  const restrictions = [];
  if (agentRestrictions.nao_pode_diagnosticar) {
    restrictions.push('NUNCA faça diagnósticos médicos');
  }
  if (agentRestrictions.nao_pode_prescrever) {
    restrictions.push('NUNCA prescreva medicamentos');
  }
  
  // Emergências cardíacas (se configuradas)
  const cardiacEmergencies = agentRestrictions.emergencias_cardiacas || [];
  
  let prompt = `Você é ${agentName}, assistente virtual da ${clinicContext.name}.
Sua personalidade é: ${agentPersonality}
Tom de comunicação: ${communicationTone}
Nível de formalidade: ${formalityLevel}

DIRETRIZES FUNDAMENTAIS:
1. Use EXCLUSIVAMENTE as informações fornecidas no contexto da clínica
2. Seja sempre cordial, profissional e empático
3. Para agendamentos, oriente o usuário sobre o processo
4. Se não souber uma informação, diga educadamente que não possui essa informação
5. ${restrictions.join(', ')}
6. Mantenha respostas concisas e objetivas (máximo 3 parágrafos)
7. Use o nome do usuário quando disponível para personalizar a conversa
8. Se o usuário perguntar sobre seu nome, responda com: "${agentName}"`;

  // Adicionar emergências cardíacas se configuradas
  if (cardiacEmergencies.length > 0) {
    prompt += `\n\nEMERGÊNCIAS CARDÍACAS - ORIENTAÇÕES:`;
    cardiacEmergencies.forEach(emergencia => {
      prompt += `\n• ${emergencia}`;
    });
  }

  // Adicionar comportamento do agente se configurado
  if (Object.keys(agentBehavior).length > 0) {
    prompt += `\n\nCOMPORTAMENTO DO AGENTE:`;
    if (agentBehavior.proativo) prompt += `\n• Seja proativo em oferecer ajuda`;
    if (agentBehavior.oferece_sugestoes) prompt += `\n• Ofereça sugestões quando apropriado`;
    if (agentBehavior.solicita_feedback) prompt += `\n• Solicite feedback quando necessário`;
    if (agentBehavior.escalacao_automatica) prompt += `\n• Escale para atendimento humano quando necessário`;
    if (agentBehavior.limite_tentativas) prompt += `\n• Limite de tentativas: ${agentBehavior.limite_tentativas}`;
    if (agentBehavior.contexto_conversa) prompt += `\n• Mantenha contexto da conversa`;
  }

  // Adicionar mensagens específicas
  prompt += `\n\nMENSAGENS ESPECÍFICAS:`;
  prompt += `\n• Saudação inicial: "${initialGreeting}"`;
  prompt += `\n• Mensagem de despedida: "${farewellMessage}"`;
  prompt += `\n• Mensagem fora do horário: "${outOfHoursMessage}"`;

  return prompt;
}

// Extrair contexto completo
const extractedContext = simulateEnhancedGetClinicContext(contextualizationData);

console.log('📤 CONFIGURAÇÕES DO AGENTE IA EXTRAÍDAS:');
console.log('-'.repeat(40));
console.log(`✅ Nome do agente: ${extractedContext.agentConfig.nome || 'NÃO CONFIGURADO'}`);
console.log(`✅ Personalidade: ${extractedContext.agentConfig.personalidade ? 'CONFIGURADA' : 'NÃO CONFIGURADA'}`);
console.log(`✅ Tom de comunicação: ${extractedContext.agentConfig.tom_comunicacao || 'NÃO CONFIGURADO'}`);
console.log(`✅ Nível de formalidade: ${extractedContext.agentConfig.nivel_formalidade || 'NÃO CONFIGURADO'}`);
console.log(`✅ Saudação inicial: ${extractedContext.agentConfig.saudacao_inicial ? 'CONFIGURADA' : 'NÃO CONFIGURADA'}`);
console.log(`✅ Mensagem de despedida: ${extractedContext.agentConfig.mensagem_despedida ? 'CONFIGURADA' : 'NÃO CONFIGURADA'}`);
console.log(`✅ Mensagem fora horário: ${extractedContext.agentConfig.mensagem_fora_horario ? 'CONFIGURADA' : 'NÃO CONFIGURADA'}`);

console.log('\n🔧 COMPORTAMENTO DO AGENTE:');
console.log('-'.repeat(40));
console.log(`✅ Proativo: ${extractedContext.agentBehavior.proativo ? 'SIM' : 'NÃO'}`);
console.log(`✅ Oferece sugestões: ${extractedContext.agentBehavior.oferece_sugestoes ? 'SIM' : 'NÃO'}`);
console.log(`✅ Solicita feedback: ${extractedContext.agentBehavior.solicita_feedback ? 'SIM' : 'NÃO'}`);
console.log(`✅ Escalação automática: ${extractedContext.agentBehavior.escalacao_automatica ? 'SIM' : 'NÃO'}`);
console.log(`✅ Limite de tentativas: ${extractedContext.agentBehavior.limite_tentativas || 'NÃO CONFIGURADO'}`);
console.log(`✅ Contexto de conversa: ${extractedContext.agentBehavior.contexto_conversa ? 'SIM' : 'NÃO'}`);

console.log('\n🚫 RESTRIÇÕES DO AGENTE:');
console.log('-'.repeat(40));
console.log(`✅ Não pode diagnosticar: ${extractedContext.agentRestrictions.nao_pode_diagnosticar ? 'SIM' : 'NÃO'}`);
console.log(`✅ Não pode prescrever: ${extractedContext.agentRestrictions.nao_pode_prescrever ? 'SIM' : 'NÃO'}`);
console.log(`✅ Emergências cardíacas: ${extractedContext.agentRestrictions.emergencias_cardiacas?.length || 0} orientações`);

// Gerar prompt com configurações do agente
const enhancedPrompt = simulateEnhancedSystemPrompt(extractedContext);

console.log('\n📝 PROMPT COM CONFIGURAÇÕES DO AGENTE:');
console.log('=' .repeat(60));
console.log(enhancedPrompt);

// Verificar se as configurações estão sendo aplicadas
console.log('\n🔍 VERIFICAÇÃO DE CONFIGURAÇÕES NO PROMPT:');
console.log('-'.repeat(40));

const promptChecks = [
  { name: 'Nome do agente', check: enhancedPrompt.includes(extractedContext.agentConfig.nome || 'Assistente Virtual') },
  { name: 'Personalidade', check: enhancedPrompt.includes('Sua personalidade é:') },
  { name: 'Tom de comunicação', check: enhancedPrompt.includes('Tom de comunicação:') },
  { name: 'Nível de formalidade', check: enhancedPrompt.includes('Nível de formalidade:') },
  { name: 'Saudação inicial', check: enhancedPrompt.includes('Saudação inicial:') },
  { name: 'Mensagem de despedida', check: enhancedPrompt.includes('Mensagem de despedida:') },
  { name: 'Mensagem fora horário', check: enhancedPrompt.includes('Mensagem fora do horário:') },
  { name: 'Comportamento do agente', check: enhancedPrompt.includes('COMPORTAMENTO DO AGENTE:') },
  { name: 'Restrições', check: enhancedPrompt.includes('NUNCA faça diagnósticos médicos') || enhancedPrompt.includes('NUNCA prescreva medicamentos') },
  { name: 'Emergências cardíacas', check: enhancedPrompt.includes('EMERGÊNCIAS CARDÍACAS') }
];

promptChecks.forEach(check => {
  console.log(`${check.check ? '✅' : '❌'} ${check.name}: ${check.check ? 'INCLUÍDO' : 'NÃO INCLUÍDO'}`);
});

console.log('\n' + '='.repeat(60));
console.log('🏁 TESTE DE CONFIGURAÇÕES DO AGENTE IA FINALIZADO');
console.log('='.repeat(60)); 