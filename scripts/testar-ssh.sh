#!/bin/bash
# Script rápido para testar conexão SSH sem senha
# Execute: ./scripts/testar-ssh.sh

SSH_KEY="$HOME/.ssh/id_rsa_postenobicho"
SERVER="root@104.218.52.159"

echo "=== 🧪 Teste de Conexão SSH ==="
echo ""

if [ ! -f "$SSH_KEY" ]; then
    echo "❌ Chave SSH não encontrada: $SSH_KEY"
    echo ""
    echo "Execute primeiro:"
    echo "   ./scripts/configurar-ssh.sh"
    exit 1
fi

echo "🔑 Chave SSH encontrada: $SSH_KEY"
echo ""

echo "🔐 Testando conexão..."
if ssh -i "$SSH_KEY" -o BatchMode=yes -o ConnectTimeout=5 $SERVER "echo '✅ Conexão OK!'" 2>/dev/null; then
    echo ""
    echo "✅ Conexão SSH funcionando sem senha!"
    echo ""
    echo "Você pode executar agora:"
    echo "   ./scripts/deploy-completo-tudo.sh"
    exit 0
else
    echo ""
    echo "❌ Erro: Ainda precisa de senha!"
    echo ""
    echo "Execute novamente:"
    echo "   ./scripts/configurar-ssh.sh"
    exit 1
fi
