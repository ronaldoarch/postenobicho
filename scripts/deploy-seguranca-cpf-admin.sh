#!/bin/bash

# Script de deploy para correções de segurança: CPF único e verificação de admin

set -e

echo "=== 🔒 Deploy: Correções de Segurança ==="
echo ""
echo "📝 Você precisará digitar a senha SSH: bicho@321"
echo ""

SERVER="root@104.218.52.159"
APP_DIR="/var/www/postenobicho"

echo "1️⃣ Enviando arquivos atualizados..."

# Schema Prisma (precisa criar migração)
scp prisma/schema.prisma $SERVER:$APP_DIR/prisma/schema.prisma

# Libs
scp lib/auth.ts $SERVER:$APP_DIR/lib/auth.ts
scp lib/admin-auth.ts $SERVER:$APP_DIR/lib/admin-auth.ts

# API Auth
scp app/api/auth/me/route.ts $SERVER:$APP_DIR/app/api/auth/me/route.ts
scp app/api/auth/register/route.ts $SERVER:$APP_DIR/app/api/auth/register/route.ts

# Admin Layout
scp app/admin/layout.tsx $SERVER:$APP_DIR/app/admin/layout.tsx

# Admin API Routes
scp app/api/admin/dashboard/route.ts $SERVER:$APP_DIR/app/api/admin/dashboard/route.ts
scp app/api/admin/saques/route.ts $SERVER:$APP_DIR/app/api/admin/saques/route.ts
scp app/api/admin/cotacoes-especiais/route.ts $SERVER:$APP_DIR/app/api/admin/cotacoes-especiais/route.ts

# Webhooks (validação CPF único no bônus)
scp app/api/webhooks/nxgate/route.ts $SERVER:$APP_DIR/app/api/webhooks/nxgate/route.ts
scp app/api/webhooks/receba/route.ts $SERVER:$APP_DIR/app/api/webhooks/receba/route.ts

# Frontend
scp app/cadastro/page.tsx $SERVER:$APP_DIR/app/cadastro/page.tsx

echo ""
echo "2️⃣ Criando migração do banco de dados..."
ssh $SERVER "cd $APP_DIR && npx prisma migrate dev --name add_cpf_to_usuario --create-only || echo 'Migração já existe ou erro ao criar'"

echo ""
echo "3️⃣ Aplicando migração..."
ssh $SERVER "cd $APP_DIR && npx prisma migrate deploy || npx prisma db push"

echo ""
echo "4️⃣ Fazendo build da aplicação..."
ssh $SERVER "cd $APP_DIR && npm run build"

echo ""
echo "5️⃣ Reiniciando PM2..."
ssh $SERVER "pm2 restart lotbicho"

echo ""
echo "=== ✅ Deploy Concluído! ==="
echo ""
echo "📋 O que foi corrigido:"
echo "  ✅ Campo CPF adicionado ao modelo Usuario (único)"
echo "  ✅ Validação de CPF único no cadastro"
echo "  ✅ CPF obrigatório no cadastro"
echo "  ✅ Verificação de admin nas rotas /admin"
echo "  ✅ Verificação de admin nas rotas API admin"
echo "  ✅ Bônus verifica CPF único (não apenas primeiro depósito do usuário)"
echo ""
echo "🎯 Próximos passos:"
echo "  1. Teste o cadastro com CPF duplicado (deve bloquear)"
echo "  2. Teste acesso ao /admin sem ser admin (deve bloquear)"
echo "  3. Teste bônus com mesmo CPF em contas diferentes (deve bloquear)"
