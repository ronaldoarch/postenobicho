#!/bin/bash
# Script completo para corrigir sistema de uploads

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🔧 Corrigindo sistema de uploads completo ==="
echo ""

# 1. Parar PM2
echo "1️⃣ Parando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 stop all || true"

# 2. Enviar rotas de upload
echo ""
echo "2️⃣ Enviando rotas de upload..."
scp "$LOCAL_DIR/app/api/upload/route.ts" $SERVER:$SERVER_DIR/app/api/upload/route.ts

# 3. Criar diretório e enviar rota de servir arquivos
echo ""
echo "3️⃣ Configurando rota de servir arquivos..."
ssh $SERVER "mkdir -p $SERVER_DIR/app/uploads/[...path]"
scp "$LOCAL_DIR/app/uploads/[...path]/route.ts" $SERVER:$SERVER_DIR/app/uploads/[...path]/route.ts

# 4. Criar diretórios de upload
echo ""
echo "4️⃣ Criando diretórios de upload..."
ssh $SERVER "mkdir -p $SERVER_DIR/public/uploads/banners"
ssh $SERVER "mkdir -p $SERVER_DIR/public/uploads/logos"
ssh $SERVER "mkdir -p $SERVER_DIR/public/uploads/stories"
ssh $SERVER "mkdir -p $SERVER_DIR/public/uploads/stories/videos"

# 5. Ajustar permissões
echo ""
echo "5️⃣ Ajustando permissões..."
ssh $SERVER "chmod -R 755 $SERVER_DIR/public/uploads"
ssh $SERVER "chown -R www-data:www-data $SERVER_DIR/public/uploads 2>/dev/null || chown -R root:root $SERVER_DIR/public/uploads || true"

# 6. Verificar arquivos existentes
echo ""
echo "6️⃣ Verificando arquivos existentes..."
BANNER_FILES=$(ssh $SERVER "find $SERVER_DIR/public/uploads/banners -type f 2>/dev/null | wc -l" || echo "0")
echo "   Arquivos em banners: $BANNER_FILES"

if [ "$BANNER_FILES" -gt 0 ]; then
  echo "   Listando alguns arquivos:"
  ssh $SERVER "ls -lh $SERVER_DIR/public/uploads/banners | head -5"
fi

# 7. Limpar build antigo
echo ""
echo "7️⃣ Limpando build antigo..."
ssh $SERVER "cd $SERVER_DIR && rm -rf .next"

# 8. Rebuild
echo ""
echo "8️⃣ Fazendo rebuild..."
ssh $SERVER "cd $SERVER_DIR && npm run build"

# 9. Reiniciar PM2
echo ""
echo "9️⃣ Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart all || pm2 start ecosystem.config.js"

# 10. Testar rota de upload
echo ""
echo "🔟 Testando rota de upload..."
sleep 3
UPLOAD_TEST=$(ssh $SERVER "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/upload -X POST 2>/dev/null || echo '000'")
if [ "$UPLOAD_TEST" = "400" ] || [ "$UPLOAD_TEST" = "200" ]; then
  echo "   ✅ Rota de upload está respondendo (status: $UPLOAD_TEST)"
else
  echo "   ⚠️  Rota de upload retornou status: $UPLOAD_TEST"
fi

# 11. Verificar status
echo ""
echo "1️⃣1️⃣ Verificando status do PM2..."
ssh $SERVER "pm2 status"

echo ""
echo "✅ Processo concluído!"
echo ""
echo "📝 Para testar:"
echo "   1. Faça upload de uma imagem de banner"
echo "   2. Verifique se o arquivo foi salvo em: public/uploads/banners/"
echo "   3. Acesse a URL: /uploads/banners/nome-do-arquivo.jpg"
echo ""
echo "🔍 Se ainda não funcionar, verifique:"
echo "   - Logs do PM2: ssh $SERVER 'cd $SERVER_DIR && pm2 logs --lines 20'"
echo "   - Se os arquivos estão sendo salvos: ssh $SERVER 'ls -la $SERVER_DIR/public/uploads/banners/'"
