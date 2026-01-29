#!/bin/bash
# Script completo de deploy para o servidor
# Execute este script do seu Mac

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🚀 Deploy completo para o servidor ==="
echo ""

# 1. Parar PM2
echo "1️⃣ Parando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 stop lotbicho || true"

# 2. Enviar arquivos corrigidos
echo ""
echo "2️⃣ Enviando arquivos corrigidos..."
scp $LOCAL_DIR/app/cadastro/page.tsx $SERVER:$SERVER_DIR/app/cadastro/
scp $LOCAL_DIR/app/suporte/page.tsx $SERVER:$SERVER_DIR/app/suporte/
scp $LOCAL_DIR/prisma/schema.prisma $SERVER:$SERVER_DIR/prisma/

# 2.1. Criar diretórios de API se não existirem e enviar arquivos
echo ""
echo "2️⃣.1️⃣ Criando diretórios e enviando arquivos de API..."
ssh $SERVER "cd $SERVER_DIR && mkdir -p app/api/configuracoes app/api/tema"
scp $LOCAL_DIR/app/api/configuracoes/route.ts $SERVER:$SERVER_DIR/app/api/configuracoes/
scp $LOCAL_DIR/app/api/tema/route.ts $SERVER:$SERVER_DIR/app/api/tema/

# 3. Instalar dependências
echo ""
echo "3️⃣ Instalando dependências no servidor (isso pode demorar alguns minutos)..."
ssh $SERVER "cd $SERVER_DIR && npm install"

# 4. Gerar Prisma Client
echo ""
echo "4️⃣ Gerando Prisma Client..."
ssh $SERVER "cd $SERVER_DIR && npx prisma generate"

# 5. Limpar build antigo
echo ""
echo "5️⃣ Limpando build antigo..."
ssh $SERVER "cd $SERVER_DIR && rm -rf .next"

# 6. Fazer build
echo ""
echo "6️⃣ Fazendo build no servidor (isso pode demorar vários minutos)..."
ssh $SERVER "cd $SERVER_DIR && npm run build"

# 7. Verificar se build foi criado
echo ""
echo "7️⃣ Verificando se build foi criado..."
BUILD_EXISTS=$(ssh $SERVER "cd $SERVER_DIR && test -d .next && echo 'yes' || echo 'no'")
if [ "$BUILD_EXISTS" = "yes" ]; then
    echo "✅ Build criado com sucesso!"
    ssh $SERVER "cd $SERVER_DIR && ls -la .next | head -5"
else
    echo "❌ Erro: Build não foi criado!"
    exit 1
fi

# 8. Reiniciar PM2
echo ""
echo "8️⃣ Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart lotbicho || pm2 start npm --name lotbicho -- start"

# 9. Aguardar alguns segundos
echo ""
echo "9️⃣ Aguardando servidor iniciar..."
sleep 5

# 10. Verificar status do PM2
echo ""
echo "🔟 Verificando status do PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 list"

# 11. Testar API
echo ""
echo "1️⃣1️⃣ Testando API..."
API_TEST=$(ssh $SERVER "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/configuracoes || echo '000'")
if [ "$API_TEST" = "200" ]; then
    echo "✅ API está respondendo corretamente!"
else
    echo "⚠️  API retornou código: $API_TEST"
    echo "Verificando logs..."
    ssh $SERVER "cd $SERVER_DIR && pm2 logs lotbicho --lines 20 --nostream"
fi

echo ""
echo "✅ Deploy concluído!"
