#!/bin/bash

# Script para verificar e atualizar o schema.prisma no servidor

SERVER="root@104.218.52.159"
APP_DIR="/var/www/postenobicho"

echo "=== 🔍 Verificando e Atualizando Schema ==="
echo ""
echo "📝 Você precisará digitar a senha SSH: bicho@321"
echo ""

echo "1️⃣ Verificando se o schema no servidor tem campo CPF..."
ssh $SERVER "cd $APP_DIR && grep -A 2 'cpf' prisma/schema.prisma || echo '❌ Campo CPF não encontrado no schema'"

echo ""
echo "2️⃣ Enviando schema atualizado..."
scp prisma/schema.prisma $SERVER:$APP_DIR/prisma/schema.prisma

echo ""
echo "3️⃣ Aplicando mudanças no banco..."
ssh $SERVER "cd $APP_DIR && npx prisma db push"

echo ""
echo "4️⃣ Verificando novamente..."
ssh $SERVER "cd $APP_DIR && grep -A 2 'cpf' prisma/schema.prisma"

echo ""
echo "=== ✅ Atualização concluída ==="
