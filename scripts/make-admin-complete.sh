#!/bin/bash
# Script completo para tornar admin@postenobicho.com em admin
# Execute este script do seu Mac

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 👤 Tornando admin@postenobicho.com em admin ==="
echo ""

# 1. Enviar schema atualizado
echo "1️⃣ Enviando schema atualizado..."
scp "$LOCAL_DIR/prisma/schema.prisma" $SERVER:$SERVER_DIR/prisma/schema.prisma

# 2. Enviar script TypeScript
echo ""
echo "2️⃣ Enviando script TypeScript..."
scp "$LOCAL_DIR/scripts/make-user-admin.ts" $SERVER:$SERVER_DIR/scripts/make-user-admin.ts

# 3. Enviar script SQL (backup)
echo ""
echo "3️⃣ Enviando script SQL..."
scp "$LOCAL_DIR/scripts/make-user-admin.sql" $SERVER:$SERVER_DIR/scripts/make-user-admin.sql

# 4. Atualizar schema no banco de dados
echo ""
echo "4️⃣ Atualizando schema no banco de dados..."
ssh $SERVER "cd $SERVER_DIR && npx prisma db push --accept-data-loss"

# 5. Regenerar Prisma Client
echo ""
echo "5️⃣ Regenerando Prisma Client..."
ssh $SERVER "cd $SERVER_DIR && npx prisma generate"

# 6. Executar script TypeScript para tornar usuário admin
echo ""
echo "6️⃣ Tornando usuário admin@postenobicho.com em admin..."
ssh $SERVER "cd $SERVER_DIR && npx tsx scripts/make-user-admin.ts"

echo ""
echo "✅ Processo concluído!"
echo ""
echo "📝 O usuário admin@postenobicho.com agora é admin!"
