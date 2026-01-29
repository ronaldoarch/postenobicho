#!/bin/bash
# Script para limpar cache e fazer rebuild completo
# Execute: ./scripts/limpar-cache-rebuild.sh

SSH_KEY="$HOME/.ssh/id_rsa_postenobicho"
SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"

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

echo "=== 🧹 Limpando Cache e Fazendo Rebuild ==="
echo ""

# 1. Parar PM2
echo "1️⃣ Parando PM2..."
ssh_cmd "cd $SERVER_DIR && pm2 stop lotbicho || true"
sleep 2

# 2. Limpar cache do Next.js
echo ""
echo "2️⃣ Limpando cache do Next.js..."
ssh_cmd "cd $SERVER_DIR && rm -rf .next .next/cache node_modules/.cache 2>/dev/null || true"
echo "✅ Cache limpo!"

# 3. Limpar cache do npm
echo ""
echo "3️⃣ Limpando cache do npm..."
ssh_cmd "cd $SERVER_DIR && npm cache clean --force 2>&1 | tail -5"

# 4. Reinstalar dependências
echo ""
echo "4️⃣ Reinstalando dependências..."
ssh_cmd "cd $SERVER_DIR && npm install 2>&1 | tail -20"

# 5. Regenerar Prisma Client
echo ""
echo "5️⃣ Regenerando Prisma Client..."
ssh_cmd "cd $SERVER_DIR && npx prisma generate 2>&1 | tail -10"

# 6. Fazer build completo
echo ""
echo "6️⃣ Fazendo build completo (isso pode demorar vários minutos)..."
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

# Verificar se build foi concluído
if echo "$BUILD_OUTPUT" | grep -q "○\|ƒ"; then
  echo ""
  echo "✅ Build concluído com sucesso!"
fi

# 7. Reiniciar PM2
echo ""
echo "7️⃣ Reiniciando PM2..."
ssh_cmd "cd $SERVER_DIR && pm2 restart lotbicho --update-env"
sleep 5

# 8. Verificar status
echo ""
echo "8️⃣ Verificando status..."
ssh_cmd "cd $SERVER_DIR && pm2 status"

echo ""
echo "=== ✅ Cache Limpo e Rebuild Concluído! ==="
echo ""
echo "🎯 Próximos passos:"
echo "   1. Limpe o cache do navegador (Ctrl+Shift+Delete ou Cmd+Shift+Delete)"
echo "   2. Faça hard refresh (Ctrl+F5 ou Cmd+Shift+R)"
echo "   3. Teste acessar a página inicial (/)"
echo ""
