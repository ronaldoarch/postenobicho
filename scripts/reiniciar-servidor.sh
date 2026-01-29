#!/bin/bash
# Script para reiniciar o servidor após deploy
# Execute: ./scripts/reiniciar-servidor.sh

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"

echo "=== 🔄 Reiniciando Servidor ==="
echo ""
echo "📝 Você precisará digitar a senha SSH quando solicitado"
echo ""

# 1. Verificar status atual
echo "1️⃣ Verificando status atual do PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 status"

# 2. Reiniciar PM2
echo ""
echo "2️⃣ Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart lotbicho --update-env"
sleep 5

# 3. Verificar status após reiniciar
echo ""
echo "3️⃣ Verificando status após reiniciar..."
ssh $SERVER "cd $SERVER_DIR && pm2 status"

# 4. Verificar logs
echo ""
echo "4️⃣ Verificando logs..."
ssh $SERVER "cd $SERVER_DIR && pm2 logs lotbicho --lines 30 --nostream"

# 5. Testar APIs
echo ""
echo "5️⃣ Testando APIs críticas..."
TEMA_STATUS=$(ssh $SERVER "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/tema 2>/dev/null || echo '000'")
AUTH_STATUS=$(ssh $SERVER "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/auth/me 2>/dev/null || echo '000'")

echo "   /api/tema: $TEMA_STATUS"
echo "   /api/auth/me: $AUTH_STATUS"

if [ "$TEMA_STATUS" = "200" ] && ([ "$AUTH_STATUS" = "200" ] || [ "$AUTH_STATUS" = "401" ]); then
  echo "   ✅ APIs estão respondendo!"
else
  echo "   ⚠️  Algumas APIs podem estar com problemas"
fi

echo ""
echo "=== ✅ Servidor Reiniciado! ==="
echo ""
echo "🎯 Próximos passos:"
echo "   1. Recarregue a página do admin (/admin/login)"
echo "   2. Teste os cards do menu no mobile"
echo "   3. Verifique a descarga no admin (/admin/descarga)"
echo "   4. Teste a liquidação no admin (/admin/liquidacao)"
echo ""
