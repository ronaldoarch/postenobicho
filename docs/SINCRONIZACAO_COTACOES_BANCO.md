# ✅ Sincronização de Cotações com Banco de Dados

## 🎯 Objetivo

Garantir que quando o admin altera uma cotação na interface (`/admin/modalidades`), essa alteração seja salva no banco de dados e **priorizada** em todos os cálculos do sistema.

## 🔄 Fluxo de Sincronização

### 1. Admin Altera Cotação
- Admin acessa `/admin/modalidades`
- Clica em "Editar" na cotação desejada
- Altera o valor (ex: de R$ 200.00 para R$ 8000.00)
- Clica em "Salvar"

### 2. Salvamento no Banco
- O valor é salvo na tabela `Modalidade` no campo `value` (formato: "1x R$ 8000.00")
- Exemplo: `UPDATE Modalidade SET value = '1x R$ 8000.00' WHERE id = 10`

### 3. Uso no Sistema
- Quando o sistema precisa calcular uma odd/cotação, a função `buscarOdd()` é chamada
- **PRIORIDADE 1:** Busca no banco de dados (tabela `Modalidade`)
  - Se encontrar e estiver ativa, usa o valor do banco
  - Extrai o valor numérico de "1x R$ 8000.00" → 8000
- **PRIORIDADE 2:** Se não encontrar no banco, usa valores hardcoded como fallback

## 📝 Implementação

### Função `buscarOdd()` Modificada

```typescript
export async function buscarOdd(
  modalidade: ModalityType,
  pos_from: number,
  pos_to: number,
  modalidadeId?: number,
  modalityName?: string | null
): Promise<number> {
  // PRIORIDADE 1: Buscar do banco de dados
  try {
    let modalidadeBanco = null
    
    // Se tiver modalidadeId, buscar por ID
    if (modalidadeId) {
      modalidadeBanco = await prisma.modalidade.findUnique({
        where: { id: modalidadeId },
        select: { id: true, name: true, value: true, active: true },
      })
    }
    
    // Se não encontrou por ID e tiver modalityName, buscar por nome
    if (!modalidadeBanco && modalityName) {
      modalidadeBanco = await prisma.modalidade.findFirst({
        where: { 
          name: modalityName,
          active: true,
        },
        select: { id: true, name: true, value: true, active: true },
      })
    }
    
    // Se encontrou no banco e está ativa, usar o valor do banco
    if (modalidadeBanco && modalidadeBanco.active && modalidadeBanco.value) {
      const valorBanco = extrairValorCotacao(modalidadeBanco.value)
      if (valorBanco !== null && valorBanco > 0) {
        return valorBanco
      }
    }
  } catch (error) {
    console.warn('Erro ao buscar cotação do banco:', error)
  }
  
  // PRIORIDADE 2: Usar valores hardcoded como fallback
  // ... (código existente)
}
```

### Função `extrairValorCotacao()`

```typescript
function extrairValorCotacao(value: string | null | undefined): number | null {
  if (!value) return null
  const match = value.match(/R\$\s*([\d,]+(?:\.\d{2})?)/)
  if (match) {
    return parseFloat(match[1].replace(',', '.'))
  }
  return null
}
```

## 🔧 Arquivos Modificados

1. **`lib/bet-rules-engine.ts`**
   - Função `buscarOdd()` agora é `async` e busca do banco primeiro
   - Função `conferirPalpite()` agora é `async` e passa `modalidadeId` e `modalityName` para `buscarOdd()`
   - Adicionada função `extrairValorCotacao()` para extrair valor numérico

2. **`components/BetConfirmation.tsx`**
   - Chamada de `buscarOdd()` agora usa `await` e passa `modalidadeId` e `modalityName`

3. **`components/BetFlow.tsx`**
   - Chamada de `buscarOdd()` agora usa `await` e passa `modalidadeId` e `modalityName`

4. **`app/api/apostas/route.ts`**
   - Chamada de `conferirPalpite()` agora usa `await` e passa `modalidadeId` e `modalityName`

5. **`app/api/resultados/liquidar/route.ts`**
   - Todas as chamadas de `buscarOdd()` e `conferirPalpite()` agora usam `await` e passam `modalidadeId` e `modalityName`

6. **`app/api/resultados/liquidar/manual/route.ts`**
   - Chamada de `conferirPalpite()` e `buscarOdd()` agora usam `await` e passam `modalidadeId` e `modalityName`

## ✅ Benefícios

1. **Sincronização Automática:** Quando admin altera cotação, todos os cálculos usam o novo valor automaticamente
2. **Prioridade do Admin:** Valores do banco têm prioridade sobre valores hardcoded
3. **Fallback Seguro:** Se não encontrar no banco, usa valores hardcoded para garantir funcionamento
4. **Consistência:** Todos os lugares do sistema (frontend, backend, liquidação) usam a mesma lógica

## 📊 Exemplo de Uso

**Cenário:** Admin altera "Milhar Invertida" de R$ 200.00 para R$ 8000.00

1. Admin salva no `/admin/modalidades`
2. Banco atualizado: `Modalidade.value = '1x R$ 8000.00'` (ID 10)
3. Usuário faz aposta em "Milhar Invertida"
4. Sistema busca odd:
   - Busca no banco: encontra ID 10 com valor "1x R$ 8000.00"
   - Extrai: 8000
   - Retorna: 8000x (em vez de 200x hardcoded)
5. Cálculo de prêmio usa 8000x

## 🔍 Verificação

Para verificar se está funcionando:

1. Admin altera uma cotação (ex: "Milhar Invertida" para R$ 8000.00)
2. Verifica no banco: `SELECT * FROM Modalidade WHERE id = 10`
3. Faz uma aposta na modalidade
4. Verifica logs: deve aparecer "Usando cotação do banco: 8000x"
5. Verifica retorno previsto: deve mostrar valores baseados em 8000x

## ⚠️ Observações Importantes

1. **Formato do Valor:** O valor no banco deve estar no formato "1x R$ XXXX.XX"
2. **Modalidade Ativa:** A modalidade deve estar com `active = true` para ser usada
3. **Fallback:** Se não encontrar no banco, usa valores hardcoded (garante funcionamento mesmo sem dados no banco)
4. **Performance:** A busca no banco é feita apenas quando necessário (se tiver `modalidadeId` ou `modalityName`)
