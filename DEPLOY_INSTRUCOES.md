# 🚀 Instruções de Deploy - Atualizações Recentes

## 📋 O que será atualizado:

1. ✅ Sistema de múltiplas extrações para apostas
2. ✅ Correções nas rotas de PIX (Nxgate)
3. ✅ Ajustes no cálculo de prêmios
4. ✅ Sistema de descarga atualizado
5. ✅ Componentes atualizados (BetFlow, BetConfirmation, LocationSelection)

## 🔧 Método 1: Script Automatizado (Recomendado)

Execute o script de deploy:

```bash
cd /Volumes/midascod/postenobicho
./scripts/deploy-manual.sh
```

**Você precisará digitar a senha SSH quando solicitado:** `bicho@321`

## 🔧 Método 2: Deploy Manual Passo a Passo

### Passo 1: Conectar ao servidor

```bash
ssh root@104.218.52.159
# Senha: bicho@321
```

### Passo 2: Parar a aplicação

```bash
cd /var/www/postenobicho
pm2 stop lotbicho
```

### Passo 3: No seu computador local - Enviar arquivos

```bash
cd /Volumes/midascod/postenobicho

# Componentes
scp components/BetFlow.tsx components/BetConfirmation.tsx components/LocationSelection.tsx components/DepositPixModal.tsx root@104.218.52.159:/var/www/postenobicho/components/

# Tipos
scp types/bet.ts root@104.218.52.159:/var/www/postenobicho/types/

# Rotas de API
scp app/api/deposito/pix-nxgate/route.ts root@104.218.52.159:/var/www/postenobicho/app/api/deposito/pix-nxgate/
scp app/api/saque/pix-nxgate/route.ts root@104.218.52.159:/var/www/postenobicho/app/api/saque/pix-nxgate/
scp app/api/webhooks/nxgate/route.ts root@104.218.52.159:/var/www/postenobicho/app/api/webhooks/nxgate/
scp app/api/apostas/route.ts root@104.218.52.159:/var/www/postenobicho/app/api/apostas/
scp app/api/admin/descarga/route.ts root@104.218.52.159:/var/www/postenobicho/app/api/admin/descarga/

# Bibliotecas
scp lib/descarga.ts lib/nxgate-client.ts lib/webhook-tracker.ts lib/meta-tracking-server.ts root@104.218.52.159:/var/www/postenobicho/lib/

# Páginas Admin
scp app/admin/descarga/page.tsx root@104.218.52.159:/var/www/postenobicho/app/admin/descarga/
scp app/admin/gateways/page.tsx root@104.218.52.159:/var/www/postenobicho/app/admin/gateways/

# Schema Prisma
scp prisma/schema.prisma root@104.218.52.159:/var/www/postenobicho/prisma/

# Package.json
scp package.json package-lock.json root@104.218.52.159:/var/www/postenobicho/
```

### Passo 4: No servidor - Instalar dependências e fazer build

```bash
cd /var/www/postenobicho

# Instalar dependências
npm install --production=false

# Gerar Prisma Client
npx prisma generate

# Aplicar migrations
npx prisma migrate deploy || npx prisma db push --accept-data-loss

# Limpar build antigo
rm -rf .next

# Fazer build
npm run build
```

### Passo 5: Reiniciar aplicação

```bash
pm2 restart lotbicho
pm2 status
```

### Passo 6: Verificar logs

```bash
pm2 logs lotbicho --lines 50
```

## ✅ Verificação Pós-Deploy

1. Acessar: https://postenobicho.com
2. Testar criação de aposta com múltiplas extrações
3. Verificar se o cálculo de prêmios está correto
4. Testar depósito PIX (se configurado)

## 🐛 Troubleshooting

Se houver erros:

```bash
# Ver logs detalhados
pm2 logs lotbicho --lines 100

# Verificar se o build foi criado
ls -la /var/www/postenobicho/.next

# Verificar se as rotas foram incluídas
find /var/www/postenobicho/.next/server/app/api -name "route.js" | wc -l
```
