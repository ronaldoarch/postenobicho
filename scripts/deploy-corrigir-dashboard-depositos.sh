#!/bin/bash
# Script para fazer deploy da correção do dashboard de depósitos
# Execute: ./scripts/deploy-corrigir-dashboard-depositos.sh

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🚀 Deploy: Correção do Dashboard de Depósitos ==="
echo ""
echo "📝 Você precisará digitar a senha SSH: bicho@321"
echo ""

# 1. Enviar arquivo atualizado
echo "1️⃣ Enviando arquivo atualizado (app/api/admin/dashboard/route.ts)..."
rsync -avz \
  "$LOCAL_DIR/app/api/admin/dashboard/route.ts" \
  "$SERVER:$SERVER_DIR/app/api/admin/dashboard/"

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
echo "  ✅ Dashboard agora busca depósitos com status 'aprovado' OU 'pago'"
echo "  ✅ Depósitos via Nxgate (status 'pago') agora aparecem no dashboard"
echo ""
echo "🎯 Próximos passos:"
echo "  1. Recarregue a página do dashboard (/admin)"
echo "  2. Os depósitos confirmados devem aparecer agora"
echo "  3. Verifique se os valores estão corretos"
echo ""
