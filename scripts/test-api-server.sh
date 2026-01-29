#!/bin/bash
# Script para testar APIs diretamente no servidor
# Execute este script do seu Mac

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"

echo "=== 🧪 Testando APIs no servidor ==="
echo ""

# 1. Verificar se servidor está rodando
echo "1️⃣ Verificando se servidor está rodando..."
ssh $SERVER "cd $SERVER_DIR && pm2 list"

# 2. Verificar se porta 3000 está escutando
echo ""
echo "2️⃣ Verificando se porta 3000 está escutando..."
ssh $SERVER "netstat -tlnp 2>/dev/null | grep :3000 || ss -tlnp | grep :3000 || echo '⚠️  Não foi possível verificar porta'"

# 3. Testar API localmente no servidor
echo ""
echo "3️⃣ Testando API /api/configuracoes localmente no servidor..."
ssh $SERVER "curl -s -w '\nHTTP Status: %{http_code}\n' http://localhost:3000/api/configuracoes | head -30"

echo ""
echo "4️⃣ Testando API /api/tema localmente no servidor..."
ssh $SERVER "curl -s -w '\nHTTP Status: %{http_code}\n' http://localhost:3000/api/tema | head -30"

echo ""
echo "5️⃣ Verificando estrutura de rotas no build..."
ssh $SERVER "cd $SERVER_DIR && find .next/server/app/api -type f -name '*.js' 2>/dev/null | head -20 || echo '⚠️  Rotas não encontradas no build'"

echo ""
echo "6️⃣ Verificando logs recentes do PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 logs lotbicho --lines 10 --nostream"

echo ""
echo "✅ Teste concluído!"
