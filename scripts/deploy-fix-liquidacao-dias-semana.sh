#!/bin/bash
# Script para fazer deploy da correção de liquidação (remover validação de dias da semana)
# Execute: ./scripts/deploy-fix-liquidacao-dias-semana.sh

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🚀 Deploy: Correção Liquidação (Dias da Semana) ==="
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
  "$LOCAL_DIR/app/api/resultados/liquidar/route.ts" \
  "$SERVER:$SERVER_DIR/app/api/resultados/liquidar/"

# 3. Limpar build
echo ""
echo "3️⃣ Limpando build antigo..."
ssh $SERVER "cd $SERVER_DIR && rm -rf .next/app/api/resultados/liquidar 2>/dev/null || true"

# 4. Fazer build
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
echo "  ✅ Removida validação de dias da semana na liquidação"
echo "  ✅ Se o usuário conseguiu apostar, agora pode liquidar"
echo "  ✅ Apostas em dias sem sorteio agora serão processadas"
echo ""
echo "🎯 Teste agora:"
echo "   1. Execute a liquidação automática"
echo "   2. As apostas devem ser processadas mesmo em dias sem sorteio"
echo ""
