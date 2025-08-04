const fs = require('fs');
const path = require('path');

// Carregar o JSON de contextualização da CardioPrime
const contextualizationPath = path.join(__dirname, 'src/data/contextualizacao-cardioprime.json');
const contextualizationData = JSON.parse(fs.readFileSync(contextualizationPath, 'utf8'));

console.log('🔍 TESTE COMPLETO DE VALIDAÇÃO DE CONTEXTUALIZAÇÃO');
console.log('=' .repeat(60));

// 1. VALIDAR ESTRUTURA COMPLETA DO JSON
console.log('\n📋 1. VALIDAÇÃO DA ESTRUTURA DO JSON');
console.log('-'.repeat(40));

const requiredSections = [
  'clinica',
  'agente_ia', 
  'profissionais',
  'servicos',
  'convenios',
  'formas_pagamento',
  'politicas',
  'informacoes_adicionais',
  'metadados'
];

requiredSections.forEach(section => {
  if (contextualizationData[section]) {
    console.log(`✅ ${section}: PRESENTE`);
  } else {
    console.log(`❌ ${section}: AUSENTE`);
  }
});

// 2. VALIDAR INFORMAÇÕES BÁSICAS DA CLÍNICA
console.log('\n🏥 2. INFORMAÇÕES BÁSICAS DA CLÍNICA');
console.log('-'.repeat(40));

const clinica = contextualizationData.clinica;
if (clinica) {
  const basicInfo = clinica.informacoes_basicas;
  if (basicInfo) {
    console.log(`✅ Nome: ${basicInfo.nome}`);
    console.log(`✅ Razão Social: ${basicInfo.razao_social}`);
    console.log(`✅ CNPJ: ${basicInfo.cnpj}`);
    console.log(`✅ Especialidade Principal: ${basicInfo.especialidade_principal}`);
    console.log(`✅ Especialidades Secundárias: ${basicInfo.especialidades_secundarias?.length || 0} especialidades`);
    console.log(`✅ Descrição: ${basicInfo.descricao ? 'PRESENTE' : 'AUSENTE'}`);
    console.log(`✅ Missão: ${basicInfo.missao ? 'PRESENTE' : 'AUSENTE'}`);
    console.log(`✅ Valores: ${basicInfo.valores?.length || 0} valores`);
    console.log(`✅ Diferenciais: ${basicInfo.diferenciais?.length || 0} diferenciais`);
  }
}

// 3. VALIDAR LOCALIZAÇÃO
console.log('\n📍 3. INFORMAÇÕES DE LOCALIZAÇÃO');
console.log('-'.repeat(40));

const localizacao = clinica?.localizacao;
if (localizacao?.endereco_principal) {
  const end = localizacao.endereco_principal;
  console.log(`✅ Logradouro: ${end.logradouro}`);
  console.log(`✅ Número: ${end.numero}`);
  console.log(`✅ Complemento: ${end.complemento || 'N/A'}`);
  console.log(`✅ Bairro: ${end.bairro}`);
  console.log(`✅ Cidade: ${end.cidade}`);
  console.log(`✅ Estado: ${end.estado}`);
  console.log(`✅ CEP: ${end.cep}`);
  console.log(`✅ País: ${end.pais}`);
  console.log(`✅ Coordenadas: ${end.coordenadas ? 'PRESENTES' : 'AUSENTES'}`);
}

// 4. VALIDAR CONTATOS
console.log('\n📞 4. INFORMAÇÕES DE CONTATO');
console.log('-'.repeat(40));

const contatos = clinica?.contatos;
if (contatos) {
  console.log(`✅ Telefone Principal: ${contatos.telefone_principal || 'AUSENTE'}`);
  console.log(`✅ WhatsApp: ${contatos.whatsapp || 'AUSENTE'}`);
  console.log(`✅ Email Principal: ${contatos.email_principal || 'AUSENTE'}`);
  console.log(`✅ Website: ${contatos.website || 'AUSENTE'}`);
  
  if (contatos.emails_departamentos) {
    console.log('✅ Emails por Departamento:');
    Object.entries(contatos.emails_departamentos).forEach(([dept, email]) => {
      console.log(`   - ${dept}: ${email}`);
    });
  }
}

