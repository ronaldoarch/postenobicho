#!/bin/bash
# Script rápido para corrigir problemas no servidor
# Execute: ./scripts/fix-servidor-rapido.sh

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🔧 Correção Rápida no Servidor ==="
echo ""

# 1. Enviar hook faltante
echo "1️⃣ Enviando hook useMetaTracking..."
rsync -avz $LOCAL_DIR/hooks/useMetaTracking.ts $SERVER:$SERVER_DIR/hooks/

# 2. Corrigir schema e fazer build
echo ""
echo "2️⃣ Corrigindo schema e fazendo build..."
ssh $SERVER << 'ENDSSH'
cd /var/www/postenobicho

# Corrigir schema Prisma
sed -i 's/provider = "sqlite"/provider = "mysql"/' prisma/schema.prisma

# Gerar Prisma Client
npx prisma generate

# Fazer build
npm run build
ENDSSH

# 3. Reiniciar PM2
echo ""
echo "3️⃣ Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart lotbicho"

echo ""
echo "=== ✅ Correção concluída! ==="
