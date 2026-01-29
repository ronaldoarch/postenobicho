#!/bin/bash
# Script para tornar o usuário admin@postenobicho.com em admin
# Execute este script do seu Mac

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 👤 Tornando usuário admin@postenobicho.com em admin ==="
echo ""

# Enviar script SQL para o servidor
echo "1️⃣ Enviando script SQL..."
scp "$LOCAL_DIR/scripts/make-user-admin.sql" $SERVER:$SERVER_DIR/scripts/make-user-admin.sql

# Executar script SQL no servidor (ignora erro se coluna já existir)
echo ""
echo "2️⃣ Executando script SQL no MySQL..."
ssh $SERVER "mysql -u root -p'KeitaroBANCO2026' admin_postenobicho < $SERVER_DIR/scripts/make-user-admin.sql 2>&1 | grep -v 'Duplicate column name' || true"

echo ""
echo "✅ Usuário admin@postenobicho.com agora é admin!"
