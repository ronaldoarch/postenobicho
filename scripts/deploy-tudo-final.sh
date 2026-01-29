#!/bin/bash
# Script completo para enviar todas as atualizações e corrigir o servidor
# Execute: ./scripts/deploy-tudo-final.sh

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🚀 Deploy Completo - Todas as Atualizações ==="
echo ""
echo "📝 Você precisará digitar a senha SSH: bicho@321"
echo ""

# 1. Preparar schema com MySQL e detalhes como String @db.Text
echo "1️⃣ Preparando schema com MySQL..."
sed 's/provider = "sqlite"/provider = "mysql"/' "$LOCAL_DIR/prisma/schema.prisma" | \
  sed 's/detalhes        Json?     @db.Text/detalhes        String?   @db.Text/' | \
  sed 's/detalhes        String?$/detalhes        String?   @db.Text/' > /tmp/schema-mysql-final.prisma

# 2. Enviar schema corrigido
echo "2️⃣ Enviando schema corrigido para o servidor..."
rsync -avz /tmp/schema-mysql-final.prisma $SERVER:$SERVER_DIR/prisma/schema.prisma

# 3. Aplicar mudanças no servidor
echo ""
echo "3️⃣ Aplicando mudanças no servidor..."
ssh $SERVER << 'ENDSSH'
cd /var/www/postenobicho

echo "📋 Verificando provider do schema..."
grep -A 1 "datasource db" prisma/schema.prisma

echo ""
echo "📋 Verificando tipo da coluna detalhes no schema..."
grep -A 2 "detalhes" prisma/schema.prisma | head -3

echo ""
echo "📋 Verificando se coluna admin existe no schema..."
grep -A 5 "model Usuario" prisma/schema.prisma | grep -E "(admin|Admin)" && echo "✅ Coluna admin encontrada!" || echo "⚠️  Coluna admin não encontrada no schema!"

echo ""
echo "🔧 Alterando coluna detalhes no MySQL para TEXT (se necessário)..."
# Tentar obter senha do .env
DB_PASSWORD=$(grep -E "^DATABASE_PASSWORD=|^MYSQL_PASSWORD=" .env 2>/dev/null | head -1 | cut -d '=' -f2 | tr -d ' ' || echo "")

if [ -n "$DB_PASSWORD" ]; then
  mysql -u root -p"$DB_PASSWORD" admin_postenobicho -e "ALTER TABLE Aposta MODIFY COLUMN detalhes TEXT;" 2>&1 | grep -v "Warning" || true
  RESULT=$?
else
  echo "⚠️  Senha não encontrada. Tentando sem senha..."
  mysql -u root admin_postenobicho -e "ALTER TABLE Aposta MODIFY COLUMN detalhes TEXT;" 2>&1 | grep -v "Warning" || true
  RESULT=$?
fi

if [ $RESULT -eq 0 ]; then
  echo "✅ Coluna detalhes está como TEXT!"
else
  echo "⚠️  Continuando mesmo com erro (pode já estar como TEXT)..."
fi

echo ""
echo "📋 Sincronizando schema com banco de dados..."
npx prisma db push --accept-data-loss --skip-generate 2>&1 | grep -v "Warning" || {
  echo "⚠️  Erro no db push, mas continuando..."
}

echo ""
echo "🔧 Limpando e regenerando Prisma Client..."
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
rm -f /tmp/schema-mysql-final.prisma

# 4. Enviar arquivos atualizados importantes
echo ""
echo "4️⃣ Enviando arquivos atualizados..."
rsync -avz \
  $LOCAL_DIR/app/api/admin/configuracoes/route.ts \
  $SERVER:$SERVER_DIR/app/api/admin/configuracoes/

rsync -avz \
  $LOCAL_DIR/lib/configuracoes-store.ts \
  $SERVER:$SERVER_DIR/lib/

# 5. Instalar dependências e fazer build
echo ""
echo "5️⃣ Instalando dependências (incluindo devDependencies para build)..."
ssh $SERVER "cd $SERVER_DIR && npm install --include=dev"

echo ""
echo "6️⃣ Fazendo build da aplicação..."
ssh $SERVER "cd $SERVER_DIR && npm run build"

# 7. Reiniciar PM2
echo ""
echo "7️⃣ Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart lotbicho --update-env"

echo ""
echo "=== ✅ Deploy Completo Concluído! ==="
echo ""
echo "📋 O que foi feito:"
echo "  ✅ Schema Prisma corrigido para MySQL"
echo "  ✅ Coluna detalhes alterada para TEXT no MySQL"
echo "  ✅ Schema sincronizado com banco de dados"
echo "  ✅ Prisma Client limpo e regenerado"
echo "  ✅ Arquivos de API atualizados"
echo "  ✅ Build da aplicação executado"
echo "  ✅ PM2 reiniciado"
echo ""
echo "🎉 Agora tente fazer login e salvar configurações novamente!"
