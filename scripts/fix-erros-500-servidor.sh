#!/bin/bash
# Script para corrigir erros 500 no servidor
# Execute: ./scripts/fix-erros-500-servidor.sh

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🔧 Corrigindo Erros 500 no Servidor ==="
echo ""
echo "📝 Você precisará digitar a senha SSH quando solicitado"
echo ""

# 1. Verificar logs do PM2
echo "1️⃣ Verificando logs do PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 logs lotbicho --lines 30 --nostream" || echo "⚠️  Não foi possível verificar logs"

# 2. Parar PM2
echo ""
echo "2️⃣ Parando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 stop lotbicho || true"
sleep 2

# 3. Verificar e corrigir schema Prisma
echo ""
echo "3️⃣ Verificando schema Prisma no servidor..."
ssh $SERVER "cd $SERVER_DIR && cat prisma/schema.prisma | grep -A 5 'model PagamentoPix' || echo '⚠️  Modelo PagamentoPix não encontrado'"

# 4. Garantir que o schema está correto
echo ""
echo "4️⃣ Enviando schema Prisma atualizado..."
rsync -avz \
  "$LOCAL_DIR/prisma/schema.prisma" \
  "$SERVER:$SERVER_DIR/prisma/"

# 5. Regenerar Prisma Client
echo ""
echo "5️⃣ Regenerando Prisma Client..."
ssh $SERVER "cd $SERVER_DIR && npx prisma generate"

# 6. Verificar se há campos faltando no schema
echo ""
echo "6️⃣ Verificando campos no schema..."
ssh $SERVER "cd $SERVER_DIR && grep -q 'transactionId' prisma/schema.prisma && echo '✅ transactionId encontrado' || echo '❌ transactionId NÃO encontrado'"
ssh $SERVER "cd $SERVER_DIR && grep -q 'status.*String.*default' prisma/schema.prisma | grep PagamentoPix && echo '✅ status encontrado' || echo '⚠️  Verificando status...'"

# 7. Instalar dependências se necessário
echo ""
echo "7️⃣ Verificando dependências..."
ssh $SERVER "cd $SERVER_DIR && npm install"

# 8. Limpar build antigo
echo ""
echo "8️⃣ Limpando build antigo..."
ssh $SERVER "cd $SERVER_DIR && rm -rf .next .next/cache 2>/dev/null || true"

# 9. Fazer build
echo ""
echo "9️⃣ Fazendo build (isso pode demorar alguns minutos)..."
ssh $SERVER "cd $SERVER_DIR && npm run build 2>&1 | tail -100"

# 10. Verificar se build foi criado
echo ""
echo "🔟 Verificando se build foi criado..."
if ssh $SERVER "cd $SERVER_DIR && test -d .next"; then
    echo "✅ Build criado com sucesso!"
else
    echo "❌ Erro: Build não foi criado"
    exit 1
fi

# 11. Reiniciar PM2
echo ""
echo "1️⃣1️⃣ Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart lotbicho --update-env"
sleep 5

# 12. Verificar logs novamente
echo ""
echo "1️⃣2️⃣ Verificando logs após reiniciar..."
ssh $SERVER "cd $SERVER_DIR && pm2 logs lotbicho --lines 20 --nostream"

# 13. Testar APIs críticas
echo ""
echo "1️⃣3️⃣ Testando APIs críticas..."
echo "   Testando /api/tema..."
TEMA_STATUS=$(ssh $SERVER "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/tema 2>/dev/null || echo '000'")
echo "   Status: $TEMA_STATUS"

echo "   Testando /api/auth/me..."
AUTH_STATUS=$(ssh $SERVER "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/auth/me 2>/dev/null || echo '000'")
echo "   Status: $AUTH_STATUS"

echo ""
echo "=== ✅ Processo Concluído! ==="
echo ""
echo "📋 Se ainda houver erros 500:"
echo "   1. Verifique os logs: ssh $SERVER 'cd $SERVER_DIR && pm2 logs lotbicho --lines 50'"
echo "   2. Verifique o status: ssh $SERVER 'cd $SERVER_DIR && pm2 status'"
echo "   3. Verifique o schema: ssh $SERVER 'cd $SERVER_DIR && cat prisma/schema.prisma | grep PagamentoPix'"
echo ""
