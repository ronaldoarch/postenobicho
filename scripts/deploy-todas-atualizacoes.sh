#!/bin/bash
# Script completo para fazer deploy de TODAS as atualizações
# Execute: ./scripts/deploy-todas-atualizacoes.sh

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🚀 Deploy Completo - Todas as Atualizações ==="
echo ""
echo "📝 Você precisará digitar a senha SSH quando solicitado"
echo ""

# 1. Parar PM2
echo "1️⃣ Parando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 stop lotbicho || true"
sleep 2

# 2. Enviar TODOS os arquivos atualizados
echo ""
echo "2️⃣ Enviando TODOS os arquivos atualizados..."

# Componentes
echo "   📦 Enviando componentes..."
rsync -avz \
  "$LOCAL_DIR/components/BottomNav.tsx" \
  "$LOCAL_DIR/components/Footer.tsx" \
  "$SERVER:$SERVER_DIR/components/"

# Páginas de login/cadastro
echo "   📄 Enviando páginas de login/cadastro..."
rsync -avz \
  "$LOCAL_DIR/app/login/page.tsx" \
  "$SERVER:$SERVER_DIR/app/login/"

rsync -avz \
  "$LOCAL_DIR/app/cadastro/page.tsx" \
  "$SERVER:$SERVER_DIR/app/cadastro/"

# Páginas admin
echo "   🔐 Enviando páginas admin..."
rsync -avz \
  "$LOCAL_DIR/app/admin/login/page.tsx" \
  "$SERVER:$SERVER_DIR/app/admin/login/"

rsync -avz \
  "$LOCAL_DIR/app/admin/descarga/page.tsx" \
  "$SERVER:$SERVER_DIR/app/admin/descarga/"

rsync -avz \
  "$LOCAL_DIR/app/admin/liquidacao/page.tsx" \
  "$SERVER:$SERVER_DIR/app/admin/liquidacao/"

rsync -avz \
  "$LOCAL_DIR/app/admin/pagamentos-pix/page.tsx" \
  "$SERVER:$SERVER_DIR/app/admin/pagamentos-pix/"

# Libs
echo "   📚 Enviando bibliotecas..."
rsync -avz \
  "$LOCAL_DIR/lib/descarga.ts" \
  "$SERVER:$SERVER_DIR/lib/"

# APIs
echo "   🔌 Enviando APIs..."
rsync -avz \
  "$LOCAL_DIR/app/api/resultados/liquidar/route.ts" \
  "$SERVER:$SERVER_DIR/app/api/resultados/liquidar/"

rsync -avz \
  "$LOCAL_DIR/app/api/admin/pagamentos-pix/route.ts" \
  "$SERVER:$SERVER_DIR/app/api/admin/pagamentos-pix/"

rsync -avz \
  "$LOCAL_DIR/app/api/webhooks/nxgate/route.ts" \
  "$SERVER:$SERVER_DIR/app/api/webhooks/nxgate/"

rsync -avz \
  "$LOCAL_DIR/app/api/admin/dashboard/route.ts" \
  "$SERVER:$SERVER_DIR/app/api/admin/dashboard/"

# Schema Prisma
echo "   🗄️  Enviando schema Prisma..."
rsync -avz \
  "$LOCAL_DIR/prisma/schema.prisma" \
  "$SERVER:$SERVER_DIR/prisma/"

# 3. Verificar arquivos enviados
echo ""
echo "3️⃣ Verificando arquivos enviados..."
ssh $SERVER "cd $SERVER_DIR && ls -la components/BottomNav.tsx components/Footer.tsx 2>/dev/null && echo '✅ Componentes OK' || echo '❌ Componentes faltando'"
ssh $SERVER "cd $SERVER_DIR && ls -la app/login/page.tsx app/cadastro/page.tsx 2>/dev/null && echo '✅ Páginas OK' || echo '❌ Páginas faltando'"
ssh $SERVER "cd $SERVER_DIR && ls -la lib/descarga.ts 2>/dev/null && echo '✅ Lib OK' || echo '❌ Lib faltando'"

# 4. Corrigir provider do Prisma se necessário
echo ""
echo "4️⃣ Corrigindo provider do Prisma..."
ssh $SERVER "cd $SERVER_DIR && sed -i 's/provider = \"sqlite\"/provider = \"mysql\"/g' prisma/schema.prisma && echo '✅ Provider corrigido' || echo '⚠️  Provider já estava correto'"

# 5. Regenerar Prisma Client
echo ""
echo "5️⃣ Regenerando Prisma Client..."
ssh $SERVER "cd $SERVER_DIR && npx prisma generate"

# 6. Instalar dependências se necessário
echo ""
echo "6️⃣ Verificando dependências..."
ssh $SERVER "cd $SERVER_DIR && npm install"

# 7. Limpar build antigo
echo ""
echo "7️⃣ Limpando build antigo..."
ssh $SERVER "cd $SERVER_DIR && rm -rf .next .next/cache 2>/dev/null || true"

# 8. Fazer build completo
echo ""
echo "8️⃣ Fazendo build completo (isso pode demorar alguns minutos)..."
echo "   Aguarde..."
ssh $SERVER "cd $SERVER_DIR && npm run build 2>&1 | tail -100"

# 9. Verificar se build foi criado
echo ""
echo "9️⃣ Verificando se build foi criado..."
if ssh $SERVER "cd $SERVER_DIR && test -d .next"; then
    echo "✅ Build criado com sucesso!"
else
    echo "❌ Erro: Build não foi criado"
    echo "Verificando logs do build..."
    ssh $SERVER "cd $SERVER_DIR && npm run build 2>&1 | tail -50"
    exit 1
fi

# 10. Reiniciar PM2
echo ""
echo "🔟 Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart lotbicho --update-env"
sleep 5

# 11. Verificar status do PM2
echo ""
echo "1️⃣1️⃣ Verificando status do PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 status"

# 12. Verificar logs
echo ""
echo "1️⃣2️⃣ Verificando logs..."
ssh $SERVER "cd $SERVER_DIR && pm2 logs lotbicho --lines 30 --nostream"

echo ""
echo "=== ✅ Deploy Concluído! ==="
echo ""
echo "📋 Arquivos atualizados:"
echo "  ✅ components/BottomNav.tsx"
echo "  ✅ components/Footer.tsx"
echo "  ✅ app/login/page.tsx"
echo "  ✅ app/cadastro/page.tsx"
echo "  ✅ app/admin/login/page.tsx"
echo "  ✅ app/admin/descarga/page.tsx"
echo "  ✅ app/admin/liquidacao/page.tsx"
echo "  ✅ app/admin/pagamentos-pix/page.tsx"
echo "  ✅ lib/descarga.ts"
echo "  ✅ app/api/resultados/liquidar/route.ts"
echo "  ✅ app/api/admin/pagamentos-pix/route.ts"
echo "  ✅ app/api/webhooks/nxgate/route.ts"
echo "  ✅ app/api/admin/dashboard/route.ts"
echo "  ✅ prisma/schema.prisma"
echo ""
echo "🎯 Teste agora:"
echo "  1. Recarregue a página de login do admin"
echo "  2. Teste os cards do menu no mobile"
echo "  3. Verifique a descarga no admin"
echo ""