// 5. VALIDAR HORÁRIO DE FUNCIONAMENTO
console.log('\n🕒 5. HORÁRIO DE FUNCIONAMENTO');
console.log('-'.repeat(40));

const horario = clinica?.horario_funcionamento;
if (horario) {
  const dias = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
  dias.forEach(dia => {
    if (horario[dia]) {
      const h = horario[dia];
      if (h.abertura && h.fechamento) {
        console.log(`✅ ${dia}: ${h.abertura} às ${h.fechamento}`);
      } else {
        console.log(`✅ ${dia}: Fechado`);
      }
    } else {
      console.log(`❌ ${dia}: NÃO DEFINIDO`);
    }
  });
}

// 6. VALIDAR PROFISSIONAIS
console.log('\n👨‍⚕️ 6. PROFISSIONAIS');
console.log('-'.repeat(40));

const profissionais = contextualizationData.profissionais;
if (profissionais && profissionais.length > 0) {
  console.log(`✅ Total de profissionais: ${profissionais.length}`);
  profissionais.forEach((prof, index) => {
    console.log(`\n   Profissional ${index + 1}:`);
    console.log(`   - Nome: ${prof.nome_completo}`);
    console.log(`   - CRM: ${prof.crm}`);
    console.log(`   - Especialidades: ${prof.especialidades?.join(', ')}`);
    console.log(`   - Experiência: ${prof.experiencia ? 'PRESENTE' : 'AUSENTE'}`);
    console.log(`   - Ativo: ${prof.ativo ? 'SIM' : 'NÃO'}`);
    console.log(`   - Aceita novos pacientes: ${prof.aceita_novos_pacientes ? 'SIM' : 'NÃO'}`);
  });
} else {
  console.log('❌ Nenhum profissional definido');
}

// 7. VALIDAR SERVIÇOS
console.log('\n🩺 7. SERVIÇOS');
console.log('-'.repeat(40));

const servicos = contextualizationData.servicos;
if (servicos) {
  if (servicos.consultas && servicos.consultas.length > 0) {
    console.log(`✅ Consultas: ${servicos.consultas.length} serviços`);
    servicos.consultas.forEach((consulta, index) => {
      console.log(`   ${index + 1}. ${consulta.nome} - ${consulta.descricao}`);
    });
  }
  
  if (servicos.exames && servicos.exames.length > 0) {
    console.log(`✅ Exames: ${servicos.exames.length} serviços`);
    servicos.exames.forEach((exame, index) => {
      console.log(`   ${index + 1}. ${exame.nome} - ${exame.descricao}`);
    });
  }
} else {
  console.log('❌ Nenhum serviço definido');
}

// 8. VALIDAR CONVÊNIOS
console.log('\n🏥 8. CONVÊNIOS');
console.log('-'.repeat(40));

const convenios = contextualizationData.convenios;
if (convenios && convenios.length > 0) {
  console.log(`✅ Total de convênios: ${convenios.length}`);
  convenios.forEach((conv, index) => {
    console.log(`   ${index + 1}. ${conv.nome} - Ativo: ${conv.ativo ? 'SIM' : 'NÃO'}`);
  });
} else {
  console.log('❌ Nenhum convênio definido');
}

// 9. VALIDAR FORMAS DE PAGAMENTO
console.log('\n💳 9. FORMAS DE PAGAMENTO');
console.log('-'.repeat(40));

const formasPagamento = contextualizationData.formas_pagamento;
if (formasPagamento) {
  console.log(`✅ Dinheiro: ${formasPagamento.dinheiro ? 'ACEITO' : 'NÃO ACEITO'}`);
  console.log(`✅ Cartão de Crédito: ${formasPagamento.cartao_credito ? 'ACEITO' : 'NÃO ACEITO'}`);
  console.log(`✅ Cartão de Débito: ${formasPagamento.cartao_debito ? 'ACEITO' : 'NÃO ACEITO'}`);
  console.log(`✅ PIX: ${formasPagamento.pix ? 'ACEITO' : 'NÃO ACEITO'}`);
  
  if (formasPagamento.parcelamento) {
    console.log(`✅ Parcelamento: ${formasPagamento.parcelamento.disponivel ? 'DISPONÍVEL' : 'NÃO DISPONÍVEL'}`);
  }
  
  if (formasPagamento.desconto_a_vista) {
    console.log(`✅ Desconto à vista: ${formasPagamento.desconto_a_vista.disponivel ? 'DISPONÍVEL' : 'NÃO DISPONÍVEL'}`);
  }
} else {
  console.log('❌ Formas de pagamento não definidas');
}

