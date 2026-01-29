#!/bin/bash
# Script para configurar autenticação SSH sem senha
# Execute uma vez: ./scripts/configurar-ssh.sh

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
SSH_KEY="$HOME/.ssh/id_rsa_postenobicho"
SSH_KEY_PUB="$SSH_KEY.pub"

echo "=== 🔐 Configuração de SSH sem Senha ==="
echo ""

# Verificar se a chave já existe
if [ -f "$SSH_KEY" ]; then
    echo "✅ Chave SSH já existe: $SSH_KEY"
    echo ""
    echo "Testando conexão..."
    if ssh -i "$SSH_KEY" -o BatchMode=yes -o ConnectTimeout=5 $SERVER "echo 'Conexão OK'" 2>/dev/null; then
        echo "✅ Conexão SSH funcionando sem senha!"
        echo ""
        echo "Você pode usar o script deploy-completo-tudo.sh agora sem precisar digitar senha."
        exit 0
    else
        echo "⚠️  Chave existe mas não está autorizada no servidor."
        echo "   Vamos copiar a chave pública para o servidor..."
    fi
else
    echo "📝 Criando nova chave SSH..."
    echo ""
    ssh-keygen -t rsa -b 4096 -f "$SSH_KEY" -N "" -C "postenobicho-deploy"
    echo ""
    echo "✅ Chave criada: $SSH_KEY"
fi

# Copiar chave pública para o servidor
echo ""
echo "📤 Copiando chave pública para o servidor..."
echo "   Você precisará digitar a senha SSH UMA ÚLTIMA VEZ..."
echo ""

# Tentar copiar a chave
if ssh-copy-id -i "$SSH_KEY_PUB" $SERVER 2>/dev/null; then
    echo "✅ Chave copiada com sucesso!"
elif command -v sshpass &> /dev/null; then
    echo "   Usando sshpass..."
    read -sp "Digite a senha SSH: " SSH_PASSWORD
    echo ""
    sshpass -p "$SSH_PASSWORD" ssh-copy-id -i "$SSH_KEY_PUB" -o StrictHostKeyChecking=no $SERVER
    echo "✅ Chave copiada com sucesso!"
else
    echo ""
    echo "⚠️  ssh-copy-id não funcionou automaticamente."
    echo "   Vamos fazer manualmente..."
    echo ""
    read -sp "Digite a senha SSH: " SSH_PASSWORD
    echo ""
    
    # Copiar chave manualmente
    cat "$SSH_KEY_PUB" | sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && chmod 700 ~/.ssh"
    echo "✅ Chave copiada manualmente!"
fi

# Testar conexão
echo ""
echo "🧪 Testando conexão sem senha..."
if ssh -i "$SSH_KEY" -o BatchMode=yes -o ConnectTimeout=5 $SERVER "echo 'Conexão OK'" 2>/dev/null; then
    echo "✅ Conexão SSH funcionando sem senha!"
    echo ""
    echo "🎉 Configuração concluída!"
    echo ""
    echo "Agora você pode usar:"
    echo "   ./scripts/deploy-completo-tudo.sh"
    echo ""
    echo "Sem precisar digitar senha!"
else
    echo "❌ Ainda precisa de senha. Verifique a configuração."
    exit 1
fi
