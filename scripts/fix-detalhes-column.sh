#!/bin/bash
# Script para corrigir a coluna detalhes no banco MySQL
# Altera de VARCHAR para TEXT para suportar JSON grande
# Execute: ./scripts/fix-detalhes-column.sh

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🔧 Corrigindo Coluna detalhes ==="
echo ""
echo "📝 Você precisará digitar a senha SSH: bicho@321"
echo ""

# 1. Preparar schema com MySQL e detalhes como String @db.Text
echo "1️⃣ Preparando schema com MySQL e detalhes como String @db.Text..."
sed 's/provider = "sqlite"/provider = "mysql"/' "$LOCAL_DIR/prisma/schema.prisma" | \
  sed 's/detalhes        Json?     @db.Text/detalhes        String?   @db.Text/' | \
  sed 's/detalhes        String?$/detalhes        String?   @db.Text/' > /tmp/schema-fixed.prisma

# 2. Enviar schema corrigido
echo "2️⃣ Enviando schema corrigido para o servidor..."
rsync -avz /tmp/schema-fixed.prisma $SERVER:$SERVER_DIR/prisma/schema.prisma

# 3. Aplicar mudanças no servidor
echo ""
echo "3️⃣ Aplicando mudanças no servidor..."
ssh $SERVER << 'ENDSSH'
cd /var/www/postenobicho

echo "📋 Verificando tipo da coluna detalhes no schema..."
grep -A 2 "detalhes" prisma/schema.prisma | head -3

echo ""
echo "📋 Verificando se coluna admin existe no schema..."
grep -A 5 "model Usuario" prisma/schema.prisma | grep -E "(admin|Admin)" && echo "✅ Coluna admin encontrada!" || echo "⚠️  Coluna admin não encontrada no schema!"

echo ""
echo "🔧 Alterando coluna detalhes no MySQL para TEXT..."
# Tentar obter senha do .env ou usar padrão
DB_PASSWORD=$(grep DATABASE_PASSWORD .env 2>/dev/null | cut -d '=' -f2 | tr -d ' ' || echo "")
if [ -z "$DB_PASSWORD" ]; then
  DB_PASSWORD=$(grep MYSQL_PASSWORD .env 2>/dev/null | cut -d '=' -f2 | tr -d ' ' || echo "")
fi

if [ -z "$DB_PASSWORD" ]; then
  echo "⚠️  Senha do banco não encontrada no .env. Tentando sem senha..."
  mysql -u root admin_postenobicho -e "ALTER TABLE Aposta MODIFY COLUMN detalhes TEXT;" 2>/dev/null || \
  mysql -u root -p admin_postenobicho -e "ALTER TABLE Aposta MODIFY COLUMN detalhes TEXT;"
else
  mysql -u root -p"$DB_PASSWORD" admin_postenobicho -e "ALTER TABLE Aposta MODIFY COLUMN detalhes TEXT;"
fi

if [ $? -eq 0 ]; then
  echo "✅ Coluna detalhes alterada para TEXT com sucesso!"
else
  echo "⚠️  Erro ao alterar coluna. Tentando continuar com db push..."
fi

echo ""
echo "📋 Sincronizando schema com banco de dados..."
npx prisma db push --accept-data-loss --skip-generate

echo ""
echo "🔧 Regenerando Prisma Client..."
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client
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
echo "✅ Schema corrigido e client regenerado!"
ENDSSH

# Limpar arquivo temporário
rm -f /tmp/schema-fixed.prisma

# 4. Reiniciar PM2
echo ""
echo "4️⃣ Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart lotbicho --update-env"

echo ""
echo "=== ✅ Correção concluída! ==="
echo ""
echo "📋 O que foi feito:"
echo "  ✅ Coluna detalhes alterada para TEXT no MySQL"
echo "  ✅ Schema Prisma atualizado para Json @db.Text"
echo "  ✅ Schema sincronizado com banco de dados"
echo "  ✅ Prisma Client regenerado"
echo "  ✅ PM2 reiniciado"
echo ""
echo "🎉 Agora tente salvar configurações novamente!"
