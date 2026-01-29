#!/bin/bash
# Script rápido para fazer deploy das correções mobile e saldo
# Execute: ./scripts/deploy-fix-mobile-saldo.sh

SSH_KEY="$HOME/.ssh/id_rsa_postenobicho"
SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

# Função para executar comandos SSH
ssh_cmd() {
    ssh -i "$SSH_KEY" -o BatchMode=yes -o ConnectTimeout=10 $SERVER "$@"
}

# Função para rsync
rsync_cmd() {
    rsync -avz -e "ssh -i $SSH_KEY -o BatchMode=yes" "$@"
}

echo "=== 🚀 Deploy Correções Mobile e Saldo ==="
echo ""

# Arquivos para enviar
FILES=(
  "components/Header.tsx"
  "components/ProfileModal.tsx"
  "components/BottomNav.tsx"
  "components/BetFlow.tsx"
  "components/InstantResultModal.tsx"
)

# 1. Enviar arquivos
echo "1️⃣ Enviando arquivos corrigidos..."
for file in "${FILES[@]}"; do
  if [ -f "$LOCAL_DIR/$file" ]; then
    echo "   📤 $file"
    rsync_cmd "$LOCAL_DIR/$file" "$SERVER:$SERVER_DIR/$file"
  fi
done

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
echo "📋 Correções aplicadas:"
echo "   ✅ Logo fixa no mobile (não acompanha scroll)"
echo "   ✅ Botão de depósito removido do perfil"
echo "   ✅ Saldo atualizado automaticamente após apostas/ganhos"
echo "   ✅ Botão 'Realizar Aposta' vai direto para página de apostas"
echo ""
