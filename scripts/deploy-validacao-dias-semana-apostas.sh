#!/bin/bash
# Script para fazer deploy da validação de dias da semana na criação de apostas
# Execute: ./scripts/deploy-validacao-dias-semana-apostas.sh

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🚀 Deploy: Validação de Dias da Semana na Criação de Apostas ==="
echo ""
echo "📝 Você precisará digitar a senha SSH quando solicitado"
echo ""

# 1. Parar PM2
echo "1️⃣ Parando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 stop lotbicho || true"
sleep 2

# 2. Enviar arquivos atualizados
echo ""
echo "2️⃣ Enviando arquivos atualizados..."
rsync -avz \
  "$LOCAL_DIR/app/api/apostas/route.ts" \
  "$SERVER:$SERVER_DIR/app/api/apostas/"

rsync -avz \
  "$LOCAL_DIR/app/api/resultados/liquidar/route.ts" \
  "$SERVER:$SERVER_DIR/app/api/resultados/liquidar/"

# 3. Limpar build
echo ""
echo "3️⃣ Limpando build antigo..."
ssh $SERVER "cd $SERVER_DIR && rm -rf .next/app/api/apostas .next/app/api/resultados/liquidar 2>/dev/null || true"

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
echo "📋 O que foi implementado:"
echo "  ✅ Validação de dias da semana na criação de apostas"
echo "  ✅ Bloqueio de apostas em dias sem sorteio"
echo "  ✅ Validação se extração está ativa"
echo "  ✅ Mantido bloqueio na liquidação (consistência)"
echo ""
echo "🎯 Comportamento esperado:"
echo "   - Usuário não conseguirá apostar em PT RIO 18:20 na Quinta-feira"
echo "   - Mensagem de erro será exibida informando os dias disponíveis"
echo "   - Liquidação continuará bloqueando apostas em dias sem sorteio"
echo ""
