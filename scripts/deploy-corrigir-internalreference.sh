#!/bin/bash
# Script para fazer deploy da correção do internalreference
# Execute: ./scripts/deploy-corrigir-internalreference.sh

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🚀 Deploy: Correção do internalreference ==="
echo ""
echo "📝 Você precisará digitar a senha SSH: bicho@321"
echo ""

# 1. Enviar arquivo atualizado
echo "1️⃣ Enviando arquivo atualizado (app/api/saque/pix-nxgate/route.ts)..."
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
echo "📋 O que foi corrigido:"
echo "  ✅ Código agora usa 'internalreference' como ID da transação (retornado pelo Nxgate)"
echo "  ✅ Mantém fallback para outros campos caso necessário"
echo ""
echo "🎯 Próximos passos:"
echo "  1. Tente fazer um saque novamente"
echo "  2. O saque deve ser registrado corretamente com o ID da transação"
echo "  3. Verifique os logs: pm2 logs lotbicho --lines 50"
echo ""
