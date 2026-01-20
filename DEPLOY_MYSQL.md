# 🚀 Deploy com MySQL - Instruções

## ✅ O que foi corrigido:

1. **Schema Prisma atualizado** de SQLite para MySQL
2. **Arquivo `.env` no servidor** já está configurado com MySQL

## 📋 Passos para fazer o deploy:

### 1. Fazer build local (já feito)

O build já foi feito com o schema MySQL atualizado.

### 2. Enviar arquivos para o servidor

```bash
# Do seu computador local
cd /Volumes/midascod/postenobicho

# Enviar arquivos atualizados
scp prisma/schema.prisma root@104.218.52.159:/var/www/postenobicho/prisma/
scp -r .next root@104.218.52.159:/var/www/postenobicho/
```

### 3. Conectar ao servidor e atualizar

```bash
# Conectar ao servidor
ssh root@104.218.52.159
# Senha: bicho@321

# Navegar até o diretório
cd /var/www/postenobicho

# Verificar se o schema está correto
grep "provider" prisma/schema.prisma
# Deve mostrar: provider = "mysql"

# Se não estiver correto, atualizar:
sed -i 's/provider = "sqlite"/provider = "mysql"/' prisma/schema.prisma

# Gerar Prisma Client com MySQL
npx prisma generate

# Executar migrações (criar/atualizar tabelas)
npx prisma migrate deploy || npx prisma db push

# Reiniciar aplicação
pm2 restart lotbicho

# Verificar logs
pm2 logs lotbicho --lines 50
```

### 4. Verificar se está funcionando

```bash
# No servidor, testar a aplicação
curl http://localhost:3000

# Verificar logs em tempo real
pm2 logs lotbicho
```

## 🔍 Verificação do .env no servidor

O arquivo `.env` no servidor deve ter:

```env
DATABASE_URL="mysql://admin_postenobicho:KeitaroBANC02026@localhost:3306/admin_postenobicho"
NODE_ENV=production
NEXTAUTH_SECRET="nFsa8lVHuMpY6itY0pgKGBqTS2VWm+TjUoS8kEAmJrc="
NEXTAUTH_URL="https://postenobicho.com"
SESSION_SECRET="71s3Yyc13RkUP2UzfHXxCqjLxG7Dg3eoygvfCE5L49E="
```

## ⚠️ Se ainda houver erro:

1. **Verificar conexão com MySQL:**
   ```bash
   mysql -u admin_postenobicho -p'KeitaroBANC02026' admin_postenobicho -e "SHOW TABLES;"
   ```

2. **Verificar se o banco existe:**
   ```bash
   mysql -u admin_postenobicho -p'KeitaroBANC02026' -e "SHOW DATABASES;"
   ```

3. **Criar banco se não existir:**
   ```bash
   mysql -u admin_postenobicho -p'KeitaroBANC02026' -e "CREATE DATABASE IF NOT EXISTS admin_postenobicho CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   ```

4. **Verificar logs do PM2:**
   ```bash
   pm2 logs lotbicho --err
   ```

## ✅ Comando rápido (copiar e colar):

```bash
cd /var/www/postenobicho && \
sed -i 's/provider = "sqlite"/provider = "mysql"/' prisma/schema.prisma && \
npx prisma generate && \
npx prisma migrate deploy || npx prisma db push && \
pm2 restart lotbicho && \
pm2 logs lotbicho --lines 30
```
