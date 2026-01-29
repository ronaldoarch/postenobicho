#!/bin/bash
# Script para verificar se as páginas estão no servidor

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"

echo "=== 🔍 Verificando páginas no servidor ==="
echo ""

PAGES=(
  "app/jogo-do-bicho/page.tsx"
  "app/jogo-do-bicho/resultados/page.tsx"
  "app/jogo-do-bicho/cotacao/page.tsx"
  "app/minhas-apostas/page.tsx"
)

for page in "${PAGES[@]}"; do
  echo "Verificando: $page"
  if ssh $SERVER "[ -f $SERVER_DIR/$page ]"; then
    echo "  ✅ Existe"
  else
    echo "  ❌ NÃO EXISTE"
  fi
done
