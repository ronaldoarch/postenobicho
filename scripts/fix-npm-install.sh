#!/bin/bash
# Script rápido para instalar dependências no servidor
# Execute: ./scripts/fix-npm-install.sh

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"

echo "=== 📦 Instalando Dependências no Servidor ==="
echo ""
echo "📝 Você precisará digitar a senha SSH: bicho@321"
echo ""

ssh $SERVER << 'ENDSSH'
cd /var/www/postenobicho

echo "📦 Instalando todas as dependências (incluindo devDependencies)..."
npm install --include=dev

echo ""
echo "✅ Dependências instaladas!"
echo ""
echo "📋 Verificando se tailwindcss está instalado..."
if [ -d "node_modules/tailwindcss" ]; then
  echo "✅ tailwindcss encontrado!"
else
  echo "❌ tailwindcss NÃO encontrado!"
  echo "📦 Instalando tailwindcss manualmente..."
  npm install tailwindcss@^3.3.5 --save-dev
fi

echo ""
echo "📋 Verificando outras dependências críticas..."
[ -d "node_modules/postcss" ] && echo "✅ postcss encontrado!" || echo "❌ postcss NÃO encontrado!"
[ -d "node_modules/autoprefixer" ] && echo "✅ autoprefixer encontrado!" || echo "❌ autoprefixer NÃO encontrado!"
[ -d "node_modules/@prisma/client" ] && echo "✅ @prisma/client encontrado!" || echo "❌ @prisma/client NÃO encontrado!"

ENDSSH

echo ""
echo "=== ✅ Instalação concluída! ==="
echo ""
echo "🎉 Agora execute o build novamente!"
