#!/bin/bash
# Script para deploy da correção de busca de odd via API

# Configurações
SERVER_USER="root"
SERVER_IP="104.218.52.159"
PROJECT_PATH="/var/www/postenobicho"
SSH_KEY_PATH="$HOME/.ssh/id_rsa_postenobicho"

echo "================================================"
echo "🚀 Deploy da correção de busca de odd via API..."
echo "================================================"

# Verificar se a chave SSH existe
if [ ! -f "$SSH_KEY_PATH" ]; then
    echo "❌ Chave SSH não encontrada em $SSH_KEY_PATH"
    exit 1
fi

chmod 600 "$SSH_KEY_PATH"

# Enviar arquivos
echo "📦 Enviando app/api/odd/buscar/route.ts..."
rsync -avz -e "ssh -i $SSH_KEY_PATH" "app/api/odd/buscar/route.ts" "$SERVER_USER@$SERVER_IP:$PROJECT_PATH/app/api/odd/buscar/"

echo "📦 Enviando components/BetFlow.tsx..."
rsync -avz -e "ssh -i $SSH_KEY_PATH" "components/BetFlow.tsx" "$SERVER_USER@$SERVER_IP:$PROJECT_PATH/components/"

# Rebuildar e reiniciar
echo "🔄 Rebuildando e reiniciando aplicação no servidor..."
ssh -i "$SSH_KEY_PATH" "$SERVER_USER@$SERVER_IP" "cd $PROJECT_PATH && export PATH=\$PATH:/root/.nvm/versions/node/v18.17.0/bin && npm run build && pm2 restart lotbicho"

echo "================================================"
echo "✅ Deploy concluído!"
echo "================================================"
echo ""
echo "📋 Teste:"
echo "1. Crie uma nova aposta de Grupo"
echo "2. Verifique se o retorno mínimo mostra R$ 1,90 (com odd 20x) em vez de R$ 1,71 (odd 18x)"
echo "3. Verifique os logs do servidor para ver se está usando a odd do banco"
