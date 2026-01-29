#!/bin/bash

# Script para deploy da regra de bônus e saque

set -e

echo "=== 🎁 Deploy: Regra de Bônus e Saque ==="
echo ""
echo "📝 Você precisará digitar a senha SSH: bicho@321"
echo ""

SERVER="root@104.218.52.159"
APP_DIR="/var/www/postenobicho"

echo "1️⃣ Enviando arquivos atualizados..."
scp app/api/saque/pix-nxgate/route.ts $SERVER:$APP_DIR/app/api/saque/pix-nxgate/route.ts
scp app/api/apostas/route.ts $SERVER:$APP_DIR/app/api/apostas/route.ts

echo ""
echo "2️⃣ Fazendo build da aplicação..."
ssh $SERVER "cd $APP_DIR && npm run build"

echo ""
echo "3️⃣ Reiniciando PM2..."
ssh $SERVER "pm2 restart lotbicho"

echo ""
echo "=== ✅ Deploy Concluído! ==="
echo ""
echo "📋 O que foi implementado:"
echo "  ✅ Usuário só pode sacar após completar rollover"
echo "  ✅ Bônus bloqueado é liberado automaticamente quando rollover completo"
echo "  ✅ Validação clara de erro quando tentar sacar com bônus bloqueado"
echo ""
echo "🎯 Teste:"
echo "  1. Faça um depósito (receberá bônus bloqueado)"
echo "  2. Tente sacar (deve ser bloqueado)"
echo "  3. Aposte até completar o rollover"
echo "  4. Tente sacar novamente (deve ser permitido)"
