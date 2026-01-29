#!/bin/bash
# Script para configurar banco de dados local

set -e

echo "=== 🗄️  Configurando banco de dados local ==="
echo ""

# Verificar se MySQL está rodando
echo "1️⃣ Verificando MySQL..."
if mysql -u root -p'KeitaroBANCO2026' -e "SELECT 1" 2>/dev/null; then
  echo "   ✅ MySQL está acessível com as credenciais padrão"
  DB_TYPE="mysql"
elif mysql -u root -e "SELECT 1" 2>/dev/null; then
  echo "   ⚠️  MySQL está rodando mas precisa de senha diferente"
  DB_TYPE="mysql"
else
  echo "   ⚠️  MySQL não está acessível ou não está rodando"
  echo ""
  echo "   Opções:"
  echo "   1) Usar SQLite (mais fácil - não requer MySQL)"
  echo "   2) Configurar MySQL manualmente"
  echo ""
  read -p "   Escolha (1 ou 2): " CHOICE
  
  if [ "$CHOICE" = "1" ]; then
    DB_TYPE="sqlite"
  else
    DB_TYPE="mysql"
  fi
fi

# Configurar SQLite
if [ "$DB_TYPE" = "sqlite" ]; then
  echo ""
  echo "2️⃣ Configurando SQLite..."
  
  # Atualizar .env
  cat > .env << 'EOF'
# Banco de Dados SQLite (desenvolvimento local)
DATABASE_URL="file:./prisma/dev.db"

# Autenticação
AUTH_SECRET="dev-secret-change-in-production"

# Ambiente
NODE_ENV=development
PORT=3000

# URLs
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
EOF
  
  # Fazer backup do schema
  cp prisma/schema.prisma prisma/schema.prisma.mysql.backup
  
  # Criar schema temporário para SQLite
  cat > prisma/schema.sqlite.prisma << 'EOF'
// Schema temporário para SQLite (desenvolvimento local)
// IMPORTANTE: Use schema.prisma original para produção (MySQL)

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
EOF
  
  # Copiar models do schema original
  grep -A 1000 "^model" prisma/schema.prisma >> prisma/schema.sqlite.prisma
  
  # Remover atributos MySQL específicos para SQLite
  sed -i '' 's/@db.Text//g' prisma/schema.sqlite.prisma || true
  sed -i '' 's/  TEXT//g' prisma/schema.sqlite.prisma || true
  
  # Usar schema SQLite temporariamente
  cp prisma/schema.sqlite.prisma prisma/schema.prisma
  
  echo "   ✅ SQLite configurado"
  echo "   ⚠️  IMPORTANTE: Antes de fazer deploy, restaure o schema MySQL:"
  echo "      cp prisma/schema.prisma.mysql.backup prisma/schema.prisma"
  
  # Gerar Prisma Client
  echo ""
  echo "3️⃣ Gerando Prisma Client..."
  npx prisma generate
  
  # Criar banco
  echo ""
  echo "4️⃣ Criando banco de dados SQLite..."
  npx prisma db push --accept-data-loss
  
  echo ""
  echo "✅ SQLite configurado e pronto!"
  
else
  # Configurar MySQL
  echo ""
  echo "2️⃣ Configurando MySQL..."
  
  read -p "   Usuário MySQL (padrão: root): " MYSQL_USER
  MYSQL_USER=${MYSQL_USER:-root}
  
  read -sp "   Senha MySQL: " MYSQL_PASS
  echo ""
  
  read -p "   Host (padrão: localhost): " MYSQL_HOST
  MYSQL_HOST=${MYSQL_HOST:-localhost}
  
  read -p "   Porta (padrão: 3306): " MYSQL_PORT
  MYSQL_PORT=${MYSQL_PORT:-3306}
  
  read -p "   Nome do banco (padrão: admin_postenobicho): " MYSQL_DB
  MYSQL_DB=${MYSQL_DB:-admin_postenobicho}
  
  # Testar conexão
  echo ""
  echo "3️⃣ Testando conexão..."
  if mysql -u "$MYSQL_USER" -p"$MYSQL_PASS" -h "$MYSQL_HOST" -P "$MYSQL_PORT" -e "SELECT 1" 2>/dev/null; then
    echo "   ✅ Conexão OK!"
  else
    echo "   ❌ Não foi possível conectar ao MySQL"
    echo "   Verifique se o MySQL está rodando e as credenciais estão corretas"
    exit 1
  fi
  
  # Criar banco se não existir
  echo ""
  echo "4️⃣ Criando banco de dados se não existir..."
  mysql -u "$MYSQL_USER" -p"$MYSQL_PASS" -h "$MYSQL_HOST" -P "$MYSQL_PORT" -e "CREATE DATABASE IF NOT EXISTS \`$MYSQL_DB\`;" 2>/dev/null || true
  
  # Atualizar .env
  cat > .env << EOF
# Banco de Dados MySQL
DATABASE_URL="mysql://${MYSQL_USER}:${MYSQL_PASS}@${MYSQL_HOST}:${MYSQL_PORT}/${MYSQL_DB}"

# Autenticação
AUTH_SECRET="dev-secret-change-in-production"

# Ambiente
NODE_ENV=development
PORT=3000

# URLs
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
EOF
  
  # Gerar Prisma Client
  echo ""
  echo "5️⃣ Gerando Prisma Client..."
  npx prisma generate
  
  # Aplicar schema
  echo ""
  echo "6️⃣ Aplicando schema ao banco..."
  npx prisma db push --accept-data-loss
  
  echo ""
  echo "✅ MySQL configurado e pronto!"
fi

echo ""
echo "📝 Próximos passos:"
echo "   1. Criar usuário admin: npm run create:admin"
echo "   2. Iniciar servidor: npm run dev"
