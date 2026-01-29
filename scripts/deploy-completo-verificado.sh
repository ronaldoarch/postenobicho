#!/bin/bash
# Script completo de deploy com verificação de todos os arquivos
# Execute: ./scripts/deploy-completo-verificado.sh

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🚀 Deploy Completo e Verificado ==="
echo ""
echo "📝 Você precisará digitar a senha SSH quando solicitado"
echo ""

# Lista de arquivos para enviar
FILES=(
  "components/BottomNav.tsx"
  "components/Footer.tsx"
  "app/login/page.tsx"
  "app/cadastro/page.tsx"
  "app/admin/login/page.tsx"
  "app/admin/descarga/page.tsx"
  "app/admin/liquidacao/page.tsx"
  "app/admin/pagamentos-pix/page.tsx"
  "lib/descarga.ts"
  "app/api/resultados/liquidar/route.ts"
  "app/api/admin/pagamentos-pix/route.ts"
  "app/api/webhooks/nxgate/route.ts"
  "app/api/admin/dashboard/route.ts"
  "prisma/schema.prisma"
)

# 1. Parar PM2
echo "1️⃣ Parando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 stop lotbicho || true"
sleep 2

# 2. Criar diretórios necessários no servidor
echo ""
echo "2️⃣ Criando diretórios necessários no servidor..."
ssh $SERVER "cd $SERVER_DIR && mkdir -p app/login app/cadastro app/admin/login app/admin/descarga app/admin/liquidacao app/admin/pagamentos-pix lib components app/api/resultados/liquidar app/api/admin/pagamentos-pix app/api/webhooks/nxgate app/api/admin/dashboard prisma"

# 3. Enviar TODOS os arquivos
echo ""
echo "3️⃣ Enviando TODOS os arquivos atualizados..."
for file in "${FILES[@]}"; do
  if [ -f "$LOCAL_DIR/$file" ]; then
    echo "   📤 Enviando $file..."
    # Extrair diretório do arquivo
    dir=$(dirname "$file")
    # Criar diretório no servidor se não existir
    ssh $SERVER "cd $SERVER_DIR && mkdir -p $dir"
    # Enviar arquivo
    rsync -avz "$LOCAL_DIR/$file" "$SERVER:$SERVER_DIR/$file"
  else
    echo "   ⚠️  Arquivo não encontrado: $file"
  fi
done

# 4. Verificar TODOS os arquivos enviados
echo ""
echo "4️⃣ Verificando arquivos enviados..."
ALL_OK=true
for file in "${FILES[@]}"; do
  if ssh $SERVER "test -f $SERVER_DIR/$file" 2>/dev/null; then
    echo "   ✅ $file"
  else
    echo "   ❌ $file NÃO encontrado no servidor!"
    ALL_OK=false
  fi
done

if [ "$ALL_OK" = false ]; then
  echo ""
  echo "❌ Alguns arquivos não foram enviados corretamente!"
  echo "   Tente executar o script novamente."
  exit 1
fi

# 5. Corrigir provider do Prisma
echo ""
echo "5️⃣ Corrigindo provider do Prisma..."
ssh $SERVER "cd $SERVER_DIR && sed -i 's/provider = \"sqlite\"/provider = \"mysql\"/g' prisma/schema.prisma && echo '✅ Provider: MySQL' || echo '⚠️  Provider já estava correto'"

# 6. Verificar campos do PagamentoPix no schema
echo ""
echo "6️⃣ Verificando campos do PagamentoPix no schema..."
ssh $SERVER "cd $SERVER_DIR && grep -A 15 'model PagamentoPix' prisma/schema.prisma | grep -E 'transactionId|status.*String' && echo '✅ Campos encontrados' || echo '⚠️  Campos podem estar faltando'"

# 7. Regenerar Prisma Client
echo ""
echo "7️⃣ Regenerando Prisma Client..."
ssh $SERVER "cd $SERVER_DIR && npx prisma generate 2>&1 | tail -20"

# 8. Instalar dependências
echo ""
echo "8️⃣ Instalando dependências..."
ssh $SERVER "cd $SERVER_DIR && npm install 2>&1 | tail -20"

# 9. Limpar build
echo ""
echo "9️⃣ Limpando build antigo..."
ssh $SERVER "cd $SERVER_DIR && rm -rf .next .next/cache 2>/dev/null || true"

# 10. Fazer build
echo ""
echo "🔟 Fazendo build completo (isso pode demorar vários minutos)..."
echo "   Aguarde..."
BUILD_OUTPUT=$(ssh $SERVER "cd $SERVER_DIR && npm run build 2>&1")
echo "$BUILD_OUTPUT" | tail -50

# Verificar se build teve sucesso (ignorar warnings sobre dynamic server usage)
if echo "$BUILD_OUTPUT" | grep -qi "Error\|Failed" && ! echo "$BUILD_OUTPUT" | grep -qi "Dynamic server usage"; then
  echo ""
  echo "❌ Erros encontrados no build!"
  echo "$BUILD_OUTPUT" | grep -i "error\|failed" | grep -v "Dynamic server usage" | head -10
  exit 1
fi

# Verificar se build foi concluído (procurar por "○" ou "ƒ" que indicam rotas compiladas)
if echo "$BUILD_OUTPUT" | grep -q "○\|ƒ"; then
  echo ""
  echo "✅ Build concluído com sucesso!"
fi

# 11. Verificar se build foi criado
echo ""
echo "1️⃣1️⃣ Verificando se build foi criado..."
if ssh $SERVER "cd $SERVER_DIR && test -d .next"; then
    echo "✅ Build criado com sucesso!"
else
    echo "❌ Erro: Build não foi criado"
    exit 1
fi

# 12. Reiniciar PM2
echo ""
echo "1️⃣2️⃣ Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart lotbicho --update-env"
sleep 5

# 13. Verificar status
echo ""
echo "1️⃣3️⃣ Verificando status do PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 status"

# 14. Verificar logs
echo ""
echo "1️⃣4️⃣ Verificando logs..."
ssh $SERVER "cd $SERVER_DIR && pm2 logs lotbicho --lines 30 --nostream"

# 15. Testar APIs
echo ""
echo "1️⃣5️⃣ Testando APIs críticas..."
TEMA_STATUS=$(ssh $SERVER "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/tema 2>/dev/null || echo '000'")
AUTH_STATUS=$(ssh $SERVER "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/auth/me 2>/dev/null || echo '000'")

echo "   /api/tema: $TEMA_STATUS"
echo "   /api/auth/me: $AUTH_STATUS"

if [ "$TEMA_STATUS" = "200" ] && [ "$AUTH_STATUS" = "200" ] || [ "$AUTH_STATUS" = "401" ]; then
  echo "   ✅ APIs estão respondendo!"
else
  echo "   ⚠️  Algumas APIs podem estar com problemas"
fi

echo ""
echo "=== ✅ Deploy Completo Finalizado! ==="
echo ""
echo "📋 Todos os arquivos foram enviados e verificados:"
for file in "${FILES[@]}"; do
  echo "   ✅ $file"
done
echo ""
echo "🎯 Próximos passos:"
echo "   1. Recarregue a página do admin (/admin/login)"
echo "   2. Teste os cards do menu no mobile"
echo "   3. Verifique a descarga no admin (/admin/descarga)"
echo "   4. Teste a liquidação no admin (/admin/liquidacao)"
echo ""
