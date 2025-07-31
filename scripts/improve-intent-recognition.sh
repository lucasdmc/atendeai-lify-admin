#!/bin/bash

echo "🧠 MELHORANDO RECONHECIMENTO DE INTENÇÕES..."
echo "=============================================="

# Parar PM2
echo "🛑 Parando PM2..."
pm2 stop atendeai-backend

# Atualizar intentRecognitionService.js com melhor reconhecimento
echo "📝 Atualizando intentRecognitionService.js..."
cat > /root/atendeai-lify-backend/src/services/ai/intentRecognitionService.js << 'EOF'
class IntentRecognitionService {
  static readonly INTENT_KEYWORDS = {
    GREETING: [
      'oi', 'olá', 'ola', 'hey', 'hi', 'hello', 'bom dia', 'boa tarde', 'boa noite',
      'tudo bem', 'td bem', 'como vai', 'como está', 'como esta'
    ],
    NAME_QUESTION: [
      'qual meu nome', 'meu nome', 'você sabe meu nome', 'vc sabe meu nome',
      'lembra meu nome', 'qual é meu nome', 'qual e meu nome'
    ],
    BOT_NAME_QUESTION: [
      'qual seu nome', 'seu nome', 'como você se chama', 'como vc se chama',
      'qual é seu nome', 'qual e seu nome', 'como te chamas'
    ],
    CLINIC_NAME_QUESTION: [
      'qual o nome da clínica', 'nome da clínica', 'nome da clinica',
      'qual clínica', 'qual clinica', 'onde estou', 'qual hospital'
    ],
    BOT_CAPABILITIES: [
      'o que você pode fazer', 'o que vc pode fazer', 'suas funções', 'suas funcoes',
      'o que você faz', 'o que vc faz', 'pode me ajudar', 'ajuda'
    ],
    CONVERSATION_TEST: [
      'teste', 'testar', 'funciona', 'está funcionando', 'esta funcionando'
    ],
    HOW_ARE_YOU: [
      'como você está', 'como vc esta', 'como você esta', 'como vc está',
      'tudo bem com você', 'tudo bem com vc'
    ],
    THANKS: [
      'obrigado', 'obrigada', 'valeu', 'valeu', 'obg', 'obgd', 'thanks', 'thank you'
    ],
    APPOINTMENT_CREATE: [
      'agendar', 'marcar', 'consulta', 'agendamento', 'marcação', 'marcacao',
      'quero agendar', 'quero marcar', 'preciso agendar', 'preciso marcar',
      'agendamento de consulta', 'marcar consulta', 'agendar consulta'
    ],
    INFO_HOURS: [
      'horário', 'horario', 'horários', 'horarios', 'funcionamento', 'aberto',
      'fechado', 'que horas', 'que hora', 'quando abre', 'quando fecha',
      'horário de funcionamento', 'horario de funcionamento'
    ],
    INFO_LOCATION: [
      'endereço', 'endereco', 'localização', 'localizacao', 'onde fica',
      'onde é', 'onde e', 'rua', 'avenida', 'bairro', 'cidade',
      'qual o endereço', 'qual o endereco', 'onde vocês ficam', 'onde vcs ficam'
    ],
    INFO_SERVICES: [
      'serviços', 'servicos', 'especialidades', 'especialidade', 'médicos',
      'medicos', 'doutores', 'doutor', 'doutora', 'que especialidades',
      'quais especialidades', 'quais serviços', 'quais servicos'
    ],
    INFO_DOCTORS: [
      'médicos', 'medicos', 'doutores', 'doutor', 'doutora', 'quais médicos',
      'quais medicos', 'nome dos médicos', 'nome dos medicos', 'quem são os médicos',
      'quem sao os medicos', 'cardiologista', 'cardiologo', 'dermatologista',
      'dermatologo', 'ginecologista', 'ginecologo', 'ortopedista', 'pediatra'
    ],
    INFO_PRICES: [
      'preço', 'preco', 'preços', 'precos', 'valor', 'quanto custa', 'quanto é',
      'quanto e', 'valor da consulta', 'preço da consulta', 'preco da consulta',
      'convênio', 'convenio', 'convênios', 'convenios', 'aceita convênio',
      'aceita convenio', 'formas de pagamento', 'pagamento'
    ],
    FAREWELL: [
      'tchau', 'até logo', 'ate logo', 'até mais', 'ate mais', 'até a próxima',
      'ate a proxima', 'bye', 'goodbye', 'sair', 'encerrar'
    ],
    EMERGENCY: [
      'emergência', 'emergencia', 'urgente', 'emergency', 'socorro', 'ajuda urgente',
      'preciso de ajuda', 'problema grave', 'dor no peito', 'falta de ar'
    ]
  };

