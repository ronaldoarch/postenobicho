#!/bin/bash
# Script para sincronizar componentes e hooks faltantes

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 📤 Sincronizando componentes e hooks faltantes ==="
echo ""

# 1. Sincronizar componentes faltantes
echo "1️⃣ Sincronizando componentes..."
rsync -avz --progress \
  "$LOCAL_DIR/components/AlertaBonito.tsx" \
  "$LOCAL_DIR/components/ConfirmacaoBonita.tsx" \
  $SERVER:$SERVER_DIR/components/

# 2. Sincronizar hooks faltantes
echo ""
echo "2️⃣ Sincronizando hooks..."
rsync -avz --progress \
  "$LOCAL_DIR/hooks/useAlerta.ts" \
  $SERVER:$SERVER_DIR/hooks/

# 3. Verificar se foram enviados
echo ""
echo "3️⃣ Verificando arquivos no servidor..."
FILES=(
  "components/AlertaBonito.tsx"
  "components/ConfirmacaoBonita.tsx"
  "hooks/useAlerta.ts"
)

for file in "${FILES[@]}"; do
  if ssh $SERVER "[ -f $SERVER_DIR/$file ]"; then
    echo "  ✅ $file existe"
  else
    echo "  ❌ $file NÃO existe"
  fi
done

echo ""
echo "✅ Componentes e hooks sincronizados!"
