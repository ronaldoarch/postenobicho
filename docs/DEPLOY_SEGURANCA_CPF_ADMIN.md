# 🔒 Deploy: Correções de Segurança - CPF Único e Admin

## ✅ Status Atual

- ✅ Campo CPF adicionado ao schema.prisma no servidor
- ✅ Campo CPF aplicado no banco de dados MySQL
- ⏳ Aguardando deploy dos arquivos de código

## 📋 Arquivos que precisam ser atualizados no servidor

### 1. Libs (criar/atualizar)
- `lib/auth.ts` - Funções de validação de CPF e verificação de admin
- `lib/admin-auth.ts` - Função `requireAdmin()` (NOVO)

### 2. API Auth
- `app/api/auth/me/route.ts` - Retornar campo `admin`
- `app/api/auth/register/route.ts` - Validação de CPF único

### 3. Admin Layout
- `app/admin/layout.tsx` - Verificação de permissões admin

### 4. Admin API Routes
- `app/api/admin/dashboard/route.ts` - Verificação admin
- `app/api/admin/saques/route.ts` - Verificação admin
- `app/api/admin/cotacoes-especiais/route.ts` - Verificação admin

### 5. Webhooks (validação CPF único no bônus)
- `app/api/webhooks/nxgate/route.ts` - Verificar CPF único para bônus
- `app/api/webhooks/receba/route.ts` - Verificar CPF único para bônus

### 6. Frontend
- `app/cadastro/page.tsx` - Campo CPF obrigatório

## 🚀 Como fazer o deploy

### Opção 1: Via SCP (do seu computador local)

```bash
# No seu computador local, execute:
SERVER="root@104.218.52.159"
APP_DIR="/var/www/postenobicho"

# Libs
scp lib/auth.ts $SERVER:$APP_DIR/lib/auth.ts
scp lib/admin-auth.ts $SERVER:$APP_DIR/lib/admin-auth.ts

# API Auth
scp app/api/auth/me/route.ts $SERVER:$APP_DIR/app/api/auth/me/route.ts
scp app/api/auth/register/route.ts $SERVER:$APP_DIR/app/api/auth/register/route.ts

# Admin Layout
scp app/admin/layout.tsx $SERVER:$APP_DIR/app/admin/layout.tsx

# Admin API Routes
scp app/api/admin/dashboard/route.ts $SERVER:$APP_DIR/app/api/admin/dashboard/route.ts
scp app/api/admin/saques/route.ts $SERVER:$APP_DIR/app/api/admin/saques/route.ts
scp app/api/admin/cotacoes-especiais/route.ts $SERVER:$APP_DIR/app/api/admin/cotacoes-especiais/route.ts

# Webhooks
scp app/api/webhooks/nxgate/route.ts $SERVER:$APP_DIR/app/api/webhooks/nxgate/route.ts
scp app/api/webhooks/receba/route.ts $SERVER:$APP_DIR/app/api/webhooks/receba/route.ts

# Frontend
scp app/cadastro/page.tsx $SERVER:$APP_DIR/app/cadastro/page.tsx
```

### Opção 2: Via Git (se usar Git no servidor)

```bash
# No servidor:
cd /var/www/postenobicho
git pull origin main  # ou sua branch
```

### Opção 3: Criar arquivos manualmente no servidor

Copie o conteúdo dos arquivos do seu computador local para o servidor.

## 🔨 Após o deploy dos arquivos

```bash
# No servidor:
cd /var/www/postenobicho

# 1. Fazer build
npm run build

# 2. Reiniciar PM2
pm2 restart lotbicho

# 3. Verificar logs
pm2 logs lotbicho --lines 50
```

## ✅ Verificações pós-deploy

1. **Testar cadastro com CPF duplicado:**
   - Tentar cadastrar dois usuários com o mesmo CPF
   - Deve bloquear o segundo cadastro

2. **Testar acesso admin:**
   - Fazer login com usuário não-admin
   - Tentar acessar `/admin`
   - Deve redirecionar para `/admin/login`

3. **Testar bônus com CPF único:**
   - Criar conta 1 com CPF X e depositar (deve ganhar bônus)
   - Criar conta 2 com mesmo CPF X e depositar (NÃO deve ganhar bônus)

## 📝 Notas

- O campo CPF é opcional (`String?`) para permitir usuários antigos sem CPF
- A validação de CPF único é feita no cadastro e no bônus
- Todas as rotas `/api/admin/*` agora verificam permissões de admin
