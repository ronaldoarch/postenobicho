#!/bin/bash
# Script para corrigir formato de resposta da API Nxgate
# Execute: ./scripts/fix-nxgate-response-format.sh

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🔧 Corrigindo Formato de Resposta Nxgate ==="
echo ""
echo "📝 Você precisará digitar a senha SSH: bicho@321"
echo ""

# 1. Enviar correção da rota de depósito (aceitar paymentCode)
echo "1️⃣ Enviando correção da rota de depósito (paymentCode)..."
rsync -avz \
  $LOCAL_DIR/app/api/deposito/pix-nxgate/route.ts \
  $SERVER:$SERVER_DIR/app/api/deposito/pix-nxgate/

# 2. Enviar correção do webhook (aceitar transaction_id)
echo ""
echo "2️⃣ Enviando correção do webhook (transaction_id)..."
rsync -avz \
  $LOCAL_DIR/app/api/webhooks/nxgate/route.ts \
  $SERVER:$SERVER_DIR/app/api/webhooks/nxgate/

# 3. Fazer build
echo ""
echo "3️⃣ Fazendo build da aplicação..."
ssh $SERVER "cd $SERVER_DIR && npm run build"

# 4. Reiniciar PM2
echo ""
echo "4️⃣ Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart lotbicho --update-env"

echo ""
echo "=== ✅ Correções Aplicadas! ==="
echo ""
echo "📋 O que foi corrigido:"
echo "  ✅ Rota de depósito agora aceita 'paymentCode' como QR code"
echo "  ✅ Rota de depósito agora aceita 'paymentCodeBase64' como imagem"
echo "  ✅ Webhook agora aceita 'transaction_id' além de 'idTransaction'"
echo ""
echo "🎉 Agora o QR code deve ser gerado corretamente!"
