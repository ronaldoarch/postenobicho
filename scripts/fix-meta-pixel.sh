#!/bin/bash
# Script para enviar MetaPixel e dependências faltantes

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🔧 Enviando MetaPixel e dependências ==="
echo ""

# 1. Enviar MetaPixel
echo "1️⃣ Enviando MetaPixel..."
rsync -avz $LOCAL_DIR/components/MetaPixel.tsx $SERVER:$SERVER_DIR/components/

# 2. Enviar MetaPixelWrapper
echo ""
echo "2️⃣ Enviando MetaPixelWrapper..."
rsync -avz $LOCAL_DIR/components/MetaPixelWrapper.tsx $SERVER:$SERVER_DIR/components/

# 3. Fazer build novamente
echo ""
echo "3️⃣ Fazendo build..."
ssh $SERVER << 'ENDSSH'
cd /var/www/postenobicho
npm run build
ENDSSH

# 4. Reiniciar PM2
echo ""
echo "4️⃣ Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart lotbicho"

echo ""
echo "=== ✅ Concluído! ==="
