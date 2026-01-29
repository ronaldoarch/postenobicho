#!/bin/bash

# Script para aplicar patch no schema.prisma no servidor
# Execute este script NO SERVIDOR (já conectado via SSH)

cd /var/www/postenobicho

echo "=== 🔧 Adicionando campo CPF ao schema.prisma ==="

# Verificar se já existe
if grep -q "cpf.*String.*@unique" prisma/schema.prisma; then
    echo "✅ Campo CPF já existe"
    exit 0
fi

# Criar arquivo temporário com o patch
cat > /tmp/add_cpf.patch << 'EOF'
--- a/prisma/schema.prisma
+++ b/prisma/schema.prisma
@@ -236,6 +236,7 @@ model Usuario {
   id                 Int         @id @default(autoincrement())
   nome               String
   email              String      @unique
+  cpf                String?     @unique // CPF único para validar uma conta por CPF
   telefone           String?
   passwordHash       String?
EOF

# Aplicar usando sed (mais simples)
sed -i '/email.*String.*@unique/a\  cpf                String?     @unique // CPF único para validar uma conta por CPF' prisma/schema.prisma

echo "✅ Campo CPF adicionado"
echo ""
echo "Verificando:"
grep -A 3 "email.*@unique" prisma/schema.prisma | head -4

echo ""
echo "Agora execute: npx prisma db push"
