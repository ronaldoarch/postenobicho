#!/bin/bash
# Script completo para corrigir páginas 404
# Sincroniza páginas, faz rebuild e reinicia PM2

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🔧 Corrigindo páginas 404 ==="
echo ""

# 1. Parar PM2
echo "1️⃣ Parando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 stop all || true"

# 2. Sincronizar páginas
echo ""
echo "2️⃣ Sincronizando páginas..."
rsync -avz --progress \
  "$LOCAL_DIR/app/jogo-do-bicho/" \
  $SERVER:$SERVER_DIR/app/jogo-do-bicho/

rsync -avz --progress \
  "$LOCAL_DIR/app/minhas-apostas/" \
  $SERVER:$SERVER_DIR/app/minhas-apostas/

# 3. Limpar build antigo
echo ""
echo "3️⃣ Limpando build antigo..."
ssh $SERVER "cd $SERVER_DIR && rm -rf .next"

# 4. Rebuild
echo ""
echo "4️⃣ Fazendo rebuild..."
ssh $SERVER "cd $SERVER_DIR && npm run build"

# 5. Verificar se build foi bem-sucedido
echo ""
echo "5️⃣ Verificando build..."
if ssh $SERVER "[ -d $SERVER_DIR/.next ]"; then
  echo "  ✅ Build criado com sucesso"
else
  echo "  ❌ Build falhou!"
  exit 1
fi

# 6. Reiniciar PM2
echo ""
echo "6️⃣ Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart all || pm2 start ecosystem.config.js"

# 7. Verificar status
echo ""
echo "7️⃣ Verificando status do PM2..."
ssh $SERVER "pm2 status"

echo ""
echo "✅ Processo concluído!"
echo ""
echo "📝 Teste as páginas:"
echo "   - /jogo-do-bicho"
echo "   - /jogo-do-bicho/resultados"
echo "   - /jogo-do-bicho/cotacao"
echo "   - /minhas-apostas"
