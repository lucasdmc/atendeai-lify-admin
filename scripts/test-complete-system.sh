#!/bin/bash

echo "🧪 TESTANDO SISTEMA COMPLETO..."
echo "=============================================="

# Testar conectividade do backend
echo "🔍 Testando conectividade do backend..."
curl -s http://localhost:3001/health
echo ""

# Testar webhook
echo "🔍 Testando webhook..."
curl -s http://localhost:3001/webhook/whatsapp-meta/test
echo ""

# Simular mensagens de teste
echo "🧪 Simulando mensagens de teste..."
echo ""

echo "1️⃣ Testando saudação inicial..."
curl -X POST http://localhost:3001/webhook/whatsapp-meta \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "554730915628",
            "text": {
              "body": "Olá!"
            }
          }]
        }
      }]
    }]
  }'
echo ""
echo ""

echo "2️⃣ Testando pergunta sobre nome..."
curl -X POST http://localhost:3001/webhook/whatsapp-meta \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "554730915628",
            "text": {
              "body": "Qual o meu nome?"
            }
          }]
        }
      }]
    }]
  }'
echo ""
echo ""

echo "3️⃣ Testando pergunta sobre endereço..."
curl -X POST http://localhost:3001/webhook/whatsapp-meta \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "554730915628",
            "text": {
              "body": "Qual o endereço?"
            }
          }]
        }
      }]
    }]
  }'
echo ""
echo ""

echo "4️⃣ Testando pergunta sobre horários..."
curl -X POST http://localhost:3001/webhook/whatsapp-meta \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "554730915628",
            "text": {
              "body": "Quais os horários?"
            }
          }]
        }
      }]
    }]
  }'
echo ""
echo ""

echo "5️⃣ Testando pergunta sobre médicos..."
curl -X POST http://localhost:3001/webhook/whatsapp-meta \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "554730915628",
            "text": {
              "body": "Quais médicos?"
            }
          }]
        }
      }]
    }]
  }'
echo ""
echo ""

echo "6️⃣ Testando pergunta sobre preços..."
curl -X POST http://localhost:3001/webhook/whatsapp-meta \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "554730915628",
            "text": {
              "body": "Quanto custa?"
            }
          }]
        }
      }]
    }]
  }'
echo ""
echo ""

echo "7️⃣ Testando agendamento..."
curl -X POST http://localhost:3001/webhook/whatsapp-meta \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "554730915628",
            "text": {
              "body": "Quero agendar"
            }
          }]
        }
      }]
    }]
  }'
echo ""
echo ""

echo "✅ TESTES CONCLUÍDOS!"
echo "🎯 Agora envie mensagens reais para o WhatsApp Business:"
echo "📱 Número: 554730915628"
echo "🤖 O sistema deve responder com informações específicas da CardioPrime!"
echo ""
echo "📋 Exemplos de mensagens para testar:"
echo "• 'Oi' → Saudação personalizada do Cardio"
echo "• 'Qual o endereço?' → Endereço da CardioPrime"
echo "• 'Quais os horários?' → Horários específicos"
echo "• 'Quais médicos?' → Lista de médicos"
echo "• 'Quanto custa?' → Preços e convênios"
echo "• 'Quero agendar' → Processo de agendamento"
echo "• 'Qual o meu nome?' → Deve lembrar o nome"
echo "• 'Qual o nome da clínica?' → CardioPrime" 