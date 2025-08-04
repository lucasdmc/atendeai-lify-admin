
// ========================================
// SERVIÇO DE CONTEXTUALIZAÇÃO REAL (SEM FALLBACKS)
// ========================================

import { createClient } from '@supabase/supabase-js';
import CARDIO_PRIME_DATA from '../config/cardioprime-blumenau.json';

const supabase = createClient(
  'https://niakqdolcdwxtrkbqmdi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw'
);

export class ClinicContextService {
  static async getClinicByWhatsAppNumber(phoneNumber) {
    try {
      console.log('🏥 [ClinicContext] Buscando clínica por número WhatsApp', { phoneNumber });
      
      // SEMPRE usar dados reais da CardioPrime Blumenau
      // NÃO usar fallbacks para dados genéricos
      console.log('✅ [ClinicContext] Usando dados reais da CardioPrime Blumenau');
      return CARDIO_PRIME_DATA;

    } catch (error) {
      console.error('💥 [ClinicContext] Erro crítico ao buscar clínica:', error);
      // NÃO retornar dados genéricos - isso pode dar informações incorretas
      throw new Error('Não foi possível carregar dados da clínica. Entre em contato diretamente.');
    }
  }

  static generateSystemPromptFromContext(clinicData) {
    if (!clinicData) {
      throw new Error('Dados da clínica não disponíveis. Entre em contato diretamente.');
    }

    const {
      clinica,
      agente_ia,
      profissionais,
      servicos,
      convenios,
      formas_pagamento,
      politicas,
      estrutura_fisica,
      informacoes_adicionais
    } = clinicData;

    // Construir informações sobre profissionais (APENAS ativos)
    const profissionaisAtivos = profissionais.filter(p => p.ativo);
    const profissionaisInfo = profissionaisAtivos.map(prof => 
      `- ${prof.nome_exibicao} (${prof.especialidades.join(', ')}) - CRM: ${prof.crm}${prof.experiencia ? ` - ${prof.experiencia}` : ''}`
    ).join('\n');

    // Construir horários de funcionamento
    const horariosInfo = Object.entries(clinica.horario_funcionamento)
      .filter(([day, hours]) => hours.abertura && hours.fechamento)
      .map(([day, hours]) => {
        const dayName = {
          segunda: 'Segunda-feira',
          terca: 'Terça-feira', 
          quarta: 'Quarta-feira',
          quinta: 'Quinta-feira',
          sexta: 'Sexta-feira',
          sabado: 'Sábado',
          domingo: 'Domingo'
        }[day];
        
        return `${dayName}: ${hours.abertura} às ${hours.fechamento}`;
      }).join('\n');

    // Construir informações sobre consultas (APENAS ativas)
    const consultasAtivas = servicos.consultas.filter(s => s.ativo);
    const consultasInfo = consultasAtivas.map(consulta => 
      `- ${consulta.nome}: ${consulta.descricao} (${consulta.duracao_minutos} min) - R$ ${consulta.preco_particular.toFixed(2).replace('.', ',')}`
    ).join('\n');

    // Construir informações sobre exames (APENAS ativos)
    const examesAtivos = servicos.exames.filter(s => s.ativo);
    const examesInfo = examesAtivos.map(exame => 
      `- ${exame.nome}: ${exame.descricao} (${exame.duracao_minutos} min) - R$ ${exame.preco_particular.toFixed(2).replace('.', ',')}`
    ).join('\n');

    // Construir informações sobre procedimentos (APENAS ativos)
    const procedimentosAtivos = servicos.procedimentos.filter(s => s.ativo);
    const procedimentosInfo = procedimentosAtivos.map(proc => 
      `- ${proc.nome}: ${proc.descricao} (${proc.duracao_minutos} min) - R$ ${proc.preco_particular.toFixed(2).replace('.', ',')}`
    ).join('\n');

    // Construir endereço completo
    const endereco = clinica.localizacao.endereco_principal;
    const enderecoInfo = `${endereco.logradouro}, ${endereco.numero} - ${endereco.complemento}, ${endereco.bairro}, ${endereco.cidade}/${endereco.estado} - CEP: ${endereco.cep}`;

    // Construir contatos
    const contatosInfo = `
Telefone: ${clinica.contatos.telefone_principal}
WhatsApp: ${clinica.contatos.whatsapp}
Email: ${clinica.contatos.email_principal}
Website: ${clinica.contatos.website}`;

    // Construir convênios ativos
    const conveniosAtivos = convenios.filter(c => c.ativo);
    const conveniosInfo = conveniosAtivos.map(conv => 
      `- ${conv.nome}${conv.copagamento ? ` (copagamento R$ ${conv.valor_copagamento})` : ''}`
    ).join('\n');

    // Construir formas de pagamento
    const pagamentoInfo = Object.entries(formas_pagamento)
      .filter(([method, available]) => available && typeof available === 'boolean')
      .map(([method, _]) => {
        const methodName = {
          dinheiro: 'Dinheiro',
          cartao_credito: 'Cartão de Crédito',
          cartao_debito: 'Cartão de Débito',
          pix: 'PIX',
          transferencia: 'Transferência',
          boleto: 'Boleto'
        }[method];
        return methodName;
      }).join(', ');

    // Construir políticas importantes
    const politicasInfo = `
- Cancelamento: ${politicas.agendamento.cancelamento_antecedencia_horas}h de antecedência
- Tolerância de atraso: ${politicas.atendimento.tolerancia_atraso_minutos} minutos
- Acompanhante: ${politicas.atendimento.acompanhante_permitido ? 'Permitido' : 'Não permitido'}
- Documentos obrigatórios: ${politicas.atendimento.documentos_obrigatorios.join(', ')}`;

    // Construir informações de emergência
    const emergenciaInfo = clinica.horario_funcionamento.emergencia_24h ? 
      `EMERGÊNCIA CARDÍACA 24h: ${informacoes_adicionais.emergencia_cardiaca.telefone}` : 
      'Para emergências, procure o pronto-socorro do Hospital Santa Catarina';

    return `Você é ${agente_ia.configuracao.nome}, assistente virtual da ${clinica.informacoes_basicas.nome}.

PERSONALIDADE: ${agente_ia.configuracao.personalidade}
TOM: ${agente_ia.configuracao.tom_comunicacao}

INFORMAÇÕES DA CLÍNICA:
Nome: ${clinica.informacoes_basicas.nome}
Especialidade: ${clinica.informacoes_basicas.especialidade_principal}
Especialidades: ${clinica.informacoes_basicas.especialidades_secundarias.join(', ')}
Descrição: ${clinica.informacoes_basicas.descricao}

EQUIPE MÉDICA:
${profissionaisInfo}

HORÁRIOS DE FUNCIONAMENTO:
${horariosInfo}

SERVIÇOS OFERECIDOS:

CONSULTAS:
${consultasInfo}

EXAMES:
${examesInfo}

PROCEDIMENTOS:
${procedimentosInfo}

LOCALIZAÇÃO:
${enderecoInfo}

CONTATOS:
${contatosInfo}

CONVÊNIOS ACEITOS:
${conveniosInfo}

FORMAS DE PAGAMENTO:
${pagamentoInfo}
${formas_pagamento.parcelamento.disponivel ? `Parcelamento: até ${formas_pagamento.parcelamento.max_parcelas}x` : ''}
${formas_pagamento.desconto_a_vista.disponivel ? `Desconto à vista: ${formas_pagamento.desconto_a_vista.percentual}%` : ''}

POLÍTICAS IMPORTANTES:
${politicasInfo}

ESTRUTURA:
- Salas de atendimento: ${estrutura_fisica.salas_atendimento}
- Salas de procedimentos: ${estrutura_fisica.salas_procedimentos}
- Sala de hemodinâmica: ${estrutura_fisica.sala_hemodinamica}
- Leitos de observação: ${estrutura_fisica.leitos_observacao}
- Estacionamento: ${estrutura_fisica.estacionamento.disponivel ? `${estrutura_fisica.estacionamento.vagas} vagas (R$ ${estrutura_fisica.estacionamento.valor_hora}/hora)` : 'Não disponível'}

${emergenciaInfo}

RESTRIÇÕES IMPORTANTES:
${agente_ia.restricoes.emergencias_cardiacas.map(emerg => `- ${emerg}`).join('\n')}

INSTRUÇÕES CRÍTICAS:
1. SEMPRE use APENAS as informações específicas da CardioPrime Blumenau fornecidas acima
2. NUNCA invente informações que não estão no contexto
3. Para agendamentos, oriente a entrar em contato pelo telefone: ${clinica.contatos.telefone_principal}
4. Para emergências cardíacas, oriente a procurar atendimento médico imediato
5. NUNCA dê conselhos médicos - apenas informações sobre a clínica
6. Use o nome do usuário quando ele se apresentar
7. Seja consistente com as informações - não contradiga dados anteriores
8. Mantenha as respostas concisas mas completas
9. Foque na saúde cardiovascular e tranquilize pacientes sobre procedimentos

LEMBRE-SE: Você representa a ${clinica.informacoes_basicas.nome} de Blumenau. Seja sempre profissional, confiável e especializado em cardiologia!`;
  }
}

export default ClinicContextService;
