-- Inserir contextualização da CardioPrime (VERSÃO CORRIGIDA)
-- Execute este script no SQL Editor do Supabase

-- Verificar se a clínica já existe
SELECT id, name, whatsapp_phone, has_contextualization 
FROM clinics 
WHERE whatsapp_phone = '554730915628';

-- Primeiro, deletar se existir
DELETE FROM clinics WHERE whatsapp_phone = '554730915628';

-- Inserir a clínica CardioPrime com JSON válido
INSERT INTO clinics (id, name, whatsapp_phone, contextualization_json, has_contextualization, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'CardioPrime',
  '554730915628',
  '{
    "clinica": {
      "informacoes_basicas": {
        "nome": "CardioPrime",
        "especialidade_principal": "Cardiologia",
        "especialidades_secundarias": [
          "Cardiologia Intervencionista",
          "Hemodinâmica",
          "Cateterismo Cardíaco",
          "Angioplastia",
          "Eletrofisiologia",
          "Ecocardiografia",
          "Ergometria"
        ]
      },
      "localizacao": {
        "endereco_principal": {
          "logradouro": "Rua Azambuja",
          "numero": "1000",
          "complemento": "Hospital Santa Catarina - 1º andar",
          "bairro": "Centro",
          "cidade": "Blumenau",
          "estado": "SC",
          "cep": "89010-000"
        }
      },
      "contatos": {
        "telefone_principal": "(47) 3231-0200",
        "whatsapp": "(47) 99999-7777",
        "email_principal": "contato@cardioprime.med.br"
      },
      "horario_funcionamento": {
        "segunda": {"abertura": "07:00", "fechamento": "18:00"},
        "terca": {"abertura": "07:00", "fechamento": "18:00"},
        "quarta": {"abertura": "07:00", "fechamento": "18:00"},
        "quinta": {"abertura": "07:00", "fechamento": "18:00"},
        "sexta": {"abertura": "07:00", "fechamento": "17:00"},
        "sabado": {"abertura": "08:00", "fechamento": "12:00"},
        "domingo": {"abertura": null, "fechamento": null}
      }
    },
    "agente_ia": {
      "configuracao": {
        "nome": "Cardio",
        "saudacao_inicial": "Olá! Sou o Cardio, assistente virtual da CardioPrime. Como posso cuidar da sua saúde cardiovascular hoje?",
        "mensagem_despedida": "Obrigado por escolher a CardioPrime para cuidar do seu coração. Até breve!"
      }
    },
    "profissionais": [
      {
        "id": "prof_001",
        "nome_completo": "Dr. Roberto Silva",
        "especialidades": ["Cardiologia", "Cardiologia Intervencionista"],
        "ativo": true,
        "aceita_novos_pacientes": true
      },
      {
        "id": "prof_002",
        "nome_completo": "Dra. Maria Fernanda",
        "especialidades": ["Cardiologia", "Ecocardiografia"],
        "ativo": true,
        "aceita_novos_pacientes": true
      }
    ],
    "servicos": {
      "consultas": [
        {
          "id": "cons_001",
          "nome": "Consulta Cardiológica",
          "preco_particular": 300.00,
          "aceita_convenio": true,
          "convenios_aceitos": ["Unimed", "Bradesco Saúde", "Amil", "SulAmérica"],
          "ativo": true
        },
        {
          "id": "cons_002",
          "nome": "Consulta Pré-Procedimento",
          "preco_particular": 350.00,
          "aceita_convenio": true,
          "convenios_aceitos": ["Unimed", "Bradesco Saúde", "Amil"],
          "ativo": true
        }
      ],
      "exames": [
        {
          "id": "exam_001",
          "nome": "Ecocardiograma Transtorácico",
          "preco_particular": 250.00,
          "aceita_convenio": true,
          "convenios_aceitos": ["Unimed", "Bradesco Saúde", "Amil", "SulAmérica"],
          "ativo": true
        },
        {
          "id": "exam_002",
          "nome": "Teste Ergométrico",
          "preco_particular": 200.00,
          "aceita_convenio": true,
          "convenios_aceitos": ["Unimed", "Bradesco Saúde", "Amil"],
          "ativo": true
        }
      ]
    },
    "convenios": [
      {
        "id": "conv_001",
        "nome": "Unimed",
        "ativo": true,
        "copagamento": false
      },
      {
        "id": "conv_002",
        "nome": "Bradesco Saúde",
        "ativo": true,
        "copagamento": true,
        "valor_copagamento": 40.00
      },
      {
        "id": "conv_003",
        "nome": "Amil",
        "ativo": true,
        "copagamento": true,
        "valor_copagamento": 45.00
      }
    ],
    "formas_pagamento": {
      "dinheiro": true,
      "cartao_credito": true,
      "cartao_debito": true,
      "pix": true
    }
  }'::jsonb,
  true,
  NOW(),
  NOW()
);

-- Verificar se foi inserido corretamente
SELECT id, name, whatsapp_phone, has_contextualization 
FROM clinics 
WHERE whatsapp_phone = '554730915628';

-- Testar a função de busca de contextualização
SELECT * FROM get_clinic_contextualization('554730915628'); 