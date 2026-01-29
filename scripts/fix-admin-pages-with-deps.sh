#!/bin/bash
# Script completo para sincronizar páginas do admin + dependências, fazer rebuild e reiniciar

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🔧 Corrigindo páginas do admin com todas as dependências ==="
echo ""

# 1. Parar PM2
echo "1️⃣ Parando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 stop all || true"

# 2. Sincronizar todos os componentes
echo ""
echo "2️⃣ Sincronizando todos os componentes..."
rsync -avz --progress \
  --exclude='._*' \
  --exclude='.DS_Store' \
  "$LOCAL_DIR/components/" \
  $SERVER:$SERVER_DIR/components/

# 3. Sincronizar todos os hooks
echo ""
echo "3️⃣ Sincronizando todos os hooks..."
rsync -avz --progress \
  --exclude='._*' \
  --exclude='.DS_Store' \
  "$LOCAL_DIR/hooks/" \
  $SERVER:$SERVER_DIR/hooks/

# 4. Sincronizar todas as páginas do admin
echo ""
echo "4️⃣ Sincronizando páginas do admin..."
rsync -avz --progress \
  --exclude='._*' \
  --exclude='.DS_Store' \
  "$LOCAL_DIR/app/admin/" \
  $SERVER:$SERVER_DIR/app/admin/

# 5. Verificar arquivos críticos
echo ""
echo "5️⃣ Verificando arquivos críticos..."
CRITICAL_FILES=(
  "components/AlertaBonito.tsx"
  "components/ConfirmacaoBonita.tsx"
  "hooks/useAlerta.ts"
  "hooks/useConfirmacao.ts"
  "app/admin/temas/page.tsx"
  "app/admin/configuracoes/page.tsx"
  "app/admin/cotacoes-especiais/page.tsx"
  "app/admin/liquidacao/page.tsx"
)

for file in "${CRITICAL_FILES[@]}"; do
  if ssh $SERVER "[ -f $SERVER_DIR/$file ]"; then
    echo "  ✅ $file existe"
  else
    echo "  ❌ $file NÃO existe"
  fi
done

# 6. Limpar build antigo
echo ""
echo "6️⃣ Limpando build antigo..."
ssh $SERVER "cd $SERVER_DIR && rm -rf .next"

# 7. Rebuild
echo ""
echo "7️⃣ Fazendo rebuild..."
ssh $SERVER "cd $SERVER_DIR && npm run build"

# 8. Verificar se build foi bem-sucedido
echo ""
echo "8️⃣ Verificando build..."
if ssh $SERVER "[ -d $SERVER_DIR/.next ]"; then
  echo "  ✅ Build criado com sucesso"
else
  echo "  ❌ Build falhou!"
  echo ""
  echo "  Verificando erros..."
  ssh $SERVER "cd $SERVER_DIR && npm run build 2>&1 | tail -20"
  exit 1
fi

# 9. Reiniciar PM2
echo ""
echo "9️⃣ Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart all || pm2 start ecosystem.config.js"

# 10. Verificar status
echo ""
echo "🔟 Verificando status do PM2..."
ssh $SERVER "pm2 status"

echo ""
echo "✅ Processo concluído!"
echo ""
echo "📝 Agora todas as páginas do admin devem estar funcionando:"
echo "   - /admin/temas"
echo "   - /admin/configuracoes"
echo "   - /admin/cotacoes-especiais"
echo "   - E outras..."
