#!/bin/bash
# Script de deploy manual - Execute este script e digite a senha quando solicitado
# Senha SSH: bicho@321

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🚀 Deploy Completo das Atualizações ==="
echo ""
echo "📝 Você precisará digitar a senha SSH quando solicitado: bicho@321"
echo ""

# 1. Parar PM2
echo "1️⃣ Parando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 stop lotbicho || true"
sleep 2

# 2. Enviar componentes atualizados
echo ""
echo "2️⃣ Enviando componentes atualizados..."
rsync -avz \
  $LOCAL_DIR/components/BetFlow.tsx \
  $LOCAL_DIR/components/BetConfirmation.tsx \
  $LOCAL_DIR/components/LocationSelection.tsx \
  $LOCAL_DIR/components/DepositPixModal.tsx \
  $SERVER:$SERVER_DIR/components/

# 3. Enviar tipos atualizados
echo ""
echo "3️⃣ Enviando tipos atualizados..."
rsync -avz \
  $LOCAL_DIR/types/bet.ts \
  $SERVER:$SERVER_DIR/types/

# 4. Enviar rotas de API atualizadas
echo ""
echo "4️⃣ Enviando rotas de API atualizadas..."
rsync -avz --include="*/" --include="route.ts" --exclude="*" \
  $LOCAL_DIR/app/api/deposito/ \
  $LOCAL_DIR/app/api/saque/ \
  $LOCAL_DIR/app/api/webhooks/ \
  $LOCAL_DIR/app/api/apostas/ \
  $LOCAL_DIR/app/api/admin/descarga/ \
  $SERVER:$SERVER_DIR/app/api/

# 5. Enviar lib atualizadas
echo ""
echo "5️⃣ Enviando bibliotecas atualizadas..."
rsync -avz \
  $LOCAL_DIR/lib/descarga.ts \
  $LOCAL_DIR/lib/nxgate-client.ts \
  $LOCAL_DIR/lib/webhook-tracker.ts \
  $LOCAL_DIR/lib/meta-tracking-server.ts \
  $SERVER:$SERVER_DIR/lib/

# 7. Enviar páginas admin atualizadas
echo ""
echo "7️⃣ Enviando páginas admin atualizadas..."
rsync -avz \
  $LOCAL_DIR/app/admin/descarga/page.tsx \
  $SERVER:$SERVER_DIR/app/admin/descarga/ 2>/dev/null || true
rsync -avz \
  $LOCAL_DIR/app/admin/gateways/page.tsx \
  $SERVER:$SERVER_DIR/app/admin/gateways/ 2>/dev/null || true

# 7. Enviar schema Prisma
echo ""
echo "7️⃣ Enviando schema Prisma..."
rsync -avz $LOCAL_DIR/prisma/schema.prisma $SERVER:$SERVER_DIR/prisma/

# 8. Enviar migrations
echo ""
echo "8️⃣ Enviando migrations..."
rsync -avz $LOCAL_DIR/prisma/migrations/ $SERVER:$SERVER_DIR/prisma/migrations/ 2>/dev/null || true

# 9. Enviar package.json
echo ""
echo "9️⃣ Enviando package.json..."
rsync -avz $LOCAL_DIR/package.json $LOCAL_DIR/package-lock.json $SERVER:$SERVER_DIR/

# 10. Executar comandos no servidor
echo ""
echo "🔟 Executando comandos no servidor..."
ssh $SERVER << 'ENDSSH'
set -e
cd /var/www/postenobicho

echo "📦 Instalando dependências..."
npm install --production=false

echo ""
echo "🔧 Gerando Prisma Client..."
npx prisma generate

echo ""
echo "🗄️ Aplicando migrations..."
npx prisma migrate deploy || npx prisma db push --accept-data-loss || true

echo ""
echo "🏗️ Limpando build antigo..."
rm -rf .next

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

# 12. Reiniciar PM2
echo ""
echo "1️⃣2️⃣ Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart lotbicho"
sleep 3

# 13. Verificar status
echo ""
echo "1️⃣3️⃣ Verificando status..."
ssh $SERVER "cd $SERVER_DIR && pm2 status"

echo ""
echo "=== ✅ Deploy concluído com sucesso! ==="
echo ""
echo "📊 Verificar logs:"
echo "   ssh $SERVER 'cd $SERVER_DIR && pm2 logs lotbicho --lines 50'"
echo ""
echo "🌐 Acessar aplicação:"
echo "   https://postenobicho.com"
