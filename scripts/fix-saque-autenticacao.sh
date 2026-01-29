#!/bin/bash
# Script para corrigir autenticação na rota de saque
# Execute: ./scripts/fix-saque-autenticacao.sh

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🔧 Corrigindo Autenticação na Rota de Saque ==="
echo ""
echo "📝 Você precisará digitar a senha SSH: bicho@321"
echo ""

# 1. Enviar correção da rota de saque
echo "1️⃣ Enviando correção da rota de saque..."
rsync -avz \
  $LOCAL_DIR/app/api/saque/pix-nxgate/route.ts \
  $SERVER:$SERVER_DIR/app/api/saque/pix-nxgate/

# 2. Fazer build
echo ""
echo "2️⃣ Fazendo build da aplicação..."
ssh $SERVER "cd $SERVER_DIR && npm run build"

# 3. Reiniciar PM2
echo ""
echo "3️⃣ Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart lotbicho --update-env"

echo ""
echo "=== ✅ Correção Aplicada! ==="
echo ""
echo "📋 O que foi corrigido:"
echo "  ✅ Rota de saque agora aceita ambos os cookies (postenobicho_session e lotbicho_session)"
echo "  ✅ Chave PIX é limpa automaticamente (remove formatação)"
echo "  ✅ Validação melhorada de formato de chave PIX por tipo"
echo "  ✅ Tratamento de erros melhorado com mensagens mais específicas"
echo "  ✅ Logs detalhados para debug"
echo ""
echo "⚠️  IMPORTANTE: Verifique se a API key do Nxgate tem permissão para saques!"
echo ""
echo "🎉 Agora o saque deve funcionar corretamente!"
