#!/bin/bash
# Script simples de deploy usando SCP
# Uso: ./scripts/deploy-simple.sh

set -e

SERVER_IP="104.218.52.159"
SERVER_USER="root"
SERVER_PASS="Bicho@321"
SERVER_PATH="/var/www/postenobicho"

echo "=== 🚀 Deploy Simples para o Servidor ==="
echo ""

# Criar script Python para restaurar arquivos no servidor
cat > /tmp/restore-pages.py << 'PYEOF'
import os
import sys

# Este script será executado no servidor para garantir que todas as páginas existam
# Por enquanto, apenas verifica se os arquivos principais existem

pages_to_check = [
    'app/page.tsx',
    'app/layout.tsx',
    'app/login/page.tsx',
    'app/cadastro/page.tsx',
    'app/apostar/page.tsx',
    'app/carteira/page.tsx',
    'app/minhas-apostas/page.tsx',
    'app/perfil/page.tsx',
    'app/cotacao/page.tsx',
    'app/resultados/page.tsx',
    'app/suporte/page.tsx',
]

missing = []
for page in pages_to_check:
    if not os.path.exists(page):
        missing.append(page)

if missing:
    print(f"⚠️  Páginas faltantes: {', '.join(missing)}")
    sys.exit(1)
else:
    print("✅ Todas as páginas principais estão presentes")
PYEOF

echo "📤 Enviando arquivos principais..."

# Enviar arquivos essenciais
sshpass -p "$SERVER_PASS" scp -r -o StrictHostKeyChecking=no \
    app/ \
    components/ \
    hooks/ \
    lib/ \
    data/ \
    types/ \
    public/ \
    prisma/ \
    scripts/ \
    *.json \
    *.js \
    *.ts \
    *.css \
    ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/ 2>&1 | grep -v "Warning: Permanently added" || true

echo "✅ Arquivos enviados!"

echo "🔧 Executando setup no servidor..."

sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /var/www/postenobicho

echo "=== Instalando dependências ==="
npm install

echo "=== Build ==="
rm -rf .next
npm run build

if [ $? -eq 0 ]; then
    echo "=== Reiniciando PM2 ==="
    pm2 restart lotbicho || pm2 start npm --name lotbicho -- start
    echo "✅ Deploy concluído!"
else
    echo "❌ Erro no build!"
    exit 1
fi
ENDSSH

rm -f /tmp/restore-pages.py

echo ""
echo "✅ Deploy concluído!"
