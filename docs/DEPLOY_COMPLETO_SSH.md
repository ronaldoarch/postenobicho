# 🚀 Guia Completo de Deploy via SSH - Passo a Passo

## 📋 Credenciais SSH

- **IP:** 104.218.52.159
- **Usuário:** root
- **Senha:** bicho@321

---

## ✅ Passo 1: Conectar ao Servidor

```bash
ssh root@104.218.52.159
# Digite a senha quando solicitado: bicho@321
```

---

## 📦 Passo 2: Instalar Node.js 20

```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar Node.js 20 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Verificar instalação
node --version  # Deve mostrar v20.x.x
npm --version   # Deve mostrar 10.x.x ou superior
```

---

## 📁 Passo 3: Criar Diretório da Aplicação

```bash
# Criar diretório
mkdir -p /var/www/postenobicho
cd /var/www/postenobicho

# Verificar permissões
pwd
```

---

## 📥 Passo 4: Receber Build da Aplicação

**Escolha uma das opções abaixo:**

### Opção A: Via SCP (do seu computador local)

No seu computador local (fora do servidor), execute:

```bash
# Navegar até a pasta do build
cd /caminho/para/seu/build

# Fazer upload dos arquivos
scp -r .next/ root@104.218.52.159:/var/www/postenobicho/
scp -r node_modules/ root@104.218.52.159:/var/www/postenobicho/
scp -r public/ root@104.218.52.159:/var/www/postenobicho/
scp -r prisma/ root@104.218.52.159:/var/www/postenobicho/
scp package.json root@104.218.52.159:/var/www/postenobicho/
scp package-lock.json root@104.218.52.159:/var/www/postenobicho/
scp ecosystem.config.js root@104.218.52.159:/var/www/postenobicho/
```

### Opção B: Via rsync (mais rápido)

No seu computador local:

```bash
# Navegar até a pasta do build
cd /caminho/para/seu/build

# Sincronizar arquivos
rsync -avz --progress \
  .next/ \
  node_modules/ \
  public/ \
  prisma/ \
  package.json \
  package-lock.json \
  ecosystem.config.js \
  root@104.218.52.159:/var/www/postenobicho/
```

### Opção C: Compactar e enviar (mais simples)

No seu computador local:

```bash
# Navegar até a pasta do build
cd /caminho/para/seu/build

# Compactar tudo
tar -czf build.tar.gz .next node_modules public prisma package.json package-lock.json ecosystem.config.js

# Enviar arquivo compactado
scp build.tar.gz root@104.218.52.159:/var/www/postenobicho/

# Voltar ao servidor e descompactar
ssh root@104.218.52.159 "cd /var/www/postenobicho && tar -xzf build.tar.gz && rm build.tar.gz"
```

---

## ✅ Passo 5: Verificar Arquivos Recebidos

Ainda no servidor (via SSH):

```bash
cd /var/www/postenobicho

# Verificar estrutura
ls -la
ls -la .next/        # Deve existir
ls -la node_modules/ # Deve existir
ls -la prisma/       # Deve existir
ls -la public/       # Deve existir
```

---

## 🗄️ Passo 6: Configurar Banco de Dados MySQL

```bash
# Conectar ao MySQL
mysql -u root -p
# Digite a senha do MySQL quando solicitado

# Criar banco de dados
CREATE DATABASE postenobicho CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Criar usuário (recomendado)
CREATE USER 'postenobicho_user'@'localhost' IDENTIFIED BY 'senha_segura_aqui';
GRANT ALL PRIVILEGES ON postenobicho.* TO 'postenobicho_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## ⚙️ Passo 7: Configurar Variáveis de Ambiente

```bash
cd /var/www/postenobicho

# Criar arquivo .env
nano .env
```

Cole o seguinte conteúdo (ajuste conforme necessário):

```env
# Banco de Dados MySQL
DATABASE_URL="mysql://postenobicho_user:senha_segura_aqui@localhost:3306/postenobicho"

# Autenticação (gerar com: openssl rand -hex 32)
AUTH_SECRET="$(openssl rand -hex 32)"

# Ambiente
NODE_ENV=production
PORT=3000

# URLs (ajustar conforme seu domínio)
NEXT_PUBLIC_BASE_URL="http://104.218.52.159"

# Gateways (opcional - pode configurar pelo admin depois)
# NXGATE_API_KEY="sua-api-key-nxgate"
# NXGATE_WEBHOOK_URL="http://104.218.52.159/api/webhooks/nxgate"
```

Salvar: `Ctrl + O`, depois `Enter`, depois `Ctrl + X`

---

## 🔧 Passo 8: Gerar Prisma Client e Executar Migrações

```bash
cd /var/www/postenobicho

