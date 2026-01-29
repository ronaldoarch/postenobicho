#!/bin/bash
# Script para disparar a liquidação manualmente e ver o log

# Configurações
SERVER_USER="root"
SERVER_IP="104.218.52.159"
PROJECT_PATH="/var/www/postenobicho"
SSH_KEY_PATH="$HOME/.ssh/id_rsa_postenobicho"

echo "================================================"
echo "🚀 Disparando liquidação manual no servidor..."
echo "================================================"

# Verificar se a chave SSH existe
if [ ! -f "$SSH_KEY_PATH" ]; then
    echo "❌ Chave SSH não encontrada em $SSH_KEY_PATH"
    exit 1
fi

chmod 600 "$SSH_KEY_PATH"

# Executar o script de liquidação diretamente e capturar a saída
ssh -i "$SSH_KEY_PATH" "$SERVER_USER@$SERVER_IP" "bash $PROJECT_PATH/scripts/cron/liquidar.sh"

echo "================================================"
echo "✅ Execução finalizada."
echo "================================================"
