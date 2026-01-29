#!/bin/bash
# Script final para enviar todas as correções da carteira
# Execute: ./scripts/deploy-carteira-final.sh

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 💳 Deploy Final da Carteira ==="
echo ""
echo "📝 Você precisará digitar a senha SSH: bicho@321"
echo ""

# 1. Enviar página de carteira atualizada
echo "1️⃣ Enviando página de carteira..."
rsync -avz \
  $LOCAL_DIR/app/carteira/ \
  $SERVER:$SERVER_DIR/app/carteira/

# 2. Enviar componente DepositPixModal (Nxgate)
echo ""
echo "2️⃣ Enviando DepositPixModal (Nxgate)..."
rsync -avz \
  $LOCAL_DIR/components/DepositPixModal.tsx \
  $SERVER:$SERVER_DIR/components/

# 3. Enviar API de transações
echo ""
echo "3️⃣ Enviando API de transações..."
rsync -avz \
  $LOCAL_DIR/app/api/transacoes/ \
  $SERVER:$SERVER_DIR/app/api/transacoes/

# 4. Enviar correção de autenticação na rota de depósito
echo ""
echo "4️⃣ Enviando correção de autenticação (depósito Nxgate)..."
rsync -avz \
  $LOCAL_DIR/app/api/deposito/pix-nxgate/route.ts \
  $SERVER:$SERVER_DIR/app/api/deposito/pix-nxgate/

# 5. Enviar correção de débito na rota de apostas
echo ""
echo "5️⃣ Enviando correção de débito (apostas)..."
rsync -avz \
  $LOCAL_DIR/app/api/apostas/route.ts \
  $SERVER:$SERVER_DIR/app/api/apostas/

# 6. Fazer build
echo ""
echo "6️⃣ Fazendo build da aplicação..."
ssh $SERVER "cd $SERVER_DIR && npm run build"

# 7. Reiniciar PM2
echo ""
echo "7️⃣ Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart lotbicho --update-env"

echo ""
echo "=== ✅ Deploy Final Concluído! ==="
echo ""
echo "📋 O que foi corrigido:"
echo "  ✅ Página de carteira completa"
echo "  ✅ DepositPixModal usando Nxgate"
echo "  ✅ API de transações criada"
echo "  ✅ Autenticação corrigida (aceita ambos os cookies)"
echo "  ✅ Débito de apostas melhorado (usa decrement)"
echo ""
echo "🎉 Agora a carteira está totalmente funcional com Nxgate!"
