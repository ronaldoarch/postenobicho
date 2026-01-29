#!/bin/bash

# Script para deploy da funcionalidade de configuração de extrações por dia
# Inclui criação da tabela no banco de dados

set -e

SSH_KEY="$HOME/.ssh/id_rsa_postenobicho"
SERVER="root@104.218.52.159"
SERVER_PATH="/var/www/postenobicho"

echo "🚀 Iniciando deploy da configuração de extrações por dia..."

# Verificar se a chave SSH existe
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ Chave SSH não encontrada: $SSH_KEY"
    exit 1
fi

# 1. Enviar arquivos atualizados
echo "📤 Enviando arquivos atualizados..."
rsync -avz --exclude='._*' --exclude='node_modules' --exclude='.next' \
  -e "ssh -i $SSH_KEY -o BatchMode=yes" \
  prisma/schema.prisma \
  app/api/admin/extracoes-por-dia/ \
  app/admin/configuracoes/page.tsx \
  app/api/apostas/route.ts \
  scripts/criar-tabela-configuracao-extracoes-por-dia.sql \
  $SERVER:$SERVER_PATH/

# 2. Criar tabela no banco de dados
echo "🗄️ Criando tabela no banco de dados..."
ssh -i $SSH_KEY -o BatchMode=yes $SERVER "cd $SERVER_PATH && mysql -u root -p$(grep DATABASE_PASSWORD .env | cut -d '=' -f2) $(grep DATABASE_NAME .env | cut -d '=' -f2) < scripts/criar-tabela-configuracao-extracoes-por-dia.sql 2>&1 || echo 'Tabela pode já existir ou erro ao criar (verificar manualmente)'"

# 3. Regenerar Prisma Client no servidor
echo "🔧 Regenerando Prisma Client..."
ssh -i $SSH_KEY -o BatchMode=yes $SERVER "cd $SERVER_PATH && npx prisma generate"

# 4. Parar PM2
echo "⏸️ Parando PM2..."
ssh -i $SSH_KEY -o BatchMode=yes $SERVER "cd $SERVER_PATH && pm2 stop lotbicho || true"

# 5. Limpar cache e fazer build
echo "🔨 Fazendo build..."
ssh -i $SSH_KEY -o BatchMode=yes $SERVER "cd $SERVER_PATH && rm -rf .next && npm run build 2>&1 | tail -30"

# 6. Reiniciar PM2
echo "▶️ Reiniciando PM2..."
ssh -i $SSH_KEY -o BatchMode=yes $SERVER "cd $SERVER_PATH && pm2 restart lotbicho --update-env"

# 7. Verificar status
echo "✅ Verificando status do PM2..."
ssh -i $SSH_KEY -o BatchMode=yes $SERVER "pm2 status lotbicho"

echo ""
echo "✅ Deploy concluído!"
echo ""
echo "📝 Próximos passos:"
echo "1. Acesse /admin/configuracoes no painel admin"
echo "2. Role até 'Extrações Permitidas por Dia da Semana'"
echo "3. Configure quais extrações podem receber apostas em cada dia"
echo "4. Teste fazendo uma aposta em um dia/extracao não permitida"
