# 🚀 Guia Rápido: Como Subir Atualizações no Site

## 📋 Passo a Passo

### 1️⃣ No seu computador local - Fazer Build

```bash
# Navegar até a pasta do projeto
cd /Volumes/midascod/postenobicho

# Instalar dependências (se necessário)
npm install

# Gerar Prisma Client
npx prisma generate

# Fazer build da aplicação
npm run build
```

### 2️⃣ Compactar os arquivos necessários

```bash
# Compactar apenas os arquivos necessários para produção
tar -czf build-update.tar.gz \
  .next/ \
  node_modules/ \
  public/ \
  prisma/ \
  package.json \
  package-lock.json \
  ecosystem.config.js \
  scripts/
```

### 3️⃣ Enviar para o servidor

```bash
# Enviar arquivo compactado para o servidor
scp build-update.tar.gz root@104.218.52.159:/var/www/postenobicho/
```

**Digite a senha quando solicitado:** `bicho@321`

### 4️⃣ No servidor - Conectar via SSH

```bash
# Conectar ao servidor
ssh root@104.218.52.159
# Digite a senha: bicho@321
```

### 5️⃣ No servidor - Descompactar e atualizar

```bash
# Navegar para o diretório da aplicação
cd /var/www/postenobicho

# Fazer backup do build atual (opcional, mas recomendado)
cp -r .next .next.backup.$(date +%Y%m%d_%H%M%S)

# Descompactar o novo build
tar -xzf build-update.tar.gz

# Remover arquivo compactado
rm build-update.tar.gz

# Gerar Prisma Client (se houver mudanças no schema)
npx prisma generate

# Reiniciar aplicação com PM2
pm2 restart lotbicho

# Verificar se está rodando
pm2 status

# Ver logs para confirmar que iniciou corretamente
pm2 logs lotbicho --lines 50
```

### 6️⃣ Verificar se está funcionando

```bash
# Verificar se a aplicação está respondendo
curl http://localhost:3000/api/resultados/liquidar

# Ou acessar o site no navegador
# https://postenobicho.com
```

---

## ⚡ Método Rápido (Script Automatizado)

Você também pode usar o script `upload-build.sh` que já existe:

```bash
# No seu computador local
cd /Volumes/midascod/postenobicho

# Tornar o script executável (se ainda não for)
chmod +x upload-build.sh

# Executar o script
./upload-build.sh
```

Depois, no servidor:

```bash
ssh root@104.218.52.159
cd /var/www/postenobicho
pm2 restart lotbicho
pm2 logs lotbicho
```

---

## 🔄 Atualização Rápida (Apenas arquivos alterados)

Se você só alterou alguns arquivos específicos (como componentes React):

```bash
# No seu computador local
cd /Volumes/midascod/postenobicho

# Fazer build
npm run build

# Enviar apenas a pasta .next (mais rápido)
scp -r .next/ root@104.218.52.159:/var/www/postenobicho/

# No servidor
ssh root@104.218.52.159
cd /var/www/postenobicho
pm2 restart lotbicho
```

---

## ⚠️ Importante

1. **Sempre faça build antes de enviar** (`npm run build`)
2. **Verifique os logs após reiniciar** (`pm2 logs lotbicho`)
3. **Se algo der errado**, você pode restaurar o backup:
   ```bash
   rm -rf .next
   mv .next.backup.XXXXXX .next
   pm2 restart lotbicho
   ```

---

## 📝 Checklist Rápido

- [ ] Build feito localmente (`npm run build`)
- [ ] Arquivos enviados para o servidor
- [ ] Descompactado no servidor
- [ ] Prisma Client gerado (se necessário)
- [ ] PM2 reiniciado (`pm2 restart lotbicho`)
- [ ] Logs verificados (sem erros)
- [ ] Site testado no navegador

---

**Última atualização:** 2026-01-17
