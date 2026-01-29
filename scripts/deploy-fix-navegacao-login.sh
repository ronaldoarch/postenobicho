#!/bin/bash
# Script para fazer deploy da correção de navegação na página de login
# Execute: ./scripts/deploy-fix-navegacao-login.sh

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🚀 Deploy: Correção Navegação Login ==="
echo ""
echo "📝 Você precisará digitar a senha SSH quando solicitado"
echo ""

# 1. Parar PM2
echo "1️⃣ Parando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 stop lotbicho || true"
sleep 2

# 2. Enviar arquivos atualizados
echo ""
echo "2️⃣ Enviando arquivos atualizados..."
rsync -avz \
  "$LOCAL_DIR/components/Header.tsx" \
  "$SERVER:$SERVER_DIR/components/"

rsync -avz \
  "$LOCAL_DIR/app/login/page.tsx" \
  "$SERVER:$SERVER_DIR/app/login/"

# 3. Limpar build
echo ""
echo "3️⃣ Limpando build antigo..."
ssh $SERVER "cd $SERVER_DIR && rm -rf .next/app/login .next/components/Header 2>/dev/null || true"

# 4. Fazer build
echo ""
echo "4️⃣ Fazendo build..."
ssh $SERVER "cd $SERVER_DIR && npm run build 2>&1 | tail -30"

# 5. Reiniciar PM2
echo ""
echo "5️⃣ Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart lotbicho --update-env"
sleep 3

# 6. Verificar logs
echo ""
echo "6️⃣ Verificando logs..."
ssh $SERVER "cd $SERVER_DIR && pm2 logs lotbicho --lines 10 --nostream"

echo ""
echo "=== ✅ Deploy Concluído! ==="
echo ""
echo "📋 O que foi corrigido:"
echo "  ✅ Aumentado z-index do Header para z-[100]"
echo "  ✅ Ajustado z-index do card de login"
echo "  ✅ Links do Header agora devem funcionar corretamente"
echo ""
echo "🎯 Teste agora:"
echo "   1. Acesse /login"
echo "   2. Clique em 'Início' no header"
echo "   3. Deve navegar para a página inicial"
echo ""
