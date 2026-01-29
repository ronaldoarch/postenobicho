#!/bin/bash
# Script para corrigir o erro 500 ao gerar QR code PIX
# Execute: ./scripts/fix-pix-error-500.sh

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🔧 Corrigindo Erro 500 no PIX ==="
echo ""
echo "📝 Você precisará digitar a senha SSH: bicho@321"
echo ""

# 1. Enviar correções da rota de depósito
echo "1️⃣ Enviando correções da rota de depósito PIX-Nxgate..."
rsync -avz \
  $LOCAL_DIR/app/api/deposito/pix-nxgate/route.ts \
  $SERVER:$SERVER_DIR/app/api/deposito/pix-nxgate/

# 2. Enviar melhorias no cliente Nxgate
echo ""
echo "2️⃣ Enviando melhorias no cliente Nxgate..."
rsync -avz \
  $LOCAL_DIR/lib/nxgate-client.ts \
  $SERVER:$SERVER_DIR/lib/

# 3. Fazer build
echo ""
echo "3️⃣ Fazendo build da aplicação..."
ssh $SERVER "cd $SERVER_DIR && npm run build"

# 4. Reiniciar PM2
echo ""
echo "4️⃣ Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart lotbicho --update-env"

echo ""
echo "=== ✅ Correções Aplicadas! ==="
echo ""
echo "📋 O que foi corrigido:"
echo "  ✅ Tratamento de erros melhorado na rota de depósito"
echo "  ✅ Logs detalhados para debug"
echo "  ✅ Tratamento de diferentes formatos de resposta da API"
echo "  ✅ Melhor tratamento de erros de conexão"
echo "  ✅ Validação melhorada do valor (aceita string e número)"
echo "  ✅ Validação de campos obrigatórios do payload"
echo "  ✅ Logs detalhados no cliente Nxgate"
echo ""
echo "🔍 Para ver os logs detalhados:"
echo "   ssh $SERVER 'cd $SERVER_DIR && pm2 logs lotbicho --lines 100'"
echo ""
echo "⚠️  IMPORTANTE: Verifique se o gateway Nxgate está configurado no painel admin!"
echo "   - Acesse: /admin/gateways"
echo "   - Configure: API Key, Base URL e Webhook URL"
echo ""
echo "🎉 Agora tente gerar o QR code novamente e verifique os logs!"
