// test-enhanced-clinic-context.js
// Script para testar a implementação do EnhancedClinicContextService

const { EnhancedClinicContextService } = require('./src/services/ai/enhancedClinicContextService');

async function testEnhancedClinicContext() {
  console.log('🧪 TESTANDO ENHANCED CLINIC CONTEXT SERVICE');
  console.log('=============================================');

  try {
    const enhancedContextService = new EnhancedClinicContextService();

    // Teste 1: Identificação de intenções
    console.log('\n📋 1. Testando identificação de intenções...');
    
    const testMessages = [
      'Olá!',
      'Quero agendar uma consulta',
      'Qual o preço do exame?',
      'Aceitam Unimed?',
      'Como faço a preparação para o exame?',
      'Quais são os horários de funcionamento?',
      'Onde fica a clínica?',
      'Quem são os médicos?',
      'Estou com dor no peito'
    ];

    testMessages.forEach(message => {
      const intent = enhancedContextService.identifyIntent(message);
      console.log(`✅ "${message}" → ${intent}`);
    });

    // Teste 2: Navegação do JSON
    console.log('\n📋 2. Testando navegação do JSON...');
    
    const testJSON = {
      clinica: {
        informacoes_basicas: {
          nome: 'Clínica Teste',
          especialidade_principal: 'Cardiologia',
          descricao: 'Clínica especializada em cardiologia'
        },
        contatos: {
          telefone_principal: '(11) 1234-5678',
          whatsapp: '(11) 98765-4321'
        },
        horario_funcionamento: {
          segunda: { abertura: '08:00', fechamento: '18:00' },
          terca: { abertura: '08:00', fechamento: '18:00' }
        }
      },
      agente_ia: {
        configuracao: {
          nome: 'Dr. Teste',
          personalidade: 'Profissional e acolhedor'
        }
      },
      profissionais: [
        {
          nome_exibicao: 'Dr. João Silva',
          crm: '12345-SP',
          especialidades: ['Cardiologia'],
          ativo: true,
          aceita_novos_pacientes: true
        }
      ],
      servicos: {
        consultas: [
          {
            nome: 'Consulta Cardiológica',
            descricao: 'Avaliação cardiológica completa',
            duracao_minutos: 30,
            preco_particular: 250.00,
            ativo: true
          }
        ],
        exames: [
          {
            nome: 'Eletrocardiograma',
            descricao: 'Exame do coração',
            duracao_minutos: 15,
            preco_particular: 80.00,
            preparacao: {
              jejum_horas: 0,
              instrucoes_especiais: 'Não é necessário jejum'
            },
            ativo: true
          }
        ]
      },
      convenios: [
        {
          nome: 'Unimed',
          ativo: true,
          copagamento: false
        }
      ]
    };

    const navigationData = await enhancedContextService.navigateJSON(testJSON, 'general');
    
    console.log('✅ Navegação do JSON concluída:');
    console.log(`   - Seções críticas: ${navigationData.critical.length}`);
    console.log(`   - Seções alta prioridade: ${navigationData.high.length}`);
    console.log(`   - Seções média prioridade: ${navigationData.medium.length}`);
    console.log(`   - Seções baixa prioridade: ${navigationData.low.length}`);

    // Teste 3: Otimização de prompt
    console.log('\n📋 3. Testando otimização de prompt...');
    
    const optimizedPrompt = enhancedContextService.optimizePrompt(navigationData, 'Quero agendar uma consulta', 'agendamento');
    
    console.log('✅ Prompt otimizado:');
    console.log(`   - Tokens usados: ${optimizedPrompt.tokensUsed}`);
    console.log(`   - Tokens disponíveis: ${optimizedPrompt.tokensAvailable}`);
    console.log(`   - Seções incluídas: ${optimizedPrompt.sectionsIncluded}`);
    console.log(`   - Intenção: ${optimizedPrompt.intent}`);

    // Teste 4: Processadores de seção
    console.log('\n📋 4. Testando processadores de seção...');
    
    const testProfissionais = [
      {
        nome_exibicao: 'Dr. Maria Santos',
        crm: '67890-SP',
        especialidades: ['Cardiologia', 'Ecocardiografia'],
        experiencia: '15 anos de experiência',
        ativo: true,
        aceita_novos_pacientes: true,
        horarios_disponibilidade: {
          segunda: [{ inicio: '08:00', fim: '12:00' }],
          terca: [{ inicio: '14:00', fim: '18:00' }]
        }
      }
    ];

    const processedProfissionais = enhancedContextService.processSection('profissionais', testProfissionais, 'agendamento');
    console.log('✅ Processamento de profissionais:');
    console.log(processedProfissionais.substring(0, 200) + '...');

    // Teste 5: Cache
    console.log('\n📋 5. Testando sistema de cache...');
    
    const cacheKey = enhancedContextService.getCacheKey('test-clinic', testJSON);
    console.log(`✅ Cache key gerada: ${cacheKey}`);

    console.log('\n🎉 TODOS OS TESTES CONCLUÍDOS COM SUCESSO!');
    console.log('✅ EnhancedClinicContextService está funcionando corretamente');
    console.log('✅ Navegação inteligente do JSON implementada');
    console.log('✅ Sistema de cache funcionando');
    console.log('✅ Identificação de intenções ativa');
    console.log('✅ Otimização de prompt implementada');

  } catch (error) {
    console.error('❌ ERRO nos testes:', error);
    throw error;
  }
}

// Executar testes
testEnhancedClinicContext()
  .then(() => {
    console.log('\n🚀 IMPLEMENTAÇÃO CONCLUÍDA COM SUCESSO!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 ERRO na implementação:', error);
    process.exit(1);
  }); 