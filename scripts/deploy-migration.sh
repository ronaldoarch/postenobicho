#!/bin/bash

# Script de Deploy - Migration do Banco de Dados
# Executa a migration SQL no servidor

set -e

echo "🚀 Iniciando deploy da migration..."

# Configurações
SERVER="root@104.218.52.159"
REMOTE_DIR="/var/www/postenobicho"
DB_NAME="KeitaroBANCO2026"
DB_USER="admin_postenobicho"

# Solicitar senha do banco de dados
read -sp "Digite a senha do banco de dados MySQL: " DB_PASS
echo ""

# 1. Enviar arquivo de migration para o servidor
echo "📤 Enviando arquivo de migration..."
scp prisma/migrations/add_cotacao_fields.sql ${SERVER}:${REMOTE_DIR}/migration.sql

# 2. Executar migration no servidor
echo "🔧 Executando migration no servidor..."
ssh ${SERVER} << EOF
cd ${REMOTE_DIR}

# Executar migration SQL
mysql -u ${DB_USER} -p'${DB_PASS}' ${DB_NAME} < migration.sql

# Verificar se a migration foi aplicada
mysql -u ${DB_USER} -p'${DB_PASS}' ${DB_NAME} -e "DESCRIBE Cotacao;" | grep -E "(modalidadeId|extracaoId|promocaoId|isSpecial)" && echo "✅ Migration aplicada com sucesso!" || echo "❌ Erro na migration"

# Limpar arquivo temporário
rm -f migration.sql

EOF

echo "✅ Deploy da migration concluído!"
