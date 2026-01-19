# 🚀 Guia Completo: Instalar Node.js e Configurar com Apache

## ✅ Por que instalar Node.js diretamente?

- ✅ **Melhor performance** - Sem overhead de containers
- ✅ **Mais simples** - Menos camadas de complexidade
- ✅ **Fácil manutenção** - Acesso direto aos logs e processos
- ✅ **Compatível com Apache** - Funciona perfeitamente como proxy reverso
- ✅ **Controle total** - Você gerencia tudo diretamente

---

## 📦 Passo 1: Instalar Node.js 20

### Para Ubuntu/Debian:

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalação
node --version  # Deve mostrar v20.x.x
npm --version   # Deve mostrar 10.x.x ou superior
```

### Para CentOS/RHEL:

```bash
# Instalar Node.js 20 via NodeSource
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Verificar instalação
node --version
npm --version
```

### Para servidores sem acesso root (usando NVM):

```bash
# Instalar NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Recarregar terminal
source ~/.bashrc

# Instalar Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# Verificar
node --version
```

---

## 📥 Passo 2: Clonar e Configurar a Aplicação

```bash
# 1. Clonar repositório (ou fazer upload dos arquivos)
cd /var/www  # ou outro diretório de sua preferência
git clone https://github.com/ronaldoarch/postenobicho.git
cd postenobicho

# 2. Instalar dependências
npm ci --production

# 3. Criar arquivo .env
nano .env
```

### Conteúdo do arquivo `.env`:

```env
# Banco de Dados MySQL
DATABASE_URL="mysql://usuario:senha@localhost:3306/postenobicho"

# Autenticação (gerar com: openssl rand -hex 32)
AUTH_SECRET="sua-chave-secreta-aqui"

# Ambiente
NODE_ENV=production
PORT=3000

# URLs (ajustar conforme seu domínio)
NEXT_PUBLIC_BASE_URL="https://seudominio.com"

# Gateways (opcional - pode configurar pelo admin depois)
NXGATE_API_KEY="sua-api-key-nxgate"
NXGATE_WEBHOOK_URL="https://seudominio.com/api/webhooks/nxgate"

# Receba Online (opcional)
RECEBA_API_KEY="sua-api-key-receba"
RECEBA_PLATFORM_ID="seu-platform-id"
RECEBA_BASE_URL="https://api.receba.online"
```

---

## 🗄️ Passo 3: Configurar Banco de Dados MySQL

```bash
# Conectar ao MySQL
mysql -u root -p

# Criar banco de dados
CREATE DATABASE postenobicho CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Criar usuário (recomendado)
CREATE USER 'postenobicho_user'@'localhost' IDENTIFIED BY 'senha_segura_aqui';
GRANT ALL PRIVILEGES ON postenobicho.* TO 'postenobicho_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Executar migrações:

```bash
# Gerar Prisma Client
npx prisma generate

# Criar tabelas no banco
npx prisma migrate deploy

# OU usar db push (se não tiver migrations)
npx prisma db push
```

---

## 🔨 Passo 4: Build da Aplicação

```bash
# Fazer build de produção
npm run build

# Testar se funciona
npm start
# Deve iniciar na porta 3000
# Acesse: http://localhost:3000
```

---

## 🔄 Passo 5: Instalar e Configurar PM2 (Gerenciador de Processos)

PM2 mantém a aplicação rodando e reinicia automaticamente em caso de falha.

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Iniciar aplicação com PM2
pm2 start ecosystem.config.js

# Ver status
pm2 status

# Ver logs
pm2 logs lotbicho

# Salvar configuração
pm2 save

# Configurar para iniciar no boot do sistema
pm2 startup
# Seguir as instruções exibidas (geralmente copiar e executar um comando sudo)
```

### Comandos úteis do PM2:

```bash
pm2 restart lotbicho    # Reiniciar aplicação
pm2 stop lotbicho      # Parar aplicação
pm2 delete lotbicho    # Remover aplicação do PM2
pm2 monit              # Monitor em tempo real
```

---

## 🌐 Passo 6: Configurar Apache como Proxy Reverso

### 1. Habilitar módulos necessários do Apache:

```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod rewrite
sudo a2enmod headers
sudo systemctl restart apache2
```

### 2. Criar configuração do VirtualHost:

```bash
sudo nano /etc/apache2/sites-available/postenobicho.conf
```

### 3. Conteúdo da configuração:

```apache
<VirtualHost *:80>
    ServerName seudominio.com
    ServerAlias www.seudominio.com

    # Logs
    ErrorLog ${APACHE_LOG_DIR}/postenobicho-error.log
    CustomLog ${APACHE_LOG_DIR}/postenobicho-access.log combined

    # Proxy para aplicação Node.js
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/

    # Headers necessários
    ProxyPassReverse / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
    
    # Timeout aumentado para requisições longas
    ProxyTimeout 300
    Timeout 300
