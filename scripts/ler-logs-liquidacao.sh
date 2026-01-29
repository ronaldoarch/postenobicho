#!/bin/bash
# Script para ler o log de liquidação de hoje

# Configurações
SERVER_USER="root"
SERVER_IP="104.218.52.159"
PROJECT_PATH="/var/www/postenobicho"
SSH_KEY_PATH="$HOME/.ssh/id_rsa_postenobicho"

echo "================================================"
echo "📄 Lendo logs de liquidação de hoje..."
echo "================================================"

DATA_HOJE=$(date '+%Y%m%d')
LOG_FILE="$PROJECT_PATH/scripts/logs/liquidacao-$DATA_HOJE.log"

ssh -i "$SSH_KEY_PATH" "$SERVER_USER@$SERVER_IP" "cat $LOG_FILE"

echo "================================================"
echo "✅ Fim do log."
echo "================================================"
