#!/bin/bash
# Script para verificar e corrigir usuário admin
# Execute: ./scripts/verificar-admin.sh

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🔍 Verificando Usuário Admin ==="
echo ""
echo "📝 Você precisará digitar a senha SSH: bicho@321"
echo ""

# 1. Enviar script de verificação
echo "1️⃣ Enviando script de verificação..."
rsync -avz $LOCAL_DIR/scripts/verificar-admin.ts $SERVER:$SERVER_DIR/scripts/

# 2. Executar verificação
echo ""
echo "2️⃣ Executando verificação..."
ssh $SERVER "cd $SERVER_DIR && npx tsx scripts/verificar-admin.ts"

echo ""
echo "=== ✅ Verificação concluída! ==="
