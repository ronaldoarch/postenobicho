#!/bin/bash
# Script para verificar status do servidor
# Execute este script do seu Mac

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"

echo "=== 🔍 Verificando status do servidor ==="
echo ""

# 1. Verificar se PM2 está rodando
echo "1️⃣ Verificando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 list"

# 2. Verificar se build existe
echo ""
echo "2️⃣ Verificando se build existe..."
ssh $SERVER "cd $SERVER_DIR && ls -la .next 2>/dev/null | head -5 || echo '❌ Build não encontrado'"

# 3. Verificar se node_modules existe
echo ""
echo "3️⃣ Verificando node_modules..."
ssh $SERVER "cd $SERVER_DIR && ls -d node_modules 2>/dev/null && echo '✅ node_modules existe' || echo '❌ node_modules não encontrado'"

# 4. Verificar logs do PM2
echo ""
echo "4️⃣ Últimas linhas dos logs do PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 logs lotbicho --lines 10 --nostream"

# 5. Verificar se porta 3000 está escutando
echo ""
echo "5️⃣ Verificando se porta 3000 está escutando..."
ssh $SERVER "netstat -tlnp | grep :3000 || echo '❌ Porta 3000 não está escutando'"

# 6. Testar uma rota de API
echo ""
echo "6️⃣ Testando rota de API..."
ssh $SERVER "curl -s http://localhost:3000/api/configuracoes | head -20 || echo '❌ Erro ao acessar API'"

echo ""
echo "✅ Verificação concluída!"
