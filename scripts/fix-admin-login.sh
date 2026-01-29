#!/bin/bash
# Script para corrigir login do admin
# Reseta a senha usando o AUTH_SECRET do servidor

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🔐 Corrigindo login do admin ==="
echo ""

# 1. Enviar script de reset de senha
echo "1️⃣ Enviando script de reset de senha..."
scp "$LOCAL_DIR/scripts/reset-admin-password.ts" $SERVER:$SERVER_DIR/scripts/reset-admin-password.ts

# 2. Verificar AUTH_SECRET no servidor
echo ""
echo "2️⃣ Verificando AUTH_SECRET no servidor..."
AUTH_SECRET=$(ssh $SERVER "cd $SERVER_DIR && grep AUTH_SECRET .env | cut -d '=' -f2 | tr -d '\"' | tr -d \"'\" || echo 'dev-secret'")
echo "   AUTH_SECRET encontrado: ${AUTH_SECRET:0:10}..."

# 3. Resetar senha do admin
echo ""
echo "3️⃣ Resetando senha do admin..."
echo "   Usando senha padrão: admin123"
ssh $SERVER "cd $SERVER_DIR && AUTH_SECRET='$AUTH_SECRET' npx tsx scripts/reset-admin-password.ts admin123"

# 4. Verificar se usuário existe e tem senha
echo ""
echo "4️⃣ Verificando usuário no banco..."
ssh $SERVER "cd $SERVER_DIR && mysql -u root -p'KeitaroBANCO2026' admin_postenobicho -e \"SELECT id, nome, email, CASE WHEN passwordHash IS NOT NULL THEN 'SIM' ELSE 'NÃO' END as tem_senha FROM Usuario WHERE email = 'admin@postenobicho.com';\""

echo ""
echo "✅ Processo concluído!"
echo ""
echo "📝 Tente fazer login novamente:"
echo "   Email: admin@postenobicho.com"
echo "   Senha: admin123"
