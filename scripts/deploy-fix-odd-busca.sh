#!/bin/bash
# Script para deploy da correção de busca de odd do banco

# Configurações
SERVER_USER="root"
SERVER_IP="104.218.52.159"
PROJECT_PATH="/var/www/postenobicho"
SSH_KEY_PATH="$HOME/.ssh/id_rsa_postenobicho"

echo "================================================"
echo "🚀 Deploy da correção de busca de odd..."
echo "================================================"

# Verificar se a chave SSH existe
if [ ! -f "$SSH_KEY_PATH" ]; then
    echo "❌ Chave SSH não encontrada em $SSH_KEY_PATH"
    exit 1
fi

chmod 600 "$SSH_KEY_PATH"

# Enviar arquivo
echo "📦 Enviando lib/bet-rules-engine.ts..."
rsync -avz -e "ssh -i $SSH_KEY_PATH" "lib/bet-rules-engine.ts" "$SERVER_USER@$SERVER_IP:$PROJECT_PATH/lib/"

# Rebuildar e reiniciar
echo "🔄 Rebuildando e reiniciando aplicação no servidor..."
ssh -i "$SSH_KEY_PATH" "$SERVER_USER@$SERVER_IP" "cd $PROJECT_PATH && export PATH=\$PATH:/root/.nvm/versions/node/v18.17.0/bin && npm run build && pm2 restart lotbicho"

echo "================================================"
echo "✅ Deploy concluído!"
echo "================================================"
echo ""
echo "📋 Próximos passos:"
echo "1. Acesse a página 'Minhas Apostas'"
echo "2. Abra uma aposta pendente"
echo "3. Verifique os logs do servidor (pm2 logs lotbicho)"
echo "4. Procure por logs que começam com '🔍 buscarOdd chamado'"
echo "5. Verifique se está usando a odd do banco (20x) ou fallback (18x)"
