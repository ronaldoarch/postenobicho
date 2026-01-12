# Guia de Deploy - Lot Bicho

## Configuração do Banco de Dados PostgreSQL

O projeto está configurado para usar PostgreSQL via Prisma ORM.

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com a seguinte variável:

```env
DATABASE_URL="postgres://postgres:SW1Ho4OVgCGpgpgZ6WVMd3fUU9E86f6H4O0CnuMUWU25b3WzS80RetfPNz7z2Zle@uk40so004k8gc488ws0sokg0:5432/postgres"
```

### Comandos do Prisma

1. **Gerar o cliente Prisma:**
   ```bash
   npm run prisma:generate
   ```

2. **Criar as tabelas no banco de dados:**
   ```bash
   npm run prisma:push
   ```
   
   Ou criar uma migration:
   ```bash
   npm run prisma:migrate
   ```

3. **Abrir Prisma Studio (opcional):**
   ```bash
   npm run prisma:studio
   ```

### Deploy no Colify

#### Opção 1: Deploy Automático (Recomendado)

1. **Configure a variável de ambiente `DATABASE_URL`** no painel do Colify com a URL do PostgreSQL:
   ```
   postgres://postgres:SW1Ho4OVgCGpgpgZ6WVMd3fUU9E86f6H4O0CnuMUWU25b3WzS80RetfPNz7z2Zle@uk40so004k8gc488ws0sokg0:5432/postgres
   ```

2. **Faça o deploy normalmente** - o Colify vai:
   - Instalar dependências (`npm install`)
   - Gerar o Prisma Client automaticamente (já está no script `build`)
   - Fazer o build do projeto

3. **Após o primeiro deploy, rode no terminal do Colify** (apenas uma vez):
   ```bash
   npm run init:db
   ```
   Ou diretamente:
   ```bash
   npm run prisma:push
   ```
   Isso cria todas as tabelas no banco de dados.
   
   **IMPORTANTE:** Execute este comando no terminal do Colify após o primeiro deploy bem-sucedido. Você pode acessar o terminal através da aba "Terminal" no painel do Colify.

#### Opção 2: Testar Localmente Primeiro (Opcional)

Se quiser testar localmente antes:

1. **Crie o arquivo `.env`** na raiz com:
   ```env
   DATABASE_URL="postgres://postgres:SW1Ho4OVgCGpgpgZ6WVMd3fUU9E86f6H4O0CnuMUWU25b3WzS80RetfPNz7z2Zle@uk40so004k8gc488ws0sokg0:5432/postgres"
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Crie as tabelas no banco:**
   ```bash
   npm run prisma:push
   ```

4. **Teste localmente:**
   ```bash
   npm run dev
   ```

5. **Depois faça o deploy no Colify** - só precisa rodar `prisma:push` uma vez no terminal do Colify após o primeiro deploy.

### Estrutura do Banco de Dados

O schema do Prisma inclui as seguintes tabelas:

- **Banner**: Banners promocionais
- **Story**: Stories do Instagram
- **Modalidade**: Modalidades de apostas
- **Promocao**: Promoções e bônus
- **Extracao**: Extrações de resultados
- **Cotacao**: Cotações
- **Tema**: Temas personalizáveis
- **Configuracao**: Configurações gerais da plataforma
- **Usuario**: Usuários do sistema
- **Saque**: Solicitações de saque

### Notas Importantes

- O arquivo `.env` não deve ser commitado no Git (já está no `.gitignore`)
- Use `.env.example` como referência para outras variáveis de ambiente
- O Prisma Client é gerado automaticamente durante o build (`npm run build`)
- Certifique-se de que a URL do banco de dados está correta e acessível do servidor de deploy
