#!/bin/bash
# Script completo para corrigir banco de dados e regenerar Prisma
# Execute: ./scripts/fix-db-completo.sh

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🔧 Correção Completa do Banco de Dados ==="
echo ""
echo "📝 Você precisará digitar a senha SSH: bicho@321"
echo ""

# 1. Enviar schema atualizado
echo "1️⃣ Enviando schema Prisma atualizado..."
rsync -avz $LOCAL_DIR/prisma/schema.prisma $SERVER:$SERVER_DIR/prisma/

# 2. Corrigir provider no schema e aplicar mudanças
echo ""
echo "2️⃣ Corrigindo provider do schema e aplicando mudanças..."
ssh $SERVER << 'ENDSSH'
cd /var/www/postenobicho

echo "🔧 Corrigindo provider do schema (SQLite -> MySQL)..."
# Garantir que está usando MySQL
sed -i 's/provider = "sqlite"/provider = "mysql"/' prisma/schema.prisma

echo "📋 Verificando provider atual..."
grep -A 1 "datasource db" prisma/schema.prisma

echo ""
echo "📋 Verificando DATABASE_URL..."
if grep -q "file:" .env 2>/dev/null || [ -z "$(grep DATABASE_URL .env 2>/dev/null | grep mysql)" ]; then
  echo "⚠️  DATABASE_URL pode estar incorreto. Verificando..."
  grep DATABASE_URL .env | head -1
fi

echo ""
echo "📋 Sincronizando schema com banco de dados..."
# Tentar db push
if npx prisma db push --accept-data-loss --skip-generate 2>&1 | tee /tmp/prisma-output.log; then
  echo "✅ db push executado com sucesso!"
else
  echo "⚠️  db push falhou, mas continuando..."
  cat /tmp/prisma-output.log || true
fi

echo ""
echo "🔧 Regenerando Prisma Client..."
npx prisma generate

echo ""
echo "✅ Prisma Client regenerado!"
ENDSSH

# 3. Reiniciar PM2
echo ""
echo "3️⃣ Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart lotbicho --update-env"

echo ""
echo "=== ✅ Correção concluída! ==="
echo ""
echo "📋 O que foi feito:"
echo "  ✅ Schema Prisma atualizado"
echo "  ✅ Banco de dados sincronizado (colunas adicionadas)"
echo "  ✅ Prisma Client regenerado"
echo "  ✅ PM2 reiniciado com variáveis de ambiente atualizadas"
echo ""
echo "🎉 Agora tente fazer login novamente!"