  static async recognizeIntent(message) {
    const lowerMessage = message.toLowerCase().trim();
    
    console.log(`🔍 [Intent] Analisando mensagem: "${lowerMessage}"`);
    
    // Verificar cada intenção
    for (const [intentName, keywords] of Object.entries(this.INTENT_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lowerMessage.includes(keyword)) {
          const confidence = this.calculateConfidence(lowerMessage, keyword);
          const entities = this.extractEntities(lowerMessage);
          
          console.log(`✅ [Intent] Intenção detectada: ${intentName} (confiança: ${confidence})`);
          
          return {
            name: intentName,
            confidence: confidence,
            entities: entities
          };
        }
      }
    }
    
    // Se não encontrou nenhuma intenção específica
    console.log(`⚠️ [Intent] Nenhuma intenção específica encontrada`);
    return {
      name: 'UNKNOWN',
      confidence: 0.1,
      entities: this.extractEntities(lowerMessage)
    };
  }

  static calculateConfidence(message, keyword) {
    const keywordLength = keyword.length;
    const messageLength = message.length;
    const matchRatio = keywordLength / messageLength;
    
    // Ajustar confiança baseada no tamanho da palavra-chave vs mensagem
    if (matchRatio > 0.8) return 0.9;
    if (matchRatio > 0.5) return 0.8;
    if (matchRatio > 0.3) return 0.7;
    return 0.6;
  }

  static extractEntities(message) {
    const entities = {};
    
    // Extrair nome (padrões comuns)
    const namePatterns = [
      /me chamo (\w+)/i,
      /meu nome é (\w+)/i,
      /meu nome e (\w+)/i,
      /sou (\w+)/i,
      /eu sou (\w+)/i
    ];
    
    for (const pattern of namePatterns) {
      const match = message.match(pattern);
      if (match) {
        entities.name = match[1];
        break;
      }
    }
    
    // Extrair especialidade médica
    const specialtyPatterns = [
      /cardiologista/i,
      /dermatologista/i,
      /ginecologista/i,
      /ortopedista/i,
      /pediatra/i,
      /cardiologia/i,
      /dermatologia/i,
      /ginecologia/i,
      /ortopedia/i,
      /pediatria/i
    ];
    
    for (const pattern of specialtyPatterns) {
      const match = message.match(pattern);
      if (match) {
        entities.specialty = match[0].toLowerCase();
        break;
      }
    }
    
    console.log(`🔍 [Intent] Entidades extraídas:`, entities);
    return entities;
  }
}

module.exports = IntentRecognitionService;
EOF

echo "✅ Intent Recognition Service atualizado!"

# Reiniciar PM2
echo "🔄 Reiniciando PM2..."
pm2 restart atendeai-backend

echo "📊 Verificando status..."
sleep 3
curl -s http://localhost:3001/health
echo ""
curl -s http://localhost:3001/webhook/whatsapp-meta/test
echo ""

echo "✅ RECONHECIMENTO DE INTENÇÕES MELHORADO!"
echo "🎯 Funcionalidades melhoradas:"
echo "   - ✅ Reconhecimento mais preciso de intenções"
echo "   - ✅ Extração melhorada de entidades"
echo "   - ✅ Detecção de nomes de usuários"
echo "   - ✅ Detecção de especialidades médicas"
echo "   - ✅ Logs detalhados para debug"
echo ""
echo "🎯 TESTE: Envie uma mensagem para o WhatsApp Business!"
echo "📱 Número: 554730915628"
echo "🤖 O sistema agora deve reconhecer melhor as intenções!"
echo ""
echo "✅ Script de melhoria aplicado com sucesso!" 