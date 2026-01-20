#!/bin/bash

# Script Completo de Deploy - Poste no Bicho
# Inclui: upload de arquivos, migration SQL, geração Prisma Client e restart PM2

set -e

echo "🚀 Iniciando deploy completo..."

# Configurações
SERVER="root@104.218.52.159"
REMOTE_DIR="/var/www/postenobicho"
DB_NAME="KeitaroBANCO2026"
DB_USER="admin_postenobicho"

# Solicitar senha do banco de dados
read -sp "Digite a senha do banco de dados MySQL: " DB_PASS
echo ""

# 1. Enviar arquivos atualizados
echo "📤 Enviando arquivos para o servidor..."
scp -r .next/ ${SERVER}:${REMOTE_DIR}/
scp -r prisma/ ${SERVER}:${REMOTE_DIR}/
scp package.json ${SERVER}:${REMOTE_DIR}/
scp package-lock.json ${SERVER}:${REMOTE_DIR}/

# 2. Executar comandos no servidor
echo "🔧 Executando comandos no servidor..."
ssh ${SERVER} << EOF
set -e

cd ${REMOTE_DIR}

echo "📦 Instalando dependências (se necessário)..."
npm ci --production

echo "🗄️ Executando migration SQL..."
mysql -u ${DB_USER} -p'${DB_PASS}' ${DB_NAME} < prisma/migrations/add_cotacao_fields.sql 2>&1 | grep -v "Warning" || true

echo "🔨 Gerando Prisma Client..."
npx prisma generate

echo "🔄 Reiniciando aplicação PM2..."
pm2 restart lotbicho

echo "📊 Verificando status..."
pm2 status lotbicho

echo "✅ Deploy concluído com sucesso!"

EOF

echo ""
echo "✅ Deploy completo finalizado!"
echo "🌐 Acesse: https://postenobicho.com"
