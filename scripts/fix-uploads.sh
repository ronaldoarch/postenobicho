#!/bin/bash
# Script para corrigir problemas com uploads de imagens

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🔧 Corrigindo sistema de uploads ==="
echo ""

# 1. Enviar rota de upload se necessário
echo "1️⃣ Verificando rota de upload..."
if ssh $SERVER "[ -f $SERVER_DIR/app/api/upload/route.ts ]"; then
  echo "  ✅ Rota de upload existe"
else
  echo "  ⚠️  Enviando rota de upload..."
  scp "$LOCAL_DIR/app/api/upload/route.ts" $SERVER:$SERVER_DIR/app/api/upload/route.ts
fi

# 2. Enviar rota de servir arquivos
echo ""
echo "2️⃣ Verificando rota de servir arquivos..."
if ssh $SERVER "[ -f $SERVER_DIR/app/uploads/[...path]/route.ts ]"; then
  echo "  ✅ Rota de servir arquivos existe"
else
  echo "  ⚠️  Criando diretório e enviando rota..."
  ssh $SERVER "mkdir -p $SERVER_DIR/app/uploads/[...path]"
  scp "$LOCAL_DIR/app/uploads/[...path]/route.ts" $SERVER:$SERVER_DIR/app/uploads/[...path]/route.ts
fi

# 3. Criar diretórios de upload no servidor
echo ""
echo "3️⃣ Criando diretórios de upload..."
ssh $SERVER "mkdir -p $SERVER_DIR/public/uploads/banners"
ssh $SERVER "mkdir -p $SERVER_DIR/public/uploads/logos"
ssh $SERVER "mkdir -p $SERVER_DIR/public/uploads/stories"
ssh $SERVER "mkdir -p $SERVER_DIR/public/uploads/stories/videos"

# 4. Verificar permissões
echo ""
echo "4️⃣ Ajustando permissões..."
ssh $SERVER "chmod -R 755 $SERVER_DIR/public/uploads"
ssh $SERVER "chown -R www-data:www-data $SERVER_DIR/public/uploads 2>/dev/null || chown -R root:root $SERVER_DIR/public/uploads"

# 5. Verificar se diretórios existem
echo ""
echo "5️⃣ Verificando diretórios..."
DIRS=(
  "public/uploads/banners"
  "public/uploads/logos"
  "public/uploads/stories"
)

for dir in "${DIRS[@]}"; do
  if ssh $SERVER "[ -d $SERVER_DIR/$dir ]"; then
    echo "  ✅ $dir existe"
    FILE_COUNT=$(ssh $SERVER "find $SERVER_DIR/$dir -type f | wc -l" || echo "0")
    echo "     Arquivos: $FILE_COUNT"
  else
    echo "  ❌ $dir NÃO existe"
  fi
done

# 6. Verificar se há arquivos de upload existentes
echo ""
echo "6️⃣ Verificando arquivos de upload existentes..."
ssh $SERVER "find $SERVER_DIR/public/uploads -type f -name '*.jpg' -o -name '*.png' -o -name '*.webp' -o -name '*.gif' | head -10"

echo ""
echo "✅ Verificação concluída!"
echo ""
echo "📝 Se os arquivos não aparecerem:"
echo "   1. Verifique se o upload está salvando em public/uploads/banners/"
echo "   2. Verifique se a rota /api/upload está funcionando"
echo "   3. Verifique se a rota /uploads/[...path] está servindo os arquivos"
echo "   4. Verifique as permissões dos diretórios"
