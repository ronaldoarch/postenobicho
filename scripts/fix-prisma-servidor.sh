#!/bin/bash
# Script para corrigir Prisma no servidor (campos faltando)
# Execute: ./scripts/fix-prisma-servidor.sh

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🔧 Corrigindo Prisma no Servidor ==="
echo ""
echo "📝 Você precisará digitar a senha SSH quando solicitado"
echo ""

# 1. Parar PM2
echo "1️⃣ Parando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 stop lotbicho || true"
sleep 2

# 2. Enviar schema Prisma atualizado
echo ""
echo "2️⃣ Enviando schema Prisma atualizado..."
rsync -avz \
  "$LOCAL_DIR/prisma/schema.prisma" \
  "$SERVER:$SERVER_DIR/prisma/"

# 3. Verificar se campos estão no schema
echo ""
echo "3️⃣ Verificando campos no schema..."
ssh $SERVER "cd $SERVER_DIR && grep -A 10 'model PagamentoPix' prisma/schema.prisma | head -15"

# 4. Garantir que o provider está correto (MySQL)
echo ""
echo "4️⃣ Verificando provider do banco..."
ssh $SERVER "cd $SERVER_DIR && sed -i 's/provider = \"sqlite\"/provider = \"mysql\"/g' prisma/schema.prisma && grep 'provider =' prisma/schema.prisma"

# 5. Regenerar Prisma Client
echo ""
echo "5️⃣ Regenerando Prisma Client..."
ssh $SERVER "cd $SERVER_DIR && npx prisma generate"

# 6. Limpar build
echo ""
echo "6️⃣ Limpando build antigo..."
ssh $SERVER "cd $SERVER_DIR && rm -rf .next .next/cache 2>/dev/null || true"

# 7. Fazer build
echo ""
echo "7️⃣ Fazendo build..."
ssh $SERVER "cd $SERVER_DIR && npm run build 2>&1 | tail -50"

# 8. Reiniciar PM2
echo ""
echo "8️⃣ Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart lotbicho --update-env"
sleep 5

# 9. Verificar logs
echo ""
echo "9️⃣ Verificando logs..."
ssh $SERVER "cd $SERVER_DIR && pm2 logs lotbicho --lines 20 --nostream"

echo ""
echo "=== ✅ Processo Concluído! ==="
echo ""
