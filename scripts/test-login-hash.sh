#!/bin/bash
# Script para testar se o hash da senha está correto

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"

echo "=== 🧪 Testando hash da senha ==="
echo ""

# 1. Obter AUTH_SECRET do servidor
echo "1️⃣ Obtendo AUTH_SECRET do servidor..."
AUTH_SECRET=$(ssh $SERVER "cd $SERVER_DIR && grep AUTH_SECRET .env 2>/dev/null | cut -d '=' -f2 | tr -d '\"' | tr -d \"'\" | tr -d ' ' || echo 'dev-secret'")

if [ -z "$AUTH_SECRET" ] || [ "$AUTH_SECRET" = "" ]; then
  AUTH_SECRET="dev-secret"
fi

echo "   AUTH_SECRET: ${AUTH_SECRET:0:30}..."

# 2. Obter hash do banco
echo ""
echo "2️⃣ Obtendo hash do banco..."
DB_HASH=$(ssh $SERVER "mysql -u root -p'KeitaroBANCO2026' admin_postenobicho -sN -e \"SELECT passwordHash FROM Usuario WHERE email = 'admin@postenobicho.com';\"")
echo "   Hash no banco: ${DB_HASH:0:30}..."

# 3. Gerar hash localmente com a senha admin123
echo ""
echo "3️⃣ Gerando hash localmente com senha 'admin123'..."
LOCAL_HASH=$(ssh $SERVER "node -e \"
const crypto = require('crypto');
const AUTH_SECRET = '$AUTH_SECRET';
const password = 'admin123';
const hash = crypto.createHash('sha256').update(password + ':' + AUTH_SECRET).digest('hex');
console.log(hash);
\"")

echo "   Hash gerado: ${LOCAL_HASH:0:30}..."

# 4. Comparar
echo ""
echo "4️⃣ Comparando hashes..."
if [ "$DB_HASH" = "$LOCAL_HASH" ]; then
  echo "   ✅ Os hashes são IGUAIS! A senha está correta."
else
  echo "   ❌ Os hashes são DIFERENTES!"
  echo "   Isso significa que:"
  echo "   - Ou o AUTH_SECRET usado pela aplicação é diferente"
  echo "   - Ou a senha no banco foi gerada com outro AUTH_SECRET"
fi

# 5. Verificar AUTH_SECRET usado pelo PM2
echo ""
echo "5️⃣ Verificando AUTH_SECRET no processo PM2..."
PM2_ENV=$(ssh $SERVER "cd $SERVER_DIR && pm2 env 0 2>/dev/null | grep AUTH_SECRET || echo 'Não encontrado'")
echo "   $PM2_ENV"

echo ""
echo "📝 Se os hashes forem diferentes, pode ser que:"
echo "   1. O PM2 precisa ser reiniciado para pegar o AUTH_SECRET correto"
echo "   2. O AUTH_SECRET no .env está diferente do esperado"
