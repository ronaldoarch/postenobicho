#!/bin/bash
# Script para fazer deploy da correção que força uso de IPv4
# Execute: ./scripts/deploy-forcar-ipv4.sh

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🚀 Deploy: Forçar Uso de IPv4 para Nxgate ==="
echo ""
echo "📝 Você precisará digitar a senha SSH: bicho@321"
echo ""

# 1. Enviar arquivo atualizado
echo "1️⃣ Enviando arquivo atualizado (lib/nxgate-client.ts)..."
rsync -avz \
  "$LOCAL_DIR/lib/nxgate-client.ts" \
  "$SERVER:$SERVER_DIR/lib/"

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
echo "  ✅ Código agora força uso de IPv4 primeiro (em vez de IPv6)"
echo "  ✅ Node.js usará IPv4 (104.218.52.159) que está autorizado no Nxgate"
echo ""
echo "🎯 Próximos passos:"
echo "  1. Verifique se o IPv4 104.218.52.159 está autorizado no Nxgate para saques"
echo "  2. Tente fazer um saque novamente"
echo "  3. Verifique os logs: pm2 logs lotbicho --lines 50"
echo ""
echo "💡 Se ainda não funcionar, adicione no .env do servidor:"
echo "   NODE_OPTIONS=--dns-result-order=ipv4first"
echo "   E reinicie: pm2 restart lotbicho --update-env"
echo ""
