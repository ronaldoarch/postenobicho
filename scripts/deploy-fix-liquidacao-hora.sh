#!/bin/bash
# Script para deploy rápido da correção de liquidação (match por hora, dias da semana), lib, manual e minhas-apostas

# Configurações
SERVER_USER="root"
SERVER_IP="104.218.52.159"
PROJECT_PATH="/var/www/postenobicho"
SSH_KEY_PATH="$HOME/.ssh/id_rsa_postenobicho"

echo "================================================"
echo "🚀 Iniciando deploy..."
echo "================================================"

# Verificar se a chave SSH existe
if [ ! -f "$SSH_KEY_PATH" ]; then
    echo "❌ Chave SSH não encontrada em $SSH_KEY_PATH"
    exit 1
fi

echo "✅ Usando chave SSH: $SSH_KEY_PATH"
chmod 600 "$SSH_KEY_PATH"

# 1. Enviar arquivos
echo "📦 Enviando app/api/resultados/liquidar/route.ts..."
rsync -avz -e "ssh -i $SSH_KEY_PATH" "app/api/resultados/liquidar/route.ts" "$SERVER_USER@$SERVER_IP:$PROJECT_PATH/app/api/resultados/liquidar/"

echo "📦 Enviando app/api/resultados/liquidar/manual/route.ts..."
rsync -avz -e "ssh -i $SSH_KEY_PATH" "app/api/resultados/liquidar/manual/route.ts" "$SERVER_USER@$SERVER_IP:$PROJECT_PATH/app/api/resultados/liquidar/manual/"

echo "📦 Enviando lib/bet-rules-engine.ts..."
rsync -avz -e "ssh -i $SSH_KEY_PATH" "lib/bet-rules-engine.ts" "$SERVER_USER@$SERVER_IP:$PROJECT_PATH/lib/"

echo "📦 Enviando app/minhas-apostas/page.tsx..."
rsync -avz -e "ssh -i $SSH_KEY_PATH" "app/minhas-apostas/page.tsx" "$SERVER_USER@$SERVER_IP:$PROJECT_PATH/app/minhas-apostas/"

echo "📦 Enviando data/horarios-reais-apuracao.ts..."
rsync -avz -e "ssh -i $SSH_KEY_PATH" "data/horarios-reais-apuracao.ts" "$SERVER_USER@$SERVER_IP:$PROJECT_PATH/data/"

# 2. Rebuildar e reiniciar
echo "🔄 Rebuildando e reiniciando aplicação no servidor..."
ssh -i "$SSH_KEY_PATH" "$SERVER_USER@$SERVER_IP" "cd $PROJECT_PATH && export PATH=\$PATH:/root/.nvm/versions/node/v18.17.0/bin && npm run build && pm2 restart lotbicho"

echo "================================================"
echo "✅ Deploy concluído!"
echo "================================================"
