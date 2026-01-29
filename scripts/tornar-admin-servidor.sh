#!/bin/bash

# Script para tornar um usuário admin no servidor
# Uso: ./scripts/tornar-admin-servidor.sh email@exemplo.com

if [ -z "$1" ]; then
    echo "❌ Por favor, forneça o email do usuário"
    echo "   Uso: ./scripts/tornar-admin-servidor.sh email@exemplo.com"
    exit 1
fi

EMAIL="$1"
SERVER="root@104.218.52.159"
APP_DIR="/var/www/postenobicho"

echo "=== 🔧 Tornando usuário admin no servidor ==="
echo ""
echo "📝 Você precisará digitar a senha SSH: bicho@321"
echo ""

echo "1️⃣ Enviando script para o servidor..."
scp scripts/tornar-usuario-admin.ts $SERVER:$APP_DIR/scripts/tornar-usuario-admin.ts

echo ""
echo "2️⃣ Executando script no servidor..."
ssh $SERVER "cd $APP_DIR && npx tsx scripts/tornar-usuario-admin.ts $EMAIL"

echo ""
echo "=== ✅ Concluído! ==="
