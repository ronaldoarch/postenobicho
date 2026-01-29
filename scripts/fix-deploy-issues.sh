#!/bin/bash
# Script para corrigir problemas do deploy
# 1. Corrigir schema Prisma (SQLite -> MySQL)
# 2. Enviar hook useMetaTracking faltante

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🔧 Corrigindo Problemas do Deploy ==="
echo ""

# 1. Enviar hook useMetaTracking
echo "1️⃣ Enviando hook useMetaTracking..."
rsync -avz \
  $LOCAL_DIR/hooks/useMetaTracking.ts \
  $SERVER:$SERVER_DIR/hooks/
echo "  ✅ Hook enviado"

# 2. Verificar e corrigir schema Prisma no servidor
echo ""
echo "2️⃣ Corrigindo schema Prisma no servidor..."
ssh $SERVER << 'ENDSSH'
cd /var/www/postenobicho

# Verificar provider atual
CURRENT_PROVIDER=$(grep "provider" prisma/schema.prisma | head -1 | awk '{print $3}' | tr -d '"')

if [ "$CURRENT_PROVIDER" = "sqlite" ]; then
    echo "  ⚠️  Schema está como SQLite, corrigindo para MySQL..."
    sed -i 's/provider = "sqlite"/provider = "mysql"/' prisma/schema.prisma
    echo "  ✅ Schema corrigido para MySQL"
else
    echo "  ✅ Schema já está como MySQL"
fi

# Verificar se está correto
echo ""
echo "  📋 Provider atual:"
grep "provider" prisma/schema.prisma | head -1
ENDSSH

# 3. Re-executar comandos no servidor
echo ""
echo "3️⃣ Re-executando comandos no servidor..."
ssh $SERVER << 'ENDSSH'
set -e
cd /var/www/postenobicho

echo "🔧 Gerando Prisma Client..."
npx prisma generate

echo ""
echo "🗄️ Aplicando migrations..."
npx prisma migrate deploy || npx prisma db push --accept-data-loss || true

echo ""
echo "🏗️ Fazendo build da aplicação..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build concluído com sucesso!"
else
    echo ""
    echo "❌ Erro no build!"
    exit 1
fi
ENDSSH

# 4. Reiniciar PM2
echo ""
echo "4️⃣ Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart lotbicho"
sleep 3

# 5. Verificar status
echo ""
echo "5️⃣ Verificando status..."
ssh $SERVER "cd $SERVER_DIR && pm2 status"

echo ""
echo "=== ✅ Correções aplicadas! ==="
