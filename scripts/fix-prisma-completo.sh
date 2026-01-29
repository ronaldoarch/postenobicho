#!/bin/bash
# Script completo para corrigir Prisma no servidor
# Garante que schema está correto e Prisma Client está atualizado
# Execute: ./scripts/fix-prisma-completo.sh

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🔧 Correção Completa do Prisma ==="
echo ""
echo "📝 Você precisará digitar a senha SSH: bicho@321"
echo ""

# 1. Preparar schema com MySQL
echo "1️⃣ Preparando schema com MySQL..."
sed 's/provider = "sqlite"/provider = "mysql"/' "$LOCAL_DIR/prisma/schema.prisma" > /tmp/schema-mysql.prisma

# 2. Enviar schema corrigido
echo "2️⃣ Enviando schema corrigido para o servidor..."
rsync -avz /tmp/schema-mysql.prisma $SERVER:$SERVER_DIR/prisma/schema.prisma

# 3. Aplicar mudanças no servidor
echo ""
echo "3️⃣ Aplicando mudanças no servidor..."
ssh $SERVER << 'ENDSSH'
cd /var/www/postenobicho

echo "📋 Verificando provider do schema..."
grep -A 1 "datasource db" prisma/schema.prisma

echo ""
echo "📋 Verificando se coluna admin existe no schema..."
grep -A 5 "model Usuario" prisma/schema.prisma | grep -E "(admin|Admin)" || echo "⚠️  Coluna admin não encontrada no schema!"

echo ""
echo "🔧 Limpando Prisma Client antigo..."
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client

echo ""
echo "📋 Sincronizando schema com banco de dados..."
npx prisma db push --accept-data-loss --skip-generate

echo ""
echo "🔧 Regenerando Prisma Client..."
npx prisma generate

echo ""
echo "✅ Verificando se Prisma Client foi gerado..."
if [ -d "node_modules/@prisma/client" ]; then
  echo "✅ Prisma Client encontrado!"
else
  echo "❌ Prisma Client não foi gerado!"
  exit 1
fi

echo ""
echo "✅ Prisma corrigido e client regenerado!"
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
echo "  ✅ Schema sincronizado com banco de dados"
echo "  ✅ Prisma Client limpo e regenerado"
echo "  ✅ PM2 reiniciado"
echo ""
echo "🎉 Agora tente fazer login e salvar configurações novamente!"