// 10. VALIDAR POLÍTICAS
console.log('\n📋 10. POLÍTICAS');
console.log('-'.repeat(40));

const politicas = contextualizationData.politicas;
if (politicas) {
  if (politicas.agendamento) {
    console.log('✅ Políticas de Agendamento:');
    console.log(`   - Antecedência mínima: ${politicas.agendamento.antecedencia_minima_horas}h`);
    console.log(`   - Antecedência máxima: ${politicas.agendamento.antecedencia_maxima_dias} dias`);
    console.log(`   - Reagendamento permitido: ${politicas.agendamento.reagendamento_permitido ? 'SIM' : 'NÃO'}`);
  }
  
  if (politicas.atendimento) {
    console.log('✅ Políticas de Atendimento:');
    console.log(`   - Tolerância atraso: ${politicas.atendimento.tolerancia_atraso_minutos} min`);
    console.log(`   - Acompanhante permitido: ${politicas.atendimento.acompanhante_permitido ? 'SIM' : 'NÃO'}`);
  }
} else {
  console.log('❌ Políticas não definidas');
}

// 11. VALIDAR AGENTE IA
console.log('\n🤖 11. CONFIGURAÇÃO DO AGENTE IA');
console.log('-'.repeat(40));

const agenteIA = contextualizationData.agente_ia;
if (agenteIA?.configuracao) {
  const config = agenteIA.configuracao;
  console.log(`✅ Nome: ${config.nome}`);
  console.log(`✅ Personalidade: ${config.personalidade ? 'DEFINIDA' : 'NÃO DEFINIDA'}`);
  console.log(`✅ Tom de comunicação: ${config.tom_comunicacao}`);
  console.log(`✅ Nível de formalidade: ${config.nivel_formalidade}`);
  console.log(`✅ Idiomas: ${config.idiomas?.join(', ')}`);
  console.log(`✅ Saudação inicial: ${config.saudacao_inicial ? 'DEFINIDA' : 'NÃO DEFINIDA'}`);
  console.log(`✅ Mensagem de despedida: ${config.mensagem_despedida ? 'DEFINIDA' : 'NÃO DEFINIDA'}`);
  console.log(`✅ Mensagem fora horário: ${config.mensagem_fora_horario ? 'DEFINIDA' : 'NÃO DEFINIDA'}`);
}

// 12. SIMULAR EXTRACTION DO LLM ORCHESTRATOR
console.log('\n🔧 12. SIMULAÇÃO DA EXTRAÇÃO DO LLM ORCHESTRATOR');
console.log('-'.repeat(40));

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

const extractedContext = simulateGetClinicContext(contextualizationData);

console.log('📤 DADOS EXTRAÍDOS PELO LLM ORCHESTRATOR:');
console.log(`✅ Nome: ${extractedContext.name}`);
console.log(`✅ Endereço: ${extractedContext.address || 'NÃO EXTRAÍDO'}`);
console.log(`✅ Telefone: ${extractedContext.phone || 'NÃO EXTRAÍDO'}`);
console.log(`✅ Email Principal: ${extractedContext.mainEmail || 'NÃO EXTRAÍDO'}`);
console.log(`✅ Website: ${extractedContext.website || 'NÃO EXTRAÍDO'}`);
console.log(`✅ Serviços: ${extractedContext.services.length} serviços extraídos`);
console.log(`✅ Profissionais: ${extractedContext.professionals.length} profissionais extraídos`);
console.log(`✅ Especialidades: ${extractedContext.specialties.length} especialidades extraídas`);
console.log(`✅ Descrição: ${extractedContext.description ? 'EXTRAÍDA' : 'NÃO EXTRAÍDA'}`);
console.log(`✅ Horário de funcionamento: ${Object.keys(extractedContext.workingHours).length > 0 ? 'EXTRAÍDO' : 'NÃO EXTRAÍDO'}`);
console.log(`✅ Formas de pagamento: ${Object.keys(extractedContext.paymentMethods).length > 0 ? 'EXTRAÍDAS' : 'NÃO EXTRAÍDAS'}`);
console.log(`✅ Convênios: ${extractedContext.insurance.length} convênios extraídos`);
console.log(`✅ Emails por departamento: ${Object.keys(extractedContext.emails).length} emails extraídos`);

