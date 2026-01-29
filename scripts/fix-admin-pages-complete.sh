#!/bin/bash
# Script completo para sincronizar páginas do admin, fazer rebuild e reiniciar

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🔧 Corrigindo páginas do admin ==="
echo ""

# 1. Parar PM2
echo "1️⃣ Parando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 stop all || true"

# 2. Sincronizar páginas do admin
echo ""
echo "2️⃣ Sincronizando páginas do admin..."
rsync -avz --progress \
  --exclude='._*' \
  --exclude='.DS_Store' \
  "$LOCAL_DIR/app/admin/" \
  $SERVER:$SERVER_DIR/app/admin/

# 3. Verificar páginas críticas
echo ""
echo "3️⃣ Verificando páginas críticas..."
CRITICAL_PAGES=(
  "app/admin/temas/page.tsx"
  "app/admin/page.tsx"
  "app/admin/layout.tsx"
  "app/admin/configuracoes/page.tsx"
)

for page in "${CRITICAL_PAGES[@]}"; do
  if ssh $SERVER "[ -f $SERVER_DIR/$page ]"; then
    echo "  ✅ $page existe"
  else
    echo "  ❌ $page NÃO existe"
  fi
done

# 4. Limpar build antigo
echo ""
echo "4️⃣ Limpando build antigo..."
ssh $SERVER "cd $SERVER_DIR && rm -rf .next"

# 5. Rebuild
echo ""
echo "5️⃣ Fazendo rebuild..."
ssh $SERVER "cd $SERVER_DIR && npm run build"

# 6. Verificar se build foi bem-sucedido
echo ""
echo "6️⃣ Verificando build..."
if ssh $SERVER "[ -d $SERVER_DIR/.next ]"; then
  echo "  ✅ Build criado com sucesso"
  
  # Contar rotas do admin no build
  ADMIN_ROUTES=$(ssh $SERVER "find $SERVER_DIR/.next/server/app/admin -name '*.js' -type f 2>/dev/null | wc -l" || echo "0")
  echo "  📊 Rotas do admin no build: $ADMIN_ROUTES"
else
  echo "  ❌ Build falhou!"
  exit 1
fi

# 7. Reiniciar PM2
echo ""
echo "7️⃣ Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart all || pm2 start ecosystem.config.js"

# 8. Verificar status
echo ""
echo "8️⃣ Verificando status do PM2..."
ssh $SERVER "pm2 status"

echo ""
echo "✅ Processo concluído!"
echo ""
echo "📝 Páginas do admin disponíveis:"
echo "   - /admin (Dashboard)"
echo "   - /admin/temas"
echo "   - /admin/configuracoes"
echo "   - /admin/banners"
echo "   - /admin/stories"
echo "   - /admin/cotacoes"
echo "   - /admin/usuarios"
echo "   - /admin/saques"
echo "   - E outras..."
