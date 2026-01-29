#!/bin/bash

# Script para deploy das correções da liquidação

set -e

echo "=== 🔧 Deploy: Correção da Liquidação ==="
echo ""
echo "📝 Você precisará digitar a senha SSH: bicho@321"
echo ""

SERVER="root@104.218.52.159"
APP_DIR="/var/www/postenobicho"

echo "1️⃣ Enviando arquivos corrigidos..."
scp app/api/resultados/liquidar/route.ts $SERVER:$APP_DIR/app/api/resultados/liquidar/route.ts
scp app/api/resultados/liquidar/manual/route.ts $SERVER:$APP_DIR/app/api/resultados/liquidar/manual/route.ts

echo ""
echo "2️⃣ Fazendo build da aplicação..."
ssh $SERVER "cd $APP_DIR && npm run build"

echo ""
echo "3️⃣ Reiniciando PM2..."
ssh $SERVER "pm2 restart lotbicho"

echo ""
echo "=== ✅ Deploy Concluído! ==="
echo ""
echo "📋 O que foi corrigido:"
echo "  ✅ Prêmios agora incrementam o rolloverAtual"
echo "  ✅ Bônus bloqueado é liberado automaticamente quando rollover completo"
echo "  ✅ Verificação automática após ganhar prêmio"
echo ""
echo "🎯 Como funciona agora:"
echo "  1. Usuário ganha prêmio na liquidação"
echo "  2. Prêmio é creditado no saldo"
echo "  3. rolloverAtual é incrementado com o valor do prêmio"
echo "  4. Se rolloverAtual >= rolloverNecessario:"
echo "     → bonusBloqueado é zerado (liberado)"
echo "     → rolloverNecessario é zerado"
echo "     → Usuário pode sacar normalmente"
echo ""
echo "📊 Teste:"
echo "  1. Crie um usuário com bônus bloqueado"
echo "  2. Faça algumas apostas"
echo "  3. Ganhe um prêmio na liquidação"
echo "  4. Verifique se o rollover foi incrementado"
echo "  5. Se completou o rollover, verifique se o bônus foi liberado"
