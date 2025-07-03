# Contextualização ESADI - Resumo

## 📋 Visão Geral

A contextualização da **ESADI (Espaço de Saúde do Aparelho Digestivo)** foi criada para fornecer ao chatbot informações precisas e completas sobre a clínica, permitindo respostas especializadas e personalizadas aos pacientes.

## 🏥 Informações da Clínica

### Dados Básicos
- **Nome**: ESADI
- **Razão Social**: ESADI - Espaço de Saúde do Aparelho Digestivo
- **CNPJ**: 12.345.678/0001-90
- **Especialidade Principal**: Gastroenterologia

### Especialidades
- Endoscopia Digestiva
- Hepatologia
- Colonoscopia
- Diagnóstico por Imagem Digestiva

### Localização
- **Endereço**: Rua Sete de Setembro, 777
- **Complemento**: Edifício Stein Office - Sala 511
- **Bairro**: Centro
- **Cidade**: Blumenau - SC
- **CEP**: 89010-201

### Contatos
- **Telefone**: (47) 3222-0432
- **WhatsApp**: (47) 99963-3223
- **Email**: contato@esadi.com.br
- **Website**: https://www.esadi.com.br

### Horário de Funcionamento
- **Segunda a Quinta**: 07:00 às 18:00
- **Sexta**: 07:00 às 17:00
- **Sábado**: 07:00 às 12:00
- **Domingo**: Fechado

## 🤖 Agente IA - Jessica

### Personalidade
- Profissional, acolhedora e especializada em gastroenterologia
- Demonstra conhecimento técnico mas comunica de forma acessível
- Tom formal mas acessível, com foco na tranquilização do paciente

### Mensagens Padrão
- **Saudação**: "Olá! Sou a Jessica, assistente virtual da ESADI. Estou aqui para ajudá-lo com agendamentos e orientações sobre exames. Como posso ajudá-lo hoje?"
- **Despedida**: "Obrigado por escolher a ESADI para cuidar da sua saúde digestiva. Até breve!"
- **Fora do Horário**: "No momento estamos fora do horário de atendimento. Para urgências gastroenterológicas, procure o pronto-socorro do Hospital Santa Isabel. Retornaremos seu contato no próximo horário comercial."

## 👨‍⚕️ Profissionais

### Dr. Carlos Eduardo Silva
- **CRM**: CRM-SC 12345
- **Especialidades**: Gastroenterologia, Endoscopia Digestiva
- **Experiência**: Mais de 25 anos
- **Horários**: Segunda, Quarta, Sexta (08:00-12:00) | Terça, Quinta (14:00-18:00)

### Dr. João da Silva
- **CRM**: CRM-SC 9999
- **Especialidades**: Endoscopia Digestiva, Colonoscopia, Diagnóstico por Imagem Digestiva
- **Experiência**: Mais de 10 anos
- **Horários**: Segunda, Quarta, Sexta (08:00-12:00) | Terça, Quinta (14:00-18:00)

## 🏥 Serviços

### Consultas
- **Consulta Gastroenterológica**: R$ 280,00 (30 min)

### Exames
- **Endoscopia Digestiva Alta**: R$ 450,00 (30 min)
- **Colonoscopia**: R$ 650,00 (45 min)
- **Teste Respiratório H. Pylori**: R$ 180,00 (60 min)

## 💳 Convênios

### Unimed
- **Copagamento**: Não
- **Autorização**: Necessária

### Bradesco Saúde
- **Copagamento**: R$ 25,00
- **Autorização**: Necessária

### SulAmérica
- **Copagamento**: R$ 30,00
- **Autorização**: Necessária

## 💰 Formas de Pagamento
- Dinheiro
- Cartão de Crédito
- Cartão de Débito
- PIX
- Parcelamento (até 6x, mínimo R$ 100,00)
- Desconto à vista (5%)

## 📋 Políticas

### Agendamento
- **Antecedência mínima**: 24 horas
- **Antecedência máxima**: 90 dias
- **Reagendamento**: Permitido
- **Cancelamento**: 24 horas de antecedência
- **Confirmação**: Necessária

### Atendimento
- **Tolerância atraso**: 15 minutos
- **Acompanhante**: Permitido
- **Documentos obrigatórios**: RG/CNH, CPF, Carteirinha do convênio

## 🔧 Implementação Técnica

### Arquivos Criados
1. **`src/data/contextualizacao-esadi.json`** - Dados estruturados da clínica
2. **`src/services/contextualizacaoService.ts`** - Serviço para gerenciar a contextualização
3. **`src/pages/Contextualizar.tsx`** - Interface para visualizar e editar
4. **`scripts/test-contextualizacao.js`** - Script de teste

### Integração com Chatbot
- A Edge Function `whatsapp-integration` foi atualizada para incluir o contexto da ESADI
- O contexto é enviado automaticamente para o chatbot em cada interação
- Respostas são personalizadas com informações específicas da clínica

### Funcionalidades do Serviço
- ✅ Carregamento de dados estruturados
- ✅ Busca por profissionais por especialidade
- ✅ Verificação de horário de funcionamento
- ✅ Geração de contexto para chatbot
- ✅ Busca de convênios e serviços
- ✅ Cálculo de status da clínica (aberta/fechada)

## 🧪 Testes Realizados

O script de teste confirma que todas as funcionalidades estão operacionais:

1. ✅ Informações básicas carregadas
2. ✅ Contatos e localização
3. ✅ Profissionais e especialidades
4. ✅ Serviços e preços
5. ✅ Convênios e copagamentos
6. ✅ Status da clínica (aberta/fechada)
7. ✅ Contexto do chatbot gerado
8. ✅ Busca por especialidade funcionando
9. ✅ Busca de convênio funcionando

## 🚀 Próximos Passos

1. **Teste do Chatbot**: Enviar mensagens via WhatsApp para verificar se o chatbot responde com as informações da ESADI
2. **Monitoramento**: Acompanhar os logs do Supabase para verificar se o contexto está sendo usado corretamente
3. **Ajustes**: Fazer ajustes finos no contexto conforme necessário
4. **Expansão**: Adicionar mais informações específicas conforme a necessidade

## 📞 Suporte

Para dúvidas ou ajustes na contextualização:
- Verificar logs no dashboard do Supabase
- Testar via script `test-contextualizacao.js`
- Acessar a página de contextualização no frontend
- Consultar a Edge Function `whatsapp-integration` para detalhes técnicos

---

**Status**: ✅ Implementado e Testado  
**Versão**: 1.0.0  
**Data**: 30/06/2024 