const fs = require('fs');
const path = require('path');

// Carregar o JSON de contextualização da CardioPrime
const contextualizationPath = path.join(__dirname, 'src/data/contextualizacao-cardioprime.json');
const contextualizationData = JSON.parse(fs.readFileSync(contextualizationPath, 'utf8'));

console.log('🔍 TESTE COMPLETO DE PROCESSAMENTO DO JSON');
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
    servicesDetails: context.servicos || {}
  };
}

// Simular a função prepareSystemPrompt melhorada
function simulateCompleteSystemPrompt(clinicContext, userProfile = null) {
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

INFORMAÇÕES COMPLETAS DA CLÍNICA:
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

  // Adicionar missão se disponível
  if (clinicContext.mission) {
    prompt += `\n- Missão: ${clinicContext.mission}`;
  }

  // Adicionar valores se disponível
  if (clinicContext.values && clinicContext.values.length > 0) {
    prompt += `\n- Valores: ${clinicContext.values.join(', ')}`;
  }

  // Adicionar diferenciais se disponível
  if (clinicContext.differentiators && clinicContext.differentiators.length > 0) {
    prompt += `\n- Diferenciais: ${clinicContext.differentiators.join(', ')}`;
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

    // Adicionar informações de parcelamento
    if (clinicContext.paymentMethods.parcelamento && clinicContext.paymentMethods.parcelamento.disponivel) {
      prompt += `\n- Parcelamento: Disponível em até ${clinicContext.paymentMethods.parcelamento.max_parcelas} parcelas`;
    }

    // Adicionar informações de desconto
    if (clinicContext.paymentMethods.desconto_a_vista && clinicContext.paymentMethods.desconto_a_vista.disponivel) {
      prompt += `\n- Desconto à vista: ${clinicContext.paymentMethods.desconto_a_vista.percentual}%`;
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

  // Adicionar políticas de agendamento se disponível
  if (clinicContext.bookingPolicies) {
    prompt += `\n- Políticas de agendamento:`;
    if (clinicContext.bookingPolicies.antecedencia_minima_horas) {
      prompt += `\n  • Antecedência mínima: ${clinicContext.bookingPolicies.antecedencia_minima_horas}h`;
    }
    if (clinicContext.bookingPolicies.antecedencia_maxima_dias) {
      prompt += `\n  • Antecedência máxima: ${clinicContext.bookingPolicies.antecedencia_maxima_dias} dias`;
    }
    if (clinicContext.bookingPolicies.reagendamento_permitido !== undefined) {
      prompt += `\n  • Reagendamento: ${clinicContext.bookingPolicies.reagendamento_permitido ? 'Permitido' : 'Não permitido'}`;
    }
    if (clinicContext.bookingPolicies.cancelamento_antecedencia_horas) {
      prompt += `\n  • Cancelamento: ${clinicContext.bookingPolicies.cancelamento_antecedencia_horas}h de antecedência`;
    }
  }

  // Adicionar políticas de atendimento se disponível
  if (clinicContext.servicePolicies) {
    prompt += `\n- Políticas de atendimento:`;
    if (clinicContext.servicePolicies.tolerancia_atraso_minutos) {
      prompt += `\n  • Tolerância atraso: ${clinicContext.servicePolicies.tolerancia_atraso_minutos} min`;
    }
    if (clinicContext.servicePolicies.acompanhante_permitido !== undefined) {
      prompt += `\n  • Acompanhante: ${clinicContext.servicePolicies.acompanhante_permitido ? 'Permitido' : 'Não permitido'}`;
    }
    if (clinicContext.servicePolicies.documentos_obrigatorios && clinicContext.servicePolicies.documentos_obrigatorios.length > 0) {
      prompt += `\n  • Documentos obrigatórios: ${clinicContext.servicePolicies.documentos_obrigatorios.join(', ')}`;
    }
  }

  // Adicionar informações adicionais se disponível
  if (clinicContext.additionalInfo && clinicContext.additionalInfo.parcerias && clinicContext.additionalInfo.parcerias.length > 0) {
    prompt += `\n- Parcerias:`;
    clinicContext.additionalInfo.parcerias.forEach(parceria => {
      prompt += `\n  • ${parceria.nome} (${parceria.tipo}): ${parceria.descricao}`;
    });
  }

  // Adicionar informações detalhadas dos profissionais se disponível
  if (clinicContext.professionalsDetails && clinicContext.professionalsDetails.length > 0) {
    prompt += `\n- Detalhes dos profissionais:`;
    clinicContext.professionalsDetails.forEach(prof => {
      prompt += `\n  • ${prof.nome_completo} (${prof.crm}): ${prof.especialidades?.join(', ')} - ${prof.experiencia}`;
      if (prof.horarios_disponibilidade) {
        const horarios = Object.entries(prof.horarios_disponibilidade)
          .filter(([dia, horarios]) => horarios && horarios.length > 0)
          .map(([dia, horarios]) => `${dia}: ${horarios.map(h => `${h.inicio}-${h.fim}`).join(', ')}`)
          .join('; ');
        if (horarios) {
          prompt += `\n    Horários: ${horarios}`;
        }
      }
    });
  }

  // Adicionar informações detalhadas dos serviços se disponível
  if (clinicContext.servicesDetails) {
    if (clinicContext.servicesDetails.consultas && clinicContext.servicesDetails.consultas.length > 0) {
      prompt += `\n- Detalhes das consultas:`;
      clinicContext.servicesDetails.consultas.forEach(consulta => {
                  // Formatar preço para aceitar ambos os formatos
          const precoFormatado = consulta.preco_particular ? 
            (consulta.preco_particular % 1 === 0 ? 
              `R$ ${consulta.preco_particular},00` : 
              `R$ ${consulta.preco_particular.toFixed(2).replace('.', ',')}`) : 
            'Preço sob consulta';
          
          prompt += `\n  • ${consulta.nome}: ${consulta.descricao} - ${consulta.duracao_minutos}min - ${precoFormatado}`;
        if (consulta.convenios_aceitos && consulta.convenios_aceitos.length > 0) {
          prompt += ` (Convênios: ${consulta.convenios_aceitos.join(', ')})`;
        }
      });
    }

    if (clinicContext.servicesDetails.exames && clinicContext.servicesDetails.exames.length > 0) {
      prompt += `\n- Detalhes dos exames:`;
      clinicContext.servicesDetails.exames.forEach(exame => {
                  // Formatar preço para aceitar ambos os formatos
          const precoFormatado = exame.preco_particular ? 
            (exame.preco_particular % 1 === 0 ? 
              `R$ ${exame.preco_particular},00` : 
              `R$ ${exame.preco_particular.toFixed(2).replace('.', ',')}`) : 
            'Preço sob consulta';
          
          prompt += `\n  • ${exame.nome}: ${exame.descricao} - ${exame.duracao_minutos}min - ${precoFormatado}`;
        if (exame.preparacao) {
          prompt += `\n    Preparação: ${exame.preparacao.instrucoes_especiais}`;
        }
        if (exame.resultado_prazo_dias) {
          prompt += `\n    Resultado: ${exame.resultado_prazo_dias} dia(s)`;
        }
      });
    }
  }

  // Adicionar informações detalhadas dos convênios se disponível
  if (clinicContext.insuranceDetails && clinicContext.insuranceDetails.length > 0) {
    prompt += `\n- Detalhes dos convênios:`;
    clinicContext.insuranceDetails.forEach(conv => {
      prompt += `\n  • ${conv.nome}: ${conv.copagamento ? `Copagamento R$ ${conv.valor_copagamento}` : 'Sem copagamento'}`;
      if (conv.autorizacao_necessaria) {
        prompt += ` (Autorização necessária)`;
      }
    });
  }

  if (userProfile && userProfile.name) {
    prompt += `\n\nINFORMAÇÕES DO USUÁRIO:
- Nome: ${userProfile.name}`;
  }

  return prompt;
}

// Extrair contexto completo
const extractedContext = simulateEnhancedGetClinicContext(contextualizationData);

console.log('📤 DADOS EXTRAÍDOS DO JSON:');
console.log('-'.repeat(40));
console.log(`✅ Nome: ${extractedContext.name}`);
console.log(`✅ Endereço: ${extractedContext.address}`);
console.log(`✅ Telefone: ${extractedContext.phone}`);
console.log(`✅ Email Principal: ${extractedContext.mainEmail}`);
console.log(`✅ Website: ${extractedContext.website}`);
console.log(`✅ Descrição: ${extractedContext.description ? 'PRESENTE' : 'AUSENTE'}`);
console.log(`✅ Missão: ${extractedContext.mission ? 'PRESENTE' : 'AUSENTE'}`);
console.log(`✅ Valores: ${extractedContext.values.length} valores`);
console.log(`✅ Diferenciais: ${extractedContext.differentiators.length} diferenciais`);
console.log(`✅ Especialidades: ${extractedContext.specialties.length} especialidades`);
console.log(`✅ Serviços: ${extractedContext.services.length} serviços`);
console.log(`✅ Profissionais: ${extractedContext.professionals.length} profissionais`);
console.log(`✅ Convênios: ${extractedContext.insurance.length} convênios`);
console.log(`✅ Horário de funcionamento: ${Object.keys(extractedContext.workingHours).length} dias`);
console.log(`✅ Emails por departamento: ${Object.keys(extractedContext.emails).length} emails`);
console.log(`✅ Políticas de agendamento: ${Object.keys(extractedContext.bookingPolicies).length > 0 ? 'PRESENTES' : 'AUSENTES'}`);
console.log(`✅ Políticas de atendimento: ${Object.keys(extractedContext.servicePolicies).length > 0 ? 'PRESENTES' : 'AUSENTES'}`);
console.log(`✅ Informações adicionais: ${Object.keys(extractedContext.additionalInfo).length > 0 ? 'PRESENTES' : 'AUSENTES'}`);
console.log(`✅ Detalhes dos profissionais: ${extractedContext.professionalsDetails.length} profissionais`);
console.log(`✅ Detalhes dos serviços: ${Object.keys(extractedContext.servicesDetails).length > 0 ? 'PRESENTES' : 'AUSENTES'}`);

// Gerar prompt completo
const completePrompt = simulateCompleteSystemPrompt(extractedContext);

console.log('\n📝 PROMPT COMPLETO GERADO:');
console.log('=' .repeat(60));
console.log(completePrompt);

// Verificar se TODAS as informações estão no prompt
console.log('\n🔍 VERIFICAÇÃO COMPLETA DE INFORMAÇÕES NO PROMPT:');
console.log('-'.repeat(40));

const promptChecks = [
  { name: 'Nome da clínica', check: completePrompt.includes(extractedContext.name) },
  { name: 'Endereço', check: completePrompt.includes(extractedContext.address) },
  { name: 'Telefone', check: completePrompt.includes(extractedContext.phone) },
  { name: 'Email principal', check: completePrompt.includes(extractedContext.mainEmail) },
  { name: 'Website', check: completePrompt.includes(extractedContext.website) },
  { name: 'Descrição', check: completePrompt.includes('Descrição:') },
  { name: 'Missão', check: completePrompt.includes('Missão:') },
  { name: 'Valores', check: completePrompt.includes('Valores:') },
  { name: 'Diferenciais', check: completePrompt.includes('Diferenciais:') },
  { name: 'Especialidades', check: completePrompt.includes('Especialidades:') },
  { name: 'Serviços', check: completePrompt.includes('Serviços oferecidos:') },
  { name: 'Profissionais', check: completePrompt.includes('Profissionais:') },
  { name: 'Convênios', check: completePrompt.includes('Convênios aceitos:') },
  { name: 'Formas de pagamento', check: completePrompt.includes('Formas de pagamento:') },
  { name: 'Parcelamento', check: completePrompt.includes('Parcelamento:') },
  { name: 'Desconto à vista', check: completePrompt.includes('Desconto à vista:') },
  { name: 'Horário de funcionamento', check: completePrompt.includes('Horário de funcionamento:') },
  { name: 'Emails por departamento', check: completePrompt.includes('Emails por departamento:') },
  { name: 'Políticas de agendamento', check: completePrompt.includes('Políticas de agendamento:') },
  { name: 'Políticas de atendimento', check: completePrompt.includes('Políticas de atendimento:') },
  { name: 'Parcerias', check: completePrompt.includes('Parcerias:') },
  { name: 'Detalhes dos profissionais', check: completePrompt.includes('Detalhes dos profissionais:') },
  { name: 'Detalhes das consultas', check: completePrompt.includes('Detalhes das consultas:') },
  { name: 'Detalhes dos exames', check: completePrompt.includes('Detalhes dos exames:') },
  { name: 'Detalhes dos convênios', check: completePrompt.includes('Detalhes dos convênios:') }
];

promptChecks.forEach(check => {
  console.log(`${check.check ? '✅' : '❌'} ${check.name}: ${check.check ? 'INCLUÍDO' : 'NÃO INCLUÍDO'}`);
});

// Verificar informações específicas que estavam faltando
console.log('\n🎯 VERIFICAÇÃO DE INFORMAÇÕES ESPECÍFICAS:');
console.log('-'.repeat(40));

const specificChecks = [
  { name: 'Horário detalhado por dia', check: completePrompt.includes('Segunda-feira: 08:00 às 18:00') },
  { name: 'Email de agendamento', check: completePrompt.includes('agendamento: agendamento@cardioprime.com.br') },
  { name: 'Email de resultados', check: completePrompt.includes('resultados: resultados@cardioprime.com.br') },
  { name: 'Missão da clínica', check: completePrompt.includes('Proporcionar excelência no cuidado cardiovascular') },
  { name: 'Valores da clínica', check: completePrompt.includes('Excelência em cardiologia') },
  { name: 'Diferenciais da clínica', check: completePrompt.includes('Equipe de cardiologistas especializados') },
  { name: 'Políticas de agendamento', check: completePrompt.includes('Antecedência mínima: 24h') },
  { name: 'Políticas de atendimento', check: completePrompt.includes('Tolerância atraso: 15 min') },
  { name: 'Parcerias', check: completePrompt.includes('Hospital Santa Isabel') },
  { name: 'Detalhes dos médicos', check: completePrompt.includes('Dr. Roberto Silva (CRM-SC 12345)') },
  { name: 'Preços das consultas', check: completePrompt.includes('R$ 300') || completePrompt.includes('R$ 300,00') || completePrompt.includes('R$ 300.00') },
  { name: 'Preços dos exames', check: completePrompt.includes('R$ 400') || completePrompt.includes('R$ 400,00') || completePrompt.includes('R$ 400.00') },
  { name: 'Preparação para exames', check: completePrompt.includes('Preparação:') },
  { name: 'Copagamento dos convênios', check: completePrompt.includes('Copagamento R$') },
  { name: 'Parcelamento', check: completePrompt.includes('Disponível em até 6 parcelas') },
  { name: 'Desconto à vista', check: completePrompt.includes('Desconto à vista: 5%') }
];

specificChecks.forEach(check => {
  console.log(`${check.check ? '✅' : '❌'} ${check.name}: ${check.check ? 'INCLUÍDO' : 'NÃO INCLUÍDO'}`);
});

// Contar quantas informações estão incluídas
const includedCount = promptChecks.filter(check => check.check).length;
const totalCount = promptChecks.length;
const specificIncludedCount = specificChecks.filter(check => check.check).length;
const specificTotalCount = specificChecks.length;

console.log('\n📊 RESUMO FINAL:');
console.log('-'.repeat(40));
console.log(`✅ Informações básicas incluídas: ${includedCount}/${totalCount} (${Math.round(includedCount/totalCount*100)}%)`);
console.log(`✅ Informações específicas incluídas: ${specificIncludedCount}/${specificTotalCount} (${Math.round(specificIncludedCount/specificTotalCount*100)}%)`);
console.log(`📝 Tamanho do prompt: ${completePrompt.length} caracteres`);

if (includedCount === totalCount && specificIncludedCount === specificTotalCount) {
  console.log('\n🎉 SUCESSO! TODAS AS INFORMAÇÕES DO JSON ESTÃO SENDO PROCESSADAS!');
} else {
  console.log('\n⚠️ ATENÇÃO: Algumas informações ainda não estão sendo processadas completamente.');
}

console.log('\n' + '='.repeat(60));
console.log('🏁 TESTE COMPLETO FINALIZADO');
console.log('='.repeat(60)); 