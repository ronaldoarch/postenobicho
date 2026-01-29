#!/bin/bash
# Script para garantir que todas as rotas de API sejam incluídas no build
# Execute este script no servidor

set -e

cd /var/www/postenobicho

echo "=== 🔧 Verificando e corrigindo rotas de API ==="
echo ""

# 1. Verificar se arquivos de rota existem
echo "1️⃣ Verificando arquivos de rota..."
if [ -f "app/api/configuracoes/route.ts" ]; then
    echo "✅ app/api/configuracoes/route.ts existe"
else
    echo "❌ app/api/configuracoes/route.ts NÃO existe!"
    exit 1
fi

if [ -f "app/api/tema/route.ts" ]; then
    echo "✅ app/api/tema/route.ts existe"
else
    echo "❌ app/api/tema/route.ts NÃO existe!"
    exit 1
fi

# 2. Verificar se rotas estão no build
echo ""
echo "2️⃣ Verificando rotas no build..."
if [ -f ".next/server/app/api/configuracoes/route.js" ]; then
    echo "✅ /api/configuracoes está no build"
else
    echo "⚠️  /api/configuracoes NÃO está no build"
fi

if [ -f ".next/server/app/api/tema/route.js" ]; then
    echo "✅ /api/tema está no build"
else
    echo "⚠️  /api/tema NÃO está no build"
fi

# 3. Listar todas as rotas de API no build
echo ""
echo "3️⃣ Listando todas as rotas de API no build..."
find .next/server/app/api -name "route.js" -type f 2>/dev/null | sort

# 4. Se as rotas não estão no build, fazer rebuild
echo ""
echo "4️⃣ Verificando se precisa fazer rebuild..."
MISSING_ROUTES=0
if [ ! -f ".next/server/app/api/configuracoes/route.js" ]; then
    MISSING_ROUTES=1
fi
if [ ! -f ".next/server/app/api/tema/route.js" ]; then
    MISSING_ROUTES=1
fi

if [ $MISSING_ROUTES -eq 1 ]; then
    echo "⚠️  Algumas rotas estão faltando. Fazendo rebuild..."
    rm -rf .next
    npm run build
else
    echo "✅ Todas as rotas estão no build"
fi

echo ""
echo "✅ Verificação concluída!"
