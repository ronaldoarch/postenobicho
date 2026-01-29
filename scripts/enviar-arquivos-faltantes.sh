#!/bin/bash
# Script para enviar todos os arquivos faltantes
# Execute este script e digite a senha quando solicitado

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 📤 Enviando Arquivos Faltantes ==="
echo ""
echo "📝 Você precisará digitar a senha SSH: bicho@321"
echo ""

# 1. Enviar MetaPixel e MetaPixelWrapper
echo "1️⃣ Enviando MetaPixel e MetaPixelWrapper..."
rsync -avz \
  $LOCAL_DIR/components/MetaPixel.tsx \
  $LOCAL_DIR/components/MetaPixelWrapper.tsx \
  $SERVER:$SERVER_DIR/components/

# 2. Corrigir schema Prisma e fazer build
echo ""
echo "2️⃣ Corrigindo schema Prisma e fazendo build..."
ssh $SERVER << 'ENDSSH'
cd /var/www/postenobicho

# Corrigir schema se necessário
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
echo "=== ✅ Arquivos enviados e build concluído! ==="
