#!/bin/bash
# Script para enviar arquivos da lib para o servidor
# Execute: ./scripts/fix-arquivos-lib.sh

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 📦 Enviando Arquivos da lib ==="
echo ""
echo "📝 Você precisará digitar a senha SSH: bicho@321"
echo ""

# Limpar arquivo da raiz primeiro
echo "0️⃣ Limpando arquivo da raiz (se existir)..."
ssh $SERVER "cd $SERVER_DIR && rm -f configuracoes-store.ts" || true

# Enviar todos os arquivos da lib
echo "1️⃣ Enviando arquivos da lib..."
rsync -avz \
  --exclude='*.map' \
  --exclude='*.test.ts' \
  $LOCAL_DIR/lib/ \
  $SERVER:$SERVER_DIR/lib/

# Enviar arquivo de configurações da API
echo ""
echo "2️⃣ Enviando arquivo de configurações da API..."
rsync -avz \
  $LOCAL_DIR/app/api/admin/configuracoes/route.ts \
  $SERVER:$SERVER_DIR/app/api/admin/configuracoes/

echo ""
echo "=== ✅ Arquivos enviados! ==="
echo ""
echo "🎉 Agora execute o build novamente!"
