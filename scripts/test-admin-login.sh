#!/bin/bash
# Script para testar o login do admin diretamente no servidor

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"

echo "=== 🧪 Testando login do admin ==="
echo ""

# Testar login via curl
echo "1️⃣ Testando login via API..."
RESPONSE=$(ssh $SERVER "cd $SERVER_DIR && curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{\"email\":\"admin@postenobicho.com\",\"password\":\"admin123\"}' \
  -c /tmp/cookies.txt")

echo "Resposta:"
echo "$RESPONSE" | head -20

# Verificar se retornou erro ou sucesso
if echo "$RESPONSE" | grep -q "Credenciais inválidas\|error\|401"; then
  echo ""
  echo "❌ Login falhou!"
  echo ""
  echo "Vamos verificar o hash da senha no banco..."
  
  # Buscar hash no banco
  echo ""
  echo "2️⃣ Hash da senha no banco:"
  ssh $SERVER "cd $SERVER_DIR && mysql -u root -p'KeitaroBANCO2026' admin_postenobicho -e \"SELECT email, LEFT(passwordHash, 30) as hash_inicio FROM Usuario WHERE email = 'admin@postenobicho.com';\""
  
  # Gerar hash localmente para comparar
  echo ""
  echo "3️⃣ Gerando hash localmente para comparar..."
  ssh $SERVER "cd $SERVER_DIR && node -e \"
    const crypto = require('crypto');
    const AUTH_SECRET = process.env.AUTH_SECRET || 'dev-secret';
    const password = 'admin123';
    const hash = crypto.createHash('sha256').update(\`\${password}:\${AUTH_SECRET}\`).digest('hex');
    console.log('Hash gerado:', hash.substring(0, 30) + '...');
    console.log('AUTH_SECRET usado:', AUTH_SECRET);
  \""
else
  echo ""
  echo "✅ Login bem-sucedido!"
fi
