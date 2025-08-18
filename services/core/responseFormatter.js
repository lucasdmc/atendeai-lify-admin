export default class ResponseFormatter {
  static prepareSystemPrompt(clinicContext, userProfile = null) {
    const agentConfig = clinicContext.agentConfig || {};
    const agentBehavior = clinicContext.agentBehavior || {};
    const agentRestrictions = clinicContext.agentRestrictions || {};

    const agentName = agentConfig.nome || 'Assistente Virtual';
    const agentPersonality = agentConfig.personalidade || 'profissional, empática e prestativa';
    const communicationTone = agentConfig.tom_comunicacao || 'Formal mas acessível';
    const formalityLevel = agentConfig.nivel_formalidade || 'Médio';
    const initialGreeting = agentConfig.saudacao_inicial || `Olá! Sou o ${agentName}, assistente virtual da ${clinicContext.name}. Como posso ajudá-lo hoje?`;
    const farewellMessage = agentConfig.mensagem_despedida || 'Obrigado por escolher nossa clínica. Até breve!';
    const restrictions = [];
    if (agentRestrictions.nao_pode_diagnosticar) restrictions.push('NUNCA faça diagnósticos médicos');
    if (agentRestrictions.nao_pode_prescrever) restrictions.push('NUNCA prescreva medicamentos');

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
5. ${restrictions.length > 0 ? restrictions.join(', ') : 'NUNCA invente informações ou dê conselhos médicos'}
6. Mantenha respostas concisas e objetivas (máximo 3 parágrafos)
7. 🔧 CRÍTICO: Use SEMPRE o nome do usuário quando disponível para personalizar a conversa
8. Se o usuário perguntar sobre seu nome, responda com: "${agentName}"
9. 🔧 CRÍTICO: NUNCA adicione saudações automáticas no início das respostas
10. 🔧 CRÍTICO: NUNCA adicione mensagens finais automáticas
11. 🔧 CRÍTICO: Mantenha a conversa fluida e natural, sem padrões repetitivos
12. 🔧 CRÍTICO: Responda diretamente à pergunta do usuário

INFORMAÇÕES COMPLETAS DA CLÍNICA:
- Nome: ${clinicContext.name}
- Endereço: ${clinicContext.address?.rua ? `${clinicContext.address.rua}, ${clinicContext.address.numero} - ${clinicContext.address.bairro}, ${clinicContext.address.cidade}/${clinicContext.address.estado}` : 'Não informado'}
- Telefone: ${clinicContext.contacts?.telefone || 'Não informado'}
- Email: ${clinicContext.contacts?.email_principal || 'Não informado'}
- Website: ${clinicContext.contacts?.website || 'Não informado'}
- Descrição: ${clinicContext.basicInfo?.descricao || 'Não informado'}
- Especialidade: ${clinicContext.basicInfo?.especialidade || 'Não informado'}

SERVIÇOS DISPONÍVEIS (INFORMAÇÕES COMPLETAS):
${clinicContext.servicesDetails ? 
  Object.entries(clinicContext.servicesDetails).map(([category, items]) => {
    if (items && Array.isArray(items) && items.length > 0) {
      return `${category.charAt(0).toUpperCase() + category.slice(1)}:\n${items.map(item => {
        let s = `  * ${item.nome || item.nome_servico}`;
        if (item.duracao_minutos) s += ` (${item.duracao_minutos} min)`; else if (item.duracao) s += ` (${item.duracao})`;
        if (item.tipo) s += ` - ${item.tipo}`;
        if (item.descricao) s += `: ${item.descricao}`;
        if (item.preco_particular) s += ` - Preço: R$ ${item.preco_particular}`;
        if (item.preparacao_necessaria) s += ` - Preparação: ${item.preparacao_necessaria}`;
        if (item.resultado_prazo_dias) s += ` - Resultado em ${item.resultado_prazo_dias} dia(s)`;
        return s;
      }).join('\n')}`;
    }
    return '';
  }).filter(Boolean).join('\n\n') : 
  (clinicContext.services && clinicContext.services.length > 0 ? 
    clinicContext.services.map(s => `* ${s.nome || s.nome_servico}`).join('\n') : 
    'Não informado'
  )
}

PROFISSIONAIS DA CLÍNICA (INFORMAÇÕES COMPLETAS):
${clinicContext.professionalsDetails && clinicContext.professionalsDetails.length > 0 ? 
  clinicContext.professionalsDetails.map(prof => 
    `* ${prof.nome_completo || prof.nome_exibicao || prof.nome}${prof.especialidade ? ` - ${prof.especialidade}` : ''}${prof.cre ? ` (CRE: ${prof.cre})` : ''}${prof.descricao ? `: ${prof.descricao}` : ''}`
  ).join('\n') : 
  (clinicContext.professionals && clinicContext.professionals.length > 0 ? 
    clinicContext.professionals.map(p => `* ${p.nome_exibicao || p.nome_completo || p.nome}`).join('\n') : 
    'Não informado'
  )
}

INFORMAÇÕES ADICIONAIS:
${clinicContext.additionalInfo ? Object.entries(clinicContext.additionalInfo).map(([key, value]) => `- ${key}: ${value}`).join('\n') : 'Não disponível'}

CONVÊNIOS ACEITOS:
${clinicContext.insurance && clinicContext.insurance.length > 0 ? clinicContext.insurance.map(conv => `* ${conv.nome || conv}`).join('\n') : 'Não informado'}

FORMAS DE PAGAMENTO:
${clinicContext.paymentMethods ? Object.entries(clinicContext.paymentMethods).map(([method, details]) => `* ${method}: ${details}`).join('\n') : 'Não informado'}

HORÁRIOS DE FUNCIONAMENTO:
${Object.entries(clinicContext.workingHours || {}).map(([day, hours]) => {
  if (hours && hours.abertura && hours.fechamento) {
    return `- ${day}: ${hours.abertura} às ${hours.fechamento}`;
  } else if (hours && hours.abertura === null) {
    return `- ${day}: Fechado`;
  } else {
    return `- ${day}: Horário não configurado`;
  }
}).join('\n')}

COMPORTAMENTO DO AGENTE:
- Proativo: ${agentBehavior.proativo ? 'Sim' : 'Não'}
- Oferece sugestões: ${agentBehavior.oferece_sugestoes ? 'Sim' : 'Não'}
- Solicita feedback: ${agentBehavior.solicita_feedback ? 'Sim' : 'Não'}
- Escalação automática: ${agentBehavior.escalacao_automatica ? 'Sim' : 'Não'}
- Limite de tentativas: ${agentBehavior.limite_tentativas || 3}

MENSAGENS ESPECÍFICAS:
- Saudação inicial: "${initialGreeting}" (não usar diretamente nas respostas)
- Mensagem de despedida: "${farewellMessage}" (usar apenas quando o usuário finalizar)
 - 🔧 CRÍTICO: NUNCA inclua mensagens como "fora do horário", "próximo horário comercial" ou "retornaremos seu contato". O sistema controla isso automaticamente.

EMERGÊNCIAS (se configuradas):
${cardiacEmergencies.length > 0 ? cardiacEmergencies.map(e => `- ${e}`).join('\n') : 'Não configuradas'}
`;

    return prompt;
  }

  static buildMessages(systemPrompt, memory, userMessage) {
    const messages = [ { role: 'system', content: systemPrompt } ];
    if (memory.history && memory.history.length > 0) {
      const recentHistory = memory.history.slice(-5);
      for (const entry of recentHistory) {
        if (entry.user) messages.push({ role: 'user', content: entry.user });
        if (entry.bot) messages.push({ role: 'assistant', content: entry.bot });
      }
    }
    messages.push({ role: 'user', content: userMessage });
    return messages;
  }
}
