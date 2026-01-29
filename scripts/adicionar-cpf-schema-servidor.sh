#!/bin/bash

# Script para adicionar campo CPF ao schema.prisma no servidor
# Execute este script NO SERVIDOR (já conectado via SSH)

SCHEMA_FILE="/var/www/postenobicho/prisma/schema.prisma"

echo "=== 🔧 Adicionando campo CPF ao schema ==="

# Verificar se o arquivo existe
if [ ! -f "$SCHEMA_FILE" ]; then
    echo "❌ Arquivo não encontrado: $SCHEMA_FILE"
    exit 1
fi

# Verificar se já tem o campo CPF
if grep -q "cpf.*String.*@unique" "$SCHEMA_FILE"; then
    echo "✅ Campo CPF já existe no schema"
    exit 0
fi

# Fazer backup
cp "$SCHEMA_FILE" "${SCHEMA_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
echo "✅ Backup criado"

# Adicionar campo CPF após a linha do email
# Procurar pela linha "email" e adicionar CPF na próxima linha
sed -i '/email.*String.*@unique/a\  cpf                String?     @unique // CPF único para validar uma conta por CPF' "$SCHEMA_FILE"

echo "✅ Campo CPF adicionado ao schema"

# Verificar se foi adicionado corretamente
echo ""
echo "📋 Verificando alteração:"
grep -A 2 "email.*@unique" "$SCHEMA_FILE" | head -3

echo ""
echo "=== ✅ Concluído! ==="
echo ""
echo "Próximo passo:"
echo "  npx prisma db push"
