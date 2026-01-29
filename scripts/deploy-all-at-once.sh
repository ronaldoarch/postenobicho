#!/bin/bash
# Script para criar TODOS os diretórios de uma vez e enviar TODOS os arquivos de uma vez
# Execute este script do seu Mac

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🚀 Deploy - Criar Tudo de Uma Vez ==="
echo ""

# 1. Parar PM2
echo "1️⃣ Parando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 stop lotbicho || true"
sleep 2

# 2. Criar TODOS os diretórios de uma vez
echo ""
echo "2️⃣ Criando TODOS os diretórios de uma vez..."
# Encontrar todos os diretórios e criar de uma vez no servidor usando um único comando
find $LOCAL_DIR/app/api -type d | sed "s|^$LOCAL_DIR/||" | ssh $SERVER "cd $SERVER_DIR && xargs -I {} mkdir -p {}"
echo "  ✅ Todos os diretórios criados"

# 3. Criar diretório components se não existir
echo ""
echo "3️⃣ Criando diretório components..."
ssh $SERVER "mkdir -p $SERVER_DIR/components"
echo "  ✅ Diretório components criado"

# 4. Enviar TODOS os arquivos route.ts de uma vez usando rsync
echo ""
echo "4️⃣ Enviando TODOS os arquivos route.ts de uma vez..."
rsync -avz --include="*/" --include="route.ts" --exclude="*" \
  $LOCAL_DIR/app/api/ $SERVER:$SERVER_DIR/app/api/
echo "  ✅ Todos os arquivos route.ts enviados"

# 5. Enviar ThemeScript.tsx
echo ""
echo "5️⃣ Enviando ThemeScript.tsx..."
rsync -avz $LOCAL_DIR/components/ThemeScript.tsx $SERVER:$SERVER_DIR/components/ThemeScript.tsx
echo "  ✅ ThemeScript.tsx enviado"

# 6. Verificar arquivos enviados
echo ""
echo "6️⃣ Verificando arquivos enviados..."
LOCAL_COUNT=$(find $LOCAL_DIR/app/api -name "route.ts" -type f | wc -l | tr -d ' ')
SERVER_COUNT=$(ssh $SERVER "find $SERVER_DIR/app/api -name 'route.ts' -type f 2>/dev/null | wc -l | tr -d ' ')

echo "  📊 Rotas locais: $LOCAL_COUNT"
echo "  📊 Rotas no servidor: $SERVER_COUNT"

if [ "$LOCAL_COUNT" -eq "$SERVER_COUNT" ]; then
    echo "  ✅ Todas as rotas foram sincronizadas!"
else
    echo "  ⚠️  Faltam $((LOCAL_COUNT - SERVER_COUNT)) rotas"
fi

# 7. Verificar ThemeScript
echo ""
echo "7️⃣ Verificando ThemeScript.tsx..."
if ssh $SERVER "test -f $SERVER_DIR/components/ThemeScript.tsx" 2>/dev/null; then
    echo "  ✅ ThemeScript.tsx existe no servidor"
else
    echo "  ❌ ThemeScript.tsx NÃO existe no servidor!"
fi

# 8. Limpar build
echo ""
echo "8️⃣ Limpando build antigo..."
ssh $SERVER "cd $SERVER_DIR && rm -rf .next .next/cache 2>/dev/null || true"
echo "  ✅ Build limpo"

# 9. Fazer build completo
echo ""
echo "9️⃣ Fazendo build completo (isso pode demorar vários minutos)..."
echo "   Aguarde..."
ssh $SERVER "cd $SERVER_DIR && npm run build 2>&1 | tail -50"

# 10. Verificar rotas no build
echo ""
echo "🔟 Verificando rotas incluídas no build..."
BUILD_ROUTES=$(ssh $SERVER "find $SERVER_DIR/.next/server/app/api -name 'route.js' -type f 2>/dev/null | wc -l | tr -d ' ')
echo "  📊 Rotas no build: $BUILD_ROUTES"
echo "  📊 Rotas esperadas: ~$LOCAL_COUNT"

if [ "$BUILD_ROUTES" -ge "$((LOCAL_COUNT - 5))" ]; then
    echo "  ✅ Build parece completo!"
else
    echo "  ⚠️  Build pode estar incompleto"
fi

# 11. Reiniciar PM2
echo ""
echo "1️⃣1️⃣ Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart lotbicho"
sleep 3

# 12. Verificar status do PM2
echo ""
echo "1️⃣2️⃣ Verificando status do PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 status"

# 13. Aguardar servidor iniciar
echo ""
echo "1️⃣3️⃣ Aguardando servidor iniciar..."
sleep 5

# 14. Testar APIs críticas
echo ""
echo "1️⃣4️⃣ Testando APIs críticas..."
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

# 15. Resumo final
echo ""
echo "=== ✅ Deploy Completo Finalizado ==="
echo ""
echo "📊 Resumo:"
echo "   • Rotas locais: $LOCAL_COUNT"
echo "   • Rotas no servidor: $SERVER_COUNT"
echo "   • Rotas no build: $BUILD_ROUTES"
echo ""
