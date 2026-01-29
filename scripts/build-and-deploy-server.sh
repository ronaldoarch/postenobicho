#!/bin/bash
# Script para fazer build completo no servidor
# Execute este script no servidor

set -e

cd /var/www/postenobicho

echo "=== 🚀 Build completo no servidor ==="
echo ""

# 1. Verificar schema.prisma
echo "1️⃣ Verificando schema.prisma..."
if grep -q 'provider = "mysql"' prisma/schema.prisma; then
    echo "✅ Schema está configurado para MySQL"
else
    echo "⚠️  Corrigindo schema para MySQL..."
    sed -i 's/provider = "sqlite"/provider = "mysql"/' prisma/schema.prisma
    echo "✅ Schema corrigido"
fi

# 2. Verificar detalhes tem @db.Text
if grep -q 'detalhes.*@db.Text' prisma/schema.prisma; then
    echo "✅ Coluna detalhes tem @db.Text"
else
    echo "⚠️  Adicionando @db.Text na coluna detalhes..."
    sed -i 's/detalhes.*String?$/detalhes        String?   @db.Text/' prisma/schema.prisma
    echo "✅ @db.Text adicionado"
fi

# 3. Limpar Prisma Client antigo
echo ""
echo "2️⃣ Limpando Prisma Client antigo..."
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client

# 4. Gerar Prisma Client novo
echo ""
echo "3️⃣ Gerando novo Prisma Client..."
npx prisma generate

# 5. Limpar build antigo
echo ""
echo "4️⃣ Limpando build antigo..."
rm -rf .next

# 6. Fazer novo build
echo ""
echo "5️⃣ Fazendo build da aplicação..."
echo "⏳ Isso pode levar alguns minutos..."
npm run build

# 7. Verificar se build foi criado
echo ""
echo "6️⃣ Verificando build..."
if [ -d ".next" ]; then
    echo "✅ Build criado com sucesso!"
    ls -la .next | head -5
else
    echo "❌ Erro: Build não foi criado"
    exit 1
fi

# 8. Reiniciar aplicação
echo ""
echo "7️⃣ Reiniciando aplicação..."
pm2 restart lotbicho

# 9. Verificar logs
echo ""
echo "8️⃣ Verificando logs (aguarde 5 segundos)..."
sleep 5
pm2 logs lotbicho --lines 20 --nostream

echo ""
echo "=== ✅ Processo concluído! ==="
echo ""
echo "📋 Se houver erros, verifique:"
echo "   - pm2 logs lotbicho --lines 50"
echo "   - pm2 status"
