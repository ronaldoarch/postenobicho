#!/bin/bash
# Script para sincronizar páginas que estão faltando no servidor

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 📤 Sincronizando páginas para o servidor ==="
echo ""

# Sincronizar páginas do jogo-do-bicho
echo "1️⃣ Sincronizando páginas do jogo-do-bicho..."
rsync -avz --progress \
  "$LOCAL_DIR/app/jogo-do-bicho/" \
  $SERVER:$SERVER_DIR/app/jogo-do-bicho/

# Sincronizar página minhas-apostas
echo ""
echo "2️⃣ Sincronizando página minhas-apostas..."
rsync -avz --progress \
  "$LOCAL_DIR/app/minhas-apostas/" \
  $SERVER:$SERVER_DIR/app/minhas-apostas/

echo ""
echo "✅ Páginas sincronizadas!"
