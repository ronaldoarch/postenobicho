#!/bin/bash
# Script para sincronizar todas as páginas do admin com o servidor

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 📤 Sincronizando páginas do admin ==="
echo ""

# 1. Sincronizar todas as páginas do admin
echo "1️⃣ Sincronizando todas as páginas do admin..."
rsync -avz --progress \
  --exclude='._*' \
  --exclude='.DS_Store' \
  "$LOCAL_DIR/app/admin/" \
  $SERVER:$SERVER_DIR/app/admin/

echo ""
echo "✅ Páginas do admin sincronizadas!"

# 2. Verificar quais páginas foram enviadas
echo ""
echo "2️⃣ Verificando páginas no servidor..."
ssh $SERVER "find $SERVER_DIR/app/admin -name 'page.tsx' -type f | sort"

echo ""
echo "📝 Páginas sincronizadas com sucesso!"
