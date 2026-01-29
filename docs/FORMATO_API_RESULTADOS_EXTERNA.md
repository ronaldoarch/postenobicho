# 📋 Formato JSON para API Externa de Resultados

Este documento especifica o formato JSON que a API externa deve retornar para que o sistema possa liquidar apostas automaticamente.

## 🔗 Endpoint da API Externa

A API externa deve fornecer um endpoint que retorne os resultados dos sorteios no formato especificado abaixo.

**Recomendação:** 
- Endpoint: `GET /api/resultados` ou `POST /api/resultados`
- Autenticação: Token Bearer ou API Key (opcional, mas recomendado)
- Rate Limit: Máximo 60 requisições por minuto

## 📦 Formato JSON Esperado

### Estrutura Principal

```json
{
  "sucesso": true,
  "mensagem": "Resultados encontrados com sucesso",
  "resultados": [
    {
      "loteria": "PT RIO",
      "dataConcurso": "2024-01-15",
      "horario": "18:20",
      "premios": [
        {
          "posicao": 1,
          "milhar": "2047",
          "grupo": 2,
          "animal": "Águia"
        },
        {
          "posicao": 2,
          "milhar": "2881",
          "grupo": 23,
          "animal": "Touro"
        },
        {
          "posicao": 3,
          "milhar": "2289",
          "grupo": 23,
          "animal": "Touro"
        },
        {
          "posicao": 4,
          "milhar": "1234",
          "grupo": 9,
          "animal": "Elefante"
        },
        {
          "posicao": 5,
          "milhar": "5678",
          "grupo": 20,
          "animal": "Leão"
        },
        {
          "posicao": 6,
          "milhar": "9012",
          "grupo": 23,
          "animal": "Touro"
        },
        {
          "posicao": 7,
          "milhar": "3456",
          "grupo": 14,
          "animal": "Macaco"
        }
      ]
    }
  ]
}
```

### Formato Simplificado (Alternativo)

Se preferir um formato mais simples, pode enviar apenas os milhares:

```json
{
  "sucesso": true,
  "mensagem": "Resultados encontrados com sucesso",
  "resultados": [
    {
      "loteria": "PT RIO",
      "dataConcurso": "2024-01-15",
      "horario": "18:20",
      "milhares": ["2047", "2881", "2289", "1234", "5678", "9012", "3456"]
    }
  ]
}
```

**Nota:** Se enviar apenas os milhares, o sistema calculará automaticamente os grupos e animais correspondentes.

## 📝 Campos Detalhados

### Objeto Principal

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `sucesso` | boolean | Sim | Indica se a requisição foi bem-sucedida |
| `mensagem` | string | Não | Mensagem descritiva (opcional) |
| `resultados` | array | Sim | Array de resultados de sorteios |

### Objeto Resultado

| Campo | Tipo | Obrigatório | Descrição | Exemplo |
|-------|------|-------------|-----------|---------|
| `loteria` | string | Sim | Nome da loteria/extração | `"PT RIO"`, `"PT SP"`, `"NACIONAL"` |
| `dataConcurso` | string | Sim | Data do sorteio no formato YYYY-MM-DD | `"2024-01-15"` |
| `horario` | string | Sim | Horário do sorteio no formato HH:MM | `"18:20"`, `"16:30"` |
| `premios` | array | Sim* | Array de prêmios (obrigatório se não usar `milhares`) | Ver abaixo |
| `milhares` | array | Sim* | Array de milhares como strings (alternativa a `premios`) | `["2047", "2881", ...]` |

**\* Nota:** Use `premios` OU `milhares`, não ambos.

### Objeto Prêmio (dentro de `premios`)

| Campo | Tipo | Obrigatório | Descrição | Exemplo |
|-------|------|-------------|-----------|---------|
| `posicao` | number | Sim | Posição do prêmio (1 a 7) | `1`, `2`, `3`, ..., `7` |
| `milhar` | string | Sim | Milhar de 4 dígitos | `"2047"`, `"0001"`, `"9999"` |
| `grupo` | number | Não* | Grupo do animal (1 a 25) | `1`, `2`, ..., `25` |
| `animal` | string | Não* | Nome do animal | `"Águia"`, `"Burro"`, `"Touro"` |

**\* Nota:** Se não fornecer `grupo` e `animal`, o sistema calculará automaticamente baseado no milhar.

## 🎯 Loterias Suportadas

O sistema reconhece os seguintes nomes de loterias (case-insensitive):

- `PT RIO` / `PT-RIO` / `MPT-RIO`
- `PT SP` / `PT-SP` / `MPT-SP`
- `PT BAHIA` / `PT-BA` / `MALUCA BAHIA`
- `NACIONAL` / `LOTERIA NACIONAL`
- `FEDERAL` / `LOTERIA FEDERAL`
- `LOTEP` / `LOTEP PB`
- `LOTECE` / `LOTECE CE`
- `LOOK` / `LOOK SP`

## 📊 Exemplo Completo com Múltiplos Resultados

