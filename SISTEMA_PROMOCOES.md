# Sistema de Promoções - Documentação

## Tipos de Promoções Implementadas

### 1. Dobro do Primeiro Depósito (`dobro_primeiro_deposito`)
- **Descrição**: Usuário ganha o dobro do valor depositado
- **Aplicação**: APENAS no primeiro depósito do usuário
- **Exemplo**: 
  - Depósito: R$ 100
  - Bônus: R$ 100 (dobro = 2x, então bônus = 1x o depósito)
  - Total na conta: R$ 200
- **Configurações**:
  - Valor mínimo do depósito (opcional)
  - Valor máximo do depósito (opcional, 0 = sem limite)

### 2. Percentual do Depósito (`percentual`)
- **Descrição**: Usuário ganha uma porcentagem do valor depositado
- **Aplicação**: Pode ser aplicada em qualquer depósito
- **Exemplo**:
  - Depósito: R$ 100
  - Percentual: 50%
  - Bônus: R$ 50
  - Total na conta: R$ 150
- **Configurações**:
  - Percentual (%)
  - Valor mínimo do depósito (opcional)
  - Valor máximo do depósito (opcional)

### 3. Valor Fixo (`valor_fixo`)
- **Descrição**: Usuário ganha um valor fixo independente do depósito
- **Aplicação**: Pode ser aplicada em qualquer depósito
- **Exemplo**:
  - Depósito: R$ 50
  - Bônus fixo: R$ 100
  - Total na conta: R$ 150
- **Configurações**:
  - Valor do bônus (R$)
  - Valor mínimo do depósito (opcional)

### 4. Cashback (`cashback`)
- **Descrição**: Usuário recebe parte do valor de volta
- **Aplicação**: Pode ser aplicada em qualquer depósito
- **Exemplo**:
  - Depósito: R$ 100
  - Cashback: 10%
  - Bônus: R$ 10
  - Total na conta: R$ 110
- **Configurações**:
  - Percentual de cashback (%)

## Funcionalidades do Admin

### Criar Promoção
- Acesse: `/admin/promocoes/new`
- Preencha os campos:
  - Título
  - Descrição
  - Tipo de promoção
  - Configurações específicas do tipo
  - Ordem de exibição
  - Status (ativa/inativa)

### Editar Promoção
- Acesse: `/admin/promocoes`
- Clique em "Editar" na promoção desejada
- Modifique os campos necessários
- Salve as alterações

### Ativar/Desativar
- Promoções inativas não aparecem no frontend
- Promoções ativas aparecem automaticamente

## Lógica de Cálculo

A função `calcularBonus()` em `lib/promocoes-calculator.ts`:
- Filtra promoções ativas e válidas
- Valida valores mínimos e máximos
- Para "dobro_primeiro_deposito", verifica se é o primeiro depósito
- Retorna o bônus calculado, total e promoção aplicada

## Exemplo de Uso

```typescript
import { calcularBonus } from '@/lib/promocoes-calculator'

const promocoes = [
  {
    id: 1,
    tipo: 'dobro_primeiro_deposito',
    active: true,
    valorMinimo: 10,
    valorMaximo: 1000
  }
]

// Primeiro depósito
const resultado1 = calcularBonus(100, promocoes, true)
// resultado1.bonus = 100 (dobro = 200 total)
// resultado1.total = 200

// Segundo depósito (não aplica dobro)
const resultado2 = calcularBonus(100, promocoes, false)
// resultado2.bonus = 0
// resultado2.total = 100
```

## Validações

- Valor mínimo: depósito deve ser >= valor mínimo
- Valor máximo: depósito deve ser <= valor máximo (se > 0)
- Primeiro depósito: tipo "dobro_primeiro_deposito" só aplica no primeiro depósito
- Promoção ativa: apenas promoções ativas são consideradas
