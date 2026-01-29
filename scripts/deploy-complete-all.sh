#!/bin/bash
# Script completo para deploy de TODAS as rotas de API e arquivos faltantes
# Execute este script do seu Mac

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🚀 Deploy Completo - Sincronizando TUDO ==="
echo ""

# 1. Parar PM2
echo "1️⃣ Parando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 stop lotbicho || true"
sleep 2

# 2. Criar TODOS os diretórios necessários
echo ""
echo "2️⃣ Criando estrutura de diretórios no servidor..."
find $LOCAL_DIR/app/api -type d | while read dir; do
    rel_path=${dir#$LOCAL_DIR/}
    ssh $SERVER "mkdir -p $SERVER_DIR/$rel_path" 2>/dev/null || true
done
echo "  ✅ Diretórios criados"

# 3. Enviar TODAS as rotas de API
echo ""
echo "3️⃣ Enviando TODAS as rotas de API (isso pode demorar alguns minutos)..."
TOTAL=$(find $LOCAL_DIR/app/api -name "route.ts" -type f | wc -l | tr -d ' ')
echo "  📦 Total de rotas para enviar: $TOTAL"
echo ""

# Criar lista temporária de arquivos
TEMP_LIST=$(mktemp)
find $LOCAL_DIR/app/api -name "route.ts" -type f > "$TEMP_LIST"

SUCCESS=0
FAILED=0

while IFS= read -r file; do
    if [ ! -f "$file" ]; then
        echo "  ⚠️  Arquivo não encontrado: $file"
        FAILED=$((FAILED + 1))
        continue
    fi
    
    rel_path=${file#$LOCAL_DIR/}
    dir_path=$(dirname $rel_path)
    
    # Criar diretório no servidor antes de enviar
    ssh $SERVER "mkdir -p $SERVER_DIR/$dir_path" 2>/dev/null || true
    
    # Enviar arquivo (filtrar mensagens de senha)
    if scp "$file" $SERVER:$SERVER_DIR/$rel_path 2>&1 | grep -v "password:" | grep -v "Warning:" >/dev/null 2>&1; then
        echo "  ✅ $rel_path"
        SUCCESS=$((SUCCESS + 1))
    else
        # Verificar se o arquivo foi enviado mesmo com warnings
        if ssh $SERVER "test -f $SERVER_DIR/$rel_path" 2>/dev/null; then
            echo "  ✅ $rel_path (enviado)"
            SUCCESS=$((SUCCESS + 1))
        else
            echo "  ❌ Falha: $rel_path"
            FAILED=$((FAILED + 1))
        fi
    fi
done < "$TEMP_LIST"

rm -f "$TEMP_LIST"

echo ""
echo "  📊 Resultado: $SUCCESS enviados, $FAILED falharam"

# Contar arquivos enviados
LOCAL_COUNT=$(find $LOCAL_DIR/app/api -name "route.ts" -type f | wc -l | tr -d ' ')
SERVER_COUNT=$(ssh $SERVER "find $SERVER_DIR/app/api -name 'route.ts' -type f 2>/dev/null | wc -l | tr -d ' ')

echo ""
echo "  📊 Estatísticas:"
echo "     Local: $LOCAL_COUNT rotas"
echo "     Servidor: $SERVER_COUNT rotas"

# 4. Enviar ThemeScript.tsx que está faltando
echo ""
echo "4️⃣ Enviando ThemeScript.tsx..."
if scp "$LOCAL_DIR/components/ThemeScript.tsx" $SERVER:$SERVER_DIR/components/ThemeScript.tsx 2>/dev/null; then
    echo "  ✅ ThemeScript.tsx enviado"
else
    echo "  ❌ Erro ao enviar ThemeScript.tsx"
fi

# 5. Verificar se ThemeScript foi enviado
echo ""
echo "5️⃣ Verificando ThemeScript.tsx..."
if ssh $SERVER "test -f $SERVER_DIR/components/ThemeScript.tsx" 2>/dev/null; then
    echo "  ✅ ThemeScript.tsx existe no servidor"
else
    echo "  ❌ ThemeScript.tsx NÃO existe no servidor!"
fi

# 6. Limpar build completamente
echo ""
echo "6️⃣ Limpando build antigo..."
ssh $SERVER "cd $SERVER_DIR && rm -rf .next .next/cache 2>/dev/null || true"
echo "  ✅ Build limpo"

# 7. Limpar cache do Next.js
echo ""
echo "7️⃣ Limpando cache do Next.js..."
ssh $SERVER "cd $SERVER_DIR && rm -rf .next/cache 2>/dev/null || true"
echo "  ✅ Cache limpo"

# 8. Fazer build completo
echo ""
echo "8️⃣ Fazendo build completo (isso pode demorar vários minutos)..."
echo "   Aguarde..."
ssh $SERVER "cd $SERVER_DIR && npm run build 2>&1 | tail -50"

# 9. Verificar rotas no build
echo ""
echo "9️⃣ Verificando rotas incluídas no build..."
BUILD_ROUTES=$(ssh $SERVER "find $SERVER_DIR/.next/server/app/api -name 'route.js' -type f 2>/dev/null | wc -l | tr -d ' ')
echo "  📊 Rotas no build: $BUILD_ROUTES"
echo "  📊 Rotas esperadas: ~$LOCAL_COUNT"

if [ "$BUILD_ROUTES" -ge "$((LOCAL_COUNT - 5))" ]; then
    echo "  ✅ Build parece completo!"
else
    echo "  ⚠️  Build pode estar incompleto (esperado ~$LOCAL_COUNT, encontrado $BUILD_ROUTES)"
fi

# 10. Reiniciar PM2
echo ""
echo "🔟 Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart lotbicho"
sleep 3

# 11. Verificar status do PM2
echo ""
echo "1️⃣1️⃣ Verificando status do PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 status"

# 12. Aguardar servidor iniciar
echo ""
echo "1️⃣2️⃣ Aguardando servidor iniciar..."
sleep 5

# 13. Testar APIs críticas
echo ""
echo "1️⃣3️⃣ Testando APIs críticas..."
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
    if [ "$STATUS" = "200" ] || [ "$STATUS" = "401" ] || [ "$STATUS" = "404" ]; then
        if [ "$STATUS" = "404" ]; then
            echo "  ⚠️  $api retornou 404 (pode não existir ou não estar no build)"
        else
            echo "  ✅ $api está respondendo (status: $STATUS)"
        fi
    else
        echo "  ❌ $api retornou status: $STATUS"
    fi
done

# 14. Resumo final
echo ""
echo "=== ✅ Deploy Completo Finalizado ==="
echo ""
echo "📊 Resumo:"
echo "   • Rotas locais: $LOCAL_COUNT"
echo "   • Rotas no servidor: $SERVER_COUNT"
echo "   • Rotas no build: $BUILD_ROUTES"
echo ""
echo "🔍 Para verificar detalhes, execute:"
echo "   ./scripts/check-missing-files.sh"
echo ""
