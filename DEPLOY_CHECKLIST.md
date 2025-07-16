# ✅ Checklist de Deploy para Produção

## 🔧 Configurações do Frontend
- [ ] Variáveis de ambiente configuradas (.env.production)
- [ ] Build do projeto executado com sucesso
- [ ] CORS configurado para domínio de produção
- [ ] Google OAuth configurado para produção

## 🖥️ Configurações da VPS
- [ ] Servidor VPS acessível
- [ ] Porta 3001 liberada no firewall
- [ ] Node.js instalado na VPS
- [ ] PM2 instalado na VPS
- [ ] Servidor WhatsApp rodando com PM2

## 🌐 Configurações do Domínio
- [ ] DNS configurado para atendeai.lify.com.br
- [ ] SSL/HTTPS configurado
- [ ] Proxy reverso (Nginx) configurado
- [ ] Redirecionamentos configurados

## 🗄️ Configurações do Banco de Dados
- [ ] Supabase configurado para produção
- [ ] Tabelas criadas e populadas
- [ ] Políticas RLS configuradas
- [ ] Edge Functions deployadas

## 🧪 Testes de Funcionalidade
- [ ] Login/Autenticação funcionando
- [ ] Conexão com Google Calendar funcionando
- [ ] WhatsApp QR Code gerando
- [ ] Agendamentos salvando
- [ ] Conversas funcionando

## 📊 Monitoramento
- [ ] Logs configurados
- [ ] Health checks funcionando
- [ ] Alertas configurados
- [ ] Backup configurado

## 🔒 Segurança
- [ ] Variáveis sensíveis protegidas
- [ ] CORS configurado corretamente
- [ ] Rate limiting configurado
- [ ] Headers de segurança configurados
