#!/bin/bash
# Script completo para corrigir e fazer build no servidor
# Execute este script no servidor OU envie check-db.js atualizado primeiro

set -e

cd /var/www/postenobicho

echo "=== 🔧 Corrigindo e fazendo build completo ==="
echo ""

# 1. Parar PM2 temporariamente
echo "1️⃣ Parando PM2..."
pm2 stop lotbicho || true

# 2. Verificar e corrigir check-db.js
echo ""
echo "2️⃣ Verificando check-db.js..."
if grep -q "--accept-daate" scripts/check-db.js 2>/dev/null; then
    echo "⚠️  Corrigindo erro de digitação em check-db.js..."
    sed -i 's/--accept-daate/--accept-data-loss/g' scripts/check-db.js
    echo "✅ Erro corrigido"
else
    echo "✅ check-db.js está correto"
fi

# 3. Verificar schema.prisma
echo ""
echo "3️⃣ Verificando schema.prisma..."
if grep -q 'provider = "mysql"' prisma/schema.prisma; then
    echo "✅ Schema está configurado para MySQL"
else
    echo "⚠️  Corrigindo schema para MySQL..."
    sed -i 's/provider = "sqlite"/provider = "mysql"/' prisma/schema.prisma
    echo "✅ Schema corrigido"
fi

# 4. Verificar detalhes tem @db.Text
if grep -q 'detalhes.*@db.Text' prisma/schema.prisma; then
    echo "✅ Coluna detalhes tem @db.Text"
else
    echo "⚠️  Adicionando @db.Text na coluna detalhes..."
    sed -i 's/detalhes.*String?$/detalhes        String?   @db.Text/' prisma/schema.prisma
    echo "✅ @db.Text adicionado"
fi

# 5. Limpar Prisma Client antigo
echo ""
echo "4️⃣ Limpando Prisma Client antigo..."
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client

# 6. Gerar Prisma Client novo
echo ""
echo "5️⃣ Gerando novo Prisma Client..."
npx prisma generate

# 7. Limpar build antigo
echo ""
echo "6️⃣ Limpando build antigo..."
rm -rf .next

# 8. Fazer novo build
echo ""
echo "7️⃣ Fazendo build da aplicação..."
echo "⏳ Isso pode levar alguns minutos (5-10 minutos)..."
npm run build

# 9. Verificar se build foi criado
echo ""
echo "8️⃣ Verificando build..."
if [ -d ".next" ]; then
    echo "✅ Build criado com sucesso!"
    ls -la .next | head -5
else
    echo "❌ Erro: Build não foi criado"
    exit 1
fi

# 10. Reiniciar aplicação
echo ""
echo "9️⃣ Reiniciando aplicação..."
pm2 restart lotbicho || pm2 start npm --name lotbicho -- start

# 11. Verificar logs
echo ""
echo "🔟 Verificando logs (aguarde 5 segundos)..."
sleep 5
pm2 logs lotbicho --lines 30 --nostream

echo ""
echo "=== ✅ Processo concluído! ==="
echo ""
echo "📋 Se houver erros, verifique:"
echo "   - pm2 logs lotbicho --lines 50"
echo "   - pm2 status"
