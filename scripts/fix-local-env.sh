#!/bin/bash
# Script para corrigir .env local para desenvolvimento

set -e

echo "=== 🔧 Corrigindo .env local ==="
echo ""

# Fazer backup do .env atual
if [ -f .env ]; then
  echo "1️⃣ Fazendo backup do .env atual..."
  cp .env .env.backup.$(date +%Y%m%d-%H%M%S)
  echo "   ✅ Backup criado"
fi

# Verificar qual banco o usuário quer usar
echo ""
echo "2️⃣ Escolha o banco de dados para desenvolvimento local:"
echo "   1) MySQL (igual ao servidor - requer MySQL rodando)"
echo "   2) SQLite (mais fácil - não requer configuração)"
echo ""
read -p "   Escolha (1 ou 2): " DB_CHOICE

if [ "$DB_CHOICE" = "1" ]; then
  echo ""
  echo "   Configurando MySQL..."
  read -p "   Host MySQL (padrão: localhost): " MYSQL_HOST
  MYSQL_HOST=${MYSQL_HOST:-localhost}
  
  read -p "   Porta MySQL (padrão: 3306): " MYSQL_PORT
  MYSQL_PORT=${MYSQL_PORT:-3306}
  
  read -p "   Usuário MySQL (padrão: root): " MYSQL_USER
  MYSQL_USER=${MYSQL_USER:-root}
  
  read -sp "   Senha MySQL: " MYSQL_PASS
  echo ""
  
  read -p "   Nome do banco (padrão: admin_postenobicho): " MYSQL_DB
  MYSQL_DB=${MYSQL_DB:-admin_postenobicho}
  
  DATABASE_URL="mysql://${MYSQL_USER}:${MYSQL_PASS}@${MYSQL_HOST}:${MYSQL_PORT}/${MYSQL_DB}"
else
  echo ""
  echo "   Configurando SQLite..."
  DATABASE_URL="file:./prisma/dev.db"
fi

# Criar novo .env
echo ""
echo "3️⃣ Criando novo .env..."
cat > .env << EOF
# Banco de Dados
DATABASE_URL="${DATABASE_URL}"

# Autenticação
AUTH_SECRET="dev-secret-change-in-production"

# Ambiente
NODE_ENV=development
PORT=3000

# URLs
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
EOF

echo "   ✅ Arquivo .env criado!"

# Se for SQLite, atualizar schema temporariamente
if [ "$DB_CHOICE" = "2" ]; then
  echo ""
  echo "4️⃣ Atualizando schema para SQLite..."
  
  # Fazer backup do schema
  cp prisma/schema.prisma prisma/schema.prisma.backup
  
  # Substituir provider temporariamente
  sed -i '' 's/provider = "mysql"/provider = "sqlite"/' prisma/schema.prisma
  sed -i '' 's/@db.Text/TEXT/' prisma/schema.prisma || true
  
  echo "   ✅ Schema atualizado para SQLite"
  echo "   ⚠️  IMPORTANTE: Lembre-se de reverter para MySQL antes de fazer deploy!"
fi

# Gerar Prisma Client
echo ""
echo "5️⃣ Regenerando Prisma Client..."
npx prisma generate

# Se for MySQL, tentar conectar
if [ "$DB_CHOICE" = "1" ]; then
  echo ""
  echo "6️⃣ Testando conexão com MySQL..."
  node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    prisma.\$connect()
      .then(() => {
        console.log('   ✅ Conexão com MySQL OK!');
        prisma.\$disconnect();
      })
      .catch((e) => {
        console.log('   ❌ Erro ao conectar:', e.message);
        console.log('   Verifique se o MySQL está rodando e as credenciais estão corretas');
        process.exit(1);
      });
  "
fi

echo ""
echo "✅ Configuração concluída!"
echo ""
echo "📝 Próximos passos:"
if [ "$DB_CHOICE" = "2" ]; then
  echo "   1. Criar banco SQLite: npx prisma db push"
  echo "   2. Criar usuário admin: npm run create:admin"
  echo "   3. Iniciar servidor: npm run dev"
else
  echo "   1. Criar usuário admin: npm run create:admin"
  echo "   2. Iniciar servidor: npm run dev"
fi
