#!/bin/bash

echo "🔧 REMOVENDO VARIÁVEIS DEFAULT DOS SCRIPTS"
echo "=========================================="

# Lista de arquivos de script para atualizar
scripts=(
    "scripts/update-whatsapp-token.sh"
    "scripts/fix-whatsapp-phone-config.sh"
    "scripts/setup-vps-complete.sh"
    "scripts/deploy-vps-manual.sh"
    "scripts/fix-whatsapp-token-expired.sh"
    "scripts/fix-all-issues.sh"
    "scripts/deploy-vps-ai.sh"
)

echo "📋 Atualizando arquivos de script..."

for script in "${scripts[@]}"; do
    if [ -f "$script" ]; then
        echo "🔧 Atualizando $script..."
        
        # Fazer backup
        cp "$script" "$script.backup.$(date +%Y%m%d_%H%M%S)"
        
        # Remover linhas com DEFAULT_CLINIC_ID e DEFAULT_USER_ID
        sed -i '' '/^DEFAULT_CLINIC_ID=/d' "$script"
        sed -i '' '/^DEFAULT_USER_ID=/d' "$script"
        sed -i '' '/^echo "DEFAULT_CLINIC_ID=/d' "$script"
        sed -i '' '/^echo "DEFAULT_USER_ID=/d' "$script"
        
        # Remover process.env.DEFAULT_CLINIC_ID e process.env.DEFAULT_USER_ID
        sed -i '' "s/process\.env\.DEFAULT_CLINIC_ID || 'default-clinic'/'default-clinic'/g" "$script"
        sed -i '' "s/process\.env\.DEFAULT_USER_ID || 'system-ai-user'/'system-ai-user'/g" "$script"
        sed -i '' "s/process\.env\.DEFAULT_CLINIC_ID || 'test-clinic'/'test-clinic'/g" "$script"
        sed -i '' "s/process\.env\.DEFAULT_USER_ID || 'system-user'/'system-user'/g" "$script"
        
        echo "✅ $script atualizado"
    else
        echo "⚠️ $script não encontrado"
    fi
done

echo ""
echo "📋 Verificando arquivos JavaScript..."

# Atualizar arquivos JavaScript que usam essas variáveis
js_files=(
    "scripts/fix-ai-system-javascript.sh"
    "scripts/integrate-full-ai-system.sh"
    "update-server-with-enhanced-ai.js"
    "test-webhook-vps.js"
)

for file in "${js_files[@]}"; do
    if [ -f "$file" ]; then
        echo "🔧 Atualizando $file..."
        
        # Fazer backup
        cp "$file" "$file.backup.$(date +%Y%m%d_%H%M%S)"
        
        # Remover process.env.DEFAULT_CLINIC_ID e process.env.DEFAULT_USER_ID
        sed -i '' "s/process\.env\.DEFAULT_CLINIC_ID || 'default-clinic'/'default-clinic'/g" "$file"
        sed -i '' "s/process\.env\.DEFAULT_USER_ID || 'system-ai-user'/'system-ai-user'/g" "$file"
        sed -i '' "s/process\.env\.DEFAULT_CLINIC_ID || 'test-clinic'/'test-clinic'/g" "$file"
        sed -i '' "s/process\.env\.DEFAULT_USER_ID || 'system-user'/'system-user'/g" "$file"
        
        echo "✅ $file atualizado"
    else
        echo "⚠️ $file não encontrado"
    fi
done

echo ""
echo "📋 Verificando documentação..."

# Atualizar arquivos de documentação
docs=(
    "GUIA_RESOLUCAO_WHATSAPP_AI.md"
    "CAUSA_PROBLEMA_WHATSAPP.md"
    "CORRECAO_CONFIGURACOES_AMBIENTE.md"
)

for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        echo "🔧 Atualizando $doc..."
        
        # Fazer backup
        cp "$doc" "$doc.backup.$(date +%Y%m%d_%H%M%S)"
        
        # Remover linhas com DEFAULT_CLINIC_ID e DEFAULT_USER_ID
        sed -i '' '/^DEFAULT_CLINIC_ID=/d' "$doc"
        sed -i '' '/^DEFAULT_USER_ID=/d' "$doc"
        
        echo "✅ $doc atualizado"
    else
        echo "⚠️ $doc não encontrado"
    fi
done

echo ""
echo "🎉 ATUALIZAÇÃO CONCLUÍDA!"
echo "========================"
echo "✅ Variáveis DEFAULT_CLINIC_ID e DEFAULT_USER_ID removidas dos scripts"
echo "✅ Arquivos JavaScript atualizados"
echo "✅ Documentação atualizada"
echo "✅ Backups criados para todos os arquivos modificados"
echo ""
echo "📝 Arquivos modificados:"
for script in "${scripts[@]}"; do
    if [ -f "$script" ]; then
        echo "   - $script"
    fi
done
for file in "${js_files[@]}"; do
    if [ -f "$file" ]; then
        echo "   - $file"
    fi
done
for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        echo "   - $doc"
    fi
done 