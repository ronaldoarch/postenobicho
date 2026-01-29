#!/bin/bash
# Script para corrigir senha do admin diretamente no banco
# Usa o AUTH_SECRET do servidor para gerar o hash correto

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🔐 Corrigindo senha do admin diretamente no banco ==="
echo ""

# 1. Obter AUTH_SECRET do servidor
echo "1️⃣ Obtendo AUTH_SECRET do servidor..."
AUTH_SECRET=$(ssh $SERVER "cd $SERVER_DIR && grep AUTH_SECRET .env 2>/dev/null | cut -d '=' -f2 | tr -d '\"' | tr -d \"'\" | tr -d ' ' || echo 'dev-secret'")

if [ -z "$AUTH_SECRET" ] || [ "$AUTH_SECRET" = "" ]; then
  AUTH_SECRET="dev-secret"
fi

echo "   AUTH_SECRET: ${AUTH_SECRET:0:20}..."

# 2. Enviar script de reset de senha
echo ""
echo "2️⃣ Enviando script de reset de senha..."
scp "$LOCAL_DIR/scripts/reset-admin-password.ts" $SERVER:$SERVER_DIR/scripts/reset-admin-password.ts

# 3. Resetar senha usando o script TypeScript com AUTH_SECRET correto
echo ""
echo "3️⃣ Resetando senha do admin usando AUTH_SECRET do servidor..."
ssh $SERVER "cd $SERVER_DIR && AUTH_SECRET='$AUTH_SECRET' npx tsx scripts/reset-admin-password.ts admin123"

# 4. Verificar se foi atualizado
echo ""
echo "4️⃣ Verificando usuário no banco..."
ssh $SERVER "mysql -u root -p'KeitaroBANCO2026' admin_postenobicho <<EOF
SELECT id, nome, email, 
       CASE WHEN passwordHash IS NOT NULL THEN 'SIM' ELSE 'NÃO' END as tem_senha,
       LEFT(passwordHash, 30) as hash_inicio
FROM Usuario 
WHERE email = 'admin@postenobicho.com';
EOF
"

# 5. Tornar usuário admin (se campo existir)
echo ""
echo "5️⃣ Tornando usuário admin..."
ssh $SERVER "mysql -u root -p'KeitaroBANCO2026' admin_postenobicho <<EOF
-- Tentar adicionar coluna admin se não existir (ignora erro se já existir)
SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE table_schema = 'admin_postenobicho' 
               AND table_name = 'Usuario' 
               AND column_name = 'admin') > 0,
              'SELECT 1',
              'ALTER TABLE Usuario ADD COLUMN admin BOOLEAN DEFAULT FALSE');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Tornar admin
UPDATE Usuario SET admin = TRUE WHERE email = 'admin@postenobicho.com';
EOF
" 2>&1 | grep -v "Duplicate column name" || true

echo ""
echo "✅ Senha resetada com sucesso!"
echo ""
echo "📝 Credenciais:"
echo "   Email: admin@postenobicho.com"
echo "   Senha: admin123"

echo ""
echo "🔄 Reinicie o PM2 para garantir que as mudanças sejam aplicadas:"
echo "   ssh $SERVER 'cd $SERVER_DIR && pm2 restart all'"
