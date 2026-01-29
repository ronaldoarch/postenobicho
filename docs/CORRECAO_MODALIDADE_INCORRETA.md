# 🔧 Correção: Modalidade Incorreta na Etapa 5

## ❌ Problema Identificado

Quando o usuário selecionava **"Milhar Invertida"**, na etapa 5 (Confirmação) aparecia **"Milhar/Centena"** em vez do nome correto.

## 🔍 Causa Raiz

**Inconsistência entre IDs do banco de dados e IDs do array estático:**

### Banco de Dados:
- ID 10 = "Milhar Invertida"
- ID 4 = "Milhar/Centena"

### Array Estático (`data/modalities.ts`):
- ID 13 = "Milhar Invertida"
- ID 10 = "Milhar/Centena"

Quando o usuário selecionava "Milhar Invertida" pelo ID do banco (10), o código buscava no array estático e encontrava "Milhar/Centena" (que tem ID 10 no array estático).

## ✅ Correção Aplicada

Modificado `BetConfirmation.tsx` para **SEMPRE usar `modalityName`** em vez de buscar pelo ID:

```typescript
// ANTES (PROBLEMÁTICO):
const selectedModality = betData.modality
  ? MODALITIES.find((m) => m.id.toString() === betData.modality)
  : null

// DEPOIS (CORRIGIDO):
let selectedModality = null

if (betData.modalityName) {
  // Buscar pelo nome (mais confiável)
  selectedModality = MODALITIES.find((m) => m.name === betData.modalityName)
  
  // Se não encontrou no array estático, criar objeto com os dados do betData
  if (!selectedModality) {
    console.warn('⚠️ Modalidade não encontrada no array estático pelo nome:', betData.modalityName)
    // Usar dados do betData como fallback
    selectedModality = {
      id: parseInt(betData.modality || '0'),
      name: betData.modalityName,
      value: '1x R$ 0.00', // Valor padrão
      hasLink: false,
    }
  }
} else if (betData.modality) {
  // Fallback: buscar pelo ID (pode ter problemas se IDs forem diferentes)
  selectedModality = MODALITIES.find((m) => m.id.toString() === betData.modality)
  if (selectedModality) {
    console.warn('⚠️ Usando busca por ID (pode estar incorreto):', {
      modalityId: betData.modality,
      modalityNameFound: selectedModality.name,
    })
  }
}
```

## 🔧 Melhorias Adicionais

1. **Priorização de `modalityName`:** O código agora sempre prioriza `modalityName` sobre `modality` (ID).

2. **Fallback inteligente:** Se não encontrar pelo nome no array estático, cria um objeto com os dados do `betData`.

3. **Logs de debug:** Adicionados logs para identificar quando há inconsistências entre IDs e nomes.

4. **Validação no cálculo:** O cálculo de retorno também foi atualizado para usar `modalityName` primeiro.

## ✅ Resultado

Agora todas as modalidades aparecem com o nome correto na etapa 5, independentemente de inconsistências entre IDs do banco e do array estático.

## 📝 Arquivos Modificados

- `components/BetConfirmation.tsx` - Linhas 237-260 (busca de modalidade)
- `components/BetConfirmation.tsx` - Linhas 92-121 (cálculo de retorno)

## ⚠️ Observação Importante

**Recomendação:** Sincronizar os IDs do array estático (`data/modalities.ts`) com os IDs do banco de dados para evitar problemas futuros. Ou melhor ainda: remover o array estático e sempre buscar modalidades do banco de dados via API.
