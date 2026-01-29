#!/bin/bash

# Script para corrigir redirecionamento de usuários não-admin

set -e

echo "=== 🔧 Deploy: Correção de Redirecionamento Admin ==="
echo ""
echo "📝 Você precisará digitar a senha SSH: bicho@321"
echo ""

SERVER="root@104.218.52.159"
APP_DIR="/var/www/postenobicho"

echo "1️⃣ Enviando arquivo atualizado..."
scp app/admin/layout.tsx $SERVER:$APP_DIR/app/admin/layout.tsx

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
echo "  ✅ Usuários não-admin agora são redirecionados para a home (/)"
echo "  ✅ Evita loops infinitos de recarregamento"
echo "  ✅ Usa window.location.href para redirecionamento completo"
echo ""
echo "🎯 Teste:"
echo "  1. Faça login com um usuário não-admin"
echo "  2. Tente acessar /admin"
echo "  3. Deve redirecionar para a home do site"
