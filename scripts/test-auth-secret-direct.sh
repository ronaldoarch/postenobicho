#!/bin/bash
# Script para testar diretamente o AUTH_SECRET usado pela aplicação

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"

echo "=== 🧪 Testando AUTH_SECRET usado pela aplicação ==="
echo ""

# 1. Criar script de teste que simula o código de login
echo "1️⃣ Criando script de teste..."
ssh $SERVER "cat > /tmp/test-auth.js << 'EOFTEST'
const crypto = require('crypto');

// Simular como o código lê o AUTH_SECRET
const AUTH_SECRET = process.env.AUTH_SECRET || 'dev-secret';

console.log('AUTH_SECRET usado:', AUTH_SECRET);
console.log('AUTH_SECRET length:', AUTH_SECRET.length);

// Hash da senha admin123
const password = 'admin123';
const hash = crypto.createHash('sha256').update(\`\${password}:\${AUTH_SECRET}\`).digest('hex');
console.log('Hash gerado:', hash);

// Hash no banco
const dbHash = 'cbfed7170fe94aa0083b0f6e6faa43381beaef18d65fe633c8c8c8c8c8c8c8c8';
console.log('Hash no banco (início):', dbHash.substring(0, 40));

if (hash === dbHash) {
  console.log('✅ MATCH!');
} else {
  console.log('❌ NO MATCH!');
  console.log('Hash gerado (início):', hash.substring(0, 40));
}
EOFTEST
"

# 2. Testar com AUTH_SECRET do .env
echo ""
echo "2️⃣ Testando com AUTH_SECRET do .env..."
AUTH_SECRET=$(ssh $SERVER "cd $SERVER_DIR && grep AUTH_SECRET .env 2>/dev/null | cut -d '=' -f2 | tr -d '\"' | tr -d \"'\" | tr -d ' ' || echo 'dev-secret'")
ssh $SERVER "AUTH_SECRET='$AUTH_SECRET' node /tmp/test-auth.js"

# 3. Verificar variáveis de ambiente do PM2
echo ""
echo "3️⃣ Verificando variáveis de ambiente do PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 env 0 | grep AUTH_SECRET || echo 'AUTH_SECRET não encontrado nas variáveis do PM2'"

# 4. Verificar se o código está usando process.env corretamente
echo ""
echo "4️⃣ Verificando código de auth.ts no servidor..."
ssh $SERVER "grep -A 3 'AUTH_SECRET' $SERVER_DIR/lib/auth.ts || echo 'Arquivo não encontrado'"

# 5. Limpar
ssh $SERVER "rm -f /tmp/test-auth.js" 2>/dev/null || true

echo ""
echo "✅ Teste concluído!"
