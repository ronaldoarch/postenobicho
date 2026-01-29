#!/bin/bash
# Script para fazer deploy das atualizações de UI, descarga e liquidação
# Execute: ./scripts/deploy-atualizacoes-ui-descarga.sh

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🚀 Deploy: Atualizações UI, Descarga e Liquidação ==="
echo ""
echo "📝 Você precisará digitar a senha SSH quando solicitado"
echo ""

# 1. Enviar arquivos atualizados
echo "1️⃣ Enviando arquivos atualizados..."

# Componentes
echo "   📦 Enviando componentes..."
rsync -avz \
  "$LOCAL_DIR/components/BottomNav.tsx" \
  "$LOCAL_DIR/components/Footer.tsx" \
  "$SERVER:$SERVER_DIR/components/"

# Páginas
echo "   📄 Enviando páginas..."
rsync -avz \
  "$LOCAL_DIR/app/login/page.tsx" \
  "$LOCAL_DIR/app/cadastro/page.tsx" \
  "$LOCAL_DIR/app/admin/login/page.tsx" \
  "$LOCAL_DIR/app/admin/descarga/page.tsx" \
  "$LOCAL_DIR/app/admin/liquidacao/page.tsx" \
  "$SERVER:$SERVER_DIR/app/"

# Criar diretórios se não existirem
ssh $SERVER "mkdir -p $SERVER_DIR/app/login $SERVER_DIR/app/cadastro $SERVER_DIR/app/admin/login $SERVER_DIR/app/admin/descarga $SERVER_DIR/app/admin/liquidacao"

# APIs
echo "   🔌 Enviando APIs..."
rsync -avz \
  "$LOCAL_DIR/lib/descarga.ts" \
  "$SERVER:$SERVER_DIR/lib/"

rsync -avz \
  "$LOCAL_DIR/app/api/resultados/liquidar/route.ts" \
  "$SERVER:$SERVER_DIR/app/api/resultados/liquidar/"

rsync -avz \
  "$LOCAL_DIR/app/api/admin/pagamentos-pix/route.ts" \
  "$SERVER:$SERVER_DIR/app/api/admin/pagamentos-pix/"

rsync -avz \
  "$LOCAL_DIR/app/api/webhooks/nxgate/route.ts" \
  "$SERVER:$SERVER_DIR/app/api/webhooks/nxgate/"

# Schema Prisma
echo "   🗄️  Enviando schema Prisma..."
rsync -avz \
  "$LOCAL_DIR/prisma/schema.prisma" \
  "$SERVER:$SERVER_DIR/prisma/"

# 2. Atualizar schema no servidor se necessário
echo ""
echo "2️⃣ Atualizando schema Prisma no servidor..."
ssh $SERVER "cd $SERVER_DIR && npx prisma generate"

# 3. Fazer build
echo ""
echo "3️⃣ Fazendo build da aplicação..."
ssh $SERVER "cd $SERVER_DIR && npm run build"

# 4. Reiniciar PM2
echo ""
echo "4️⃣ Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart lotbicho --update-env"

echo ""
echo "=== ✅ Deploy Concluído! ==="
echo ""
echo "📋 O que foi atualizado:"
echo "  ✅ Descarga: busca todas as apostas (pendentes, liquidadas e perdidas)"
echo "  ✅ Descarga: comparação flexível de modalidade"
echo "  ✅ Descarga: exibe status das apostas na tabela"
echo "  ✅ Liquidação: mensagens de debug melhoradas"
echo "  ✅ BottomNav: navegação dos cards corrigida"
echo "  ✅ Login/Cadastro: espaçamento do card corrigido"
echo "  ✅ Footer: logo duplicada removida"
echo "  ✅ Admin Login: placeholder de email removido"
echo "  ✅ Pagamentos PIX: integração com gateway Nxgate"
echo ""
echo "🎯 Próximos passos:"
echo "  1. Teste a descarga no admin (/admin/descarga)"
echo "  2. Teste a liquidação no admin (/admin/liquidacao)"
echo "  3. Teste os cards do menu no mobile"
echo "  4. Verifique as páginas de login e cadastro"
echo ""
