#!/bin/bash
# Script para corrigir exibição do QR code
# Execute: ./scripts/fix-qrcode-display.sh

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🔧 Corrigindo Exibição do QR Code ==="
echo ""
echo "📝 Você precisará digitar a senha SSH: bicho@321"
echo ""

# 1. Enviar correção do componente DepositPixModal
echo "1️⃣ Enviando correção do componente DepositPixModal..."
rsync -avz \
  $LOCAL_DIR/components/DepositPixModal.tsx \
  $SERVER:$SERVER_DIR/components/

# 1.5. Enviar correção da API de depósito (melhor formatação de resposta)
echo ""
echo "1️⃣.5️⃣ Enviando correção da API de depósito..."
rsync -avz \
  $LOCAL_DIR/app/api/deposito/pix-nxgate/route.ts \
  $SERVER:$SERVER_DIR/app/api/deposito/pix-nxgate/

# 2. Fazer build
echo ""
echo "2️⃣ Fazendo build da aplicação..."
ssh $SERVER "cd $SERVER_DIR && npm run build"

# 3. Reiniciar PM2
echo ""
echo "3️⃣ Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart lotbicho --update-env"

echo ""
echo "=== ✅ Correção Aplicada! ==="
echo ""
echo "📋 O que foi corrigido:"
echo "  ✅ Simplificado para sempre usar QRCodeSVG (mais confiável)"
echo "  ✅ Suporte a diferentes campos de resposta (qrCodeText, paymentCode)"
echo "  ✅ Melhor formatação e espaçamento do QR code"
echo "  ✅ Removida dependência de imagem base64 (usa apenas texto)"
echo ""
echo "🎉 Agora o QR code deve aparecer corretamente usando QRCodeSVG!"