```json
{
  "sucesso": true,
  "mensagem": "Resultados encontrados com sucesso",
  "resultados": [
    {
      "loteria": "PT RIO",
      "dataConcurso": "2024-01-15",
      "horario": "18:20",
      "premios": [
        {
          "posicao": 1,
          "milhar": "2047",
          "grupo": 2,
          "animal": "Águia"
        },
        {
          "posicao": 2,
          "milhar": "2881",
          "grupo": 23,
          "animal": "Touro"
        },
        {
          "posicao": 3,
          "milhar": "2289",
          "grupo": 23,
          "animal": "Touro"
        },
        {
          "posicao": 4,
          "milhar": "1234",
          "grupo": 9,
          "animal": "Elefante"
        },
        {
          "posicao": 5,
          "milhar": "5678",
          "grupo": 20,
          "animal": "Leão"
        },
        {
          "posicao": 6,
          "milhar": "9012",
          "grupo": 23,
          "animal": "Touro"
        },
        {
          "posicao": 7,
          "milhar": "3456",
          "grupo": 14,
          "animal": "Macaco"
        }
      ]
    },
    {
      "loteria": "PT RIO",
      "dataConcurso": "2024-01-15",
      "horario": "16:30",
      "milhares": ["1001", "2002", "3003", "4004", "5005", "6006", "7007"]
    }
  ]
}
```

## 🔍 Filtros Opcionais (Query Parameters)

A API pode aceitar filtros opcionais para retornar resultados específicos:

- `loteria` (string): Filtrar por loteria específica
- `dataConcurso` (string): Filtrar por data específica (YYYY-MM-DD)
- `horario` (string): Filtrar por horário específico (HH:MM)

**Exemplo de requisição:**
```
GET /api/resultados?loteria=PT RIO&dataConcurso=2024-01-15&horario=18:20
```

## ❌ Formato de Erro

Se houver erro, retorne:

```json
{
  "sucesso": false,
  "mensagem": "Descrição do erro",
  "erro": "Código do erro (opcional)",
  "resultados": []
}
```

**Exemplos de erros:**

```json
{
  "sucesso": false,
  "mensagem": "Resultado não encontrado para PT RIO em 2024-01-15 às 18:20",
  "erro": "NOT_FOUND",
  "resultados": []
}
```

```json
{
  "sucesso": false,
  "mensagem": "Parâmetros inválidos",
  "erro": "INVALID_PARAMS",
  "resultados": []
}
```

## 🔄 Integração com o Sistema

### Como o Sistema Usa os Resultados

1. **Busca de Resultados:**
   - O sistema chama a API externa periodicamente (a cada X minutos)
   - Ou a API externa pode fazer webhook para notificar novos resultados

2. **Processamento:**
   - O sistema busca apostas pendentes que correspondem ao resultado
   - Compara os milhares/grupos apostados com os resultados
   - Calcula os prêmios baseado nas odds configuradas
   - Atualiza o saldo dos usuários automaticamente

3. **Liquidação:**
   - Apostas ganhadoras: status muda para `liquidado`, saldo é creditado
   - Apostas perdedoras: status muda para `perdida`

### Endpoint de Integração

O sistema pode chamar a API externa através de:

**Variável de Ambiente:**
```env
RESULTADOS_API_URL=https://sua-api.com/api/resultados
RESULTADOS_API_KEY=sua-chave-api-opcional
```

**Ou via configuração no admin:**
- Admin > Configurações > API de Resultados
- URL da API
- Token/Chave de autenticação (opcional)

## 📌 Observações Importantes

1. **Milhares:** Devem sempre ter 4 dígitos (ex: `"0001"`, `"2047"`, `"9999"`)
2. **Grupos:** Devem estar entre 1 e 25
3. **Posições:** Devem estar entre 1 e 7 (normalmente são 7 prêmios)
4. **Data:** Sempre no formato ISO (YYYY-MM-DD)
5. **Horário:** Sempre no formato HH:MM (24 horas)
6. **Timezone:** Recomendado usar UTC ou especificar timezone

## 🧪 Exemplo de Teste

**Requisição:**
```bash
curl -X GET "https://sua-api.com/api/resultados?loteria=PT RIO&dataConcurso=2024-01-15" \
  -H "Authorization: Bearer sua-chave-api"
```

**Resposta Esperada:**
```json
{
  "sucesso": true,
  "mensagem": "Resultados encontrados",
  "resultados": [
    {
      "loteria": "PT RIO",
      "dataConcurso": "2024-01-15",
      "horario": "18:20",
      "premios": [
        { "posicao": 1, "milhar": "2047", "grupo": 2, "animal": "Águia" },
        { "posicao": 2, "milhar": "2881", "grupo": 23, "animal": "Touro" },
        { "posicao": 3, "milhar": "2289", "grupo": 23, "animal": "Touro" },
        { "posicao": 4, "milhar": "1234", "grupo": 9, "animal": "Elefante" },
        { "posicao": 5, "milhar": "5678", "grupo": 20, "animal": "Leão" },
        { "posicao": 6, "milhar": "9012", "grupo": 23, "animal": "Touro" },
        { "posicao": 7, "milhar": "3456", "grupo": 14, "animal": "Macaco" }
      ]
    }
  ]
}
```

## 📞 Suporte

Para dúvidas sobre a integração, entre em contato com a equipe de desenvolvimento.
