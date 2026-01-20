#!/bin/bash
# Script para configurar ambiente de desenvolvimento local

echo "=== 🔧 Configurando ambiente de desenvolvimento ==="

# Criar .env.local se não existir
if [ ! -f .env.local ]; then
    echo "📝 Criando .env.local..."
    cat > .env.local << 'EOF'
# Configuração para desenvolvimento local com SQLite
DATABASE_URL="file:./dev.db"
AUTH_SECRET="dev-secret-local"
EOF
fi

# Garantir que o schema está configurado para SQLite
echo "🔄 Verificando schema do Prisma..."
if grep -q 'provider = "mysql"' prisma/schema.prisma; then
    echo "⚠️  Schema está configurado para MySQL. Mudando para SQLite..."
    sed -i '' 's/provider = "mysql"/provider = "sqlite"/' prisma/schema.prisma
fi

# Gerar Prisma Client e criar banco
echo "📦 Gerando Prisma Client..."
export DATABASE_URL="file:./dev.db"
npx prisma generate

echo "🗄️  Criando banco de dados..."
npx prisma db push --skip-generate

# Criar usuário admin se não existir
echo "👤 Criando usuário admin..."
export AUTH_SECRET="dev-secret-local"
npm run create:admin

echo ""
echo "✅ Ambiente de desenvolvimento configurado!"
echo ""
echo "📝 Credenciais do admin:"
echo "   Email: admin@postenobicho.com"
echo "   Senha: admin123"
echo ""
echo "🚀 Para iniciar o servidor:"
echo "   npm run dev"
