#!/bin/bash
# Script para fazer deploy apenas das melhorias de logs do saque
# Execute: ./scripts/deploy-logs-saque.sh

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🚀 Deploy das Melhorias de Logs de Saque ==="
echo ""
echo "📝 Você precisará digitar a senha SSH: bicho@321"
echo ""

# 1. Enviar arquivo atualizado
echo "1️⃣ Enviando arquivo atualizado..."
rsync -avz \
  "$LOCAL_DIR/app/api/saque/pix-nxgate/route.ts" \
  "$SERVER:$SERVER_DIR/app/api/saque/pix-nxgate/"

# 2. Fazer build
echo ""
echo "2️⃣ Fazendo build da aplicação..."
ssh $SERVER "cd $SERVER_DIR && npm run build"

# 3. Reiniciar PM2
echo ""
echo "3️⃣ Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart lotbicho --update-env"

echo ""
echo "=== ✅ Deploy Concluído! ==="
echo ""
echo "📋 O que foi atualizado:"
echo "  ✅ Logs melhorados mostrando payload completo"
echo "  ✅ Correção na limpeza de chave PIX (EMAIL e RANDOM)"
echo "  ✅ Logs mostram tipo de cada campo (number vs string)"
echo ""
echo "🎉 Agora tente fazer um saque e verifique os logs:"
echo "   pm2 logs lotbicho --lines 100"
echo ""
echo "Procure por:"
echo "  === DEBUG SAQUE PIX NXGATE ==="
echo "  📤 PAYLOAD ENVIADO (JSON):"