</VirtualHost>
```

### 4. Habilitar site e reiniciar Apache:

```bash
# Desabilitar site padrão (se necessário)
sudo a2dissite 000-default.conf

# Habilitar novo site
sudo a2ensite postenobicho.conf

# Testar configuração
sudo apache2ctl configtest

# Reiniciar Apache
sudo systemctl restart apache2
```

---

## 🔒 Passo 7: Configurar SSL/HTTPS (Opcional mas Recomendado)

### Usando Certbot (Let's Encrypt):

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-apache

# Obter certificado SSL
sudo certbot --apache -d seudominio.com -d www.seudominio.com

# Renovação automática (já configurado pelo Certbot)
sudo certbot renew --dry-run
```

O Certbot atualizará automaticamente a configuração do Apache para usar HTTPS.

---

## ⏰ Passo 8: Configurar Cron Job para Liquidação Automática

```bash
# Editar crontab
crontab -e

# Adicionar linha (executa a cada 5 minutos durante horários de sorteio)
*/5 9-22 * * * curl -X POST http://localhost:3000/api/resultados/liquidar -H "Content-Type: application/json" -d '{}' >> /var/log/postenobicho-liquidacao.log 2>&1
```

Ou usando script:

```bash
# Criar script
nano /var/www/postenobicho/scripts/cron/liquidar.sh
```

```bash
#!/bin/bash
cd /var/www/postenobicho
curl -X POST http://localhost:3000/api/resultados/liquidar \
  -H "Content-Type: application/json" \
  -d '{}' \
  >> /var/log/postenobicho-liquidacao.log 2>&1
```

```bash
# Dar permissão de execução
chmod +x /var/www/postenobicho/scripts/cron/liquidar.sh

# Adicionar ao crontab
crontab -e
# Adicionar: */5 9-22 * * * /var/www/postenobicho/scripts/cron/liquidar.sh
```

---

## ✅ Verificação Final

### 1. Verificar se Node.js está rodando:

```bash
pm2 status
# Deve mostrar "lotbicho" como "online"
```

### 2. Verificar se Apache está funcionando:

```bash
sudo systemctl status apache2
# Deve estar "active (running)"
```

### 3. Testar aplicação:

```bash
# Testar localmente
curl http://localhost:3000

# Testar via Apache
curl http://seudominio.com
```

### 4. Verificar logs:

```bash
# Logs da aplicação
pm2 logs lotbicho

# Logs do Apache
sudo tail -f /var/log/apache2/postenobicho-access.log
sudo tail -f /var/log/apache2/postenobicho-error.log
```

---

## 🔧 Troubleshooting

### Problema: Aplicação não inicia

```bash
# Verificar se porta 3000 está em uso
sudo netstat -tulpn | grep 3000

# Verificar logs do PM2
pm2 logs lotbicho --lines 50

# Verificar variáveis de ambiente
pm2 env lotbicho
```

### Problema: Apache não conecta ao Node.js

```bash
# Verificar se aplicação está rodando
pm2 status

# Testar conexão local
curl http://localhost:3000

# Verificar configuração do Apache
sudo apache2ctl configtest
```

### Problema: Erro de permissões

```bash
# Dar permissões corretas ao diretório
sudo chown -R www-data:www-data /var/www/postenobicho/public/uploads
sudo chmod -R 755 /var/www/postenobicho/public/uploads
```

---

## 📊 Monitoramento

### Ver uso de recursos:

```bash
# CPU e memória do Node.js
pm2 monit

# Uso geral do sistema
htop
```

### Verificar saúde da aplicação:

```bash
# Status da aplicação
curl http://localhost:3000/api/status

# Estatísticas de liquidação
curl http://localhost:3000/api/resultados/liquidar
```

---

## 🎯 Resumo dos Comandos Essenciais

```bash
# Iniciar aplicação
pm2 start ecosystem.config.js

# Reiniciar aplicação
pm2 restart lotbicho

# Ver logs
pm2 logs lotbicho

# Parar aplicação
pm2 stop lotbicho

# Reiniciar Apache
sudo systemctl restart apache2

# Ver logs do Apache
sudo tail -f /var/log/apache2/postenobicho-access.log
```

---

## ✅ Vantagens desta Configuração

1. ✅ **Performance otimizada** - Node.js rodando diretamente
2. ✅ **Apache como proxy** - Facilita SSL e configurações avançadas
3. ✅ **PM2 gerencia processos** - Reinicia automático em caso de falha
4. ✅ **Fácil manutenção** - Logs e monitoramento simples
5. ✅ **Escalável** - Pode adicionar mais instâncias se necessário

---

**Pronto! Sua aplicação está configurada e rodando! 🚀**
