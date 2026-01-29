#!/bin/bash
# Script rápido para fazer deploy apenas da correção do dashboard
# Execute: ./scripts/deploy-fix-dashboard.sh

SSH_KEY="$HOME/.ssh/id_rsa_postenobicho"
SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

# Verificar se a chave SSH existe
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ Chave SSH não encontrada"
    exit 1
fi

# Função para executar comandos SSH
ssh_cmd() {
    ssh -i "$SSH_KEY" -o BatchMode=yes -o ConnectTimeout=10 $SERVER "$@"
}

# Função para rsync
rsync_cmd() {
    rsync -avz -e "ssh -i $SSH_KEY -o BatchMode=yes" "$@"
}

echo "=== 🚀 Deploy Correção Dashboard ==="
echo ""

# 1. Enviar arquivo corrigido
echo "1️⃣ Enviando app/api/admin/dashboard/route.ts..."
rsync_cmd "$LOCAL_DIR/app/api/admin/dashboard/route.ts" "$SERVER:$SERVER_DIR/app/api/admin/dashboard/route.ts"

# 2. Reiniciar PM2
echo ""
echo "2️⃣ Reiniciando PM2..."
ssh_cmd "cd $SERVER_DIR && pm2 restart lotbicho --update-env"
sleep 3

# 3. Verificar status
echo ""
echo "3️⃣ Verificando status..."
ssh_cmd "cd $SERVER_DIR && pm2 status"

echo ""
echo "=== ✅ Deploy Concluído! ==="
echo ""
echo "🎯 Teste o dashboard agora - deve mostrar os dados corretos!"
echo ""
