#!/bin/bash
# Script para corrigir o build e fazer deploy final
# Execute: ./scripts/fix-build-final.sh

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🔧 Corrigindo Build Final ==="
echo ""
echo "📝 Você precisará digitar a senha SSH: bicho@321"
echo ""

# 1. Enviar página de integrações corrigida
echo "1️⃣ Enviando página de integrações corrigida..."
rsync -avz \
  $LOCAL_DIR/app/admin/integracoes/page.tsx \
  $SERVER:$SERVER_DIR/app/admin/integracoes/

# 2. Fazer build
echo ""
echo "2️⃣ Fazendo build da aplicação..."
ssh $SERVER "cd $SERVER_DIR && npm run build"

# 3. Reiniciar PM2
echo ""
echo "3️⃣ Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart lotbicho --update-env"

echo ""
echo "=== ✅ Build corrigido! ==="
echo ""
echo "🎉 Agora o build deve funcionar!"
