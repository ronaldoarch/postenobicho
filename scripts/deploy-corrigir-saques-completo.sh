#!/bin/bash
# Script para fazer deploy das correções completas de saques
# Execute: ./scripts/deploy-corrigir-saques-completo.sh

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🚀 Deploy: Correções Completas de Saques ==="
echo ""
echo "📝 Você precisará digitar a senha SSH: bicho@321"
echo ""

# 1. Enviar arquivos atualizados
echo "1️⃣ Enviando arquivos atualizados..."
rsync -avz \
  "$LOCAL_DIR/app/api/admin/saques/route.ts" \
  "$SERVER:$SERVER_DIR/app/api/admin/saques/"

rsync -avz \
  "$LOCAL_DIR/app/api/admin/dashboard/route.ts" \
  "$SERVER:$SERVER_DIR/app/api/admin/dashboard/"

rsync -avz \
  "$LOCAL_DIR/app/api/webhooks/nxgate/route.ts" \
  "$SERVER:$SERVER_DIR/app/api/webhooks/nxgate/"

rsync -avz \
  "$LOCAL_DIR/app/admin/saques/page.tsx" \
  "$SERVER:$SERVER_DIR/app/admin/saques/"

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
echo "  ✅ API de saques agora busca do banco de dados (não mais array em memória)"
echo "  ✅ Dashboard conta saques com status 'aprovado' ou 'saque-pago'"
echo "  ✅ Saques pendentes aparecem na aba de saques"
echo "  ✅ Saques são AUTOMÁTICOS - aprovados automaticamente quando o webhook confirma"
echo "  ✅ Webhook atualiza status para 'aprovado' quando Nxgate confirma pagamento"
echo ""
echo "🎯 Próximos passos:"
echo "  1. Recarregue a página do dashboard (/admin)"
echo "  2. Verifique a aba de saques (/admin/saques)"
echo "  3. Os saques pendentes devem aparecer agora"
echo "  4. Quando o Nxgate confirmar um saque, ele será aprovado automaticamente"
echo ""
