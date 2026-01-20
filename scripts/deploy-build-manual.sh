#!/bin/bash
# Script de Deploy - Versão Manual (sem sshpass)
# Uso: ./scripts/deploy-build-manual.sh

set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configurações do servidor
SERVER_IP="104.218.52.159"
SERVER_USER="root"
SERVER_PATH="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo -e "${BLUE}=== 🚀 Deploy Manual - Poste no Bicho ===${NC}"
echo ""

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Execute este script a partir da raiz do projeto${NC}"
    exit 1
fi

# Verificar se o build existe
if [ ! -d ".next" ]; then
    echo -e "${YELLOW}⚠️  Build não encontrado. Fazendo build...${NC}"
    npm run build
fi

echo -e "${GREEN}✅ Build encontrado!${NC}"
echo ""

# Lista de arquivos para enviar
FILES_TO_SEND=(
    ".next"
    "public"
    "prisma"
    "package.json"
    "package-lock.json"
    "ecosystem.config.js"
    "next.config.js"
    "tsconfig.json"
    "tailwind.config.js"
    "postcss.config.js"
)

echo -e "${YELLOW}📤 Preparando upload dos seguintes arquivos:${NC}"
for file in "${FILES_TO_SEND[@]}"; do
    if [ -e "$file" ]; then
        echo "  ✅ $file"
    else
        echo -e "  ${YELLOW}⚠️  $file (não encontrado)${NC}"
    fi
done
echo ""

# Criar arquivo tar.gz com os arquivos
echo -e "${YELLOW}📦 Criando arquivo compactado...${NC}"
TAR_FILE="build-deploy-$(date +%Y%m%d-%H%M%S).tar.gz"

tar -czf "$TAR_FILE" "${FILES_TO_SEND[@]}" 2>/dev/null || {
    echo -e "${RED}❌ Erro ao criar arquivo compactado${NC}"
    exit 1
}

echo -e "${GREEN}✅ Arquivo criado: $TAR_FILE${NC}"
echo ""

# Instruções para upload manual
echo -e "${BLUE}=== 📋 Instruções para Upload Manual ===${NC}"
echo ""
echo "1. Envie o arquivo para o servidor:"
echo -e "   ${YELLOW}scp $TAR_FILE ${SERVER_USER}@${SERVER_IP}:/tmp/${NC}"
echo ""
echo "2. Conecte ao servidor:"
echo -e "   ${YELLOW}ssh ${SERVER_USER}@${SERVER_IP}${NC}"
echo ""
echo "3. Execute os seguintes comandos no servidor:"
echo ""
cat << 'EOF'
   cd /var/www/postenobicho
   
   # Fazer backup do build atual
   if [ -d ".next" ]; then
       mv .next .next.backup.$(date +%Y%m%d-%H%M%S)
   fi
   
   # Extrair novo build
   tar -xzf /tmp/build-deploy-*.tar.gz
   rm /tmp/build-deploy-*.tar.gz
   
   # Instalar dependências
   npm ci --production=false || npm install --production=false
   
   # Gerar Prisma Client
   npx prisma generate
   
   # Executar migrações (se houver)
   npx prisma migrate deploy || echo "Nenhuma migration pendente"
   
   # Reiniciar aplicação
   pm2 restart lotbicho || pm2 start ecosystem.config.js || pm2 start npm --name lotbicho -- start
   
   # Verificar status
   pm2 status
   pm2 logs lotbicho --lines 20
EOF

echo ""
echo -e "${GREEN}=== ✅ Instruções geradas! ===${NC}"
echo ""
echo -e "${YELLOW}💡 Dica: Você também pode usar rsync diretamente:${NC}"
echo ""
echo "rsync -avz --progress \\"
for file in "${FILES_TO_SEND[@]}"; do
    if [ -e "$file" ]; then
        echo "  $file \\"
    fi
done
echo "  ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/"
echo ""
