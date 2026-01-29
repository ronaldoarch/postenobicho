#!/bin/bash
# Script para corrigir schema do banco de dados no servidor
# Adiciona colunas faltantes do Meta Pixel e Webhook
# Execute: ./scripts/fix-database-schema.sh

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🔧 Corrigindo Schema do Banco de Dados ==="
echo ""
echo "📝 Você precisará digitar a senha SSH: bicho@321"
echo ""

# 1. Enviar schema atualizado
echo "1️⃣ Enviando schema Prisma atualizado..."
rsync -avz $LOCAL_DIR/prisma/schema.prisma $SERVER:$SERVER_DIR/prisma/

# 2. Aplicar mudanças no banco usando Prisma db push
echo ""
echo "2️⃣ Sincronizando schema com banco de dados..."
ssh $SERVER << 'ENDSSH'
cd /var/www/postenobicho

echo "📋 Aplicando alterações no banco usando Prisma db push..."
echo "⚠️  Isso vai adicionar as colunas faltantes automaticamente"
echo ""

# Usar prisma db push para sincronizar schema (mais seguro que SQL direto)
npx prisma db push --accept-data-loss

echo ""
echo "✅ Schema sincronizado!"

# 3. Regenerar Prisma Client
echo ""
echo "🔧 Regenerando Prisma Client..."
npx prisma generate

echo ""
echo "✅ Prisma Client regenerado!"
ENDSSH

# 3. Reiniciar PM2
echo ""
echo "3️⃣ Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart lotbicho"

echo ""
echo "=== ✅ Correção concluída! ==="
echo ""
echo "📋 O que foi feito:"
echo "  ✅ Schema Prisma atualizado no servidor"
echo "  ✅ Colunas do Meta Pixel e Webhook adicionadas ao banco"
echo "  ✅ Prisma Client regenerado"
echo "  ✅ PM2 reiniciado"
echo ""
echo "🎉 Agora você pode salvar as configurações sem erros!"
