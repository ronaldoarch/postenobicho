#!/bin/bash
# Script para verificar arquivos faltando no servidor
# Execute este script do seu Mac

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🔍 Verificando arquivos faltando no servidor ==="
echo ""

# 1. Verificar rotas de API
echo "1️⃣ Verificando rotas de API..."
LOCAL_API_COUNT=$(find $LOCAL_DIR/app/api -name "route.ts" -type f | wc -l | tr -d ' ')
SERVER_API_COUNT=$(ssh $SERVER "find $SERVER_DIR/app/api -name 'route.ts' -type f 2>/dev/null | wc -l | tr -d ' '")

echo "  Rotas locais: $LOCAL_API_COUNT"
echo "  Rotas no servidor: $SERVER_API_COUNT"

if [ "$LOCAL_API_COUNT" -ne "$SERVER_API_COUNT" ]; then
    echo "  ⚠️  Faltam $((LOCAL_API_COUNT - SERVER_API_COUNT)) rotas de API!"
    echo ""
    echo "  Rotas faltando:"
    comm -23 <(find $LOCAL_DIR/app/api -name "route.ts" -type f | sed "s|$LOCAL_DIR/||" | sort) \
             <(ssh $SERVER "find $SERVER_DIR/app/api -name 'route.ts' -type f 2>/dev/null | sed \"s|$SERVER_DIR/||\" | sort" | sort) || true
else
    echo "  ✅ Todas as rotas de API estão presentes"
fi

# 2. Verificar arquivos de lib críticos
echo ""
echo "2️⃣ Verificando arquivos de lib críticos..."
LIB_FILES=(
    "lib/configuracoes-store.ts"
    "lib/temas-store.ts"
    "lib/prisma.ts"
    "lib/auth.ts"
    "lib/bet-rules-engine.ts"
)

for lib_file in "${LIB_FILES[@]}"; do
    if ssh $SERVER "test -f $SERVER_DIR/$lib_file" 2>/dev/null; then
        echo "  ✅ $lib_file existe"
    else
        echo "  ❌ $lib_file NÃO existe!"
    fi
done

# 3. Verificar componentes críticos
echo ""
echo "3️⃣ Verificando componentes críticos..."
COMPONENTS=(
    "components/Header.tsx"
    "components/Footer.tsx"
    "components/ThemeScript.tsx"
)

for comp in "${COMPONENTS[@]}"; do
    if ssh $SERVER "test -f $SERVER_DIR/$comp" 2>/dev/null; then
        echo "  ✅ $comp existe"
    else
        echo "  ❌ $comp NÃO existe!"
    fi
done

# 4. Verificar hooks críticos
echo ""
echo "4️⃣ Verificando hooks críticos..."
HOOKS=(
    "hooks/useConfiguracoes.ts"
    "hooks/useTema.ts"
)

for hook in "${HOOKS[@]}"; do
    if ssh $SERVER "test -f $SERVER_DIR/$hook" 2>/dev/null; then
        echo "  ✅ $hook existe"
    else
        echo "  ❌ $hook NÃO existe!"
    fi
done

# 5. Verificar rotas no build
echo ""
echo "5️⃣ Verificando rotas no build..."
BUILD_ROUTES=$(ssh $SERVER "find $SERVER_DIR/.next/server/app/api -name 'route.js' -type f 2>/dev/null | wc -l | tr -d ' '")
echo "  Rotas no build: $BUILD_ROUTES"

if [ "$BUILD_ROUTES" -lt "$LOCAL_API_COUNT" ]; then
    echo "  ⚠️  Build tem menos rotas que o esperado!"
    echo "  Esperado: ~$LOCAL_API_COUNT, Encontrado: $BUILD_ROUTES"
else
    echo "  ✅ Número de rotas no build parece OK"
fi

echo ""
echo "✅ Verificação concluída!"
