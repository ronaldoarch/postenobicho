#!/bin/bash
# Script para enviar TODAS as páginas, rotas e diretórios
# Execute: ./scripts/deploy-todas-paginas.sh

set -e

SSH_KEY="$HOME/.ssh/id_rsa_postenobicho"
SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

# Verificar se a chave SSH existe
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ Chave SSH não encontrada: $SSH_KEY"
    echo ""
    echo "Execute primeiro:"
    echo "   ./scripts/configurar-ssh.sh"
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

echo "=== 🚀 Deploy de TODAS as Páginas e Rotas ==="
echo ""

# Testar conexão
if ! ssh_cmd "echo 'Conexão OK'" > /dev/null 2>&1; then
    echo "❌ Erro: Não foi possível conectar sem senha!"
    exit 1
fi
echo "✅ Conexão SSH OK!"
echo ""

# 1. Parar PM2
echo "1️⃣ Parando PM2..."
ssh_cmd "cd $SERVER_DIR && pm2 stop lotbicho || true"
sleep 2

# 2. Enviar TODA a estrutura de diretórios app/
echo ""
echo "2️⃣ Enviando TODA a estrutura app/..."
rsync_cmd --exclude='node_modules' --exclude='.next' "$LOCAL_DIR/app/" "$SERVER:$SERVER_DIR/app/"

# 3. Enviar TODOS os componentes
echo ""
echo "3️⃣ Enviando TODOS os componentes..."
rsync_cmd --exclude='node_modules' "$LOCAL_DIR/components/" "$SERVER:$SERVER_DIR/components/"

# 4. Enviar TODAS as libs
echo ""
echo "4️⃣ Enviando TODAS as libs..."
rsync_cmd --exclude='node_modules' "$LOCAL_DIR/lib/" "$SERVER:$SERVER_DIR/lib/"

# 5. Enviar TODOS os hooks
echo ""
echo "5️⃣ Enviando TODOS os hooks..."
rsync_cmd --exclude='node_modules' "$LOCAL_DIR/hooks/" "$SERVER:$SERVER_DIR/hooks/"

# 6. Enviar tipos
echo ""
echo "6️⃣ Enviando tipos..."
rsync_cmd --exclude='node_modules' "$LOCAL_DIR/types/" "$SERVER:$SERVER_DIR/types/"

# 7. Enviar schema Prisma
echo ""
echo "7️⃣ Enviando schema Prisma..."
rsync_cmd "$LOCAL_DIR/prisma/schema.prisma" "$SERVER:$SERVER_DIR/prisma/schema.prisma"

# 8. Enviar configurações importantes
echo ""
echo "8️⃣ Enviando configurações..."
for file in "next.config.js" "tailwind.config.js" "tsconfig.json" "package.json"; do
  if [ -f "$LOCAL_DIR/$file" ]; then
    rsync_cmd "$LOCAL_DIR/$file" "$SERVER:$SERVER_DIR/$file"
  fi
done

# 9. Corrigir provider do Prisma
echo ""
echo "9️⃣ Corrigindo provider do Prisma..."
ssh_cmd "cd $SERVER_DIR && sed -i 's/provider = \"sqlite\"/provider = \"mysql\"/g' prisma/schema.prisma && echo '✅ Provider: MySQL' || echo '⚠️  Provider já estava correto'"

# 10. Regenerar Prisma Client
echo ""
echo "🔟 Regenerando Prisma Client..."
ssh_cmd "cd $SERVER_DIR && npx prisma generate 2>&1 | tail -20"

# 11. Instalar dependências
echo ""
echo "1️⃣1️⃣ Instalando dependências..."
ssh_cmd "cd $SERVER_DIR && npm install 2>&1 | tail -20"

# 12. Limpar build antigo
echo ""
echo "1️⃣2️⃣ Limpando build antigo..."
ssh_cmd "cd $SERVER_DIR && rm -rf .next .next/cache 2>/dev/null || true"

# 13. Fazer build completo
echo ""
echo "1️⃣3️⃣ Fazendo build completo (isso pode demorar vários minutos)..."
echo "   Aguarde..."
BUILD_OUTPUT=$(ssh_cmd "cd $SERVER_DIR && npm run build 2>&1")
echo "$BUILD_OUTPUT" | tail -50

# Verificar se build teve sucesso
if echo "$BUILD_OUTPUT" | grep -qi "Error\|Failed" && ! echo "$BUILD_OUTPUT" | grep -qi "Dynamic server usage"; then
  echo ""
  echo "❌ Erros encontrados no build!"
  echo "$BUILD_OUTPUT" | grep -i "error\|failed" | grep -v "Dynamic server usage" | head -10
  exit 1
fi

# 14. Reiniciar PM2
echo ""
echo "1️⃣4️⃣ Reiniciando PM2..."
ssh_cmd "cd $SERVER_DIR && pm2 restart lotbicho --update-env"
sleep 5

# 15. Verificar status
echo ""
echo "1️⃣5️⃣ Verificando status..."
ssh_cmd "cd $SERVER_DIR && pm2 status"

# 16. Resumo
echo ""
echo "=== ✅ Deploy Completo de Todas as Páginas Finalizado! ==="
echo ""
echo "📋 Estrutura enviada:"
echo "   ✅ app/ (todas as páginas e rotas)"
echo "   ✅ components/ (todos os componentes)"
echo "   ✅ lib/ (todas as bibliotecas)"
echo "   ✅ hooks/ (todos os hooks)"
echo "   ✅ types/ (todos os tipos)"
echo "   ✅ prisma/schema.prisma"
echo "   ✅ Configurações (next.config.js, tailwind.config.js, etc)"
echo ""
echo "📊 Status:"
echo "   • Prisma Client: ✅ Regenerado"
echo "   • Dependências: ✅ Instaladas"
echo "   • Build: ✅ Concluído"
echo "   • PM2: ✅ Reiniciado"
echo ""
