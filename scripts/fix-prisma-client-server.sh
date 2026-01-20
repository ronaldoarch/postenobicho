#!/bin/bash
# Script para corrigir Prisma Client no servidor
# Execute este script no servidor

set -e

cd /var/www/postenobicho

echo "=== 🔧 Corrigindo Prisma Client no servidor ==="
echo ""

# 1. Verificar schema.prisma
echo "1️⃣ Verificando schema.prisma..."
if grep -q 'provider = "mysql"' prisma/schema.prisma; then
    echo "✅ Schema está configurado para MySQL"
else
    echo "❌ Schema está configurado para SQLite. Corrigindo..."
    sed -i 's/provider = "sqlite"/provider = "mysql"/' prisma/schema.prisma
    echo "✅ Schema corrigido para MySQL"
fi

# 2. Verificar detalhes tem @db.Text
echo ""
echo "2️⃣ Verificando coluna detalhes..."
if grep -q 'detalhes.*@db.Text' prisma/schema.prisma; then
    echo "✅ Coluna detalhes tem @db.Text"
else
    echo "⚠️  Coluna detalhes não tem @db.Text. Adicionando..."
    sed -i 's/detalhes.*String?$/detalhes        String?   @db.Text/' prisma/schema.prisma
    echo "✅ @db.Text adicionado"
fi

# 3. Limpar Prisma Client antigo
echo ""
echo "3️⃣ Limpando Prisma Client antigo..."
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client

# 4. Gerar Prisma Client novo
echo ""
echo "4️⃣ Gerando novo Prisma Client..."
npx prisma generate

# 5. Limpar build antigo (importante!)
echo ""
echo "5️⃣ Limpando build antigo..."
rm -rf .next

# 6. Fazer novo build
echo ""
echo "6️⃣ Fazendo novo build..."
npm run build

# 7. Reiniciar aplicação
echo ""
echo "7️⃣ Reiniciando aplicação..."
pm2 restart lotbicho

# 8. Verificar logs
echo ""
echo "8️⃣ Verificando logs..."
sleep 3
pm2 logs lotbicho --lines 20 --nostream

echo ""
echo "=== ✅ Processo concluído! ==="
