#!/bin/bash
# Script de Deploy Completo - Build e Upload para Servidor
# Uso: ./scripts/deploy-build.sh

set -e  # Parar em caso de erro

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações do servidor
SERVER_IP="104.218.52.159"
SERVER_USER="root"
SERVER_PASS="bicho@321"
SERVER_PATH="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo -e "${BLUE}=== 🚀 Deploy Completo - Poste no Bicho ===${NC}"
echo ""

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Execute este script a partir da raiz do projeto${NC}"
    exit 1
fi

# Verificar se sshpass está instalado (macOS)
if ! command -v sshpass &> /dev/null; then
    echo -e "${YELLOW}⚠️  sshpass não encontrado. Tentando instalar...${NC}"
    if command -v brew &> /dev/null; then
        brew install hudochenkov/sshpass/sshpass || echo -e "${RED}❌ Instale manualmente: brew install hudochenkov/sshpass/sshpass${NC}"
    else
        echo -e "${RED}❌ Instale sshpass manualmente ou use ssh com chave${NC}"
        exit 1
    fi
fi

# Passo 1: Fazer build local
echo -e "${YELLOW}📦 Passo 1/5: Fazendo build local...${NC}"
echo ""

# Limpar build anterior
if [ -d ".next" ]; then
    echo "Limpando build anterior..."
    rm -rf .next
fi

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "Instalando dependências..."
    npm install
fi

# Gerar Prisma Client
echo "Gerando Prisma Client..."
npx prisma generate

# Fazer build
echo "Executando build do Next.js..."
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro no build! Corrija os erros antes de continuar.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build concluído com sucesso!${NC}"
echo ""

# Passo 2: Preparar arquivos para upload
echo -e "${YELLOW}📤 Passo 2/5: Preparando arquivos para upload...${NC}"

# Criar lista de arquivos/diretórios para enviar
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

# Verificar quais arquivos existem
EXISTING_FILES=()
for file in "${FILES_TO_SEND[@]}"; do
    if [ -e "$file" ]; then
        EXISTING_FILES+=("$file")
    else
        echo -e "${YELLOW}⚠️  Arquivo não encontrado: $file${NC}"
    fi
done

echo -e "${GREEN}✅ ${#EXISTING_FILES[@]} arquivos/diretórios preparados${NC}"
echo ""

# Passo 3: Enviar arquivos para o servidor
echo -e "${YELLOW}📤 Passo 3/5: Enviando arquivos para o servidor...${NC}"
echo "Servidor: ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}"
echo ""

# Criar diretório no servidor se não existir
sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "mkdir -p ${SERVER_PATH}"

# Enviar cada arquivo/diretório
for file in "${EXISTING_FILES[@]}"; do
    echo -n "Enviando $file... "
    if sshpass -p "$SERVER_PASS" scp -r -o StrictHostKeyChecking=no "$file" ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/ 2>/dev/null; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${RED}❌${NC}"
        echo -e "${RED}Erro ao enviar $file${NC}"
        exit 1
    fi
done

echo ""
echo -e "${GREEN}✅ Arquivos enviados com sucesso!${NC}"
echo ""

# Passo 4: Executar comandos no servidor
echo -e "${YELLOW}🔧 Passo 4/5: Executando comandos no servidor...${NC}"
echo ""

sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
set -e

cd /var/www/postenobicho

echo "=== Verificando Node.js ==="
node --version || (echo "❌ Node.js não encontrado!" && exit 1)
npm --version || (echo "❌ npm não encontrado!" && exit 1)

echo ""
echo "=== Instalando dependências de produção ==="
npm ci --production=false || npm install --production=false

echo ""
echo "=== Gerando Prisma Client ==="
npx prisma generate

echo ""
echo "=== Executando migrações (se houver) ==="
npx prisma migrate deploy || echo "⚠️  Nenhuma migration pendente ou erro (pode ser normal)"

echo ""
echo "=== Verificando estrutura de arquivos ==="
ls -la .next/standalone 2>/dev/null || echo "⚠️  Build standalone não encontrado (pode ser normal)"
ls -la .next/static 2>/dev/null || echo "⚠️  Build static não encontrado"

echo ""
echo "=== Reiniciando aplicação PM2 ==="
if pm2 list | grep -q "lotbicho"; then
    echo "Aplicação encontrada no PM2, reiniciando..."
    pm2 restart lotbicho
else
    echo "Aplicação não encontrada no PM2, iniciando..."
    if [ -f "ecosystem.config.js" ]; then
        pm2 start ecosystem.config.js
    else
        pm2 start npm --name lotbicho -- start
    fi
fi

echo ""
echo "=== Status do PM2 ==="
pm2 status

echo ""
echo "=== Aguardando aplicação iniciar... ==="
sleep 5

echo ""
echo "=== Testando rotas principais ==="
for route in "/" "/api/status"; do
    status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000$route || echo "000")
    if [ "$status" = "200" ] || [ "$status" = "404" ]; then
        echo "✅ $route: OK ($status)"
    else
        echo "⚠️  $route: Status $status"
    fi
done

echo ""
echo "=== ✅ Comandos no servidor concluídos! ==="
ENDSSH

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao executar comandos no servidor!${NC}"
    exit 1
fi

# Passo 5: Verificação final
echo ""
echo -e "${YELLOW}🔍 Passo 5/5: Verificação final...${NC}"
echo ""

# Testar se o servidor está respondendo
echo -n "Testando servidor... "
if curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://${SERVER_IP} | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✅ Servidor respondendo${NC}"
else
    echo -e "${YELLOW}⚠️  Servidor pode não estar respondendo ainda${NC}"
fi

echo ""
echo -e "${GREEN}=== 🎉 Deploy concluído com sucesso! ===${NC}"
echo ""
echo -e "${BLUE}📋 Informações:${NC}"
echo "   Servidor: http://${SERVER_IP}"
echo "   Diretório: ${SERVER_PATH}"
echo ""
echo -e "${YELLOW}💡 Comandos úteis:${NC}"
echo "   Ver logs: ssh ${SERVER_USER}@${SERVER_IP} 'pm2 logs lotbicho'"
echo "   Reiniciar: ssh ${SERVER_USER}@${SERVER_IP} 'pm2 restart lotbicho'"
echo "   Status: ssh ${SERVER_USER}@${SERVER_IP} 'pm2 status'"
echo ""
