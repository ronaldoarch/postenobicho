#!/bin/bash
# Script para enviar a página de carteira para o servidor
# Execute: ./scripts/deploy-carteira.sh

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 💳 Enviando Página de Carteira ==="
echo ""
echo "📝 Você precisará digitar a senha SSH: bicho@321"
echo ""

# 1. Enviar página de carteira
echo "1️⃣ Enviando página de carteira..."
rsync -avz \
  $LOCAL_DIR/app/carteira/ \
  $SERVER:$SERVER_DIR/app/carteira/

# 2. Fazer build
echo ""
echo "2️⃣ Fazendo build da aplicação..."
ssh $SERVER "cd $SERVER_DIR && npm run build"

# 3. Reiniciar PM2
echo ""
echo "3️⃣ Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart lotbicho --update-env"

echo ""
echo "=== ✅ Página de Carteira enviada! ==="
echo ""
echo "🎉 Agora a página /carteira deve funcionar!"
