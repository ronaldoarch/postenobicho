#!/bin/bash
# Script para enviar correção do tipo BetData
# Execute: ./scripts/fix-tipo-bet.sh

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🔧 Enviando correção do tipo BetData ==="
echo ""
echo "📝 Você precisará digitar a senha SSH: bicho@321"
echo ""

# 1. Enviar tipo corrigido, componente corrigido e páginas corrigidas
echo "1️⃣ Enviando arquivos corrigidos..."
rsync -avz $LOCAL_DIR/types/bet.ts $SERVER:$SERVER_DIR/types/
rsync -avz $LOCAL_DIR/components/BetConfirmation.tsx $SERVER:$SERVER_DIR/components/
rsync -avz $LOCAL_DIR/components/BetFlow.tsx $SERVER:$SERVER_DIR/components/
rsync -avz $LOCAL_DIR/app/apostar/page.tsx $SERVER:$SERVER_DIR/app/apostar/
rsync -avz $LOCAL_DIR/app/jogo-do-bicho/page.tsx $SERVER:$SERVER_DIR/app/jogo-do-bicho/
rsync -avz $LOCAL_DIR/app/api/resultados/liquidar/debug/route.ts $SERVER:$SERVER_DIR/app/api/resultados/liquidar/debug/

# 2. Fazer build
echo ""
echo "2️⃣ Fazendo build..."
ssh $SERVER << 'ENDSSH'
cd /var/www/postenobicho
npm run build
ENDSSH

# 3. Reiniciar PM2
echo ""
echo "3️⃣ Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart lotbicho"

echo ""
echo "=== ✅ Correção aplicada! ==="
