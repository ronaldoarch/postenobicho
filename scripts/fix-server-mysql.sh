#!/bin/bash
# Script para corrigir configuração MySQL no servidor
# Execute este script no servidor via SSH

set -e

SERVER_IP="104.218.52.159"
SERVER_USER="root"
SERVER_PATH="/var/www/postenobicho"

echo "=== 🔧 Corrigindo configuração MySQL no servidor ==="
echo ""
echo "Este script vai:"
echo "1. Verificar o arquivo .env atual"
echo "2. Garantir que o schema.prisma está configurado para MySQL"
echo "3. Gerar Prisma Client"
echo "4. Executar migrações"
echo "5. Reiniciar a aplicação PM2"
echo ""

# Instruções para executar no servidor
cat << 'EOF'
# Execute estes comandos no servidor:

cd /var/www/postenobicho

echo "=== Verificando arquivo .env ==="
if [ -f .env ]; then
    echo "✅ Arquivo .env encontrado"
    echo "DATABASE_URL atual:"
    grep DATABASE_URL .env || echo "⚠️  DATABASE_URL não encontrada"
else
    echo "❌ Arquivo .env não encontrado!"
    exit 1
fi

echo ""
echo "=== Verificando schema.prisma ==="
if grep -q 'provider = "mysql"' prisma/schema.prisma; then
    echo "✅ Schema já está configurado para MySQL"
else
    echo "⚠️  Schema não está configurado para MySQL. Atualizando..."
    sed -i 's/provider = "sqlite"/provider = "mysql"/' prisma/schema.prisma
    echo "✅ Schema atualizado para MySQL"
fi

echo ""
echo "=== Gerando Prisma Client ==="
npx prisma generate

echo ""
echo "=== Executando migrações ==="
npx prisma migrate deploy || npx prisma db push

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
EOF

echo ""
echo "📋 Para executar no servidor:"
echo ""
echo "1. Conecte ao servidor:"
echo "   ssh ${SERVER_USER}@${SERVER_IP}"
echo ""
echo "2. Execute os comandos acima manualmente"
echo ""
echo "OU copie e cole este comando completo:"
echo ""
cat << 'COMMAND'
cd /var/www/postenobicho && \
sed -i 's/provider = "sqlite"/provider = "mysql"/' prisma/schema.prisma && \
npx prisma generate && \
npx prisma migrate deploy || npx prisma db push && \
pm2 restart lotbicho && \
pm2 logs lotbicho --lines 30
COMMAND
