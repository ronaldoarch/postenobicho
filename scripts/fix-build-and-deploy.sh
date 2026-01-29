#!/bin/bash
# Script para corrigir o build enviando arquivos de lib faltantes
# Execute este script do seu Mac

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🔧 Corrigindo Build ==="
echo ""

# 1. Parar PM2
echo "1️⃣ Parando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 stop lotbicho || true"
sleep 2

# 2. Enviar TODOS os arquivos de lib
echo ""
echo "2️⃣ Enviando todos os arquivos de lib..."
rsync -avz --include="*.ts" --exclude="*" \
  $LOCAL_DIR/lib/ $SERVER:$SERVER_DIR/lib/
echo "  ✅ Arquivos de lib enviados"

# 3. Verificar arquivo crítico
echo ""
echo "3️⃣ Verificando horarios-store.ts..."
if ssh $SERVER "test -f $SERVER_DIR/lib/horarios-store.ts" 2>/dev/null; then
    echo "  ✅ horarios-store.ts existe"
else
    echo "  ❌ horarios-store.ts NÃO existe!"
    exit 1
fi

# 4. Limpar build
echo ""
echo "4️⃣ Limpando build antigo..."
ssh $SERVER "cd $SERVER_DIR && rm -rf .next .next/cache 2>/dev/null || true"
echo "  ✅ Build limpo"

# 5. Fazer build completo
echo ""
echo "5️⃣ Fazendo build completo (isso pode demorar vários minutos)..."
echo "   Aguarde..."
ssh $SERVER "cd $SERVER_DIR && npm run build 2>&1 | tail -50"

# 6. Verificar se build foi bem-sucedido
echo ""
echo "6️⃣ Verificando se build foi bem-sucedido..."
if ssh $SERVER "test -d $SERVER_DIR/.next" 2>/dev/null; then
    BUILD_ROUTES=$(ssh $SERVER "find $SERVER_DIR/.next/server/app/api -name route.js -type f 2>/dev/null | wc -l | tr -d ' '")
    echo "  📊 Rotas no build: $BUILD_ROUTES"
    
    if [ "$BUILD_ROUTES" -ge "40" ]; then
        echo "  ✅ Build parece completo!"
    else
        echo "  ⚠️  Build pode estar incompleto"
    fi
else
    echo "  ❌ Build falhou!"
    exit 1
fi

# 7. Reiniciar PM2
echo ""
echo "7️⃣ Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart lotbicho"
sleep 3

# 8. Verificar status do PM2
echo ""
echo "8️⃣ Verificando status do PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 status"

# 9. Aguardar servidor iniciar
echo ""
echo "9️⃣ Aguardando servidor iniciar..."
sleep 5

# 10. Testar APIs críticas
echo ""
echo "🔟 Testando APIs críticas..."
APIS=(
    "/api/configuracoes"
    "/api/tema"
    "/api/auth/me"
    "/api/admin/horarios"
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

echo ""
echo "=== ✅ Build Corrigido! ==="
