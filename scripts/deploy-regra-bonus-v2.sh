#!/bin/bash

# Script para deploy da regra de bônus e saque (versão 2 - com validação de primeira aposta)

set -e

echo "=== 🎁 Deploy: Regra de Bônus e Saque v2 ==="
echo ""
echo "📝 Você precisará digitar a senha SSH: bicho@321"
echo ""

SERVER="root@104.218.52.159"
APP_DIR="/var/www/postenobicho"

echo "1️⃣ Enviando arquivos atualizados..."
scp app/api/saque/pix-nxgate/route.ts $SERVER:$APP_DIR/app/api/saque/pix-nxgate/route.ts
scp app/api/apostas/route.ts $SERVER:$APP_DIR/app/api/apostas/route.ts

echo ""
echo "2️⃣ Aplicando mudanças no schema do banco (MySQL)..."
scp scripts/add-columns-mysql.sql $SERVER:/tmp/add-columns-mysql.sql
ssh $SERVER "cd $APP_DIR && bash <<'EOF'
# Corrigir schema para MySQL se necessário
if grep -q 'provider = \"sqlite\"' prisma/schema.prisma; then
  sed -i 's/provider = \"sqlite\"/provider = \"mysql\"/' prisma/schema.prisma
fi

# Adicionar campos ao schema se não existirem
if ! grep -q 'jaApostouComSaldoReal' prisma/schema.prisma; then
  # Encontrar a linha rolloverAtual e adicionar os campos depois dela
  sed -i '/rolloverAtual.*Float.*@default(0)/a\
  jaApostouComSaldoReal Boolean  @default(false) // se já apostou pelo menos uma vez com saldo real\
  jaApostou          Boolean     @default(false) // se já apostou pelo menos uma vez (saldo ou bônus)' prisma/schema.prisma
fi

# Aplicar mudanças diretamente no banco via SQL
DB_PASS=\$(grep DATABASE_URL .env | sed 's/.*mysql:\/\/admin_postenobicho:\\([^@]*\\)@.*/\\1/')
mysql -u admin_postenobicho -p\"\$DB_PASS\" admin_postenobicho < /tmp/add-columns-mysql.sql 2>&1 | grep -v 'already exists' || true

# Regenerar Prisma Client para incluir os novos campos
echo 'Regenerando Prisma Client...'
rm -rf node_modules/.prisma node_modules/@prisma/client
npx prisma generate
EOF
"

echo ""
echo "3️⃣ Instalando dependências (se necessário)..."
ssh $SERVER "cd $APP_DIR && npm install"

echo ""
echo "4️⃣ Fazendo build da aplicação..."
ssh $SERVER "cd $APP_DIR && npm run build"

echo ""
echo "5️⃣ Reiniciando PM2..."
ssh $SERVER "pm2 restart lotbicho"

echo ""
echo "=== ✅ Deploy Concluído! ==="
echo ""
echo "📋 O que foi implementado:"
echo "  ✅ Usuário precisa apostar com saldo real antes de usar bônus"
echo "  ✅ Usuário precisa apostar pelo menos uma vez antes de poder sacar"
echo "  ✅ Usuário só pode sacar após completar rollover"
echo "  ✅ Bônus bloqueado é liberado automaticamente quando rollover completo"
echo ""
echo "🎯 Teste:"
echo "  1. Faça um depósito (receberá bônus bloqueado)"
echo "  2. Tente usar bônus na aposta (deve ser bloqueado)"
echo "  3. Aposte com saldo real primeiro"
echo "  4. Agora pode usar bônus nas apostas"
echo "  5. Tente sacar antes de apostar (deve ser bloqueado)"
echo "  6. Aposte pelo menos uma vez"
echo "  7. Complete o rollover"
echo "  8. Tente sacar novamente (deve ser permitido)"
