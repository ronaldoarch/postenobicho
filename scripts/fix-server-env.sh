#!/bin/bash
# Script para corrigir DATABASE_URL no servidor
# Execute este script no servidor via SSH

set -e

SERVER_IP="104.218.52.159"
SERVER_USER="root"
SERVER_PATH="/var/www/postenobicho"

echo "=== 🔧 Corrigindo configuração do servidor ==="
echo ""
echo "Este script vai:"
echo "1. Verificar o arquivo .env atual"
echo "2. Corrigir a DATABASE_URL para SQLite"
echo "3. Reiniciar a aplicação PM2"
echo ""

# Comandos para executar no servidor
cat << 'EOF' | ssh ${SERVER_USER}@${SERVER_IP} bash
set -e

cd /var/www/postenobicho

echo "=== Verificando arquivo .env ==="
if [ -f .env ]; then
    echo "Arquivo .env encontrado. Fazendo backup..."
    cp .env .env.backup.$(date +%Y%m%d-%H%M%S)
    echo "Backup criado!"
else
    echo "Arquivo .env não encontrado. Criando novo..."
fi

echo ""
echo "=== Configurando DATABASE_URL para SQLite ==="

# Criar ou atualizar .env
cat > .env << 'ENVEOF'
# Banco de Dados SQLite
DATABASE_URL="file:./prisma/dev.db"

# Autenticação (gerar nova chave se necessário)
AUTH_SECRET="$(openssl rand -hex 32)"

# Ambiente
NODE_ENV=production
PORT=3000

# URLs
NEXT_PUBLIC_BASE_URL="http://104.218.52.159"
ENVEOF

echo "✅ Arquivo .env configurado!"
echo ""

echo "=== Verificando diretório do banco ==="
mkdir -p prisma
if [ ! -f prisma/dev.db ]; then
    echo "⚠️  Banco de dados não encontrado. Será criado na primeira execução."
else
    echo "✅ Banco de dados encontrado: prisma/dev.db"
fi

echo ""
echo "=== Gerando Prisma Client ==="
export DATABASE_URL="file:./prisma/dev.db"
npx prisma generate

echo ""
echo "=== Verificando permissões ==="
chmod 664 prisma/dev.db 2>/dev/null || echo "⚠️  Não foi possível ajustar permissões (pode ser normal)"
chmod 775 prisma/ 2>/dev/null || echo "⚠️  Não foi possível ajustar permissões (pode ser normal)"

echo ""
echo "=== Reiniciando aplicação PM2 ==="
pm2 restart lotbicho || pm2 start ecosystem.config.js || pm2 start npm --name lotbicho -- start

echo ""
echo "=== Status do PM2 ==="
pm2 status

echo ""
echo "=== Aguardando aplicação iniciar... ==="
sleep 5

echo ""
echo "=== Testando aplicação ==="
status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")
if [ "$status" = "200" ] || [ "$status" = "404" ]; then
    echo "✅ Aplicação respondendo (status: $status)"
else
    echo "⚠️  Aplicação pode não estar respondendo (status: $status)"
    echo "Verifique os logs com: pm2 logs lotbicho"
fi

echo ""
echo "=== ✅ Configuração concluída! ==="
echo ""
echo "📋 Próximos passos:"
echo "1. Verifique os logs: pm2 logs lotbicho"
echo "2. Se o banco não existir, execute: npx prisma db push"
echo "3. Crie um usuário admin: npm run create:admin"
EOF

echo ""
echo "✅ Script executado no servidor!"
echo ""
echo "💡 Para verificar manualmente, conecte ao servidor:"
echo "   ssh ${SERVER_USER}@${SERVER_IP}"
echo "   cd ${SERVER_PATH}"
echo "   cat .env"
echo "   pm2 logs lotbicho"