# Gerar Prisma Client
npx prisma generate

# Executar migrações
npx prisma migrate deploy

# OU usar db push (se não tiver migrations)
# npx prisma db push
```

---

## 🔄 Passo 9: Instalar e Configurar PM2

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Verificar se ecosystem.config.js existe
ls -la ecosystem.config.js

# Se não existir, criar um básico
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'lotbicho',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/postenobicho',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G'
  }]
}
EOF

# Criar diretório de logs
mkdir -p logs

# Iniciar aplicação com PM2
pm2 start ecosystem.config.js

# Ver status
pm2 status

# Ver logs
pm2 logs lotbicho

# Salvar configuração
pm2 save

# Configurar para iniciar no boot
pm2 startup
# Copiar e executar o comando que aparecer (geralmente começa com sudo)
```

---

## 🌐 Passo 10: Configurar Apache como Proxy Reverso

```bash
# Instalar Apache (se não estiver instalado)
apt install -y apache2

# Habilitar módulos necessários
a2enmod proxy
a2enmod proxy_http
a2enmod rewrite
a2enmod headers

# Criar configuração do VirtualHost
cat > /etc/apache2/sites-available/postenobicho.conf << 'EOF'
<VirtualHost *:80>
    ServerName 104.218.52.159
    ServerAlias www.104.218.52.159

    # Logs
    ErrorLog ${APACHE_LOG_DIR}/postenobicho-error.log
    CustomLog ${APACHE_LOG_DIR}/postenobicho-access.log combined

    # Proxy para aplicação Node.js
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
    
    # Timeout aumentado para requisições longas
    ProxyTimeout 300
    Timeout 300
</VirtualHost>
EOF

# Desabilitar site padrão (opcional)
a2dissite 000-default.conf

# Habilitar novo site
a2ensite postenobicho.conf

# Testar configuração
apache2ctl configtest

# Reiniciar Apache
systemctl restart apache2

# Verificar status
systemctl status apache2
```

---

## ✅ Passo 11: Verificar se Tudo Está Funcionando

```bash
# Verificar se Node.js está rodando
pm2 status
# Deve mostrar "lotbicho" como "online"

# Verificar se Apache está funcionando
systemctl status apache2
# Deve estar "active (running)"

# Testar aplicação localmente
curl http://localhost:3000

# Testar via Apache
curl http://104.218.52.159
```

---

## ⏰ Passo 12: Configurar Cron Job para Liquidação Automática

```bash
# Editar crontab
crontab -e

# Adicionar linha (executa a cada 5 minutos durante horários de sorteio)
# Pressione 'i' para inserir, cole a linha abaixo, pressione ESC, depois :wq para salvar
*/5 9-22 * * * curl -X POST http://localhost:3000/api/resultados/liquidar -H "Content-Type: application/json" -d '{}' >> /var/log/postenobicho-liquidacao.log 2>&1
```

---

## 🔍 Verificação Final

```bash
# Ver logs da aplicação
pm2 logs lotbicho

# Ver logs do Apache
tail -f /var/log/apache2/postenobicho-access.log
tail -f /var/log/apache2/postenobicho-error.log

# Verificar uso de recursos
pm2 monit

# Testar endpoints
curl http://localhost:3000/api/status
curl http://localhost:3000/api/resultados/liquidar
```

---

## 🎯 Comandos Úteis para Manutenção

```bash
# Reiniciar aplicação
pm2 restart lotbicho

# Parar aplicação
pm2 stop lotbicho

# Ver logs em tempo real
pm2 logs lotbicho --lines 50

# Reiniciar Apache
systemctl restart apache2

# Ver logs do Apache
tail -f /var/log/apache2/postenobicho-error.log
```

---

## ✅ Checklist de Verificação

- [ ] Node.js 20 instalado e funcionando
- [ ] Build da aplicação enviado para /var/www/postenobicho
- [ ] Arquivo .env configurado
- [ ] Banco de dados MySQL criado
- [ ] Prisma Client gerado
- [ ] Migrações executadas
- [ ] PM2 instalado e aplicação rodando
- [ ] Apache configurado como proxy reverso
- [ ] Aplicação acessível via IP
- [ ] Cron job configurado

---

**Pronto! Sua aplicação deve estar rodando em http://104.218.52.159 🚀**
