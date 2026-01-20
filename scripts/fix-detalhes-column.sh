#!/bin/bash
# Script para corrigir a coluna detalhes no MySQL
# Execute este script no servidor

set -e

cd /var/www/postenobicho

echo "=== 🔧 Corrigindo coluna detalhes ==="
echo ""

# 1. Alterar coluna no banco
echo "1️⃣ Alterando coluna detalhes para TEXT..."
mysql -u admin_postenobicho -p'KeitaroBANCO2026' admin_postenobicho << 'EOF'
ALTER TABLE Aposta MODIFY COLUMN detalhes TEXT;
SHOW COLUMNS FROM Aposta WHERE Field = 'detalhes';
EOF

if [ $? -eq 0 ]; then
    echo "✅ Coluna alterada com sucesso!"
else
    echo "❌ Erro ao alterar coluna"
    exit 1
fi

# 2. Verificar schema.prisma
echo ""
echo "2️⃣ Verificando schema.prisma..."
if grep -q '@db.Text' prisma/schema.prisma | grep -q 'detalhes'; then
    echo "✅ Schema.prisma já está correto"
else
    echo "⚠️  Schema.prisma precisa ser atualizado"
    echo "A coluna detalhes deve ter @db.Text"
fi

# 3. Gerar Prisma Client novamente
echo ""
echo "3️⃣ Gerando Prisma Client..."
npx prisma generate

# 4. Tentar db push novamente
echo ""
echo "4️⃣ Sincronizando schema com banco..."
npx prisma db push --skip-generate

echo ""
echo "=== ✅ Correção concluída! ==="
echo ""
echo "📋 Próximos passos:"
echo "1. Reiniciar aplicação: pm2 restart lotbicho"
echo "2. Verificar logs: pm2 logs lotbicho --lines 30"
