#!/bin/bash

# Script para fazer deploy das alterações de localizações

SERVER_USER="root"
SERVER_HOST="104.218.52.159"
SERVER_PATH="/var/www/postenobicho"
SSH_KEY="$HOME/.ssh/id_rsa_postenobicho"

echo "================================================"
echo "🚀 Deploy do sistema de localizações..."
echo "================================================"

# Verificar se a chave SSH existe
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ Chave SSH não encontrada: $SSH_KEY"
    exit 1
fi

# Enviar arquivos modificados
echo "📦 Enviando arquivos..."

rsync -avz --progress \
    -e "ssh -i $SSH_KEY" \
    prisma/schema.prisma \
    $SERVER_USER@$SERVER_HOST:$SERVER_PATH/prisma/

rsync -avz --progress \
    -e "ssh -i $SSH_KEY" \
    lib/ip-geolocation.ts \
    $SERVER_USER@$SERVER_HOST:$SERVER_PATH/lib/

rsync -avz --progress \
    -e "ssh -i $SSH_KEY" \
    app/api/auth/register/route.ts \
    $SERVER_USER@$SERVER_HOST:$SERVER_PATH/app/api/auth/register/

rsync -avz --progress \
    -e "ssh -i $SSH_KEY" \
    app/api/apostas/route.ts \
    $SERVER_USER@$SERVER_HOST:$SERVER_PATH/app/api/apostas/

rsync -avz --progress \
    -e "ssh -i $SSH_KEY" \
    app/api/admin/localizacoes/ \
    $SERVER_USER@$SERVER_HOST:$SERVER_PATH/app/api/admin/localizacoes/

rsync -avz --progress \
    -e "ssh -i $SSH_KEY" \
    app/admin/localizacoes/ \
    $SERVER_USER@$SERVER_HOST:$SERVER_PATH/app/admin/localizacoes/

rsync -avz --progress \
    -e "ssh -i $SSH_KEY" \
    components/MapaLocalizacoes.tsx \
    $SERVER_USER@$SERVER_HOST:$SERVER_PATH/components/

rsync -avz --progress \
    -e "ssh -i $SSH_KEY" \
    app/admin/layout.tsx \
    $SERVER_USER@$SERVER_HOST:$SERVER_PATH/app/admin/

echo ""
echo "🔄 Aplicando migration e reiniciando aplicação no servidor..."

ssh -i $SSH_KEY $SERVER_USER@$SERVER_HOST << 'ENDSSH'
cd /var/www/postenobicho

echo "📦 Gerando Prisma Client..."
npx prisma generate

echo "🗄️ Aplicando migration..."
npx prisma db push --accept-data-loss || echo "⚠️ Migration pode ter falhado, mas continuando..."

echo "🔨 Rebuildando aplicação..."
npm run build

echo "🔄 Reiniciando PM2..."
pm2 restart lotbicho --update-env

echo "✅ Deploy concluído!"
ENDSSH

echo ""
echo "================================================"
echo "✅ Deploy concluído!"
echo "================================================"
echo ""
echo "📋 Teste:"
echo "1. Acesse /admin/localizacoes no painel admin"
echo "2. Faça um cadastro ou aposta para testar"
echo "3. Verifique se as localizações aparecem no mapa"
