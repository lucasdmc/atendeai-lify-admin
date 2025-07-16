#!/bin/bash

# 🚀 Script de Configuração Rápida da VPS AtendeAI
# VPS: 31.97.241.19
# Host: atendeai.lify.com.br
# Usuário: root

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações da VPS
VPS_IP="31.97.241.19"
VPS_HOST="atendeai.server.com.br"
VPS_USER="root"
VPS_PATH="/opt/whatsapp-server"

echo -e "${BLUE}🚀 Configuração Rápida da VPS AtendeAI${NC}"
echo -e "${BLUE}📍 VPS: ${VPS_IP} (${VPS_HOST})${NC}"
echo -e "${BLUE}👤 Usuário: ${VPS_USER}${NC}"
echo ""

# Função para executar comandos SSH
execute_ssh() {
    local command="$1"
    local description="$2"
    
    echo -e "${YELLOW}🔄 ${description}...${NC}"
    ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} "$command"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ ${description} - Sucesso${NC}"
    else
        echo -e "${RED}❌ ${description} - Falhou${NC}"
        return 1
    fi
}

# Função para testar conectividade
test_connectivity() {
    echo -e "${YELLOW}🧪 Testando conectividade...${NC}"
    
    if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} "echo 'SSH OK'" 2>/dev/null; then
        echo -e "${GREEN}✅ Conexão SSH OK${NC}"
        return 0
    else
        echo -e "${RED}❌ Conexão SSH falhou${NC}"
        echo -e "${YELLOW}💡 Verifique:${NC}"
        echo "1. SSH key configurada: ssh-copy-id root@${VPS_IP}"
        echo "2. IP correto: ${VPS_IP}"
        echo "3. Usuário correto: ${VPS_USER}"
        return 1
    fi
}

# Função para instalar dependências básicas
install_basic_deps() {
    echo -e "${YELLOW}📦 Instalando dependências básicas...${NC}"
    
    execute_ssh "apt-get update" "Atualizando pacotes"
    execute_ssh "apt-get install -y curl wget git unzip" "Instalando utilitários"
    execute_ssh "apt-get install -y ufw" "Instalando firewall"
}

# Função para instalar Node.js
install_nodejs() {
    echo -e "${YELLOW}📦 Instalando Node.js...${NC}"
    
    execute_ssh "curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -" "Adicionando repositório Node.js"
    execute_ssh "apt-get install -y nodejs" "Instalando Node.js"
    execute_ssh "npm install -g pm2" "Instalando PM2"
    
    # Verificar instalação
    execute_ssh "node --version" "Verificando Node.js"
    execute_ssh "npm --version" "Verificando NPM"
    execute_ssh "pm2 --version" "Verificando PM2"
}

# Função para instalar Nginx
install_nginx() {
    echo -e "${YELLOW}🌐 Instalando Nginx...${NC}"
    
    execute_ssh "apt-get install -y nginx" "Instalando Nginx"
    execute_ssh "systemctl enable nginx" "Habilitando Nginx"
    execute_ssh "systemctl start nginx" "Iniciando Nginx"
}

# Função para configurar firewall
setup_firewall() {
    echo -e "${YELLOW}🔥 Configurando firewall...${NC}"
    
    execute_ssh "ufw --force enable" "Habilitando UFW"
    execute_ssh "ufw allow ssh" "Liberando SSH"
    execute_ssh "ufw allow 80" "Liberando porta 80"
    execute_ssh "ufw allow 443" "Liberando porta 443"
    execute_ssh "ufw allow 3001" "Liberando porta 3001"
    execute_ssh "ufw --force reload" "Recarregando firewall"
}

# Função para clonar repositório
clone_repository() {
    echo -e "${YELLOW}📥 Clonando repositório...${NC}"
    
    execute_ssh "mkdir -p ${VPS_PATH}" "Criando diretório"
    execute_ssh "cd ${VPS_PATH} && git clone https://github.com/lucasdmc/LifyChatbot-Node-Server ." "Clonando repositório"
    execute_ssh "cd ${VPS_PATH} && npm install" "Instalando dependências"
}

# Função para configurar PM2
setup_pm2() {
    echo -e "${YELLOW}⚙️ Configurando PM2...${NC}"
    
    execute_ssh "cd ${VPS_PATH} && pm2 start server.js --name whatsapp-server" "Iniciando servidor com PM2"
    execute_ssh "pm2 save" "Salvando configuração PM2"
    execute_ssh "pm2 startup" "Configurando startup automático"
}

# Função para mostrar status
show_status() {
    echo -e "${BLUE}📊 Status do Sistema:${NC}"
    echo ""
    
    execute_ssh "pm2 status" "Status PM2"
    execute_ssh "systemctl status nginx --no-pager" "Status Nginx"
    execute_ssh "ufw status" "Status Firewall"
    execute_ssh "df -h" "Uso de disco"
    execute_ssh "free -h" "Uso de RAM"
}

# Função principal
main() {
    echo -e "${BLUE}🚀 Configuração Rápida da VPS AtendeAI${NC}"
    echo ""
    
    # Testar conectividade inicial
    if ! test_connectivity; then
        echo -e "${RED}❌ Não foi possível conectar à VPS${NC}"
        exit 1
    fi
    
    # Instalar dependências básicas
    install_basic_deps
    
    # Instalar Node.js
    install_nodejs
    
    # Instalar Nginx
    install_nginx
    
    # Configurar firewall
    setup_firewall
    
    # Clonar repositório
    clone_repository
    
    # Configurar PM2
    setup_pm2
    
    # Mostrar status
    show_status
    
    echo ""
    echo -e "${GREEN}🎉 Configuração básica concluída!${NC}"
    echo -e "${BLUE}🌐 Próximos passos:${NC}"
    echo "1. Execute o deploy completo: ./scripts/deploy-production-vps.sh"
    echo "2. Configure SSL: certbot --nginx -d atendeai.lify.com.br"
    echo "3. Configure Nginx para proxy reverso"
    echo "4. Teste o sistema: curl http://${VPS_IP}:3001/health"
    echo ""
    echo -e "${YELLOW}📋 Comandos úteis:${NC}"
    echo "• Ver logs: ssh root@${VPS_IP} 'pm2 logs'"
    echo "• Reiniciar: ssh root@${VPS_IP} 'pm2 restart whatsapp-server'"
    echo "• Status: ssh root@${VPS_IP} 'pm2 status'"
    echo "• Nginx: ssh root@${VPS_IP} 'systemctl status nginx'"
}

# Executar função principal
main "$@" 