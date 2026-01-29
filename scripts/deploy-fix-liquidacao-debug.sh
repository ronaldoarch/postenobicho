#!/bin/bash
# Script para fazer deploy da correção de debug da liquidação
# Execute: ./scripts/deploy-fix-liquidacao-debug.sh

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🚀 Deploy: Correção Debug Liquidação ==="
echo ""
echo "📝 Você precisará digitar a senha SSH quando solicitado"
echo ""

# 1. Parar PM2
echo "1️⃣ Parando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 stop lotbicho || true"
sleep 2

# 2. Enviar arquivo atualizado
echo ""
echo "2️⃣ Enviando arquivo atualizado..."
rsync -avz \
  "$LOCAL_DIR/app/admin/liquidacao/page.tsx" \
  "$SERVER:$SERVER_DIR/app/admin/liquidacao/"

# 3. Limpar build
echo ""
echo "3️⃣ Limpando build antigo..."
ssh $SERVER "cd $SERVER_DIR && rm -rf .next/app/admin/liquidacao 2>/dev/null || true"

# 4. Fazer build apenas da página
echo ""
echo "4️⃣ Fazendo build..."
ssh $SERVER "cd $SERVER_DIR && npm run build 2>&1 | tail -30"

# 5. Reiniciar PM2
echo ""
echo "5️⃣ Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart lotbicho --update-env"
sleep 3

# 6. Verificar logs
echo ""
echo "6️⃣ Verificando logs..."
ssh $SERVER "cd $SERVER_DIR && pm2 logs lotbicho --lines 10 --nostream"

echo ""
echo "=== ✅ Deploy Concluído! ==="
echo ""
echo "📋 O que foi corrigido:"
echo "  ✅ Mensagens de debug melhoradas na página de liquidação"
echo "  ✅ Informações mais detalhadas sobre por que não há apostas processadas"
echo ""
echo "🎯 Teste agora:"
echo "   1. Acesse /admin/liquidacao"
echo "   2. Execute a liquidação automática"
echo "   3. Veja as informações detalhadas de debug"
echo ""
