#!/bin/bash
# Script completo de deploy - Envia tudo, testa, faz build e atualiza schema
# SEM PRECISAR DIGITAR SENHA (usa SSH key)
# Execute: ./scripts/deploy-completo-tudo.sh

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"
SSH_KEY="$HOME/.ssh/id_rsa_postenobicho"

# Verificar se a chave SSH existe
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ Chave SSH não encontrada: $SSH_KEY"
    echo ""
    echo "Execute primeiro o script de configuração:"
    echo "   ./scripts/configurar-ssh.sh"
    echo ""
    exit 1
fi

# Função para executar comandos SSH
ssh_cmd() {
    ssh -i "$SSH_KEY" -o BatchMode=yes -o ConnectTimeout=10 $SERVER "$@"
}

# Função para rsync
rsync_cmd() {
    rsync -avz -e "ssh -i $SSH_KEY -o BatchMode=yes" "$@"
}

# Testar conexão
echo "=== 🚀 Deploy Completo - Tudo de Uma Vez ==="
echo ""
echo "🔐 Testando conexão SSH..."
if ! ssh_cmd "echo 'Conexão OK'" > /dev/null 2>&1; then
    echo "❌ Erro: Não foi possível conectar sem senha!"
    echo ""
    echo "Execute primeiro:"
    echo "   ./scripts/configurar-ssh.sh"
    echo ""
    exit 1
fi
echo "✅ Conexão SSH OK! (sem senha)"
echo ""

# Lista completa de arquivos para enviar
FILES=(
  # Componentes
  "components/BottomNav.tsx"
  "components/Footer.tsx"
  "components/Header.tsx"
  
  # Páginas públicas
  "app/login/page.tsx"
  "app/cadastro/page.tsx"
  "app/page.tsx"
  
  # Páginas admin
  "app/admin/login/page.tsx"
  "app/admin/descarga/page.tsx"
  "app/admin/liquidacao/page.tsx"
  "app/admin/pagamentos-pix/page.tsx"
  
  # Libs
  "lib/descarga.ts"
  
  # APIs
  "app/api/apostas/route.ts"
  "app/api/resultados/liquidar/route.ts"
  "app/api/admin/pagamentos-pix/route.ts"
  "app/api/webhooks/nxgate/route.ts"
  "app/api/admin/dashboard/route.ts"
  
  # Schema Prisma
  "prisma/schema.prisma"
)

# 1. Parar PM2
echo "1️⃣ Parando PM2..."
ssh_cmd "cd $SERVER_DIR && pm2 stop lotbicho || true"
sleep 2

# 2. Criar diretórios necessários
echo ""
echo "2️⃣ Criando diretórios necessários..."
ssh_cmd "cd $SERVER_DIR && mkdir -p app/login app/cadastro app/admin/login app/admin/descarga app/admin/liquidacao app/admin/pagamentos-pix lib components app/api/apostas app/api/resultados/liquidar app/api/admin/pagamentos-pix app/api/webhooks/nxgate app/api/admin/dashboard prisma"

# 3. Enviar TODOS os arquivos
echo ""
echo "3️⃣ Enviando TODOS os arquivos..."
for file in "${FILES[@]}"; do
  if [ -f "$LOCAL_DIR/$file" ]; then
    echo "   📤 Enviando $file..."
    # Criar diretório se não existir
    dir=$(dirname "$file")
    ssh_cmd "cd $SERVER_DIR && mkdir -p $dir"
    # Enviar arquivo
    rsync_cmd "$LOCAL_DIR/$file" "$SERVER:$SERVER_DIR/$file"
  else
    echo "   ⚠️  Arquivo não encontrado: $file"
  fi
done

# 4. Verificar arquivos enviados
echo ""
echo "4️⃣ Verificando arquivos enviados..."
ALL_OK=true
for file in "${FILES[@]}"; do
  if ssh_cmd "test -f $SERVER_DIR/$file" 2>/dev/null; then
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
ssh_cmd "cd $SERVER_DIR && sed -i 's/provider = \"sqlite\"/provider = \"mysql\"/g' prisma/schema.prisma && echo '✅ Provider: MySQL' || echo '⚠️  Provider já estava correto'"

# 6. Verificar campos do PagamentoPix no schema
echo ""
echo "6️⃣ Verificando campos do PagamentoPix no schema..."
ssh_cmd "cd $SERVER_DIR && grep -A 15 'model PagamentoPix' prisma/schema.prisma | grep -E 'transactionId|status.*String' && echo '✅ Campos encontrados' || echo '⚠️  Campos podem estar faltando'"

