#!/bin/bash
# Script para enviar a página de carteira completa com integração Nxgate
# Execute: ./scripts/deploy-carteira-completo.sh

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 💳 Deploy Completo da Carteira (Nxgate) ==="
echo ""
echo "📝 Você precisará digitar a senha SSH: bicho@321"
echo ""

# 1. Enviar página de carteira atualizada
echo "1️⃣ Enviando página de carteira atualizada..."
rsync -avz \
  $LOCAL_DIR/app/carteira/ \
  $SERVER:$SERVER_DIR/app/carteira/

# 2. Enviar componente DepositPixModal atualizado (usando Nxgate)
echo ""
echo "2️⃣ Enviando componente DepositPixModal (Nxgate)..."
rsync -avz \
  $LOCAL_DIR/components/DepositPixModal.tsx \
  $SERVER:$SERVER_DIR/components/

# 3. Enviar API de transações
echo ""
echo "3️⃣ Enviando API de transações..."
rsync -avz \
  $LOCAL_DIR/app/api/transacoes/ \
  $SERVER:$SERVER_DIR/app/api/transacoes/

# 4. Fazer build
echo ""
echo "4️⃣ Fazendo build da aplicação..."
ssh $SERVER "cd $SERVER_DIR && npm run build"

# 5. Reiniciar PM2
echo ""
echo "5️⃣ Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart lotbicho --update-env"

echo ""
echo "=== ✅ Deploy da Carteira concluído! ==="
echo ""
echo "📋 O que foi enviado:"
echo "  ✅ Página de carteira (/carteira)"
echo "  ✅ Componente DepositPixModal (agora usa Nxgate)"
echo "  ✅ API de transações (/api/transacoes)"
echo "  ✅ Funcionalidade de saque integrada com Nxgate"
echo ""
echo "🎉 Agora a carteira está totalmente integrada com Nxgate!"
