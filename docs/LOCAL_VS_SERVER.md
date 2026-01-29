# 🔄 Desenvolvimento Local vs Servidor

## ✅ Não interfere no servidor!

Usar **SQLite localmente** e **MySQL no servidor** é totalmente seguro e não causa conflitos porque:

### 1. **Arquivos separados**
- **Local**: `.env` → `DATABASE_URL="file:./prisma/dev.db"` (SQLite)
- **Servidor**: `.env` no servidor → `DATABASE_URL="mysql://..."` (MySQL)

### 2. **Schemas podem ser diferentes**
- **Local**: Pode usar `schema.prisma` adaptado para SQLite
- **Servidor**: Usa `schema.prisma` original para MySQL

### 3. **Dados separados**
- **Local**: Banco SQLite (`prisma/dev.db`) - só no seu computador
- **Servidor**: Banco MySQL - só no servidor

## 📝 Fluxo de trabalho recomendado

### Desenvolvimento Local (SQLite)
```bash
# 1. Configurar SQLite
./scripts/setup-local-db.sh  # Escolha opção 1 (SQLite)

# 2. Desenvolver e testar
npm run dev

# 3. Testar funcionalidades
./scripts/test-local.sh
```

### Deploy para Servidor (MySQL)
```bash
# 1. Restaurar schema MySQL (se necessário)
cp prisma/schema.prisma.mysql.backup prisma/schema.prisma

# 2. Fazer deploy
./scripts/deploy-complete.sh
```

## ⚠️ Importante antes de fazer deploy

**SEMPRE** restaure o schema MySQL antes de fazer deploy:

```bash
# Se você modificou o schema para SQLite
cp prisma/schema.prisma.mysql.backup prisma/schema.prisma

# Ou simplesmente use o schema original que já está configurado para MySQL
```

## 🔍 Verificar qual schema está ativo

```bash
# Verificar provider no schema
grep "provider = " prisma/schema.prisma

# Deve mostrar:
# - "sqlite" para desenvolvimento local
# - "mysql" para produção/servidor
```

## 💡 Dicas

1. **Git**: Adicione `prisma/dev.db` e `prisma/dev.db-journal` ao `.gitignore`
2. **Backup**: O script cria `schema.prisma.mysql.backup` automaticamente
3. **Testes**: Use SQLite para testes rápidos, MySQL para testes mais próximos da produção
