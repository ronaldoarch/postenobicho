#!/bin/bash
# Script simples: rsync cria diretórios automaticamente e envia tudo de uma vez
# Execute este script do seu Mac

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🚀 Deploy Simples - Tudo de Uma Vez ==="
echo ""

# 1. Parar PM2
echo "1️⃣ Parando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 stop lotbicho || true"
sleep 2

# 2. Enviar TODAS as rotas de API de uma vez (rsync cria diretórios automaticamente)
echo ""
echo "2️⃣ Enviando TODAS as rotas de API de uma vez..."
echo "   (rsync cria todos os diretórios automaticamente)"
rsync -avz --include="*/" --include="route.ts" --exclude="*" \
  $LOCAL_DIR/app/api/ $SERVER:$SERVER_DIR/app/api/
echo "  ✅ Todas as rotas enviadas"

# 3. Enviar ThemeScript.tsx (rsync cria diretório se não existir)
echo ""
echo "3️⃣ Enviando ThemeScript.tsx..."
rsync -avz $LOCAL_DIR/components/ThemeScript.tsx $SERVER:$SERVER_DIR/components/ThemeScript.tsx
echo "  ✅ ThemeScript.tsx enviado"

# 4. Verificar arquivos enviados
echo ""
echo "4️⃣ Verificando arquivos enviados..."
LOCAL_COUNT=$(find $LOCAL_DIR/app/api -name "route.ts" -type f | wc -l | tr -d ' ')
SERVER_COUNT=$(ssh $SERVER "find $SERVER_DIR/app/api -name route.ts -type f 2>/dev/null | wc -l | tr -d ' '")

echo "  📊 Rotas locais: $LOCAL_COUNT"
echo "  📊 Rotas no servidor: $SERVER_COUNT"

if [ "$LOCAL_COUNT" -eq "$SERVER_COUNT" ]; then
    echo "  ✅ Todas as rotas foram sincronizadas!"
else
    echo "  ⚠️  Faltam $((LOCAL_COUNT - SERVER_COUNT)) rotas"
fi

# 5. Limpar build
echo ""
echo "5️⃣ Limpando build antigo..."
ssh $SERVER "cd $SERVER_DIR && rm -rf .next .next/cache 2>/dev/null || true"
echo "  ✅ Build limpo"

# 6. Fazer build completo
echo ""
echo "6️⃣ Fazendo build completo (isso pode demorar vários minutos)..."
echo "   Aguarde..."
ssh $SERVER "cd $SERVER_DIR && npm run build 2>&1 | tail -50"

# 7. Verificar rotas no build
echo ""
echo "7️⃣ Verificando rotas incluídas no build..."
BUILD_ROUTES=$(ssh $SERVER "find $SERVER_DIR/.next/server/app/api -name route.js -type f 2>/dev/null | wc -l | tr -d ' '")
echo "  📊 Rotas no build: $BUILD_ROUTES"
echo "  📊 Rotas esperadas: ~$LOCAL_COUNT"

if [ "$BUILD_ROUTES" -ge "$((LOCAL_COUNT - 5))" ]; then
    echo "  ✅ Build parece completo!"
else
    echo "  ⚠️  Build pode estar incompleto"
fi

# 8. Reiniciar PM2
echo ""
echo "8️⃣ Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart lotbicho"
sleep 3

# 9. Verificar status do PM2
echo ""
echo "9️⃣ Verificando status do PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 status"

# 10. Aguardar servidor iniciar
echo ""
echo "🔟 Aguardando servidor iniciar..."
sleep 5

# 11. Testar APIs críticas
echo ""
echo "1️⃣1️⃣ Testando APIs críticas..."
APIS=(
    "/api/configuracoes"
    "/api/tema"
    "/api/auth/me"
    "/api/auth/login"
    "/api/modalidades"
    "/api/apostas"
    "/api/admin/dashboard"
)

for api in "${APIS[@]}"; do
    STATUS=$(ssh $SERVER "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000$api 2>/dev/null || echo '000'")
    if [ "$STATUS" = "200" ] || [ "$STATUS" = "401" ]; then
        echo "  ✅ $api está respondendo (status: $STATUS)"
    elif [ "$STATUS" = "404" ]; then
        echo "  ⚠️  $api retornou 404"
    else
        echo "  ❌ $api retornou status: $STATUS"
    fi
done

# 12. Resumo final
echo ""
echo "=== ✅ Deploy Completo Finalizado ==="
echo ""
echo "📊 Resumo:"
echo "   • Rotas locais: $LOCAL_COUNT"
echo "   • Rotas no servidor: $SERVER_COUNT"
echo "   • Rotas no build: $BUILD_ROUTES"
echo ""
