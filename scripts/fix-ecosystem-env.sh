#!/bin/bash
# Script para atualizar ecosystem.config.js para carregar AUTH_SECRET

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🔧 Corrigindo ecosystem.config.js para carregar AUTH_SECRET ==="
echo ""

# 1. Obter AUTH_SECRET do servidor
echo "1️⃣ Obtendo AUTH_SECRET do servidor..."
AUTH_SECRET=$(ssh $SERVER "cd $SERVER_DIR && grep AUTH_SECRET .env 2>/dev/null | cut -d '=' -f2 | tr -d '\"' | tr -d \"'\" | tr -d ' ' || echo 'dev-secret'")

if [ -z "$AUTH_SECRET" ] || [ "$AUTH_SECRET" = "" ]; then
  AUTH_SECRET="dev-secret"
fi

echo "   AUTH_SECRET: ${AUTH_SECRET:0:30}..."

# 2. Criar novo ecosystem.config.js com AUTH_SECRET
echo ""
echo "2️⃣ Criando novo ecosystem.config.js..."
ssh $SERVER "cd $SERVER_DIR && cat > ecosystem.config.js << 'EOFPM2'
module.exports = {
  apps: [
    {
      name: 'lotbicho',
      script: 'npm',
      args: 'start',
      cwd: process.cwd(),
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        AUTH_SECRET: '$AUTH_SECRET',
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.next'],
    },
  ],
}
EOFPM2
"

# 3. Parar e reiniciar PM2
echo ""
echo "3️⃣ Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 delete all || true"
ssh $SERVER "cd $SERVER_DIR && pm2 start ecosystem.config.js"

# 4. Verificar se AUTH_SECRET está nas variáveis
echo ""
echo "4️⃣ Verificando variáveis de ambiente..."
sleep 3
ssh $SERVER "cd $SERVER_DIR && pm2 env 0 | grep AUTH_SECRET || echo 'AUTH_SECRET não encontrado'"

# 5. Testar login
echo ""
echo "5️⃣ Testando login..."
sleep 2
LOGIN_RESPONSE=$(ssh $SERVER "curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{\"email\":\"admin@postenobicho.com\",\"password\":\"admin123\"}'")

echo "   Resposta: $LOGIN_RESPONSE"

if echo "$LOGIN_RESPONSE" | grep -q "Login realizado com sucesso\|user"; then
  echo ""
  echo "   ✅ LOGIN FUNCIONOU!"
else
  echo ""
  echo "   ❌ Login ainda falhou!"
  echo ""
  echo "   Verificando logs do PM2..."
  ssh $SERVER "cd $SERVER_DIR && pm2 logs --lines 10 --nostream"
fi

echo ""
echo "✅ Processo concluído!"
