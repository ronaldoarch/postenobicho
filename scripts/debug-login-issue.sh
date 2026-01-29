#!/bin/bash
# Script para diagnosticar e corrigir problema de login

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"

echo "=== 🔍 Diagnosticando problema de login ==="
echo ""

# 1. Verificar AUTH_SECRET no .env
echo "1️⃣ Verificando AUTH_SECRET no .env..."
AUTH_SECRET_ENV=$(ssh $SERVER "cd $SERVER_DIR && grep AUTH_SECRET .env 2>/dev/null | cut -d '=' -f2 | tr -d '\"' | tr -d \"'\" | tr -d ' ' || echo 'dev-secret'")
echo "   AUTH_SECRET no .env: ${AUTH_SECRET_ENV:0:30}..."

# 2. Verificar hash no banco
echo ""
echo "2️⃣ Verificando hash no banco..."
DB_HASH=$(ssh $SERVER "mysql -u root -p'KeitaroBANCO2026' admin_postenobicho -sN -e \"SELECT passwordHash FROM Usuario WHERE email = 'admin@postenobicho.com';\"")
echo "   Hash no banco: ${DB_HASH:0:40}..."

# 3. Gerar hash esperado com AUTH_SECRET do .env
echo ""
echo "3️⃣ Gerando hash esperado com senha 'admin123'..."
EXPECTED_HASH=$(ssh $SERVER "node -e \"
const crypto = require('crypto');
const AUTH_SECRET = '$AUTH_SECRET_ENV';
const password = 'admin123';
const hash = crypto.createHash('sha256').update(password + ':' + AUTH_SECRET).digest('hex');
console.log(hash);
\"")

echo "   Hash esperado: ${EXPECTED_HASH:0:40}..."

# 4. Comparar
echo ""
echo "4️⃣ Comparando hashes..."
if [ "$DB_HASH" = "$EXPECTED_HASH" ]; then
  echo "   ✅ Os hashes são IGUAIS!"
  echo "   O problema pode ser que o PM2 precisa ser reiniciado."
else
  echo "   ❌ Os hashes são DIFERENTES!"
  echo "   Vamos atualizar o hash no banco..."
  
  # Atualizar hash no banco
  ssh $SERVER "mysql -u root -p'KeitaroBANCO2026' admin_postenobicho <<EOF
UPDATE Usuario 
SET passwordHash = '$EXPECTED_HASH' 
WHERE email = 'admin@postenobicho.com';
EOF
"
  
  echo "   ✅ Hash atualizado no banco!"
fi

# 5. Reiniciar PM2 com --update-env para garantir que pegue o .env correto
echo ""
echo "5️⃣ Reiniciando PM2 com --update-env..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart all --update-env"

# 6. Aguardar alguns segundos
echo ""
echo "6️⃣ Aguardando aplicação iniciar..."
sleep 3

# 7. Testar login via API
echo ""
echo "7️⃣ Testando login via API..."
LOGIN_RESPONSE=$(ssh $SERVER "curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{\"email\":\"admin@postenobicho.com\",\"password\":\"admin123\"}'")

echo "   Resposta:"
echo "$LOGIN_RESPONSE" | head -5

if echo "$LOGIN_RESPONSE" | grep -q "Login realizado com sucesso\|user"; then
  echo ""
  echo "   ✅ Login funcionou!"
else
  echo ""
  echo "   ❌ Login ainda falhou!"
  echo "   Verifique os logs do PM2:"
  echo "   ssh $SERVER 'cd $SERVER_DIR && pm2 logs --lines 20'"
fi

echo ""
echo "✅ Diagnóstico concluído!"
