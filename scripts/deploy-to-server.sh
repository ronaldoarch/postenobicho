#!/bin/bash
# Script completo de deploy para o servidor
# Uso: ./scripts/deploy-to-server.sh

set -e  # Parar em caso de erro

SERVER_IP="104.218.52.159"
SERVER_USER="root"
SERVER_PASS="Bicho@321"
SERVER_PATH="/var/www/postenobicho"

echo "=== 🚀 Iniciando deploy para o servidor ==="
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se sshpass está instalado
if ! command -v sshpass &> /dev/null; then
    echo -e "${RED}❌ sshpass não está instalado. Instale com: brew install sshpass${NC}"
    exit 1
fi

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Execute este script a partir da raiz do projeto${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Preparando arquivos para deploy...${NC}"

# Criar arquivo temporário com lista de arquivos para excluir
cat > /tmp/.deploy-exclude << EOF
node_modules
.next
.git
.env.local
.env.development
.env.test
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.DS_Store
*.swp
*.swo
*~
.vscode
.idea
coverage
.nyc_output
build.tar.gz
EOF

echo -e "${YELLOW}📤 Enviando arquivos para o servidor...${NC}"

# Enviar arquivos usando rsync (mais eficiente que scp)
sshpass -p "$SERVER_PASS" rsync -avz \
    --exclude-from=/tmp/.deploy-exclude \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='.next' \
    --delete \
    ./ ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/

echo -e "${GREEN}✅ Arquivos enviados com sucesso!${NC}"

echo -e "${YELLOW}🔧 Executando comandos no servidor...${NC}"

# Executar comandos no servidor
sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
set -e

cd /var/www/postenobicho

echo "=== Instalando dependências ==="
npm install --production=false

echo ""
echo "=== Gerando Prisma Client ==="
npx prisma generate

echo ""
echo "=== Fazendo build do projeto ==="
rm -rf .next
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "=== ✅ Build concluído com sucesso! ==="
    echo ""
    echo "=== Reiniciando PM2 ==="
    pm2 restart lotbicho || pm2 start npm --name lotbicho -- start
    
    echo ""
    echo "=== Status do PM2 ==="
    pm2 status
    
    echo ""
    echo "=== Testando rotas principais ==="
    sleep 3
    for route in "/" "/login" "/cadastro" "/apostar" "/cotacao" "/suporte"; do
        status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000$route)
        if [ "$status" = "200" ]; then
            echo "✅ $route: OK ($status)"
        else
            echo "❌ $route: ERRO ($status)"
        fi
    done
    
    echo ""
    echo "=== ✅ Deploy concluído com sucesso! ==="
else
    echo ""
    echo "=== ❌ Erro no build! Verifique os logs acima ==="
    exit 1
fi
ENDSSH

# Limpar arquivo temporário
rm -f /tmp/.deploy-exclude

echo ""
echo -e "${GREEN}=== 🎉 Deploy concluído! ===${NC}"
echo ""
echo "Acesse: http://${SERVER_IP}"
