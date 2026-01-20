#!/bin/bash

# Script de Deploy Completo - Poste no Bicho
# Senha SSH: Bicho@321

set -e

SERVER="root@104.218.52.159"
REMOTE_DIR="/var/www/postenobicho"
SSH_PASS="Bicho@321"

echo "🚀 Iniciando deploy completo..."

# Instalar sshpass se não estiver instalado (macOS)
if ! command -v sshpass &> /dev/null; then
    echo "📦 Instalando sshpass..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install hudochenkov/sshpass/sshpass 2>/dev/null || echo "⚠️  sshpass não instalado. Você precisará digitar a senha manualmente."
    fi
fi

# Função para executar comandos SSH
ssh_exec() {
    if command -v sshpass &> /dev/null; then
        sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no "$SERVER" "$@"
    else
        ssh -o StrictHostKeyChecking=no "$SERVER" "$@"
    fi
}

# Função para copiar arquivos
scp_copy() {
    if command -v sshpass &> /dev/null; then
        sshpass -p "$SSH_PASS" scp -o StrictHostKeyChecking=no "$@"
    else
        scp -o StrictHostKeyChecking=no "$@"
    fi
}

# 1. Enviar arquivos atualizados
echo "📤 Enviando arquivos para o servidor..."

scp_copy -r .next/ "$SERVER:$REMOTE_DIR/" || {
    echo "⚠️  Erro ao enviar .next/. Tentando novamente..."
    scp_copy -r .next/ "$SERVER:$REMOTE_DIR/"
}

scp_copy components/NumberCalculator.tsx "$SERVER:$REMOTE_DIR/components/" || echo "⚠️  NumberCalculator já existe"
scp_copy components/BetFlow.tsx "$SERVER:$REMOTE_DIR/components/"
scp_copy app/admin/page.tsx "$SERVER:$REMOTE_DIR/app/admin/"
scp_copy app/admin/layout.tsx "$SERVER:$REMOTE_DIR/app/admin/"
scp_copy app/api/admin/dashboard/route.ts "$SERVER:$REMOTE_DIR/app/api/admin/dashboard/"
scp_copy types/bet.ts "$SERVER:$REMOTE_DIR/types/"
scp_copy app/api/apostas/route.ts "$SERVER:$REMOTE_DIR/app/api/apostas/"
scp_copy package.json "$SERVER:$REMOTE_DIR/"
scp_copy package-lock.json "$SERVER:$REMOTE_DIR/"

echo "✅ Arquivos enviados"

# 2. Executar comandos no servidor
echo "🔧 Executando comandos no servidor..."

ssh_exec << 'EOF'
cd /var/www/postenobicho

echo "📦 Instalando dependências..."
npm ci --production

echo "🔨 Gerando Prisma Client..."
npx prisma generate

echo "🔄 Reiniciando aplicação PM2..."
pm2 restart lotbicho

echo "📊 Verificando status..."
pm2 status lotbicho

echo "✅ Deploy concluído!"
EOF

echo ""
echo "✅ Deploy completo finalizado!"
echo "🌐 Acesse: https://postenobicho.com/admin"
echo ""
echo "📝 Para criar usuário admin, execute no servidor:"
echo "   cd /var/www/postenobicho"
echo "   npx tsx scripts/create-admin.ts admin@postenobicho.com Bicho@321 Administrador"
