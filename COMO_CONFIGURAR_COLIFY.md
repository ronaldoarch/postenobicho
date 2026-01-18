# Como Configurar Deploy no Colify - Repositório Privado

## Problema
O Colify não consegue acessar repositórios privados do GitHub sem autenticação.

## Solução Mais Simples: Personal Access Token (PAT)

### Passo 1: Criar Personal Access Token no GitHub

1. Acesse: https://github.com/settings/tokens
2. Clique em "Generate new token" → "Generate new token (classic)"
3. Configure:
   - **Note**: `Colify Deploy`
   - **Expiration**: Escolha um prazo (ex: 90 dias ou sem expiração)
   - **Scopes**: Marque apenas `repo` (acesso completo a repositórios privados)
4. Clique em "Generate token"
5. **COPIE O TOKEN IMEDIATAMENTE** (você não verá ele novamente!)

### Passo 2: Configurar no Colify

1. No formulário de criação da aplicação, use a URL HTTPS com o token:

   ```
   https://SEU_TOKEN@github.com/ronaldoarch/lotbicho.git
   ```

   Exemplo:
   ```
   https://ghp_xxxxxxxxxxxxxxxxxxxx@github.com/ronaldoarch/lotbicho.git
   ```

2. **OU** configure no Colify:
   - Vá em Settings → Source Control
   - Adicione o token como variável de ambiente ou configuração
   - Use a URL normal: `https://github.com/ronaldoarch/lotbicho.git`

### Passo 3: Configurar Variáveis de Ambiente

No Colify, adicione:

- **Nome**: `DATABASE_URL`
- **Valor**: `mysql://usuario:senha@host:3306/nome_do_banco`
  
  **Exemplo:**
  ```
  mysql://root:senha123@db.example.com:3306/postenobicho
  ```

### Passo 4: Após o Primeiro Deploy

Acesse o terminal do Colify e rode:

```bash
npm run prisma:push
```

Isso cria todas as tabelas no banco de dados.

## Alternativa: Deploy Key (SSH)

Se preferir usar SSH, você precisa:
1. Gerar uma chave SSH
2. Adicionar a chave pública no GitHub (Deploy Keys)
3. Adicionar a chave privada no Colify (Settings → Deploy Keys)
4. Usar a URL SSH: `git@github.com:ronaldoarch/lotbicho.git`

Mas o PAT é mais simples e rápido!