// 13. IDENTIFICAR PROBLEMAS
console.log('\n🚨 13. PROBLEMAS IDENTIFICADOS');
console.log('-'.repeat(40));

const problems = [];

// Verificar se informações críticas estão sendo extraídas
if (!extractedContext.address) {
  problems.push('❌ Endereço não está sendo extraído corretamente');
}

if (!extractedContext.phone) {
  problems.push('❌ Telefone não está sendo extraído corretamente');
}

if (!extractedContext.mainEmail) {
  problems.push('❌ Email principal não está sendo extraído');
}

if (extractedContext.professionals.length === 0) {
  problems.push('❌ Profissionais não estão sendo extraídos');
}

if (Object.keys(extractedContext.workingHours).length === 0) {
  problems.push('❌ Horário de funcionamento não está sendo extraído');
}

if (problems.length === 0) {
  console.log('✅ Nenhum problema crítico identificado na extração');
} else {
  problems.forEach(problem => console.log(problem));
}

// 14. VERIFICAR SE TODAS AS INFORMAÇÕES ESTÃO NO PROMPT
console.log('\n📝 14. VERIFICAÇÃO DO PROMPT DO SISTEMA');
console.log('-'.repeat(40));

function simulateSystemPrompt(clinicContext) {
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

  if (clinicContext.description) {
    prompt += `\n- Descrição: ${clinicContext.description}`;
  }

  if (clinicContext.specialties && clinicContext.specialties.length > 0) {
    prompt += `\n- Especialidades: ${clinicContext.specialties.join(', ')}`;
  }

  if (clinicContext.services && clinicContext.services.length > 0) {
    prompt += `\n- Serviços oferecidos: ${clinicContext.services.join(', ')}`;
  }

  if (clinicContext.professionals && clinicContext.professionals.length > 0) {
    prompt += `\n- Profissionais: ${clinicContext.professionals.join(', ')}`;
  }

  if (clinicContext.insurance && clinicContext.insurance.length > 0) {
    const convenios = clinicContext.insurance.map(c => c.nome).join(', ');
    prompt += `\n- Convênios aceitos: ${convenios}`;
  }

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

  return prompt;
}

const systemPrompt = simulateSystemPrompt(extractedContext);

console.log('📋 PROMPT GERADO:');
console.log(systemPrompt);

// Verificar se informações críticas estão no prompt
const promptChecks = [
  { name: 'Nome da clínica', check: systemPrompt.includes(extractedContext.name) },
  { name: 'Endereço', check: systemPrompt.includes(extractedContext.address) },
  { name: 'Telefone', check: systemPrompt.includes(extractedContext.phone) },
  { name: 'Descrição', check: extractedContext.description ? systemPrompt.includes('Descrição:') : true },
  { name: 'Especialidades', check: extractedContext.specialties.length > 0 ? systemPrompt.includes('Especialidades:') : true },
  { name: 'Serviços', check: extractedContext.services.length > 0 ? systemPrompt.includes('Serviços oferecidos:') : true },
  { name: 'Profissionais', check: extractedContext.professionals.length > 0 ? systemPrompt.includes('Profissionais:') : true },
  { name: 'Convênios', check: extractedContext.insurance.length > 0 ? systemPrompt.includes('Convênios aceitos:') : true },
  { name: 'Formas de pagamento', check: systemPrompt.includes('Formas de pagamento:') }
];

promptChecks.forEach(check => {
  console.log(`${check.check ? '✅' : '❌'} ${check.name}: ${check.check ? 'INCLUÍDO' : 'NÃO INCLUÍDO'}`);
});

console.log('\n' + '='.repeat(60));
console.log('🏁 TESTE COMPLETO FINALIZADO');
console.log('='.repeat(60)); 