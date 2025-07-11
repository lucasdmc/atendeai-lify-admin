// Script para testar o sistema de agendamento do chatbot
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada');
  console.log('Configure a variável de ambiente SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Cenários de teste de agendamento
const cenariosTeste = [
  {
    nome: "Agendamento Completo - Consulta",
    mensagens: [
      "Olá, gostaria de agendar uma consulta",
      "João Silva",
      "47999999999",
      "1",
      "1",
      "1",
      "1",
      "sim"
    ]
  },
  {
    nome: "Agendamento Completo - Exame",
    mensagens: [
      "Quero marcar um exame",
      "Maria Santos",
      "47988888888",
      "2",
      "2",
      "2",
      "3",
      "sim"
    ]
  },
  {
    nome: "Agendamento com Profissional Qualquer",
    mensagens: [
      "Preciso agendar uma consulta",
      "Pedro Costa",
      "47977777777",
      "1",
      "qualquer",
      "1",
      "2",
      "sim"
    ]
  },
  {
    nome: "Cancelamento no Final",
    mensagens: [
      "Vou agendar uma colonoscopia",
      "Ana Oliveira",
      "47966666666",
      "3",
      "1",
      "1",
      "1",
      "não"
    ]
  }
];

async function testarAgendamento() {
  console.log('🤖 TESTE DO SISTEMA DE AGENDAMENTO\n');
  
  for (let i = 0; i < cenariosTeste.length; i++) {
    const cenario = cenariosTeste[i];
    console.log(`\n--- CENÁRIO ${i + 1}: ${cenario.nome} ---`);
    
    let conversa = {
      etapa: 'inicio',
      dados_coletados: {},
      tentativas: 0,
      ultima_interacao: new Date().toISOString()
    };
    
    for (let j = 0; j < cenario.mensagens.length; j++) {
      const mensagem = cenario.mensagens[j];
      console.log(`\n👤 Usuário: ${mensagem}`);
      
      try {
        // Simular processamento da mensagem
        const resultado = await processarMensagemSimulada(mensagem, conversa);
        
        if (resultado.resposta) {
          console.log(`🤖 Jessica: ${resultado.resposta}`);
        }
        
        if (resultado.dados_atualizados) {
          conversa = resultado.dados_atualizados;
        }
        
        // Aguardar um pouco entre as mensagens
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`❌ Erro no teste:`, error.message);
      }
    }
    
    console.log(`\n✅ Cenário ${i + 1} concluído`);
  }
  
  console.log('\n🎯 TESTE CONCLUÍDO');
  console.log('📊 Resumo:');
  console.log(`- Total de cenários testados: ${cenariosTeste.length}`);
  console.log('- Verifique se o fluxo de agendamento está funcionando corretamente');
  console.log('- Teste também via WhatsApp para verificar a integração completa');
}

