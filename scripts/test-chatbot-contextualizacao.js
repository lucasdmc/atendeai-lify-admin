// Script para testar o chatbot com contextualização da ESADI
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

// Contextualização da ESADI
const esadiContext = `Você é a Jessica, assistente virtual da ESADI - Espaço de Saúde do Aparelho Digestivo.

INFORMAÇÕES DA CLÍNICA:
- Especialidade: Gastroenterologia
- Especialidades: Endoscopia Digestiva, Hepatologia, Colonoscopia, Diagnóstico por Imagem Digestiva
- Descrição: Centro especializado em saúde do aparelho digestivo com tecnologia de ponta para Santa Catarina
- Missão: Proporcionar diagnósticos precisos e tratamentos eficazes para patologias do aparelho digestivo

CONTATOS:
- Telefone: (47) 3222-0432
- WhatsApp: (47) 99963-3223
- Email: contato@esadi.com.br
- Website: https://www.esadi.com.br

ENDEREÇO:
Rua Sete de Setembro, 777
Edifício Stein Office - Sala 511
Centro, Blumenau - SC
CEP: 89010-201

HORÁRIO DE FUNCIONAMENTO:
- Segunda a Quinta: 07:00 às 18:00
- Sexta: 07:00 às 17:00
- Sábado: 07:00 às 12:00
- Domingo: Fechado

SERVIÇOS DISPONÍVEIS:
- Consulta Gastroenterológica (R$ 280,00)
- Endoscopia Digestiva Alta (R$ 450,00)
- Colonoscopia (R$ 650,00)
- Teste Respiratório para H. Pylori (R$ 180,00)

CONVÊNIOS ACEITOS:
- Unimed
- Bradesco Saúde
- SulAmérica

PROFISSIONAIS:
- Dr. Carlos Eduardo Silva (CRM-SC 12345) - Gastroenterologia e Endoscopia
- Dr. João da Silva (CRM-SC 9999) - Endoscopia, Colonoscopia e Hepatologia

PERSONALIDADE: Profissional, acolhedora e especializada em gastroenterologia. Demonstra conhecimento técnico mas comunica de forma acessível.
TOM DE COMUNICAÇÃO: Formal mas acessível, com foco na tranquilização do paciente

Sempre responda de forma profissional, acolhedora e especializada em gastroenterologia. Use as informações acima para fornecer respostas precisas sobre a clínica, serviços, agendamentos e orientações médicas.`;

// Mensagens de teste
const mensagensTeste = [
  "Olá, gostaria de saber mais sobre a ESADI",
  "Quais exames vocês fazem?",
  "Qual o preço da endoscopia?",
  "Vocês aceitam Unimed?",
  "Qual o horário de funcionamento?",
  "Onde vocês ficam localizados?",
  "Quem são os médicos?",
  "Preciso de jejum para endoscopia?",
  "Como faço para agendar?",
  "Vocês fazem colonoscopia?",
  "Qual o preço da consulta?",
  "Aceitam cartão de crédito?",
  "Tem desconto à vista?",
  "Qual a experiência dos médicos?",
  "Fazem teste para H. pylori?"
];

async function testarChatbot() {
  console.log('🤖 TESTE DO CHATBOT COM CONTEXTUALIZAÇÃO ESADI\n');
  console.log('📋 Contexto carregado com sucesso');
  console.log(`📝 ${esadiContext.split('\n').length} linhas de contexto\n`);

  for (let i = 0; i < mensagensTeste.length; i++) {
    const mensagem = mensagensTeste[i];
    console.log(`\n--- TESTE ${i + 1}/${mensagensTeste.length} ---`);
    console.log(`👤 Usuário: ${mensagem}`);
    
    try {
      // Chamar a função AI com contextualização
      const { data, error } = await supabase.functions.invoke('ai-chat-gpt4', {
        body: {
          messages: [
            {
              role: 'system',
              content: esadiContext
            },
            {
              role: 'user',
              content: mensagem
            }
          ],
          phoneNumber: 'teste-contextualizacao'
        }
      });

      if (error) {
        console.error(`❌ Erro na função AI:`, error);
        continue;
      }

      if (data?.response) {
        console.log(`🤖 Jessica: ${data.response}`);
        
        // Verificar se a resposta contém informações da ESADI
        const temInfoESADI = verificarInfoESADI(data.response);
        if (temInfoESADI) {
          console.log('✅ Resposta contém informações da ESADI');
        } else {
          console.log('⚠️  Resposta pode não conter informações específicas da ESADI');
        }
      } else {
        console.log('❌ Nenhuma resposta recebida');
      }

    } catch (error) {
      console.error(`❌ Erro no teste:`, error.message);
    }

    // Aguardar um pouco entre os testes
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n🎯 TESTE CONCLUÍDO');
  console.log('📊 Resumo:');
  console.log(`- Total de mensagens testadas: ${mensagensTeste.length}`);
  console.log('- Verifique se as respostas contêm informações específicas da ESADI');
  console.log('- Teste também via WhatsApp para verificar a integração completa');
}

function verificarInfoESADI(resposta) {
  const indicadoresESADI = [
    'ESADI',
    'Gastroenterologia',
    'Endoscopia',
    'Blumenau',
    'Rua Sete de Setembro',
    'Dr. Carlos Eduardo',
    'Dr. João',
    'Unimed',
    'Bradesco',
    'SulAmérica',
    '280,00',
    '450,00',
    '650,00',
    '07:00',
    '18:00'
  ];

  return indicadoresESADI.some(indicador => 
    resposta.toLowerCase().includes(indicador.toLowerCase())
  );
}

// Função para testar uma mensagem específica
async function testarMensagemEspecifica(mensagem) {
  console.log(`\n🎯 TESTE DE MENSAGEM ESPECÍFICA`);
  console.log(`👤 Usuário: ${mensagem}`);
  
  try {
    const { data, error } = await supabase.functions.invoke('ai-chat-gpt4', {
      body: {
        messages: [
          {
            role: 'system',
            content: esadiContext
          },
          {
            role: 'user',
            content: mensagem
          }
        ],
        phoneNumber: 'teste-especifico'
      }
    });

    if (error) {
      console.error(`❌ Erro:`, error);
      return;
    }

    if (data?.response) {
      console.log(`🤖 Jessica: ${data.response}`);
      
      const temInfoESADI = verificarInfoESADI(data.response);
      console.log(temInfoESADI ? '✅ Contém info ESADI' : '⚠️  Pode não conter info ESADI');
    } else {
      console.log('❌ Nenhuma resposta');
    }

  } catch (error) {
    console.error(`❌ Erro:`, error.message);
  }
}

// Executar testes
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Testar mensagem específica
    const mensagem = args.join(' ');
    await testarMensagemEspecifica(mensagem);
  } else {
    // Executar todos os testes
    await testarChatbot();
  }
}

// Verificar se o script está sendo executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export {
  testarChatbot,
  testarMensagemEspecifica,
  esadiContext
}; 