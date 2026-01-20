# 🔧 Correções Aplicadas para Erros 500 nas APIs

## 📋 Problemas Identificados

1. **Erro 500 em `/api/configuracoes`** - Falha ao conectar com banco de dados
2. **Erro 500 em `/api/auth/login`** - Falha ao conectar com banco de dados  
3. **Erro 401 em `/api/auth/me`** - Esperado quando não autenticado

## ✅ Correções Aplicadas

### 1. Adicionado `force-dynamic` nas rotas de autenticação

**Arquivos modificados:**
- `app/api/auth/login/route.ts`
- `app/api/auth/me/route.ts`

**Motivo:** Garante que as rotas sejam renderizadas dinamicamente e não tentem ser pré-renderizadas estaticamente.

### 2. Melhorado tratamento de erros em `getConfiguracoes()`

**Arquivo:** `lib/configuracoes-store.ts`

**Mudança:** Agora retorna configuração padrão em caso de erro ao invés de lançar exceção.

```typescript
// Antes: Lançava erro
// Agora: Retorna configuração padrão
```

### 3. Melhorado tratamento de erros em `/api/configuracoes`

**Arquivo:** `app/api/configuracoes/route.ts`

**Mudança:** Retorna configuração padrão com status 200 ao invés de 500 em caso de erro.

## 🔍 Causa Raiz dos Erros

Os erros 500 estão ocorrendo porque:

1. **Prisma não consegue conectar ao MySQL** no servidor
2. **DATABASE_URL pode estar incorreta** ou o MySQL não está acessível
3. **Schema Prisma pode estar desatualizado** no servidor

## 📋 Próximos Passos no Servidor

Para corrigir completamente os erros, execute no servidor:

```bash
# 1. Conectar ao servidor
ssh root@104.218.52.159

# 2. Verificar DATABASE_URL
cd /var/www/postenobicho
cat .env | grep DATABASE_URL

# 3. Verificar se MySQL está rodando
systemctl status mysql

# 4. Testar conexão MySQL
mysql -u admin_postenobicho -p'KeitaroBANC02026' admin_postenobicho -e "SELECT 1"

# 5. Verificar schema.prisma
grep "provider" prisma/schema.prisma
# Deve mostrar: provider = "mysql"

# 6. Gerar Prisma Client
npx prisma generate

# 7. Executar migrações
npx prisma migrate deploy || npx prisma db push

# 8. Reiniciar aplicação
pm2 restart lotbicho

# 9. Verificar logs
pm2 logs lotbicho --lines 50
```

## ✅ Resultado Esperado

Após as correções:
- ✅ `/api/configuracoes` retorna configuração padrão mesmo se houver erro de conexão
- ✅ `/api/auth/login` funciona corretamente quando MySQL estiver acessível
- ✅ `/api/auth/me` retorna 401 quando não autenticado (comportamento esperado)

## 🧪 Como Testar

1. **Testar configurações:**
   ```bash
   curl http://localhost:3000/api/configuracoes
   ```
   Deve retornar JSON com configurações (mesmo que padrão)

2. **Testar login:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@postenobicho.com","password":"senha"}'
   ```

3. **Verificar logs:**
   ```bash
   pm2 logs lotbicho --err
   ```
