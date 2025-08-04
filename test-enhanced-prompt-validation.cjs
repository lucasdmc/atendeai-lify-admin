const fs = require('fs');
const path = require('path');

// Carregar o JSON de contextualização da CardioPrime
const contextualizationPath = path.join(__dirname, 'src/data/contextualizacao-cardioprime.json');
const contextualizationData = JSON.parse(fs.readFileSync(contextualizationPath, 'utf8'));

console.log('🔍 TESTE DO PROMPT MELHORADO');
console.log('=' .repeat(60));

// Simular a função getClinicContext do LLM Orchestrator
function simulateGetClinicContext(context) {
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
    workingHours: clinica.horario_funcionamento || {},
    paymentMethods: context.formas_pagamento || {},
    insurance: context.convenios || [],
    emails: contatos.emails_departamentos || {},
    website: contatos.website || '',
    mainEmail: contatos.email_principal || ''
  };
}

// Simular a função prepareSystemPrompt melhorada
function simulateEnhancedSystemPrompt(clinicContext, userProfile = null) {
  let prompt = `Você é uma recepcionista virtual da ${clinicContext.name}.
Sua personalidade é: profissional, empática e prestativa

DIRETRIZES FUNDAMENTAIS:
1. Use EXCLUSIVAMENTE as informações fornecidas no contexto da clínica
2. Seja sempre cordial, profissional e empática
3. Para agendamentos, oriente o usuário sobre o processo
4. Se não souber uma informação, diga educadamente que não possui essa informação
5. NUNCA invente informações ou dê conselhos médicos
6. Mantenha respostas concisas e objetivas (máximo 3 parágrafos)
7. Use o nome do usuário quando disponível para personalizar a conversa
8. Se o usuário perguntar sobre seu nome e você souber, responda com o nome dele

INFORMAÇÕES DA CLÍNICA:
- Nome: ${clinicContext.name}
- Endereço: ${clinicContext.address || 'Não informado'}
- Telefone: ${clinicContext.phone || 'Não informado'}`;

  // Adicionar email principal se disponível
  if (clinicContext.mainEmail) {
    prompt += `\n- Email: ${clinicContext.mainEmail}`;
  }

  // Adicionar website se disponível
  if (clinicContext.website) {
    prompt += `\n- Website: ${clinicContext.website}`;
  }

  // Adicionar descrição se disponível
  if (clinicContext.description) {
    prompt += `\n- Descrição: ${clinicContext.description}`;
  }

  // Adicionar especialidades se disponível
  if (clinicContext.specialties && clinicContext.specialties.length > 0) {
    prompt += `\n- Especialidades: ${clinicContext.specialties.join(', ')}`;
  }

  // Adicionar serviços se disponível
  if (clinicContext.services && clinicContext.services.length > 0) {
    prompt += `\n- Serviços oferecidos: ${clinicContext.services.join(', ')}`;
  }

  // Adicionar profissionais se disponível
  if (clinicContext.professionals && clinicContext.professionals.length > 0) {
    prompt += `\n- Profissionais: ${clinicContext.professionals.join(', ')}`;
  }

  // Adicionar convênios se disponível
  if (clinicContext.insurance && clinicContext.insurance.length > 0) {
    const convenios = clinicContext.insurance.map(c => c.nome).join(', ');
    prompt += `\n- Convênios aceitos: ${convenios}`;
  }

  // Adicionar formas de pagamento se disponível
  if (clinicContext.paymentMethods) {
    const formas = [];
    if (clinicContext.paymentMethods.dinheiro) formas.push('Dinheiro');
    if (clinicContext.paymentMethods.cartao_credito) formas.push('Cartão de Crédito');
    if (clinicContext.paymentMethods.cartao_debito) formas.push('Cartão de Débito');
    if (clinicContext.paymentMethods.pix) formas.push('PIX');
    
    if (formas.length > 0) {
      prompt += `\n- Formas de pagamento: ${formas.join(', ')}`;
    }
  }

  // Adicionar horário de funcionamento se disponível
  if (clinicContext.workingHours && Object.keys(clinicContext.workingHours).length > 0) {
    prompt += `\n- Horário de funcionamento:`;
    const dias = {
      'segunda': 'Segunda-feira',
      'terca': 'Terça-feira', 
      'quarta': 'Quarta-feira',
      'quinta': 'Quinta-feira',
      'sexta': 'Sexta-feira',
      'sabado': 'Sábado',
      'domingo': 'Domingo'
    };
    
    Object.entries(clinicContext.workingHours).forEach(([dia, horario]) => {
      if (horario && horario.abertura && horario.fechamento) {
        prompt += `\n  • ${dias[dia]}: ${horario.abertura} às ${horario.fechamento}`;
      } else if (horario) {
        prompt += `\n  • ${dias[dia]}: Fechado`;
      }
    });
  }

  // Adicionar emails específicos por departamento se disponível
  if (clinicContext.emails && Object.keys(clinicContext.emails).length > 0) {
    prompt += `\n- Emails por departamento:`;
    Object.entries(clinicContext.emails).forEach(([dept, email]) => {
      prompt += `\n  • ${dept}: ${email}`;
    });
  }

  if (userProfile && userProfile.name) {
    prompt += `\n\nINFORMAÇÕES DO USUÁRIO:
- Nome: ${userProfile.name}`;
  }

  return prompt;
}

