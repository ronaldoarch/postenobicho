#!/bin/bash
# Script para garantir que o PM2 está usando as variáveis de ambiente do .env

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"

echo "=== 🔧 Corrigindo variáveis de ambiente do PM2 ==="
echo ""

# 1. Parar PM2
echo "1️⃣ Parando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 stop all || true"

# 2. Verificar .env
echo ""
echo "2️⃣ Verificando .env..."
ssh $SERVER "cd $SERVER_DIR && cat .env | grep AUTH_SECRET"

# 3. Atualizar ecosystem.config.js para carregar .env explicitamente
echo ""
echo "3️⃣ Atualizando ecosystem.config.js..."
ssh $SERVER "cd $SERVER_DIR && cat > ecosystem.config.js << 'EOFPM2'
module.exports = {
  apps: [{
    name: 'lotbicho',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '$SERVER_DIR',
    instances: 1,
    exec_mode: 'fork',
    env_file: '.env',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G',
  }]
}
EOFPM2
"

# 4. Recarregar PM2 com novo config
echo ""
echo "4️⃣ Recarregando PM2 com novo config..."
ssh $SERVER "cd $SERVER_DIR && pm2 delete all || true"
ssh $SERVER "cd $SERVER_DIR && pm2 start ecosystem.config.js"

# 5. Verificar variáveis de ambiente
echo ""
echo "5️⃣ Verificando variáveis de ambiente do PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 env 0 | grep AUTH_SECRET || echo 'AUTH_SECRET não encontrado'"

# 6. Aguardar aplicação iniciar
echo ""
echo "6️⃣ Aguardando aplicação iniciar..."
sleep 5

# 7. Testar login
echo ""
echo "7️⃣ Testando login..."
LOGIN_RESPONSE=$(ssh $SERVER "curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{\"email\":\"admin@postenobicho.com\",\"password\":\"admin123\"}'")

echo "   Resposta: $LOGIN_RESPONSE"

if echo "$LOGIN_RESPONSE" | grep -q "Login realizado com sucesso\|user"; then
  echo ""
  echo "   ✅ Login funcionou!"
else
  echo ""
  echo "   ❌ Login ainda falhou!"
  echo ""
  echo "   Vamos tentar outra abordagem: passar AUTH_SECRET diretamente no PM2..."
  
  # Tentar passar AUTH_SECRET diretamente
  AUTH_SECRET=$(ssh $SERVER "cd $SERVER_DIR && grep AUTH_SECRET .env | cut -d '=' -f2 | tr -d '\"' | tr -d \"'\" | tr -d ' '")
  
  ssh $SERVER "cd $SERVER_DIR && pm2 delete all || true"
  ssh $SERVER "cd $SERVER_DIR && AUTH_SECRET='$AUTH_SECRET' pm2 start ecosystem.config.js --update-env"
  
  sleep 5
  
  LOGIN_RESPONSE2=$(ssh $SERVER "curl -s -X POST http://localhost:3000/api/auth/login \
    -H 'Content-Type: application/json' \
    -d '{\"email\":\"admin@postenobicho.com\",\"password\":\"admin123\"}'")
  
  echo ""
  echo "   Resposta após passar AUTH_SECRET diretamente: $LOGIN_RESPONSE2"
fi

echo ""
echo "✅ Processo concluído!"