async function processarMensagemSimulada(mensagem, conversa) {
  const mensagemLower = mensagem.toLowerCase();
  
  // Simular lógica de processamento baseada na etapa atual
  switch (conversa.etapa) {
    case 'inicio':
      if (mensagemLower.includes('agendar') || mensagemLower.includes('marcar') || 
          mensagemLower.includes('consulta') || mensagemLower.includes('exame')) {
        
        conversa.etapa = 'coleta_dados';
        return {
          resposta: `Perfeito! Vou ajudá-lo a agendar seu atendimento na ESADI. 

Para começar, preciso de algumas informações:

📝 Qual é o seu nome completo?`,
          dados_atualizados: conversa
        };
      }
      return {
        resposta: `Olá! Sou a Jessica, assistente virtual da ESADI. 

Posso ajudá-lo com:
• 📅 Agendamento de consultas e exames
• ℹ️ Informações sobre nossos serviços
• 📞 Contatos e horários
• 💳 Convênios aceitos

Como posso ajudá-lo hoje?`
      };
    
    case 'coleta_dados':
      const dados = conversa.dados_coletados || {};
      
      if (!dados.nome) {
        dados.nome = mensagem.trim();
        return {
          resposta: `Obrigada, ${dados.nome}! 

Agora preciso do seu número de telefone para contato (apenas números):`,
          dados_atualizados: { ...conversa, dados_coletados: dados }
        };
      }
      
      if (!dados.telefone) {
        const telefone = mensagem.replace(/\D/g, '');
        if (telefone.length < 10) {
          return {
            resposta: 'Por favor, informe um número de telefone válido (apenas números):'
          };
        }
        
        dados.telefone = telefone;
        return {
          resposta: `Perfeito! Agora preciso saber qual serviço você gostaria de agendar:

1. Consulta Gastroenterológica - R$ 280,00
2. Endoscopia Digestiva Alta - R$ 450,00
3. Colonoscopia - R$ 650,00
4. Teste Respiratório para H. Pylori - R$ 180,00

Digite o número do serviço desejado ou o nome do serviço:`,
          dados_atualizados: { ...conversa, dados_coletados: dados, etapa: 'escolha_servico' }
        };
      }
      break;
    
    case 'escolha_servico':
      const servicos = [
        { id: 'cons_001', nome: 'Consulta Gastroenterológica', preco: 280.00 },
        { id: 'exam_001', nome: 'Endoscopia Digestiva Alta', preco: 450.00 },
        { id: 'exam_002', nome: 'Colonoscopia', preco: 650.00 },
        { id: 'exam_003', nome: 'Teste Respiratório para H. Pylori', preco: 180.00 }
      ];
      
      let servicoEscolhido = null;
      const numero = parseInt(mensagem);
      
      if (!isNaN(numero) && numero > 0 && numero <= servicos.length) {
        servicoEscolhido = servicos[numero - 1];
      } else {
        servicoEscolhido = servicos.find(servico => 
          servico.nome.toLowerCase().includes(mensagemLower) ||
          mensagemLower.includes(servico.nome.toLowerCase())
        );
      }
      
      if (!servicoEscolhido) {
        return {
          resposta: `Desculpe, não encontrei esse serviço. Por favor, escolha um dos serviços disponíveis:

1. Consulta Gastroenterológica - R$ 280,00
2. Endoscopia Digestiva Alta - R$ 450,00
3. Colonoscopia - R$ 650,00
4. Teste Respiratório para H. Pylori - R$ 180,00`
        };
      }
      
      const dadosServico = { ...conversa.dados_coletados, servico_desejado: servicoEscolhido.id };
      
      return {
        resposta: `Ótima escolha! Você selecionou: **${servicoEscolhido.nome}**

Agora escolha o profissional:

1. Dr. Carlos Eduardo Silva - Gastroenterologia e Endoscopia
2. Dr. João da Silva - Endoscopia, Colonoscopia e Hepatologia

Digite o número do profissional ou "qualquer" para qualquer um disponível:`,
        dados_atualizados: { ...conversa, dados_coletados: dadosServico, etapa: 'escolha_profissional' }
      };
    
    case 'escolha_profissional':
      const profissionais = [
        { id: 'prof_001', nome: 'Dr. Carlos Eduardo Silva', especialidades: 'Gastroenterologia e Endoscopia' },
        { id: 'prof_002', nome: 'Dr. João da Silva', especialidades: 'Endoscopia, Colonoscopia e Hepatologia' }
      ];
      
      let profissionalEscolhido = null;
      
      if (mensagemLower.includes('qualquer') || mensagemLower.includes('indiferente')) {
        profissionalEscolhido = profissionais[0];
      } else {
        const numero = parseInt(mensagem);
        if (!isNaN(numero) && numero > 0 && numero <= profissionais.length) {
          profissionalEscolhido = profissionais[numero - 1];
        } else {
          profissionalEscolhido = profissionais.find(prof => 
            prof.nome.toLowerCase().includes(mensagemLower) ||
            mensagemLower.includes(prof.nome.toLowerCase())
          );
        }
      }
      
      if (!profissionalEscolhido) {
        return {
          resposta: `Desculpe, não encontrei esse profissional. Por favor, escolha um dos profissionais disponíveis:

1. Dr. Carlos Eduardo Silva - Gastroenterologia e Endoscopia
2. Dr. João da Silva - Endoscopia, Colonoscopia e Hepatologia

Ou digite "qualquer" para qualquer profissional disponível.`
        };
      }
      
      const dadosProfissional = { ...conversa.dados_coletados, profissional_preferido: profissionalEscolhido.id };
      const proximasDatas = gerarProximasDatasDisponiveis();
      
      return {
        resposta: `Perfeito! Você escolheu: **${profissionalEscolhido.nome}**

Agora escolha a data preferida:

${proximasDatas.map((data, index) => 
  `${index + 1}. ${data.formatada} (${data.diaSemana})`
).join('\n')}

Digite o número da data desejada:`,
        dados_atualizados: { ...conversa, dados_coletados: dadosProfissional, etapa: 'escolha_data' }
      };
    
    case 'escolha_data':
      const datas = gerarProximasDatasDisponiveis();
      const numeroData = parseInt(mensagem);
      
      if (isNaN(numeroData) || numeroData < 1 || numeroData > datas.length) {
        return {
          resposta: `Por favor, escolha uma data válida:

${datas.map((data, index) => 
  `${index + 1}. ${data.formatada} (${data.diaSemana})`
).join('\n')}`
        };
      }
      
      const dataEscolhida = datas[numeroData - 1];
      const dadosData = { ...conversa.dados_coletados, data_preferida: dataEscolhida.iso };
      const horariosDisponiveis = gerarHorariosDisponiveis();
      
      return {
        resposta: `Ótimo! Data escolhida: **${dataEscolhida.formatada}**

Agora escolha o horário preferido:

${horariosDisponiveis.map((horario, index) => 
  `${index + 1}. ${horario}`
).join('\n')}

Digite o número do horário desejado:`,
        dados_atualizados: { ...conversa, dados_coletados: dadosData, etapa: 'escolha_horario' }
      };
    
    case 'escolha_horario':
      const horarios = gerarHorariosDisponiveis();
      const numeroHorario = parseInt(mensagem);
      
      if (isNaN(numeroHorario) || numeroHorario < 1 || numeroHorario > horarios.length) {
        return {
          resposta: `Por favor, escolha um horário válido:

${horarios.map((horario, index) => 
  `${index + 1}. ${horario}`
).join('\n')}`
        };
      }
      
      const horarioEscolhido = horarios[numeroHorario - 1];
      const dadosHorario = { ...conversa.dados_coletados, horario_preferido: horarioEscolhido };
      
      const servicosConfirmacao = [
        { id: 'cons_001', nome: 'Consulta Gastroenterológica', preco: 280.00 },
        { id: 'exam_001', nome: 'Endoscopia Digestiva Alta', preco: 450.00 },
        { id: 'exam_002', nome: 'Colonoscopia', preco: 650.00 },
        { id: 'exam_003', nome: 'Teste Respiratório para H. Pylori', preco: 180.00 }
      ];
      
      const servico = servicosConfirmacao.find(s => s.id === dadosHorario.servico_desejado);
      const profissionaisConfirmacao = [
        { id: 'prof_001', nome: 'Dr. Carlos Eduardo Silva' },
        { id: 'prof_002', nome: 'Dr. João da Silva' }
      ];
      
      const profissional = profissionaisConfirmacao.find(p => p.id === dadosHorario.profissional_preferido);
      
      return {
        resposta: `🎉 Perfeito! Vamos confirmar seu agendamento:

📋 **Dados do Agendamento:**
• Paciente: ${dadosHorario.nome}
• Serviço: ${servico?.nome}
• Profissional: ${profissional?.nome}
• Data: ${formatarData(dadosHorario.data_preferida)}
• Horário: ${horarioEscolhido}
• Valor: R$ ${servico?.preco.toFixed(2)}

📞 **Confirmação:**
Digite "SIM" para confirmar o agendamento ou "NÃO" para cancelar.`,
        dados_atualizados: { ...conversa, dados_coletados: dadosHorario, etapa: 'confirmacao' }
      };
    
    case 'confirmacao':
      if (mensagemLower.includes('sim') || mensagemLower.includes('confirmar') || mensagemLower.includes('ok')) {
        return {
          resposta: `✅ **Agendamento confirmado com sucesso!**

📅 **Detalhes:**
• Código: #${Math.random().toString(36).substr(2, 6).toUpperCase()}
• Data: ${formatarData(conversa.dados_coletados.data_preferida)}
• Horário: ${conversa.dados_coletados.horario_preferido}

📋 **Lembretes importantes:**
• Chegue com 15 minutos de antecedência
• Traga RG/CPF e carteirinha do convênio (se aplicável)
• Para exames, siga as orientações de preparo

📞 **Contato:**
Em caso de dúvidas, ligue: (47) 3222-0432

Obrigada por escolher a ESADI! 😊`,
          dados_atualizados: { ...conversa, etapa: 'finalizado' }
        };
      } else if (mensagemLower.includes('não') || mensagemLower.includes('cancelar')) {
        return {
          resposta: 'Agendamento cancelado. Posso ajudá-lo com mais alguma coisa?',
          dados_atualizados: { ...conversa, etapa: 'inicio', dados_coletados: {} }
        };
      }
      
      return {
        resposta: 'Por favor, digite "SIM" para confirmar ou "NÃO" para cancelar o agendamento.'
      };
    
    default:
      return {
        resposta: 'Desculpe, ocorreu um erro. Vou reiniciar o processo de agendamento.',
        dados_atualizados: { ...conversa, etapa: 'inicio', dados_coletados: {} }
      };
  }
}

// Funções auxiliares
function gerarProximasDatasDisponiveis() {
  const datas = [];
  const hoje = new Date();
  
  for (let i = 1; i <= 7; i++) {
    const data = new Date(hoje);
    data.setDate(hoje.getDate() + i);
    
    const diaSemana = data.getDay();
    if (diaSemana !== 0) { // Excluir domingo
      datas.push({
        iso: data.toISOString().split('T')[0],
        formatada: data.toLocaleDateString('pt-BR'),
        diaSemana: getDiaSemanaNome(diaSemana)
      });
    }
  }
  
  return datas;
}

function gerarHorariosDisponiveis() {
  return ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30', '09:30 - 10:00', 
          '14:00 - 14:30', '14:30 - 15:00', '15:00 - 15:30', '15:30 - 16:00'];
}

function getDiaSemanaNome(dia) {
  const nomes = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  return nomes[dia];
}

function formatarData(data) {
  return new Date(data).toLocaleDateString('pt-BR');
}

// Executar testes
async function main() {
  await testarAgendamento();
}

// Verificar se o script está sendo executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export {
  testarAgendamento,
  processarMensagemSimulada
}; 