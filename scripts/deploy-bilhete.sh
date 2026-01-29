#!/bin/bash
# Script para deploy do componente de bilhete

# Configurações
SERVER_USER="root"
SERVER_IP="104.218.52.159"
PROJECT_PATH="/var/www/postenobicho"
SSH_KEY_PATH="$HOME/.ssh/id_rsa_postenobicho"

echo "================================================"
echo "🚀 Deploy do componente de bilhete..."
echo "================================================"

# Verificar se a chave SSH existe
if [ ! -f "$SSH_KEY_PATH" ]; then
    echo "❌ Chave SSH não encontrada em $SSH_KEY_PATH"
    exit 1
fi

chmod 600 "$SSH_KEY_PATH"

# Enviar arquivos
echo "📦 Enviando components/BilheteAposta.tsx..."
rsync -avz -e "ssh -i $SSH_KEY_PATH" "components/BilheteAposta.tsx" "$SERVER_USER@$SERVER_IP:$PROJECT_PATH/components/"

echo "📦 Enviando app/minhas-apostas/page.tsx..."
rsync -avz -e "ssh -i $SSH_KEY_PATH" "app/minhas-apostas/page.tsx" "$SERVER_USER@$SERVER_IP:$PROJECT_PATH/app/minhas-apostas/"

# Rebuildar e reiniciar
echo "🔄 Rebuildando e reiniciando aplicação no servidor..."
ssh -i "$SSH_KEY_PATH" "$SERVER_USER@$SERVER_IP" "cd $PROJECT_PATH && export PATH=\$PATH:/root/.nvm/versions/node/v18.17.0/bin && npm run build && pm2 restart lotbicho"

echo "================================================"
echo "✅ Deploy concluído!"
echo "================================================"
echo ""
echo "📋 Teste:"
echo "1. Acesse a página 'Minhas Apostas'"
echo "2. Clique no botão 'Bilhete' em uma aposta"
echo "3. Verifique se o bilhete está sendo exibido corretamente"
echo "4. Teste a função de impressão"
