# 🔍 Verificação do Payload de Saque Nxgate

## 📋 Payload Atual que Estamos Enviando

```typescript
const saquePayload: NxgateSaquePixPayload = {
  api_key: apiKey,
  valor: valorFormatado, // parseFloat(valor.toFixed(2))
  chave_pix: chavePix, // Limpa (sem formatação)
  tipo_chave: tipoChave, // 'CPF' | 'CNPJ' | 'PHONE' | 'EMAIL' | 'RANDOM'
  webhook: finalWebhookUrl, // Opcional
}
```

## 📤 Endpoint

```
POST https://nxgate.com.br/api/pix/sacar
```

## 🔍 Campos do Payload

### ✅ Campos Obrigatórios (conforme nossa implementação):

1. **`api_key`** (string)
   - ✅ Enviado: `apiKey` do gateway ou `.env`
   - ✅ Formato: String simples

2. **`valor`** (number | string)
   - ✅ Enviado: `parseFloat(valor.toFixed(2))` (número)
   - ✅ Formato: Número com 2 casas decimais

3. **`chave_pix`** (string)
   - ✅ Enviado: `chavePix.replace(/\D/g, '')` (limpa, sem formatação)
   - ✅ Formato: Apenas números para CPF/CNPJ/PHONE

4. **`tipo_chave`** (string)
   - ✅ Enviado: `'CPF' | 'CNPJ' | 'PHONE' | 'EMAIL' | 'RANDOM'`
   - ✅ Validação: Verificamos se está na lista permitida

### ⚠️ Campo Opcional:

5. **`webhook`** (string, opcional)
   - ✅ Enviado: URL do webhook configurada
   - ✅ Formato: URL completa

## 🔍 Verificações Necessárias

### 1. Nome dos Campos (snake_case vs camelCase)

**Verificar na documentação do Nxgate:**
- ✅ Estamos usando `api_key` (snake_case) - correto
- ✅ Estamos usando `chave_pix` (snake_case) - correto
- ✅ Estamos usando `tipo_chave` (snake_case) - correto
- ✅ Estamos usando `valor` (sem underscore) - verificar se está correto
- ✅ Estamos usando `webhook` (sem underscore) - verificar se está correto

### 2. Formato do Valor

**Atual:**
```typescript
const valorFormatado = parseFloat(valor.toFixed(2))
// Exemplo: 30.00 (number)
```

**Possíveis formatos esperados pela API:**
- `30.00` (number) ✅ Atual
- `"30.00"` (string) - Pode ser necessário?
- `30` (number inteiro) - Pode ser necessário?

### 3. Formato da Chave PIX

**Atual:**
```typescript
const chavePix = chavePixRaw.replace(/\D/g, '')
// Remove tudo que não é dígito
// CPF: "12345678901" (11 dígitos)
// CNPJ: "12345678901234" (14 dígitos)
// PHONE: "5511999999999" (10-11 dígitos)
```

**Verificar:**
- ✅ CPF: 11 dígitos sem formatação
- ✅ CNPJ: 14 dígitos sem formatação
- ✅ PHONE: 10-11 dígitos sem formatação
- ⚠️ EMAIL: Enviado como está (sem limpeza) - verificar se está correto
- ⚠️ RANDOM: Enviado como está (sem limpeza) - verificar se está correto

### 4. Tipo de Chave

**Valores permitidos:**
- ✅ `'CPF'`
- ✅ `'CNPJ'`
- ✅ `'PHONE'`
- ✅ `'EMAIL'`
- ✅ `'RANDOM'`

**Verificar se a API aceita:**
- Maiúsculas: `'CPF'` ✅
- Minúsculas: `'cpf'` ❓
- Outros formatos: `'CPF/CNPJ'` ❓

## 🧪 Como Testar o Payload

### Opção 1: Verificar nos Logs

Quando tentar fazer um saque, verifique os logs do PM2:
```bash
pm2 logs lotbicho --lines 100
```

Procure por:
```
=== DEBUG SAQUE PIX NXGATE ===
Payload: {
  valor: 30,
  tipo_chave: 'CPF',
  chave_pix: '123***',
  webhook: 'https://...'
}
```

### Opção 2: Script de Teste

Execute o script de teste:
```bash
./scripts/test-nxgate-ip.sh
```

Este script mostra o payload exato sendo enviado.

### Opção 3: Comparar com Documentação

Compare o payload acima com a documentação oficial do Nxgate:
- Endpoint: `/api/pix/sacar`
- Método: `POST`
- Headers: `Content-Type: application/json`

## ⚠️ Possíveis Problemas

### 1. Campo `valor` como String

Se a API espera string:
```typescript
// Atual (number)
valor: parseFloat(valor.toFixed(2))

// Possível correção (string)
valor: valor.toFixed(2)
```

### 2. Campo `webhook` Obrigatório

Se o webhook for obrigatório e não estiver sendo enviado corretamente:
```typescript
// Verificar se finalWebhookUrl não está undefined
if (!finalWebhookUrl) {
  // Erro ou usar valor padrão
}
```

### 3. Formato de `chave_pix` para EMAIL

Se EMAIL precisa de formato específico:
```typescript
if (tipoChave === 'EMAIL') {
  // Não limpar, manter como está
  chavePix = chavePixRaw.trim().toLowerCase()
} else {
  // Limpar para CPF/CNPJ/PHONE
  chavePix = chavePixRaw.replace(/\D/g, '')
}
```

## 📝 Próximos Passos

1. ✅ Verificar logs do PM2 para ver o payload exato sendo enviado
2. ✅ Comparar com a documentação oficial do Nxgate
3. ✅ Testar com diferentes formatos de valor (number vs string)
4. ✅ Verificar se há campos adicionais necessários
5. ✅ Verificar se o endpoint está correto (`/api/pix/sacar`)

## 🔗 Referências

- Documentação Nxgate: Verificar documentação oficial
- Endpoint: `POST /api/pix/sacar`
- Base URL: `https://nxgate.com.br`
