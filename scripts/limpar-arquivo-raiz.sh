#!/bin/bash
# Script para remover configuracoes-store.ts da raiz do servidor
# Execute: ./scripts/limpar-arquivo-raiz.sh

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"

echo "=== 🧹 Limpando Arquivo da Raiz ==="
echo ""
echo "📝 Você precisará digitar a senha SSH: bicho@321"
echo ""

ssh $SERVER << 'ENDSSH'
cd /var/www/postenobicho

echo "🔍 Verificando se configuracoes-store.ts está na raiz..."
if [ -f "configuracoes-store.ts" ]; then
  echo "❌ Arquivo encontrado na raiz! Removendo..."
  rm -f configuracoes-store.ts
  echo "✅ Arquivo removido!"
else
  echo "✅ Arquivo não encontrado na raiz (ok)"
fi

echo ""
echo "🔍 Verificando se configuracoes-store.ts está em lib/..."
if [ -f "lib/configuracoes-store.ts" ]; then
  echo "✅ Arquivo encontrado em lib/ (correto)"
else
  echo "❌ Arquivo NÃO encontrado em lib/!"
fi

echo ""
echo "🔍 Verificando se prisma.ts está em lib/..."
if [ -f "lib/prisma.ts" ]; then
  echo "✅ prisma.ts encontrado em lib/ (correto)"
else
  echo "❌ prisma.ts NÃO encontrado em lib/!"
fi

ENDSSH

echo ""
echo "=== ✅ Limpeza concluída! ==="