// Extrair contexto
const extractedContext = simulateGetClinicContext(contextualizationData);

console.log('📤 DADOS EXTRAÍDOS:');
console.log(`✅ Nome: ${extractedContext.name}`);
console.log(`✅ Endereço: ${extractedContext.address}`);
console.log(`✅ Telefone: ${extractedContext.phone}`);
console.log(`✅ Email Principal: ${extractedContext.mainEmail}`);
console.log(`✅ Website: ${extractedContext.website}`);
console.log(`✅ Horário de funcionamento: ${Object.keys(extractedContext.workingHours).length} dias`);
console.log(`✅ Emails por departamento: ${Object.keys(extractedContext.emails).length} emails`);

// Gerar prompt melhorado
const enhancedPrompt = simulateEnhancedSystemPrompt(extractedContext);

console.log('\n📝 PROMPT MELHORADO GERADO:');
console.log('=' .repeat(60));
console.log(enhancedPrompt);

// Verificar se todas as informações críticas estão no prompt
console.log('\n🔍 VERIFICAÇÃO DE INFORMAÇÕES NO PROMPT:');
console.log('-'.repeat(40));

const promptChecks = [
  { name: 'Nome da clínica', check: enhancedPrompt.includes(extractedContext.name) },
  { name: 'Endereço', check: enhancedPrompt.includes(extractedContext.address) },
  { name: 'Telefone', check: enhancedPrompt.includes(extractedContext.phone) },
  { name: 'Email principal', check: enhancedPrompt.includes(extractedContext.mainEmail) },
  { name: 'Website', check: enhancedPrompt.includes(extractedContext.website) },
  { name: 'Descrição', check: enhancedPrompt.includes('Descrição:') },
  { name: 'Especialidades', check: enhancedPrompt.includes('Especialidades:') },
  { name: 'Serviços', check: enhancedPrompt.includes('Serviços oferecidos:') },
  { name: 'Profissionais', check: enhancedPrompt.includes('Profissionais:') },
  { name: 'Convênios', check: enhancedPrompt.includes('Convênios aceitos:') },
  { name: 'Formas de pagamento', check: enhancedPrompt.includes('Formas de pagamento:') },
  { name: 'Horário de funcionamento', check: enhancedPrompt.includes('Horário de funcionamento:') },
  { name: 'Emails por departamento', check: enhancedPrompt.includes('Emails por departamento:') }
];

promptChecks.forEach(check => {
  console.log(`${check.check ? '✅' : '❌'} ${check.name}: ${check.check ? 'INCLUÍDO' : 'NÃO INCLUÍDO'}`);
});

// Verificar informações específicas que estavam faltando
console.log('\n🎯 VERIFICAÇÃO DE INFORMAÇÕES ESPECÍFICAS:');
console.log('-'.repeat(40));

// Verificar se horário de funcionamento está detalhado
const horarioDetalhado = enhancedPrompt.includes('Segunda-feira: 08:00 às 18:00');
console.log(`${horarioDetalhado ? '✅' : '❌'} Horário detalhado por dia: ${horarioDetalhado ? 'INCLUÍDO' : 'NÃO INCLUÍDO'}`);

// Verificar se email de agendamento está incluído
const emailAgendamento = enhancedPrompt.includes('agendamento: agendamento@cardioprime.com.br');
console.log(`${emailAgendamento ? '✅' : '❌'} Email de agendamento: ${emailAgendamento ? 'INCLUÍDO' : 'NÃO INCLUÍDO'}`);

// Verificar se email de resultados está incluído
const emailResultados = enhancedPrompt.includes('resultados: resultados@cardioprime.com.br');
console.log(`${emailResultados ? '✅' : '❌'} Email de resultados: ${emailResultados ? 'INCLUÍDO' : 'NÃO INCLUÍDO'}`);

console.log('\n' + '='.repeat(60));
console.log('🏁 TESTE DO PROMPT MELHORADO FINALIZADO');
console.log('='.repeat(60)); 