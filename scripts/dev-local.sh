#!/bin/bash
# Script para iniciar ambiente de desenvolvimento local

set -e

echo "=== 🚀 Preparando ambiente de desenvolvimento local ==="
echo ""

# 1. Verificar se .env existe
echo "1️⃣ Verificando arquivo .env..."
if [ ! -f .env ]; then
  echo "   ⚠️  Arquivo .env não encontrado!"
  echo "   Criando .env de exemplo..."
  cat > .env << 'EOF'
# Banco de Dados
# Para desenvolvimento local, você pode usar SQLite ou MySQL
# SQLite (mais fácil para testes):
# DATABASE_URL="file:./prisma/dev.db"
# MySQL (igual ao servidor):
DATABASE_URL="mysql://root:KeitaroBANCO2026@localhost:3306/admin_postenobicho"

# Autenticação
AUTH_SECRET="dev-secret-change-in-production"

# Ambiente
NODE_ENV=development
PORT=3000

# URLs
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
EOF
  echo "   ✅ Arquivo .env criado!"
  echo "   ⚠️  IMPORTANTE: Configure o DATABASE_URL conforme seu ambiente"
else
  echo "   ✅ Arquivo .env encontrado"
fi

# 2. Verificar se node_modules existe
echo ""
echo "2️⃣ Verificando dependências..."
if [ ! -d "node_modules" ]; then
  echo "   ⚠️  node_modules não encontrado!"
  echo "   Instalando dependências..."
  npm install
else
  echo "   ✅ Dependências instaladas"
fi

# 3. Gerar Prisma Client
echo ""
echo "3️⃣ Gerando Prisma Client..."
npx prisma generate

# 4. Verificar banco de dados
echo ""
echo "4️⃣ Verificando banco de dados..."
if grep -q "file:" .env 2>/dev/null; then
  echo "   Usando SQLite (desenvolvimento)"
  if [ ! -f "prisma/dev.db" ]; then
    echo "   ⚠️  Banco SQLite não encontrado. Criando..."
    npx prisma db push --accept-data-loss
  else
    echo "   ✅ Banco SQLite encontrado"
  fi
else
  echo "   Usando MySQL"
  echo "   Verificando conexão..."
  # Tentar conectar ao MySQL (não falhar se não conseguir)
  node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    prisma.\$connect()
      .then(() => {
        console.log('   ✅ Conexão com MySQL OK');
        prisma.\$disconnect();
      })
      .catch((e) => {
        console.log('   ⚠️  Não foi possível conectar ao MySQL:', e.message);
        console.log('   Certifique-se de que o MySQL está rodando e o DATABASE_URL está correto');
        process.exit(0);
      });
  " || echo "   ⚠️  Não foi possível verificar MySQL"
fi

# 5. Verificar se porta 3000 está livre
echo ""
echo "5️⃣ Verificando porta 3000..."
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
  echo "   ⚠️  Porta 3000 já está em uso!"
  echo "   Processo usando a porta:"
  lsof -Pi :3000 -sTCP:LISTEN
  echo ""
  read -p "   Deseja parar o processo? (s/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Ss]$ ]]; then
    lsof -ti :3000 | xargs kill -9 2>/dev/null || true
    echo "   ✅ Processo parado"
  else
    echo "   ⚠️  Você pode usar outra porta: PORT=3001 npm run dev"
  fi
else
  echo "   ✅ Porta 3000 está livre"
fi

echo ""
echo "✅ Ambiente preparado!"
echo ""
echo "📝 Para iniciar o servidor de desenvolvimento:"
echo "   npm run dev"
echo ""
echo "📝 Para iniciar em outra porta:"
echo "   PORT=3001 npm run dev"
echo ""
echo "📝 Para acessar:"
echo "   http://localhost:3000"
echo ""
echo "📝 Para criar usuário admin:"
echo "   npm run create:admin"
