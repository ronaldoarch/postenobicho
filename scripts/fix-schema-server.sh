#!/bin/bash
# Script para corrigir schema.prisma no servidor
# Execute este script no servidor

set -e

cd /var/www/postenobicho

echo "=== 🔧 Corrigindo schema.prisma no servidor ==="
echo ""

# 1. Verificar schema atual
echo "1️⃣ Verificando schema.prisma atual..."
if grep -q "detalhes.*@db.Text" prisma/schema.prisma; then
    echo "✅ Schema já tem @db.Text na coluna detalhes"
else
    echo "⚠️  Schema precisa ser atualizado"
    echo "Atualizando..."
    
    # Atualizar linha detalhes para incluir @db.Text
    sed -i 's/detalhes.*String?$/detalhes        String?   @db.Text/' prisma/schema.prisma
    
    echo "✅ Schema atualizado"
fi

# 2. Verificar se a alteração foi aplicada
echo ""
echo "2️⃣ Verificando alteração..."
grep "detalhes" prisma/schema.prisma

# 3. Verificar se coluna no banco está como TEXT
echo ""
echo "3️⃣ Verificando coluna no banco..."
mysql -u admin_postenobicho -p'KeitaroBANCO2026' admin_postenobicho -e "SHOW COLUMNS FROM Aposta WHERE Field = 'detalhes';"

# 4. Gerar Prisma Client
echo ""
echo "4️⃣ Gerando Prisma Client..."
npx prisma generate

# 5. Tentar sincronizar novamente (sem gerar, já que geramos acima)
echo ""
echo "5️⃣ Sincronizando schema..."
npx prisma db push --accept-data-loss --skip-generate

echo ""
echo "=== ✅ Processo concluído! ==="
