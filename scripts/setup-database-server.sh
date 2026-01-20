#!/bin/bash
# Script para criar tabelas no banco MySQL
# Execute este script no servidor

set -e

cd /var/www/postenobicho

echo "=== 🗄️ Configurando banco de dados ==="
echo ""

# 1. Verificar conexão
echo "1️⃣ Verificando conexão com MySQL..."
mysql -u admin_postenobicho -p'KeitaroBANCO2026' admin_postenobicho -e "SELECT 1" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Conexão OK"
else
    echo "❌ Erro na conexão"
    exit 1
fi

# 2. Verificar se tabelas já existem
echo ""
echo "2️⃣ Verificando tabelas existentes..."
TABLES=$(mysql -u admin_postenobicho -p'KeitaroBANCO2026' admin_postenobicho -e "SHOW TABLES;" 2>/dev/null | wc -l)
if [ $TABLES -gt 1 ]; then
    echo "✅ Encontradas $((TABLES-1)) tabela(s) no banco"
    mysql -u admin_postenobicho -p'KeitaroBANCO2026' admin_postenobicho -e "SHOW TABLES;" 2>/dev/null
else
    echo "⚠️  Nenhuma tabela encontrada. Será necessário criar."
fi

# 3. Verificar schema.prisma
echo ""
echo "3️⃣ Verificando schema.prisma..."
if grep -q 'provider = "mysql"' prisma/schema.prisma; then
    echo "✅ Schema configurado para MySQL"
else
    echo "❌ Schema não está configurado para MySQL"
    echo "Corrigindo..."
    sed -i 's/provider = "sqlite"/provider = "mysql"/' prisma/schema.prisma
    echo "✅ Schema corrigido"
fi

# 4. Gerar Prisma Client
echo ""
echo "4️⃣ Gerando Prisma Client..."
npx prisma generate

# 5. Criar/atualizar tabelas
echo ""
echo "5️⃣ Criando/atualizando tabelas no banco..."
npx prisma db push --accept-data-loss

# 6. Verificar tabelas criadas
echo ""
echo "6️⃣ Verificando tabelas criadas..."
TABLES_AFTER=$(mysql -u admin_postenobicho -p'KeitaroBANCO2026' admin_postenobicho -e "SHOW TABLES;" 2>/dev/null | wc -l)
echo "✅ Total de tabelas: $((TABLES_AFTER-1))"
mysql -u admin_postenobicho -p'KeitaroBANCO2026' admin_postenobicho -e "SHOW TABLES;" 2>/dev/null

# 7. Verificar se há dados nas tabelas principais
echo ""
echo "7️⃣ Verificando dados nas tabelas principais..."
echo "Tabela Configuracao:"
mysql -u admin_postenobicho -p'KeitaroBANCO2026' admin_postenobicho -e "SELECT COUNT(*) as total FROM Configuracao;" 2>/dev/null || echo "Tabela não existe ou vazia"

echo "Tabela Tema:"
mysql -u admin_postenobicho -p'KeitaroBANCO2026' admin_postenobicho -e "SELECT COUNT(*) as total FROM Tema;" 2>/dev/null || echo "Tabela não existe ou vazia"

echo "Tabela Usuario:"
mysql -u admin_postenobicho -p'KeitaroBANCO2026' admin_postenobicho -e "SELECT COUNT(*) as total FROM Usuario;" 2>/dev/null || echo "Tabela não existe ou vazia"

echo ""
echo "=== ✅ Configuração do banco concluída! ==="
echo ""
echo "📋 Próximos passos:"
echo "1. Reiniciar aplicação: pm2 restart lotbicho"
echo "2. Verificar logs: pm2 logs lotbicho --lines 30"
echo "3. Testar aplicação: curl http://localhost:3000/api/configuracoes"
