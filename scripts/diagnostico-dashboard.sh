#!/bin/bash
# Script para diagnosticar por que o dashboard está zerado
# Execute: ./scripts/diagnostico-dashboard.sh

SSH_KEY="$HOME/.ssh/id_rsa_postenobicho"
SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"

# Função para executar comandos SSH
ssh_cmd() {
    ssh -i "$SSH_KEY" -o BatchMode=yes -o ConnectTimeout=10 $SERVER "$@"
}

echo "=== 🔍 Diagnóstico do Dashboard ==="
echo ""

# Enviar script Node.js
echo "📤 Enviando script de diagnóstico..."
rsync -avz -e "ssh -i $SSH_KEY -o BatchMode=yes" scripts/diagnostico-dashboard.js "$SERVER:$SERVER_DIR/scripts/diagnostico-dashboard.js"

# Executar diagnóstico
echo ""
echo "🔍 Executando diagnóstico..."
ssh_cmd "cd $SERVER_DIR && node scripts/diagnostico-dashboard.js"

echo ""
echo "=== ✅ Diagnóstico Concluído ==="
echo ""