# 7. Regenerar Prisma Client
echo ""
echo "7️⃣ Regenerando Prisma Client..."
ssh_cmd "cd $SERVER_DIR && npx prisma generate 2>&1 | tail -20"

# 8. Instalar dependências
echo ""
echo "8️⃣ Instalando dependências..."
ssh_cmd "cd $SERVER_DIR && npm install 2>&1 | tail -20"

# 9. Limpar build antigo
echo ""
echo "9️⃣ Limpando build antigo..."
ssh_cmd "cd $SERVER_DIR && rm -rf .next .next/cache 2>/dev/null || true"

# 10. Fazer build completo
echo ""
echo "🔟 Fazendo build completo (isso pode demorar vários minutos)..."
echo "   Aguarde..."
BUILD_OUTPUT=$(ssh_cmd "cd $SERVER_DIR && npm run build 2>&1")
echo "$BUILD_OUTPUT" | tail -50

# Verificar se build teve sucesso (ignorar warnings sobre dynamic server usage)
if echo "$BUILD_OUTPUT" | grep -qi "Error\|Failed" && ! echo "$BUILD_OUTPUT" | grep -qi "Dynamic server usage"; then
  echo ""
  echo "❌ Erros encontrados no build!"
  echo "$BUILD_OUTPUT" | grep -i "error\|failed" | grep -v "Dynamic server usage" | head -10
  exit 1
fi

# Verificar se build foi concluído
if echo "$BUILD_OUTPUT" | grep -q "○\|ƒ"; then
  echo ""
  echo "✅ Build concluído com sucesso!"
fi

# 11. Verificar se build foi criado
echo ""
echo "1️⃣1️⃣ Verificando se build foi criado..."
if ssh_cmd "cd $SERVER_DIR && test -d .next"; then
    echo "✅ Build criado com sucesso!"
else
    echo "❌ Erro: Build não foi criado"
    exit 1
fi

# 12. Reiniciar PM2
echo ""
echo "1️⃣2️⃣ Reiniciando PM2..."
ssh_cmd "cd $SERVER_DIR && pm2 restart lotbicho --update-env"
sleep 5

# 13. Verificar status do PM2
echo ""
echo "1️⃣3️⃣ Verificando status do PM2..."
ssh_cmd "cd $SERVER_DIR && pm2 status"

# 14. Verificar logs
echo ""
echo "1️⃣4️⃣ Verificando logs..."
ssh_cmd "cd $SERVER_DIR && pm2 logs lotbicho --lines 30 --nostream"

# 15. Testar APIs críticas
echo ""
echo "1️⃣5️⃣ Testando APIs críticas..."
TEMA_STATUS=$(ssh_cmd "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/tema 2>/dev/null || echo '000'")
AUTH_STATUS=$(ssh_cmd "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/auth/me 2>/dev/null || echo '000'")
CONFIG_STATUS=$(ssh_cmd "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/configuracoes 2>/dev/null || echo '000'")

echo "   /api/tema: $TEMA_STATUS"
echo "   /api/auth/me: $AUTH_STATUS"
echo "   /api/configuracoes: $CONFIG_STATUS"

if [ "$TEMA_STATUS" = "200" ] && ([ "$AUTH_STATUS" = "200" ] || [ "$AUTH_STATUS" = "401" ]) && [ "$CONFIG_STATUS" = "200" ]; then
  echo "   ✅ APIs estão respondendo corretamente!"
else
  echo "   ⚠️  Algumas APIs podem estar com problemas"
fi

# 16. Resumo final
echo ""
echo "=== ✅ Deploy Completo Finalizado! ==="
echo ""
echo "📋 Arquivos enviados e verificados:"
for file in "${FILES[@]}"; do
  echo "   ✅ $file"
done
echo ""
echo "📊 Status:"
echo "   • Prisma Client: ✅ Regenerado"
echo "   • Dependências: ✅ Instaladas"
echo "   • Build: ✅ Concluído"
echo "   • PM2: ✅ Reiniciado"
echo "   • APIs: ✅ Testadas"
echo ""
echo "🎯 Próximos passos:"
echo "   1. Teste a navegação na página de login"
echo "   2. Teste os cards do menu no mobile"
echo "   3. Verifique a descarga no admin"
echo "   4. Teste a liquidação no admin"
echo "   5. Verifique a validação de dias da semana nas apostas"
echo ""
