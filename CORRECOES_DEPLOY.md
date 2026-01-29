# 🔧 Correções Necessárias no Servidor

## Problemas Identificados:

1. ❌ Schema Prisma está como SQLite (deve ser MySQL)
2. ❌ Falta componente `MetaPixel.tsx` no servidor
3. ❌ Falta componente `MetaPixelWrapper.tsx` no servidor

## ✅ Solução Rápida:

Execute os comandos abaixo no seu terminal:

```bash
cd /Volumes/midascod/postenobicho

# 1. Enviar componentes faltantes
rsync -avz components/MetaPixel.tsx components/MetaPixelWrapper.tsx root@104.218.52.159:/var/www/postenobicho/components/
# Senha: bicho@321

# 2. Conectar ao servidor e corrigir
ssh root@104.218.52.159
# Senha: bicho@321

cd /var/www/postenobicho

# Corrigir schema Prisma
sed -i 's/provider = "sqlite"/provider = "mysql"/' prisma/schema.prisma

# Gerar Prisma Client
npx prisma generate

# Fazer build
npm run build

# Reiniciar PM2
pm2 restart lotbicho

# Verificar status
pm2 status
pm2 logs lotbicho --lines 50
```

## ✅ Ou use o script automatizado:

```bash
cd /Volumes/midascod/postenobicho
./scripts/enviar-arquivos-faltantes.sh
```

**Você precisará digitar a senha SSH (`bicho@321`) quando solicitado.**
