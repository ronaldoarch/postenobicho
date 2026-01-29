#!/bin/bash
# Script para sincronizar todos os arquivos de lib para o servidor
# Execute este script do seu Mac

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 📚 Sincronizando arquivos de lib ==="
echo ""

# Enviar TODOS os arquivos .ts da pasta lib usando rsync
echo "Enviando todos os arquivos de lib..."
rsync -avz --include="*.ts" --exclude="*" \
  $LOCAL_DIR/lib/ $SERVER:$SERVER_DIR/lib/

echo ""
echo "✅ Arquivos de lib sincronizados!"

# Verificar arquivos críticos
echo ""
echo "Verificando arquivos críticos..."
LIB_FILES=(
    "lib/horarios-store.ts"
    "lib/descarga.ts"
    "lib/configuracoes-store.ts"
    "lib/temas-store.ts"
    "lib/auth.ts"
    "lib/prisma.ts"
    "lib/bet-rules-engine.ts"
)

for lib_file in "${LIB_FILES[@]}"; do
    if ssh $SERVER "test -f $SERVER_DIR/$lib_file" 2>/dev/null; then
        echo "  ✅ $lib_file existe"
    else
        echo "  ❌ $lib_file NÃO existe!"
    fi
done

echo ""
echo "✅ Verificação concluída!"
