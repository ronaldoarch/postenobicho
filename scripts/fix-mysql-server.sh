#!/bin/bash
# Script para corrigir problemas de MySQL no servidor
# Execute este script no servidor via SSH

set -e

echo "=== 🔧 Corrigindo problemas de MySQL ==="
echo ""

# 1. Verificar se MySQL está instalado
echo "1️⃣ Verificando se MySQL está instalado..."
if command -v mysql &> /dev/null; then
    echo "✅ MySQL client encontrado"
    mysql --version
else
    echo "❌ MySQL client não encontrado"
    echo "Instalando MySQL..."
    apt update
    apt install -y mysql-client mysql-server
fi

# 2. Verificar se MySQL está rodando
echo ""
echo "2️⃣ Verificando se MySQL está rodando..."
if systemctl is-active --quiet mysql || systemctl is-active --quiet mysqld; then
    echo "✅ MySQL está rodando"
else
    echo "⚠️  MySQL não está rodando. Tentando iniciar..."
    systemctl start mysql || systemctl start mysqld || service mysql start || service mysqld start
    sleep 2
    if systemctl is-active --quiet mysql || systemctl is-active --quiet mysqld; then
        echo "✅ MySQL iniciado com sucesso"
    else
        echo "❌ Não foi possível iniciar MySQL"
        echo "Verificando se está instalado..."
        systemctl status mysql || systemctl status mysqld || echo "MySQL pode não estar instalado"
    fi
fi

# 3. Verificar DATABASE_URL
echo ""
echo "3️⃣ Verificando DATABASE_URL..."
cd /var/www/postenobicho
if [ -f .env ]; then
    DATABASE_URL=$(grep DATABASE_URL .env | cut -d '=' -f2 | tr -d '"')
    echo "DATABASE_URL atual: $DATABASE_URL"
    
    # Extrair informações da URL
    if [[ $DATABASE_URL == mysql://* ]]; then
        # Extrair usuário, senha, host, porta e banco
        # Formato: mysql://usuario:senha@host:porta/banco
        echo "✅ Formato da URL está correto"
    else
        echo "❌ Formato da URL está incorreto"
    fi
else
    echo "❌ Arquivo .env não encontrado"
fi

# 4. Testar conexão com diferentes senhas
echo ""
echo "4️⃣ Testando conexão MySQL..."
echo "Tentando diferentes variações de senha..."

# Tentar com KeitaroBANCO2026
echo "Testando: KeitaroBANCO2026"
mysql -u admin_postenobicho -p'KeitaroBANCO2026' admin_postenobicho -e "SELECT 1" 2>&1 | head -1 && echo "✅ Senha correta: KeitaroBANCO2026" || echo "❌ Senha incorreta: KeitaroBANCO2026"

# Tentar com KeitaroBANC02026
echo "Testando: KeitaroBANC02026"
mysql -u admin_postenobicho -p'KeitaroBANC02026' admin_postenobicho -e "SELECT 1" 2>&1 | head -1 && echo "✅ Senha correta: KeitaroBANC02026" || echo "❌ Senha incorreta: KeitaroBANC02026"

# Tentar com KeitaroBANCO2026 (com O maiúsculo)
echo "Testando: KeitaroBANCO2026"
mysql -u admin_postenobicho -p'KeitaroBANCO2026' admin_postenobicho -e "SELECT 1" 2>&1 | head -1 && echo "✅ Senha correta: KeitaroBANCO2026" || echo "❌ Senha incorreta: KeitaroBANCO2026"

# 5. Verificar se o banco existe
echo ""
echo "5️⃣ Verificando se o banco de dados existe..."
# Tentar conectar como root primeiro
if mysql -u root -e "SHOW DATABASES LIKE 'admin_postenobicho';" 2>/dev/null | grep -q admin_postenobicho; then
    echo "✅ Banco de dados existe"
else
    echo "⚠️  Banco de dados pode não existir"
    echo "Tentando criar..."
    mysql -u root << 'EOF' 2>/dev/null || echo "Não foi possível criar banco (pode precisar de senha root)"
CREATE DATABASE IF NOT EXISTS admin_postenobicho CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EOF
fi

# 6. Verificar usuário MySQL
echo ""
echo "6️⃣ Verificando usuário MySQL..."
mysql -u root -e "SELECT User, Host FROM mysql.user WHERE User='admin_postenobicho';" 2>/dev/null || echo "Não foi possível verificar usuário (pode precisar de senha root)"

echo ""
echo "=== ✅ Verificação concluída ==="
echo ""
echo "📋 Próximos passos:"
echo "1. Identifique qual senha está correta"
echo "2. Atualize o arquivo .env com a senha correta"
echo "3. Execute: npx prisma db push"
echo "4. Reinicie: pm2 restart lotbicho"
