#!/bin/bash

echo "🧪 TESTANDO CONTEXTUALIZAÇÃO DA CARDIOPRIME..."
echo "=============================================="

# Testar diferentes tipos de mensagens
echo "📱 Testando mensagens para o WhatsApp..."

# 1. Saudação inicial
echo "1️⃣ Testando saudação inicial..."
curl -X POST http://localhost:3001/webhook/whatsapp-meta \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "742991528315493",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "554730915628",
            "phone_number_id": "698766983327246"
          },
          "messages": [{
            "from": "554797192447",
            "id": "test_msg_001",
            "timestamp": "1753982337",
            "text": {
              "body": "Oi"
            },
            "type": "text"
          }]
        },
        "field": "messages"
      }]
    }]
  }'

echo ""
echo "2️⃣ Testando pergunta sobre endereço..."
curl -X POST http://localhost:3001/webhook/whatsapp-meta \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "742991528315493",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "554730915628",
            "phone_number_id": "698766983327246"
          },
          "messages": [{
            "from": "554797192447",
            "id": "test_msg_002",
            "timestamp": "1753982338",
            "text": {
              "body": "Qual o endereço da clínica?"
            },
            "type": "text"
          }]
        },
        "field": "messages"
      }]
    }]
  }'

echo ""
echo "3️⃣ Testando pergunta sobre horários..."
curl -X POST http://localhost:3001/webhook/whatsapp-meta \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "742991528315493",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "554730915628",
            "phone_number_id": "698766983327246"
          },
          "messages": [{
            "from": "554797192447",
            "id": "test_msg_003",
            "timestamp": "1753982339",
            "text": {
              "body": "Quais são os horários de funcionamento?"
            },
            "type": "text"
          }]
        },
        "field": "messages"
      }]
    }]
  }'

echo ""
echo "4️⃣ Testando pergunta sobre médicos..."
curl -X POST http://localhost:3001/webhook/whatsapp-meta \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "742991528315493",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "554730915628",
            "phone_number_id": "698766983327246"
          },
          "messages": [{
            "from": "554797192447",
            "id": "test_msg_004",
            "timestamp": "1753982340",
            "text": {
              "body": "Quais médicos trabalham na clínica?"
            },
            "type": "text"
          }]
        },
        "field": "messages"
      }]
    }]
  }'

echo ""
echo "5️⃣ Testando pergunta sobre preços..."
curl -X POST http://localhost:3001/webhook/whatsapp-meta \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "742991528315493",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "554730915628",
            "phone_number_id": "698766983327246"
          },
          "messages": [{
            "from": "554797192447",
            "id": "test_msg_005",
            "timestamp": "1753982341",
            "text": {
              "body": "Quanto custa uma consulta?"
            },
            "type": "text"
          }]
        },
        "field": "messages"
      }]
    }]
  }'

echo ""
echo "6️⃣ Testando agendamento..."
curl -X POST http://localhost:3001/webhook/whatsapp-meta \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "742991528315493",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "554730915628",
            "phone_number_id": "698766983327246"
          },
          "messages": [{
            "from": "554797192447",
            "id": "test_msg_006",
            "timestamp": "1753982342",
            "text": {
              "body": "Quero agendar uma consulta"
            },
            "type": "text"
          }]
        },
        "field": "messages"
      }]
    }]
  }'

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