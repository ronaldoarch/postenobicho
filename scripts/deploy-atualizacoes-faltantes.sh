#!/bin/bash
# Script para enviar todas as atualizações que não subiram para o servidor
# Execute: ./scripts/deploy-atualizacoes-faltantes.sh

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🚀 Enviando Atualizações Faltantes ==="
echo ""
echo "📝 Você precisará digitar a senha SSH: bicho@321"
echo ""

# 1. Componentes atualizados (logo só na home)
echo "1️⃣ Enviando componentes atualizados..."
rsync -avz \
  $LOCAL_DIR/components/Header.tsx \
  $LOCAL_DIR/components/DynamicFavicon.tsx \
  $LOCAL_DIR/components/DynamicTitle.tsx \
  $LOCAL_DIR/components/Footer.tsx \
  $LOCAL_DIR/components/HeroBanner.tsx \
  $SERVER:$SERVER_DIR/components/

# 2. Página de Integrações no Admin
echo ""
echo "2️⃣ Enviando página de Integrações..."
rsync -avz \
  $LOCAL_DIR/app/admin/integracoes/ \
  $SERVER:$SERVER_DIR/app/admin/integracoes/

# 3. API de teste de webhook
echo ""
echo "3️⃣ Enviando API de teste de webhook..."
rsync -avz \
  $LOCAL_DIR/app/api/admin/integracoes/ \
  $SERVER:$SERVER_DIR/app/api/admin/integracoes/

# 4. Layout do Admin atualizado (com menu Integrações)
echo ""
echo "4️⃣ Enviando layout do Admin atualizado..."
rsync -avz \
  $LOCAL_DIR/app/admin/layout.tsx \
  $SERVER:$SERVER_DIR/app/admin/

# 5. Página home atualizada
echo ""
echo "5️⃣ Enviando página home atualizada..."
rsync -avz \
  $LOCAL_DIR/app/page.tsx \
  $SERVER:$SERVER_DIR/app/

# 6. Outros componentes que podem ter sido atualizados
echo ""
echo "6️⃣ Enviando outros componentes atualizados..."
rsync -avz \
  $LOCAL_DIR/components/MetaPixel.tsx \
  $LOCAL_DIR/components/MetaPixelWrapper.tsx \
  $SERVER:$SERVER_DIR/components/

# 7. Hooks atualizados
echo ""
echo "7️⃣ Enviando hooks atualizados..."
rsync -avz \
  $LOCAL_DIR/hooks/useMetaTracking.ts \
  $SERVER:$SERVER_DIR/hooks/

# 8. Arquivos de lib relacionados a integrações
echo ""
echo "8️⃣ Enviando arquivos de lib relacionados a integrações..."
rsync -avz \
  $LOCAL_DIR/lib/meta-tracking-server.ts \
  $LOCAL_DIR/lib/webhook-tracker.ts \
  $SERVER:$SERVER_DIR/lib/

# 9. Layout principal atualizado
echo ""
echo "9️⃣ Enviando layout principal atualizado..."
rsync -avz \
  $LOCAL_DIR/app/layout.tsx \
  $SERVER:$SERVER_DIR/app/

# 10. Limpar arquivo da raiz se existir
echo ""
echo "🔟 Limpando arquivo da raiz (se existir)..."
ssh $SERVER "cd $SERVER_DIR && rm -f configuracoes-store.ts" || true

# 11. Fazer build
echo ""
echo "1️⃣1️⃣ Fazendo build da aplicação..."
ssh $SERVER "cd $SERVER_DIR && npm run build"

# 12. Reiniciar PM2
echo ""
echo "1️⃣2️⃣ Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart lotbicho --update-env"

echo ""
echo "=== ✅ Todas as atualizações foram enviadas! ==="
echo ""
echo "📋 O que foi enviado:"
echo "  ✅ Header.tsx (logo só na home)"
echo "  ✅ DynamicFavicon.tsx"
echo "  ✅ DynamicTitle.tsx"
echo "  ✅ Footer.tsx"
echo "  ✅ HeroBanner.tsx"
echo "  ✅ Página de Integrações (/admin/integracoes)"
echo "  ✅ API de teste de webhook"
echo "  ✅ Layout do Admin (com menu Integrações)"
echo "  ✅ Página home atualizada"
echo "  ✅ Componentes Meta Pixel"
echo "  ✅ Hooks de tracking"
echo "  ✅ Libs de integração"
echo "  ✅ Layout principal"
echo ""
echo "🎉 Agora todas as atualizações estão no servidor!"
