# Implementação do Backend

## Resumo

Implementado um sistema de API completo baseado na estrutura do site original `pontodobicho.com`. O backend utiliza Next.js API Routes (App Router) e mantém compatibilidade com o formato de resposta da API original.

## Estrutura Criada

### 1. Tipos TypeScript (`types/api.ts`)

Definidos todos os tipos TypeScript para:
- `ApiResponse<T>` - Formato padrão de resposta da API
- `Quotation` - Cotações de modalidades
- `Lottery` - Dados de loterias
- `LotteriesByRegion` - Loterias organizadas por região
- `SystemVersion` - Versão do sistema e serviços
- `Result` - Resultados de sorteios

### 2. API Routes

#### `/api/quotations/active` (GET)
- Retorna todas as cotações ativas
- Inclui modalidades padrão e especiais (PONTO-NOITE, PONTO-MEIO-DIA, etc.)
- Formato compatível com a API original
- Endpoint: `GET /api/quotations/active`

#### `/api/lottery` (GET)
- Retorna listagem de loterias organizadas por região
- Inclui: Especiais, Rio de Janeiro, São Paulo, Distrito Federal, Goiás, etc.
- Cada loteria contém: id, name, uf, status, closingTime
- Endpoint: `GET /api/lottery`

#### `/api/results` (GET)
- Retorna resultados de sorteios
- Suporta filtros via query parameters:
  - `date` - Filtra por data
  - `location` - Filtra por localização
  - `drawTime` - Filtra por horário do sorteio
- Endpoint: `GET /api/results?date=YYYY-MM-DD&location=...&drawTime=...`

### 3. Serviço de API (`lib/api.ts`)

Criado serviço centralizado para chamadas de API no frontend:

```typescript
import { api } from '@/lib/api'

// Buscar cotações
const quotations = await api.getQuotations()

// Buscar loterias
const lotteries = await api.getLotteries()

// Buscar resultados
const results = await api.getResults({ date: '2024-01-01' })
```

## Formato das Respostas

Todas as APIs seguem o formato padrão:

```json
{
  "type": "success" | "error",
  "message": "Mensagem opcional",
  "data": { /* dados */ }
}
```

## Comparação com API Original

### API Original
- Base URL: `https://api.pontodobicho.com`
- Endpoints analisados:
  - `/jb/quotations/active`
  - `/lottery`
  - `/version`
  - `/user/profile`
  - `/user/notifications/summary`

### Nossa Implementação
- Base URL: `/api` (relativo, pode ser configurado via `NEXT_PUBLIC_API_URL`)
- Endpoints implementados:
  - `/api/quotations/active` ✅
  - `/api/lottery` ✅
  - `/api/results` ✅

## Configuração

### Variáveis de Ambiente (Opcional)

```env
NEXT_PUBLIC_API_URL=/api
```

Por padrão, usa `/api` (rotas relativas do Next.js).

## Próximos Passos

1. ✅ Estrutura de tipos TypeScript
2. ✅ API Routes do Next.js
3. ✅ Serviço de API para frontend
4. ⏳ Integração com banco de dados (opcional)
5. ⏳ Autenticação de usuários (opcional)
6. ⏳ Cache de respostas (opcional)
7. ⏳ Validação de dados (Zod/Joi)

## Uso no Frontend

Exemplo de uso em componentes:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Quotation } from '@/types/api'

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchQuotations() {
      const response = await api.getQuotations()
      if (response.type === 'success' && response.data) {
        setQuotations(response.data)
      }
      setLoading(false)
    }
    fetchQuotations()
  }, [])

  if (loading) return <div>Carregando...</div>

  return (
    <div>
      {quotations.map((q) => (
        <div key={q.id}>
          {q.modality}: R$ {q.quotation}
        </div>
      ))}
    </div>
  )
}
```

## Observações

- Todas as rotas de API estão configuradas como `dynamic = 'force-dynamic'` para garantir renderização no servidor
- Os dados são simulados baseados na estrutura original
- Para produção, recomenda-se conectar a um banco de dados real
- As APIs seguem o padrão REST e são compatíveis com o formato da API original
