#!/bin/bash
# Script para corrigir schema Prisma para MySQL no servidor
# Execute: ./scripts/fix-schema-mysql.sh

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🔧 Corrigindo Schema Prisma para MySQL ==="
echo ""
echo "📝 Você precisará digitar a senha SSH: bicho@321"
echo ""

# 1. Ler schema local e substituir provider
echo "1️⃣ Preparando schema com MySQL..."
# Criar schema temporário substituindo SQLite por MySQL
sed 's/provider = "sqlite"/provider = "mysql"/' "$LOCAL_DIR/prisma/schema.prisma" > /tmp/schema-mysql.prisma

# 2. Enviar schema corrigido
echo "2️⃣ Enviando schema corrigido para o servidor..."
rsync -avz /tmp/schema-mysql.prisma $SERVER:$SERVER_DIR/prisma/schema.prisma

# 3. Aplicar mudanças no servidor
echo ""
echo "3️⃣ Aplicando mudanças no banco de dados..."
ssh $SERVER << 'ENDSSH'
cd /var/www/postenobicho

echo "📋 Verificando provider atual..."
grep -A 1 "datasource db" prisma/schema.prisma

echo ""
echo "📋 Sincronizando schema com banco de dados..."
npx prisma db push --accept-data-loss --skip-generate

echo ""
echo "🔧 Regenerando Prisma Client..."
npx prisma generate

echo ""
echo "✅ Schema corrigido e Prisma Client regenerado!"
ENDSSH

# Limpar arquivo temporário
rm -f /tmp/schema-mysql.prisma

# 4. Reiniciar PM2
echo ""
echo "4️⃣ Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart lotbicho --update-env"

echo ""
echo "=== ✅ Correção concluída! ==="
echo ""
echo "📋 O que foi feito:"
echo "  ✅ Schema Prisma corrigido para MySQL"
echo "  ✅ Banco de dados sincronizado (colunas adicionadas)"
echo "  ✅ Prisma Client regenerado"
echo "  ✅ PM2 reiniciado"
echo ""
echo "🎉 Agora tente fazer login e salvar configurações novamente!"
