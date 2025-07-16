# CHECKLIST DE VERIFICAÇÃO

## ✅ Pré-requisitos
- [ ] Backend local rodando na porta 3001
- [ ] Supabase configurado e acessível
- [ ] Variáveis de ambiente configuradas
- [ ] Arquivo de contextualização presente

## 🔧 Testes de Conectividade
- [ ] Backend local responde via curl
- [ ] Frontend consegue acessar backend local
- [ ] Frontend consegue acessar Edge Function

## 📱 Testes de WhatsApp
- [ ] QR Code é gerado corretamente
- [ ] QR Code pode ser lido pelo WhatsApp
- [ ] Conexão é estabelecida após leitura
- [ ] Sessão persiste após reconexão
- [ ] Agente responde a mensagens

## 🤖 Testes de Contextualização
- [ ] Arquivo JSON é carregado corretamente
- [ ] Contexto é aplicado ao agente
- [ ] Respostas seguem o contexto
- [ ] Memória de conversa funciona
- [ ] Integração com IA funciona

## 🐛 Logs e Debug
- [ ] Logs do backend são gerados
- [ ] Logs da Edge Function são gerados
- [ ] Logs do frontend são gerados
- [ ] Erros são capturados e registrados
- [ ] Timeouts são configurados adequadamente
