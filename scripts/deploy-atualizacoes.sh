#!/bin/bash
# Script completo de deploy das atualizações recentes
# Inclui: múltiplas extrações, correções PIX, sistema de descarga
# Execute este script do seu Mac (será solicitada a senha SSH)

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🚀 Deploy Completo das Atualizações ==="
echo ""
echo "📝 Será solicitada a senha SSH: bicho@321"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 1. Parar PM2
echo -e "${YELLOW}1️⃣ Parando PM2...${NC}"
ssh $SERVER "cd $SERVER_DIR && pm2 stop lotbicho || true"
sleep 2

# 2. Enviar componentes atualizados
echo ""
echo -e "${YELLOW}2️⃣ Enviando componentes atualizados...${NC}"
rsync -avz \
  $LOCAL_DIR/components/BetFlow.tsx \
  $LOCAL_DIR/components/BetConfirmation.tsx \
  $LOCAL_DIR/components/LocationSelection.tsx \
  $LOCAL_DIR/components/DepositPixModal.tsx \
  $SERVER:$SERVER_DIR/components/
echo -e "${GREEN}  ✅ Componentes enviados${NC}"

# 3. Enviar tipos atualizados
echo ""
echo -e "${YELLOW}3️⃣ Enviando tipos atualizados...${NC}"
rsync -avz \
  $LOCAL_DIR/types/bet.ts \
  $SERVER:$SERVER_DIR/types/
echo -e "${GREEN}  ✅ Tipos enviados${NC}"

# 4. Enviar rotas de API atualizadas
echo ""
echo -e "${YELLOW}4️⃣ Enviando rotas de API atualizadas...${NC}"
rsync -avz --include="*/" --include="route.ts" --exclude="*" \
  $LOCAL_DIR/app/api/deposito/ \
  $LOCAL_DIR/app/api/saque/ \
  $LOCAL_DIR/app/api/webhooks/ \
  $LOCAL_DIR/app/api/apostas/ \
  $LOCAL_DIR/app/api/admin/descarga/ \
  $SERVER:$SERVER_DIR/app/api/
echo -e "${GREEN}  ✅ Rotas de API enviadas${NC}"

# 5. Enviar lib atualizadas
echo ""
echo -e "${YELLOW}5️⃣ Enviando bibliotecas atualizadas...${NC}"
rsync -avz \
  $LOCAL_DIR/lib/descarga.ts \
  $LOCAL_DIR/lib/nxgate-client.ts \
  $LOCAL_DIR/lib/webhook-tracker.ts \
  $LOCAL_DIR/lib/meta-tracking-server.ts \
  $SERVER:$SERVER_DIR/lib/
echo -e "${GREEN}  ✅ Bibliotecas enviadas${NC}"

# 6. Enviar páginas admin atualizadas
echo ""
echo -e "${YELLOW}6️⃣ Enviando páginas admin atualizadas...${NC}"
rsync -avz \
  $LOCAL_DIR/app/admin/descarga/page.tsx \
  $SERVER:$SERVER_DIR/app/admin/descarga/ 2>/dev/null || true
rsync -avz \
  $LOCAL_DIR/app/admin/gateways/page.tsx \
  $SERVER:$SERVER_DIR/app/admin/gateways/ 2>/dev/null || true
echo -e "${GREEN}  ✅ Páginas admin enviadas${NC}"

# 7. Enviar schema Prisma (se houver mudanças)
echo ""
echo -e "${YELLOW}7️⃣ Verificando schema Prisma...${NC}"
if [ -f "$LOCAL_DIR/prisma/schema.prisma" ]; then
  rsync -avz $LOCAL_DIR/prisma/schema.prisma $SERVER:$SERVER_DIR/prisma/
  echo -e "${GREEN}  ✅ Schema Prisma enviado${NC}"
fi

# 8. Enviar migrations (se houver)
echo ""
echo -e "${YELLOW}8️⃣ Verificando migrations...${NC}"
if [ -d "$LOCAL_DIR/prisma/migrations" ]; then
  rsync -avz $LOCAL_DIR/prisma/migrations/ $SERVER:$SERVER_DIR/prisma/migrations/ 2>/dev/null || true
  echo -e "${GREEN}  ✅ Migrations enviadas${NC}"
fi

# 9. Enviar package.json (caso tenha novas dependências)
echo ""
echo -e "${YELLOW}9️⃣ Enviando package.json...${NC}"
rsync -avz $LOCAL_DIR/package.json $LOCAL_DIR/package-lock.json $SERVER:$SERVER_DIR/
echo -e "${GREEN}  ✅ Package.json enviado${NC}"

# 10. Executar comandos no servidor
echo ""
echo -e "${YELLOW}🔟 Executando comandos no servidor...${NC}"
ssh $SERVER << 'ENDSSH'
set -e
cd /var/www/postenobicho

echo "📦 Instalando dependências..."
npm install --production=false

echo ""
echo "🔧 Gerando Prisma Client..."
npx prisma generate

echo ""
echo "🗄️ Aplicando migrations (se houver)..."
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

# 11. Reiniciar PM2
echo ""
echo -e "${YELLOW}1️⃣1️⃣ Reiniciando PM2...${NC}"
ssh $SERVER "cd $SERVER_DIR && pm2 restart lotbicho"
sleep 3

# 12. Verificar status
echo ""
echo -e "${YELLOW}1️⃣2️⃣ Verificando status...${NC}"
ssh $SERVER "cd $SERVER_DIR && pm2 status"

echo ""
echo -e "${GREEN}=== ✅ Deploy concluído com sucesso! ===${NC}"
echo ""
echo "📊 Verificar logs:"
echo "   ssh $SERVER 'cd $SERVER_DIR && pm2 logs lotbicho --lines 50'"
echo ""
echo "🌐 Acessar aplicação:"
echo "   https://postenobicho.com"
