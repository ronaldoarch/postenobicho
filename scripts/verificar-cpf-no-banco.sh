#!/bin/bash

# Script para verificar se o campo CPF foi adicionado ao banco

SERVER="root@104.218.52.159"
APP_DIR="/var/www/postenobicho"

echo "=== 🔍 Verificando campo CPF no banco ==="
echo ""
echo "📝 Você precisará digitar a senha SSH: bicho@321"
echo ""

echo "1️⃣ Verificando schema.prisma no servidor..."
ssh $SERVER "cd $APP_DIR && grep -A 2 'cpf' prisma/schema.prisma | head -5"

echo ""
echo "2️⃣ Verificando estrutura da tabela Usuario no banco..."
ssh $SERVER "cd $APP_DIR && mysql -u admin_postenobicho -p\$(grep DATABASE_URL .env | cut -d'/' -f3 | cut -d'@' -f1) admin_postenobicho -e 'DESCRIBE Usuario;' 2>/dev/null || echo 'Precisa verificar manualmente'"

echo ""
echo "3️⃣ Verificando se há usuários com CPF..."
ssh $SERVER "cd $APP_DIR && npx prisma db execute --stdin <<< 'SELECT id, nome, email, cpf FROM Usuario LIMIT 5;' 2>/dev/null || echo 'Precisa verificar via Prisma Studio ou MySQL'"

echo ""
echo "=== ✅ Verificação concluída ==="
