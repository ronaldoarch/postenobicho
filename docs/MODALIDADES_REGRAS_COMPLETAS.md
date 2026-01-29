# Documentação Completa: Modalidades, Regras e Cálculos

## Índice
1. [Visão Geral](#visão-geral)
2. [Sistema de Grupos e Dezenas](#sistema-de-grupos-e-dezenas)
3. [Sistema de Palpites e Limitações](#sistema-de-palpites-e-limitações)
4. [Extrações e Horários](#extrações-e-horários)
5. [Apostas Instantâneas](#apostas-instantâneas)
6. [Modalidades de Animais (Grupos)](#modalidades-de-animais-grupos)
7. [Modalidades de Números](#modalidades-de-números)
8. [Modalidades Especiais](#modalidades-especiais)
9. [Cálculo de Prêmios](#cálculo-de-prêmios)
10. [Liquidação de Apostas](#liquidação-de-apostas)
11. [Formato JSON para Testes](#formato-json-para-testes)

---

## Visão Geral

O sistema de apostas do Jogo do Bicho funciona com **25 grupos** (animais), cada grupo contendo **4 dezenas** consecutivas (00-99). Cada milhar sorteado pertence a um grupo específico baseado em sua dezena (últimos 2 dígitos).

### Estrutura Básica
- **Grupos**: 1 a 25 (cada grupo = 1 animal)
- **Dezenas**: 00 a 99 (100 dezenas no total)
- **Milhares**: 0000 a 9999 (10.000 milhares possíveis)
- **Centenas**: 000 a 999 (1.000 centenas possíveis)

---

## Sistema de Grupos e Dezenas

### Conversão Dezena → Grupo

Cada grupo contém 4 dezenas consecutivas:
- **Grupo 1**: 01, 02, 03, 04 → Avestruz
- **Grupo 2**: 05, 06, 07, 08 → Águia
- **Grupo 3**: 09, 10, 11, 12 → Burro
- ...
- **Grupo 25**: 97, 98, 99, 00 → Vaca

**Fórmula**: 
```
Se dezena = 0: grupo = 25
Senão: grupo = floor((dezena - 1) / 4) + 1
```

**Exemplo**:
- Milhar `1234` → Dezena `34` → Grupo `9` (Cobra)
- Milhar `0099` → Dezena `99` → Grupo `25` (Vaca)
- Milhar `0000` → Dezena `00` → Grupo `25` (Vaca)

### Tabela de Animais e Grupos

| Grupo | Animal | Dezenas |
|-------|--------|---------|
| 1 | Avestruz | 01-04 |
| 2 | Águia | 05-08 |
| 3 | Burro | 09-12 |
| 4 | Borboleta | 13-16 |
| 5 | Cachorro | 17-20 |
| 6 | Cabra | 21-24 |
| 7 | Carneiro | 25-28 |
| 8 | Camelo | 29-32 |
| 9 | Cobra | 33-36 |
| 10 | Coelho | 37-40 |
| 11 | Cavalo | 41-44 |
| 12 | Elefante | 45-48 |
| 13 | Galo | 49-52 |
| 14 | Gato | 53-56 |
| 15 | Jacaré | 57-60 |
| 16 | Leão | 61-64 |
| 17 | Macaco | 65-68 |
| 18 | Porco | 69-72 |
| 19 | Pavão | 73-76 |
| 20 | Peru | 77-80 |
| 21 | Touro | 81-84 |
| 22 | Tigre | 85-88 |
| 23 | Urso | 89-92 |
| 24 | Veado | 93-96 |
| 25 | Vaca | 97-99, 00 |

---

## Sistema de Palpites e Limitações

### Conceito de Palpite

Um **palpite** é uma escolha individual dentro de uma modalidade. O sistema permite múltiplos palpites por aposta, mas cada palpite é processado e liquidado **separadamente**.

### Estrutura de Dados

#### Para Modalidades de Animais (Grupos)

```typescript
animalBets: number[][]  // Array de arrays de IDs de animais
```

**Exemplo**:
```javascript
// Grupo simples: 3 palpites (cada um com 1 animal)
animalBets: [
  [20],  // Palpite 1: Grupo 20 (Peru)
  [21],  // Palpite 2: Grupo 21 (Touro)
  [8]    // Palpite 3: Grupo 8 (Camelo)
]

// Dupla de Grupo: 2 palpites (cada um com 2 animais)
animalBets: [
  [20, 21],  // Palpite 1: Grupo 20 + Grupo 21
  [8, 9]     // Palpite 2: Grupo 8 + Grupo 9
]

// Terno de Grupo: 1 palpite (com 3 animais)
animalBets: [
  [20, 21, 8]  // Palpite 1: Grupo 20 + Grupo 21 + Grupo 8
]
```

#### Para Modalidades de Números

```typescript
numberBets: string[]  // Array de strings formatadas
```

**Exemplo**:
```javascript
// Milhar: 3 palpites (cada um com 4 dígitos)
numberBets: [
  "1234",  // Palpite 1: Milhar 1234
  "5678",  // Palpite 2: Milhar 5678
  "9012"   // Palpite 3: Milhar 9012
]

// Duque de Dezena: 2 palpites (cada um com 2 dezenas)
numberBets: [
  "12-23",  // Palpite 1: Dezena 12 + Dezena 23
  "34-45"   // Palpite 2: Dezena 34 + Dezena 45
]

// Quadra de Dezena: 1 palpite (com 4 dezenas)
numberBets: [
  "12-23-34-45"  // Palpite 1: 4 dezenas
]

// Dezeninha: 1 palpite (com múltiplas dezenas separadas por vírgula)
numberBets: [
  "12,23,34,45,56"  // Palpite 1: 5 dezenas
]
```

### Limitações por Modalidade

#### Limite Geral
- **Máximo de palpites**: 10 por aposta (independente da modalidade)

#### Limitações por Modalidade de Animais

| Modalidade | Animais por Palpite | Exemplo de Palpite |
|------------|---------------------|-------------------|
| **Grupo** | 1 animal | `[20]` → Grupo 20 (Peru) |
| **Dupla de Grupo** | 2 animais | `[20, 21]` → Grupo 20 + Grupo 21 |
| **Terno de Grupo** | 3 animais | `[20, 21, 8]` → Grupo 20 + Grupo 21 + Grupo 8 |
| **Quadra de Grupo** | 4 animais | `[20, 21, 8, 9]` → 4 grupos |
| **Quina de Grupo** | 5 animais | `[20, 21, 8, 9, 10]` → 5 grupos |
| **Passe Vai** | 2 animais | `[20, 21]` → Grupo 20 + Grupo 21 |
| **Passe Vai e Vem** | 2 animais | `[20, 21]` → Grupo 20 + Grupo 21 |

**Regra**: Cada modalidade exige um número específico de animais por palpite. O frontend **não permite** criar um palpite incompleto.

#### Limitações por Modalidade de Números

| Modalidade | Dígitos/Formato | Exemplo de Palpite |
|------------|----------------|-------------------|
| **Dezena** | 2 dígitos | `"12"` → Dezena 12 |
| **Centena** | 3 dígitos | `"123"` → Centena 123 |
| **Milhar** | 4 dígitos | `"1234"` → Milhar 1234 |
| **Dezena Invertida** | 2 dígitos | `"12"` → Gera variações: 12, 21 |
| **Centena Invertida** | 3 dígitos | `"123"` → Gera variações: 123, 132, 213, 231, 312, 321 |
| **Milhar Invertida** | 4 dígitos | `"1234"` → Gera todas as permutações distintas |
| **Milhar/Centena** | 3 ou 4 dígitos | `"1234"` → Gera: Milhar 1234 + Centena 234 |
| **Duque de Dezena** | 2 dezenas (formato: "XX-YY") | `"12-23"` → Dezena 12 + Dezena 23 |
| **Terno de Dezena** | 2 dígitos (gera 3 dezenas) | `"12"` → Dezena 12, 23, 34 (EMD) |
| **Quadra de Dezena** | 4 dezenas (formato: "XX-YY-ZZ-WW") | `"12-23-34-45"` → 4 dezenas |
| **Duque de Dezena EMD** | 4 dígitos (escolhe 2 de 3 EMD) | `"1234"` → Escolhe 2 de [12, 23, 34] |
| **Terno de Dezena EMD** | 4 dígitos (usa 3 EMD) | `"1234"` → Usa [12, 23, 34] |
| **Dezeninha** | 3 a 20 dezenas (formato: "XX,YY,ZZ,...") | `"12,23,34,45,56"` → 5 dezenas |

**Regra**: Cada modalidade tem um formato específico. O frontend valida o formato antes de permitir adicionar o palpite.

### Como o Frontend Separa os Palpites

#### Para Modalidades de Animais

**Grupo Simples** (`requiredPerBet = 1`):
1. Usuário clica em um animal → Palpite é adicionado imediatamente
2. Cada clique em um animal diferente cria um novo palpite
3. Máximo: 10 palpites (10 animais diferentes)

**Dupla/Terno/Quadra/Quina** (`requiredPerBet > 1`):
1. Usuário clica em animais sequencialmente
2. Sistema mostra "Palpite em construção: XX-YY (2/3)"
3. Quando completa o número necessário, palpite é adicionado automaticamente
4. Máximo: 10 palpites completos

**Exemplo Dupla de Grupo**:
```
Clica em Animal 20 → "Palpite em construção: 20 (1/2)"
Clica em Animal 21 → Palpite [20, 21] adicionado ✅
Clica em Animal 8  → "Palpite em construção: 8 (1/2)"
Clica em Animal 9  → Palpite [8, 9] adicionado ✅
```

#### Para Modalidades de Números

**Números Simples** (Dezena, Centena, Milhar):
1. Usuário digita dígitos no teclado numérico
2. Quando completa o número de dígitos, palpite é adicionado automaticamente
3. Máximo: 10 palpites

**Números Compostos** (Duque, Terno, Quadra):
1. Usuário digita no formato específico
2. Sistema valida formato antes de adicionar
3. Máximo: 10 palpites

**Exemplo Milhar**:
```
Digita: 1 → 2 → 3 → 4 → Palpite "1234" adicionado ✅
Digita: 5 → 6 → 7 → 8 → Palpite "5678" adicionado ✅
Digita: 9 → 0 → 1 → 2 → Palpite "9012" adicionado ✅
```

**Exemplo Duque de Dezena**:
```
Digita: 1 → 2 → - → 2 → 3 → Palpite "12-23" adicionado ✅
Digita: 3 → 4 → - → 4 → 5 → Palpite "34-45" adicionado ✅
```

### Como o Backend Processa Múltiplos Palpites

#### Processamento Individual

Cada palpite é processado **separadamente**:

1. **Loop pelos palpites**: Para cada palpite em `animalBets` ou `numberBets`
2. **Criação de aposta individual**: Uma aposta no banco de dados para cada palpite × cada extração
3. **Cálculo de prêmio**: Cada palpite é conferido independentemente
4. **Liquidação**: Cada aposta é liquidada separadamente

#### Exemplo: Múltiplos Palpites com Múltiplas Extrações

**Cenário**:
- Modalidade: Grupo
- Palpites: 3 animais (Grupo 20, 21, 8)
- Extrações: 2 (PT RIO 09:20, PT RIO 11:20)
- Valor: R$ 6,00
- Divisão: "all"
- Posições: 1º-5º

**Processamento**:

1. **Cálculo do valor**:
   - Valor por extração: R$ 6,00
   - Valor por palpite: R$ 6,00 / 3 = R$ 2,00
   - Total debitado: R$ 6,00 × 2 extrações = R$ 12,00

2. **Apostas criadas** (6 apostas no total):
   ```
   Aposta 1: Grupo 20, PT RIO 09:20, R$ 2,00
   Aposta 2: Grupo 21, PT RIO 09:20, R$ 2,00
   Aposta 3: Grupo 8,  PT RIO 09:20, R$ 2,00
   Aposta 4: Grupo 20, PT RIO 11:20, R$ 2,00
   Aposta 5: Grupo 21, PT RIO 11:20, R$ 2,00
   Aposta 6: Grupo 8,  PT RIO 11:20, R$ 2,00
   ```

3. **Liquidação**: Cada uma das 6 apostas é liquidada independentemente quando os resultados são publicados.

#### Divisão "all" vs "each"

**Divisão "all"** (padrão):
- Valor é dividido entre todos os palpites
- Exemplo: R$ 6,00 / 3 palpites = R$ 2,00 por palpite

**Divisão "each"**:
- Cada palpite tem o valor completo
- Exemplo: R$ 6,00 × 3 palpites = R$ 18,00 total debitado

**Fórmula**:
```javascript
// Divisão "all"
valorPorPalpite = valorDigitado / qtdPalpites
totalDebitado = valorPorPalpite × qtdExtracoes

// Divisão "each"
valorPorPalpite = valorDigitado
totalDebitado = valorPorPalpite × qtdPalpites × qtdExtracoes
```

### Validações do Frontend

#### Validações de Palpites

1. **Limite máximo**: Não permite adicionar mais de 10 palpites
2. **Formato**: Valida formato antes de adicionar (ex: 4 dígitos para Milhar)
3. **Duplicação**: Não permite palpites duplicados
4. **Completude**: Não permite palpite incompleto (ex: Dupla com apenas 1 animal)

#### Validações de Extrações

1. **Horário**: Não permite selecionar extrações que já fecharam
2. **Limite**: Máximo de 3 extrações por aposta
3. **Dia da semana**: Valida se há sorteio no dia selecionado

### Estrutura JSON de Palpites

#### Exemplo Completo: Grupo com 3 Palpites

```json
{
  "betData": {
    "modalityName": "Grupo",
    "animalBets": [
      [20],  // Palpite 1: Grupo 20
      [21],  // Palpite 2: Grupo 21
      [8]    // Palpite 3: Grupo 8
    ],
    "numberBets": [],
    "amount": 6.00,
    "divisionType": "all",
    "selectedExtracoes": ["37", "15"],
    "position": "1-5"
  }
}
```

#### Exemplo Completo: Dupla de Grupo com 2 Palpites

```json
{
  "betData": {
    "modalityName": "Dupla de Grupo",
    "animalBets": [
      [20, 21],  // Palpite 1: Grupo 20 + Grupo 21
      [8, 9]     // Palpite 2: Grupo 8 + Grupo 9
    ],
    "numberBets": [],
    "amount": 4.00,
    "divisionType": "all",
    "selectedExtracoes": ["37"],
    "position": "1-3"
  }
}
```

#### Exemplo Completo: Milhar com 3 Palpites

```json
{
  "betData": {
    "modalityName": "Milhar",
    "animalBets": [],
    "numberBets": [
      "1234",  // Palpite 1: Milhar 1234
      "5678",  // Palpite 2: Milhar 5678
      "9012"   // Palpite 3: Milhar 9012
    ],
    "amount": 6.00,
    "divisionType": "all",
    "selectedExtracoes": ["37", "15", "16"],
    "position": "1-5"
  }
}
```

### Resumo das Regras

1. **Cada animal/número = 1 palpite** (para modalidades simples)
2. **Múltiplos animais/números = 1 palpite** (para modalidades compostas)
3. **Máximo 10 palpites** por aposta
4. **Cada palpite é processado separadamente** no backend
5. **Valor dividido entre palpites** (se divisão "all")
6. **Cada palpite × cada extração = 1 aposta no banco**

---

## Extrações e Horários

### Visão Geral

O sistema suporta **46 extrações** de diferentes estados e loterias, cada uma com seus próprios horários de fechamento e apuração. As extrações são organizadas por estado e podem ser selecionadas no momento de fazer a aposta.

### Estrutura de uma Extração

Cada extração possui:
- **ID**: Identificador único
- **Nome**: Nome da loteria (ex: "PT RIO", "LOOK", "NACIONAL")
- **Estado**: Estado da loteria (ex: "RJ", "SP", "GO", "BR")
- **closeTime**: Horário de fechamento interno (quando para de aceitar apostas)
- **realCloseTime**: Horário real de fechamento no site oficial
- **time**: Horário da extração
- **active**: Se está ativa ou não
- **days**: Dias da semana com sorteio (ex: "Seg, Ter, Qua, Sex, Sáb")

### Lista Completa de Extrações

#### Rio de Janeiro (RJ)
| ID | Nome | Horário | Fecha às | Dias |
|----|------|---------|----------|------|
| 15 | PT RIO | 11:20 | 11:10 | Seg, Ter, Qua, Sex, Sáb, Dom |
| 16 | PT RIO | 14:20 | 14:10 | Seg, Ter, Qua, Sex, Sáb, Dom |
| 17 | PT RIO | 16:20 | 16:10 | Seg, Ter, Qua, Sex, Sáb, Dom |
| 18 | PT RIO | 18:20 | 18:10 | Seg, Ter, Sex |
| 19 | PT RIO | 21:20 | 21:10 | Seg, Ter, Qua, Sex, Sáb |
| 37 | PT RIO | 09:20 | 09:10 | Seg, Ter, Qua, Sex, Sáb, Dom |

#### São Paulo (SP)
| ID | Nome | Horário | Fecha às | Dias |
|----|------|---------|----------|------|
| 42 | PT SP | 10:00 | 10:11 | Seg, Ter, Qua, Sex, Sáb, Dom |
| 43 | PT SP | 13:15 | 13:11 | Seg, Ter, Qua, Sex, Sáb, Dom |
| 44 | PT SP (Band) | 15:15 | 15:11 | Seg, Ter, Qua, Sex, Sáb |
| 45 | PT SP | 17:15 | 17:11 | Seg, Ter, Qua, Sex, Sáb |
| 46 | PT SP | 20:15 | 20:11 | Seg, Ter, Sex |

#### Goiás (GO)
| ID | Nome | Horário | Fecha às | Dias |
|----|------|---------|----------|------|
| 8 | LOOK | 11:20 | 11:05 | Todos |
| 9 | LOOK | 14:20 | 14:05 | Todos |
| 10 | LOOK | 16:20 | 16:05 | Todos |
| 11 | LOOK | 18:20 | 18:05 | Todos |
| 12 | LOOK | 21:20 | 21:05 | Todos |
| 35 | LOOK | 09:20 | 09:05 | Todos |
| 38 | LOOK | 23:20 | 23:10 | Todos |
| 40 | LOOK | 07:20 | 07:05 | Todos |

#### Ceará (CE)
| ID | Nome | Horário | Fecha às | Dias |
|----|------|---------|----------|------|
| 1 | LOTECE | 11:00 | 10:26 | Seg, Ter, Qua, Sex, Sáb |
| 2 | LOTECE | 14:00 | 13:25 | Seg, Ter, Qua, Sex, Sáb |
| 3 | LOTECE | 19:40 | 19:10 | Seg, Ter, Qua, Sex, Sáb |
| 41 | LOTECE | 15:40 | 15:26 | Seg, Ter, Qua, Sex, Sáb |

#### Paraíba (PB)
| ID | Nome | Horário | Fecha às | Dias |
|----|------|---------|----------|------|
| 4 | LOTEP | 10:45 | 10:35 | Seg, Ter, Qua, Sex, Sáb, Dom |
| 5 | LOTEP | 12:45 | 12:35 | Seg, Ter, Qua, Sex, Sáb, Dom |
| 6 | LOTEP | 15:45 | 15:35 | Seg, Ter, Qua, Sex, Sáb |
| 7 | LOTEP | 18:05 | 17:51 | Seg, Ter, Qua, Sex, Sáb |

#### Bahia (BA)
| ID | Nome | Horário | Fecha às | Dias |
|----|------|---------|----------|------|
| 27 | PT BAHIA | 10:20 | 10:03 | Seg, Ter, Qua, Sex, Sáb, Dom |
| 28 | PT BAHIA | 12:20 | 12:03 | Seg, Ter, Qua, Sex, Sáb, Dom |
| 29 | PT BAHIA | 15:20 | 15:03 | Seg, Ter, Qua, Sex, Sáb, Dom |
| 30 | PT BAHIA | 19:00 | 18:43 | Seg, Ter, Sex |
| 31 | PT BAHIA | 21:20 | 21:03 | Seg, Ter, Qua, Sex, Sáb |

#### Nacional (BR)
| ID | Nome | Horário | Fecha às | Dias |
|----|------|---------|----------|------|
| 13 | PARA TODOS | 09:45 | 09:35 | Seg, Ter, Qua, Sex, Sáb, Dom |
| 14 | PARA TODOS | 20:40 | 20:20 | Seg, Ter, Qua, Sex, Sáb |
| 20 | NACIONAL | 08:00 | 07:45 | Todos |
| 21 | NACIONAL | 10:00 | 09:45 | Todos |
| 22 | NACIONAL | 12:00 | 11:45 | Todos |
| 23 | NACIONAL | 15:00 | 14:45 | Todos |
| 24 | NACIONAL | 17:00 | 16:45 | Todos |
| 25 | NACIONAL | 21:00 | 20:45 | Todos |
| 26 | NACIONAL | 23:00 | 22:45 | Todos |
| 32 | FEDERAL | 20:00 | 19:50 | Sábado |
| 39 | NACIONAL | 02:00 | 01:51 | Todos |

### Seleção de Extrações no Momento da Aposta

#### Seleção Múltipla

O sistema permite selecionar **até 3 extrações** por aposta. Quando múltiplas extrações são selecionadas:

1. **Valor dividido**: O valor digitado é dividido igualmente entre as extrações selecionadas
2. **Apostas separadas**: Uma aposta individual é criada para cada extração
3. **Cálculo**: Se apostar R$ 6,00 em 3 extrações, cada aposta terá R$ 2,00

**Exemplo Prático**:
- Valor digitado: R$ 6,00
- Extrações selecionadas: PT RIO 09:20, PT RIO 11:20, PT RIO 14:20
- Resultado: 3 apostas de R$ 2,00 cada
- Cada aposta é independente e será liquidada separadamente

**Importante**: O valor digitado é sempre **por extração**. Se selecionar 3 extrações e digitar R$ 2,00:
- Valor total debitado: R$ 2,00 × 3 = R$ 6,00
- Cada aposta salva: R$ 2,00 (valor por extração)

#### Interface de Seleção

A interface mostra:
- **Agrupamento por estado**: Extrações organizadas por estado (RJ, SP, GO, etc.)
- **Status visual**: 
  - 🟢 **Aberta**: Pode selecionar
  - 🟡 **Fechando em X min**: Fecha em menos de 5 minutos (não pode selecionar)
  - ⚫ **Encerrada**: Já fechou (não pode selecionar)
- **Informações exibidas**:
  - Nome da extração
  - Horário de fechamento
  - Dias da semana com sorteio
  - ID da extração

#### Validações

1. **Horário de fechamento**: Não é possível apostar em extrações que já fecharam
2. **Limite de tempo**: Extrações que fecham em menos de 5 minutos não aparecem como disponíveis
3. **Dia da semana**: O sistema valida se há sorteio no dia selecionado antes de permitir a aposta
4. **Status ativo**: Apenas extrações marcadas como `active: true` podem ser selecionadas
5. **Limite de seleção**: Máximo de 3 extrações por aposta

#### Troca Automática

O sistema atualiza automaticamente a lista de extrações a cada 1 minuto:
- Remove extrações que já fecharam
- Adiciona novas extrações que abriram
- Atualiza status (Aberta → Fechando → Encerrada)

#### Comportamento com Apostas Instantâneas

Quando a opção "INSTANTANEA" está marcada:
- **Não é possível selecionar extrações**: A seleção de extrações fica desabilitada
- **Resultado gerado aleatoriamente**: O sistema gera um resultado instantâneo
- **Uma única aposta**: Apenas uma aposta é criada (não múltiplas)

### Horários de Fechamento vs Apuração

**Importante**: Existe diferença entre:
- **closeTime**: Horário quando o sistema para de aceitar apostas (horário interno)
- **realCloseTime**: Horário real de fechamento no site oficial (quando realmente fecha)
- **time**: Horário da extração (horário de exibição)
- **Horário de apuração**: 30 minutos após o `realCloseTime` (quando o sistema busca resultados)

**Exemplo PT RIO 09:20**:
- Fecha apostas às: **09:10** (realCloseTime)
- Busca resultados a partir de: **09:30** (30 minutos após realCloseTime)
- Apuração acontece: **09:20** (time - horário de exibição)

**Exemplo LOOK 11:20**:
- Fecha apostas às: **11:05** (realCloseTime)
- Busca resultados a partir de: **11:35** (30 minutos após)
- Apuração acontece: **11:20** (time)

### Fluxo Completo de Seleção de Extrações

#### Etapa 4: Seleção de Localização/Extrações

1. **Carregamento**: Sistema busca todas as extrações ativas da API
2. **Agrupamento**: Extrações são agrupadas por estado
3. **Filtragem**: Apenas extrações com mais de 5 minutos até fechamento aparecem como disponíveis
4. **Seleção**: Usuário pode selecionar até 3 extrações usando checkboxes
5. **Validação**: Sistema valida se extrações estão abertas antes de permitir confirmação

#### Comportamento Dinâmico

- **Atualização automática**: Lista atualiza a cada 1 minuto
- **Troca automática**: Se extração selecionada fechar, sistema pode sugerir próxima disponível
- **Status visual**: Cores indicam status (verde=aberta, amarelo=fechando, cinza=encerrada)

#### Cálculo com Múltiplas Extrações

**Fórmula**:
```
Valor por Extração = Valor Digitado
Valor Total Debitado = Valor Digitado × Qtd Extrações Selecionadas
Qtd Apostas Criadas = Qtd Extrações Selecionadas
```

**Exemplo Detalhado**:
- Modalidade: Grupo
- Grupos: 20, 21 (2 palpites)
- Valor digitado: R$ 4,00
- Divisão: "all"
- Posições: 1º-5º
- Extrações selecionadas: PT RIO 09:20, PT RIO 11:20, PT RIO 14:20 (3 extrações)

**Cálculo**:
1. Valor por palpite: R$ 4,00 / 2 = R$ 2,00
2. Valor por extração: R$ 2,00 (mesmo valor para cada palpite)
3. Total debitado: R$ 2,00 × 3 extrações = R$ 6,00
4. Apostas criadas: 3 extrações × 2 palpites = 6 apostas individuais
5. Cada aposta salva: R$ 2,00 (valor por extração)

---

## Apostas Instantâneas

### O que são Apostas Instantâneas?

Apostas instantâneas são apostas que têm resultado **imediatamente após serem registradas**, sem precisar esperar pela apuração oficial da extração.

### Como Funciona

1. **Seleção**: O usuário marca a opção "INSTANTANEA" na etapa 4 (Seleção de Localização)
2. **Geração de Resultado**: Ao confirmar a aposta, o sistema gera um resultado aleatório instantaneamente
3. **Conferência**: O sistema confere a aposta contra o resultado gerado
4. **Liquidação Imediata**: 
   - Se ganhou: Status = `liquidado`, prêmio creditado imediatamente
   - Se perdeu: Status = `perdida`
5. **Exibição**: Um modal mostra o resultado com animação

### Características

#### Vantagens
- ✅ Resultado imediato (não precisa esperar apuração)
- ✅ Prêmio creditado instantaneamente se ganhar
- ✅ Experiência mais dinâmica para o usuário

#### Limitações
- ❌ Não pode selecionar extração específica (resultado é gerado aleatoriamente)
- ❌ Não pode usar múltiplas extrações (apenas uma aposta instantânea)
- ❌ Não pode usar horários especiais
- ❌ Interface de seleção de extrações fica desabilitada quando marcada

### Processo Técnico

#### 1. Geração do Resultado

```javascript
// Gera 7 milhares aleatórios (0000-9999)
const resultadoInstantaneo = gerarResultadoInstantaneo(7)

// Exemplo de resultado:
{
  prizes: [1234, 5678, 9012, 3456, 7890, 2345, 6789],
  groups: [9, 17, 23, 9, 19, 8, 17]
}
```

#### 2. Conferência da Aposta

O sistema usa as mesmas regras de conferência das apostas normais:
- Modalidades de grupo: Verifica se grupos aparecem no resultado
- Modalidades de número: Verifica se números aparecem no resultado
- Posições: Respeita o intervalo selecionado (ex: 1º-5º)

#### 3. Cálculo do Prêmio

O cálculo é idêntico ao das apostas normais:
- Valor unitário × Multiplicador × Acertos
- Considera variações (para modalidades invertidas)
- Considera combinações (para Milhar/Centena)

#### 4. Atualização de Status

```javascript
// Se ganhou
status: 'liquidado'
// Prêmio creditado no saldo do usuário

// Se perdeu
status: 'perdida'
// Nenhum crédito
```

### Exemplo Completo

**Cenário**: Aposta instantânea em Grupo 20 (Peru), posições 1º-5º, R$ 2,00

1. **Usuário confirma aposta**
2. **Sistema gera resultado**:
   ```
   Prêmios: [7720, 8134, 5234, 1234, 4321, 9876, 1111]
   Grupos:  [20,   21,   8,    9,    6,    24,   3]
   ```
3. **Sistema confere**: Grupo 20 aparece no 1º prêmio ✅
4. **Cálculo do prêmio**:
   - Valor unitário: R$ 2,00 / 5 = R$ 0,40
   - Prêmio por unidade: R$ 0,40 × 18 = R$ 7,20
   - Prêmio total: 1 acerto × R$ 7,20 = R$ 7,20
5. **Status**: `liquidado`
6. **Saldo atualizado**: +R$ 7,20
7. **Modal exibido**: Mostra resultado e prêmio ganho

### Modal de Resultado Instantâneo

O modal exibe:
1. **Countdown**: 5 segundos de "Gerando números..."
2. **Revelação progressiva**: Números são revelados um a um (a cada 800ms)
3. **Resultado final**: Mostra todos os 7 prêmios
4. **Mensagem de prêmio**: 
   - Se ganhou: "Parabéns! Você ganhou: R$ X,XX"
   - Se perdeu: "Não houve prêmio desta vez"
5. **Botão fechar**: Fecha o modal e atualiza saldo

### Diferenças entre Aposta Normal e Instantânea

| Aspecto | Aposta Normal | Aposta Instantânea |
|---------|---------------|-------------------|
| Seleção de extração | Sim (até 3) | Não (gerada aleatoriamente) |
| Resultado | Aguarda apuração oficial | Gerado imediatamente |
| Status inicial | `pendente` | `liquidado` ou `perdida` |
| Tempo de liquidação | 30 min após fechamento | Imediato |
| Prêmio creditado | Após apuração | Imediatamente |
| Múltiplas extrações | Sim | Não |

### Validações Especiais

1. **Limites de descarga**: Aplicados normalmente (mesmas regras)
2. **Saldo insuficiente**: Bloqueia antes de gerar resultado
3. **Dia da semana**: Não aplicável (resultado é gerado)
4. **Horário de fechamento**: Não aplicável (não depende de extração real)

---

## Modalidades de Animais (Grupos)

### 1. Grupo (Simples)
**Descrição**: Aposta em 1 grupo (animal) específico.

**Regra de Vitória**: O grupo apostado deve aparecer em qualquer posição do intervalo selecionado.

**Exemplo**: 
- Aposta: Grupo 20 (Peru)
- Posições: 1º ao 5º
- Resultado: `[1234, 5678, 7890, 2345, 6789]` → Grupos: `[9, 17, 19, 8, 17]`
- Vitória: Se grupo 20 aparecer em qualquer posição de 1º a 5º

**Cálculo**:
- Valor por palpite: `valorDigitado / qtdPalpites` (se divisão "all")
- Unidades: `1 grupo × qtdPosicoes`
- Valor unitário: `valorPorPalpite / unidades`
- Multiplicador: **18x** (padrão)

**Posições disponíveis**: 1º, 1º-3º, 1º-5º, 1º-7º

---

### 2. Dupla de Grupo
**Descrição**: Aposta em 2 grupos diferentes que devem aparecer juntos.

**Regra de Vitória**: Ambos os grupos devem aparecer no intervalo de posições selecionado (não precisa ser na mesma posição).

**Exemplo**:
- Aposta: Grupos 20 e 21 (Peru e Touro)
- Posições: 1º ao 5º
- Resultado: Grupos `[9, 20, 19, 21, 17]`
- Vitória: ✅ Ambos aparecem (20 e 21)

**Cálculo**:
- Valor por palpite: `valorDigitado / qtdPalpites`
- Unidades: `1 combinação × qtdPosicoes`
- Valor unitário: `valorPorPalpite / unidades`
- Multiplicador: **180x**

**Posições disponíveis**: 1º, 1º-3º, 1º-5º, 1º-7º

---

### 3. Terno de Grupo
**Descrição**: Aposta em 3 grupos diferentes que devem aparecer juntos.

**Regra de Vitória**: Todos os 3 grupos devem aparecer no intervalo selecionado.

**Exemplo**:
- Aposta: Grupos 20, 21, 22
- Posições: 1º ao 5º
- Resultado: Grupos `[20, 21, 19, 22, 17]`
- Vitória: ✅ Todos os 3 aparecem

**Cálculo**:
- Valor por palpite: `valorDigitado / qtdPalpites`
- Unidades: `1 combinação × qtdPosicoes`
- Valor unitário: `valorPorPalpite / unidades`
- Multiplicador: **1800x**

**Posições disponíveis**: 1º, 1º-3º, 1º-5º, 1º-7º

---

### 4. Quadra de Grupo
**Descrição**: Aposta em 4 grupos diferentes que devem aparecer juntos.

**Regra de Vitória**: Todos os 4 grupos devem aparecer no intervalo selecionado.

**Cálculo**:
- Multiplicador: **5000x**

**Posições disponíveis**: 1º, 1º-3º, 1º-5º, 1º-7º

---

### 5. Quina de Grupo
**Descrição**: Aposta em 5 grupos diferentes que devem aparecer juntos.

**Regra de Vitória**: Todos os 5 grupos devem aparecer no intervalo selecionado.

**Cálculo**:
- Multiplicador: **5000x**

**Posições disponíveis**: 1º, 1º-3º, 1º-5º, 1º-7º

---

### 6. Terno de Grupo Seco
**Descrição**: Similar ao Terno de Grupo, mas com multiplicador diferente.

**Regra de Vitória**: Todos os 3 grupos devem aparecer no intervalo selecionado (válido do 1º ao 5º prêmio).

**Cálculo**:
- Multiplicador: **150x**

**Posições disponíveis**: 1º, 1º-3º, 1º-5º

---

## Modalidades de Números

### 1. Dezena
**Descrição**: Aposta nos últimos 2 dígitos de um milhar.

**Regra de Vitória**: A dezena apostada deve aparecer nos últimos 2 dígitos de qualquer milhar no intervalo selecionado.

**Exemplo**:
- Aposta: Dezena `34`
- Posições: 1º ao 5º
- Resultado: `[1234, 5634, 7890, 2345, 0034]`
- Vitória: ✅ Dezena 34 aparece em 3 posições (1º, 2º, 5º)

**Cálculo**:
- Valor por palpite: `valorDigitado / qtdPalpites`
- Unidades: `1 dezena × qtdPosicoes`
- Valor unitário: `valorPorPalpite / unidades`
- Multiplicador: **60x**

**Posições disponíveis**: 1º, 1º-3º, 1º-5º, 1º-7º

---

### 2. Centena
**Descrição**: Aposta nos últimos 3 dígitos de um milhar.

**Regra de Vitória**: A centena apostada deve aparecer nos últimos 3 dígitos de qualquer milhar no intervalo selecionado.

**Exemplo**:
- Aposta: Centena `234`
- Resultado: `[1234, 5234, 7890, 2345, 0034]`
- Vitória: ✅ Centena 234 aparece em 2 posições (1º, 2º)

**Cálculo**:
- Multiplicador: **600x**
- **Redução de 1/6**: Se a centena estiver "cotada" (especial), o prêmio é dividido por 6

**Posições disponíveis**: 1º, 1º-3º, 1º-5º, 1º-7º

---

### 3. Milhar
**Descrição**: Aposta em um milhar completo (4 dígitos).

**Regra de Vitória**: O milhar apostado deve aparecer exatamente em qualquer posição do intervalo selecionado.

**Exemplo**:
- Aposta: Milhar `1234`
- Resultado: `[1234, 5678, 7890, 2345, 6789]`
- Vitória: ✅ Milhar 1234 aparece no 1º prêmio

**Cálculo**:
- Multiplicador: **5000x**
- **Redução de 1/6**: Se o milhar estiver "cotado" (especial), o prêmio é dividido por 6

**Posições disponíveis**: 1º, 1º-3º, 1º-5º

---

### 4. Dezena Invertida
**Descrição**: Aposta em uma dezena que pode aparecer em qualquer ordem (permutações).

**Regra de Vitória**: Qualquer permutação da dezena apostada deve aparecer nos últimos 2 dígitos.

**Exemplo**:
- Aposta: Dezena `34`
- Permutações: `34`, `43` (2 variações)
- Resultado: `[1234, 5643, 7890, 2345, 0034]`
- Vitória: ✅ Ambas as variações aparecem (34 no 1º e 5º, 43 no 2º)

**Cálculo**:
- **Quantidade de variações**: Calculada automaticamente (ex: `34` = 2 variações, `11` = 1 variação)
- Valor por palpite: `valorDigitado / qtdPalpites`
- **Valor por variação**: `valorPorPalpite / qtdVariacoes` (cada variação é tratada como um palpite separado)
- Unidades: `qtdVariacoes × qtdPosicoes`
- Valor unitário: `(valorPorPalpite / qtdVariacoes) / qtdPosicoes`
- Multiplicador: **60x** (aplicado por variação)

**Exemplo de cálculo**:
- Aposta: Dezena `34` (2 variações), R$ 2,00, posições 1º-5º
- Valor por variação: R$ 2,00 / 2 = R$ 1,00
- Unidades: 2 × 5 = 10
- Valor unitário: R$ 1,00 / 5 = R$ 0,20
- Se acertar ambas: 2 acertos × R$ 0,20 × 60 = R$ 24,00

**Posições disponíveis**: 1º, 1º-3º, 1º-5º, 1º-7º

---

### 5. Centena Invertida
**Descrição**: Aposta em uma centena que pode aparecer em qualquer ordem (permutações).

**Regra de Vitória**: Qualquer permutação da centena apostada deve aparecer nos últimos 3 dígitos.

**Exemplo**:
- Aposta: Centena `234`
- Permutações: `234`, `243`, `324`, `342`, `423`, `432` (6 variações se todos dígitos diferentes)
- Se tiver dígitos repetidos: `112` → `112`, `121`, `211` (3 variações)

**Cálculo**:
- Quantidade de variações: Calculada automaticamente
- Valor por variação: `valorPorPalpite / qtdVariacoes`
- Multiplicador: **600x**

**Posições disponíveis**: 1º, 1º-3º, 1º-5º, 1º-7º

---

### 6. Milhar Invertida
**Descrição**: Aposta em um milhar que pode aparecer em qualquer ordem (permutações).

**Regra de Vitória**: Qualquer permutação do milhar apostado deve aparecer exatamente.

**Exemplo**:
- Aposta: Milhar `1234`
- Permutações: 24 variações (se todos dígitos diferentes)
- Se tiver dígitos repetidos: `1123` → 12 variações

**Cálculo**:
- Quantidade de variações: Calculada automaticamente
- Valor por variação: `valorPorPalpite / qtdVariacoes`
- Multiplicador: **200x**

**Posições disponíveis**: 1º, 1º-3º, 1º-5º

---

### 7. Milhar/Centena
**Descrição**: Aposta que vale tanto como milhar quanto como centena.

**Regra de Vitória**: O número apostado pode ganhar como milhar completo OU como centena (últimos 3 dígitos).

**Exemplo**:
- Aposta: `1234`
- Combinações: `1234` (milhar) e `234` (centena) = 2 combinações
- Resultado: `[1234, 5678, 5234, 2345, 6789]`
- Vitória: ✅ Acertou como milhar no 1º prêmio E como centena no 3º prêmio

**Cálculo**:
- **Combinações**: Sempre 2 (milhar + centena)
- Valor por combinação: `valorPorPalpite / 2`
- Unidades: `2 combinações × qtdPosicoes`
- Valor unitário: `(valorPorPalpite / 2) / qtdPosicoes`
- Multiplicador: **3300x** (aplicado por combinação que acertar)

**Exemplo de cálculo**:
- Aposta: `1234`, R$ 2,00, posições 1º-5º
- Valor por combinação: R$ 2,00 / 2 = R$ 1,00
- Unidades: 2 × 5 = 10
- Valor unitário: R$ 1,00 / 5 = R$ 0,20
- Se acertar ambas: 2 acertos × R$ 0,20 × 3300 = R$ 1.320,00

**Posições disponíveis**: 1º, 1º-3º, 1º-5º

---

### 8. Duque de Dezena
**Descrição**: Aposta em 2 dezenas diferentes que devem aparecer nos resultados.

**Regra de Vitória**: Ambas as dezenas devem aparecer nos últimos 2 dígitos de diferentes milhares no intervalo selecionado.

**Exemplo**:
- Aposta: Dezenas `34` e `56`
- Resultado: `[1234, 5656, 7890, 2345, 0056]`
- Vitória: ✅ Ambas aparecem (34 no 1º, 56 no 2º e 5º)

**Cálculo**:
- Multiplicador: **300x**

**Posições disponíveis**: 1º, 1º-3º, 1º-5º, 1º-7º

---

### 9. Terno de Dezena
**Descrição**: Aposta em 3 dezenas diferentes que devem aparecer nos resultados.

**Regra de Vitória**: Todas as 3 dezenas devem aparecer nos últimos 2 dígitos de diferentes milhares.

**Cálculo**:
- Multiplicador: **5000x**

**Posições disponíveis**: 1º, 1º-3º, 1º-5º, 1º-7º

---

### 10. Quadra de Dezena
**Descrição**: Aposta em 4 dezenas diferentes que devem aparecer nos resultados.

**Regra de Vitória**: Todas as 4 dezenas devem aparecer nos últimos 2 dígitos de diferentes milhares.

**Cálculo**:
- Multiplicador: **300x**

**Posições disponíveis**: 1º, 1º-3º, 1º-5º, 1º-7º

---

### 11. Duque de Dezena (EMD)
**Descrição**: Aposta em 1 dezena que pode aparecer como Esquerda, Meio ou Direita de um milhar.

**Regra de Vitória**: A dezena apostada deve aparecer em qualquer uma das 3 posições EMD de qualquer milhar no intervalo.

**Explicação EMD**:
- Milhar `1234` → Esquerda: `12`, Meio: `23`, Direita: `34`
- Se apostar dezena `23`, ganha se aparecer em qualquer uma dessas 3 posições

**Exemplo**:
- Aposta: Dezena `23`
- Resultado: `[1234, 5623, 7890, 2345, 0023]`
- Vitória: ✅ Dezena 23 aparece como Meio no 1º prêmio, como Direita no 2º prêmio, e como Esquerda no 4º prêmio

**Cálculo**:
- Multiplicador: **300x**

**Posições disponíveis**: 1º, 1º-3º, 1º-5º, 1º-7º

---

### 12. Terno de Dezena (EMD)
**Descrição**: Aposta em 3 dezenas diferentes que devem aparecer usando EMD.

**Regra de Vitória**: Todas as 3 dezenas devem aparecer nas posições EMD de diferentes milhares.

**Cálculo**:
- Multiplicador: **5000x**

**Posições disponíveis**: 1º, 1º-3º, 1º-5º, 1º-7º

---

### 13. Dezeninha
**Descrição**: Aposta em 3 a 20 dezenas diferentes que devem aparecer todas nos resultados.

**Regra de Vitória**: Todas as dezenas apostadas devem aparecer nos últimos 2 dígitos de diferentes milhares.

**Cálculo**:
- Multiplicador varia conforme quantidade de dezenas:
  - **3 dezenas**: 15x
  - **4 dezenas**: 150x
  - **5 dezenas**: 1500x
  - **6+ dezenas**: 1500x (mantém)

**Posições disponíveis**: 1º, 1º-3º, 1º-5º, 1º-7º

---

## Modalidades Especiais

### 1. Passe Vai
**Descrição**: Aposta que o grupo do 1º prêmio vai para o 2º prêmio.

**Regra de Vitória**: O grupo do 1º prêmio deve ser igual ao grupo do 2º prêmio.

**Exemplo**:
- Aposta: Grupos 20 → 20 (Peru vai para Peru)
- Resultado: `[7720, 7734]` → Grupos: `[20, 20]`
- Vitória: ✅ Grupo 20 do 1º vai para o 2º

**Cálculo**:
- Posições fixas: **1º-2º** (não pode escolher)
- Multiplicador: **300x**

---

### 2. Passe Vai e Vem
**Descrição**: Aposta que o grupo do 1º prêmio vai para o 2º OU o grupo do 2º vai para o 1º.

**Regra de Vitória**: Os grupos do 1º e 2º prêmios devem ser iguais (em qualquer ordem).

**Exemplo**:
- Aposta: Grupos 20 e 21 (qualquer ordem)
- Resultado: `[7720, 8134]` → Grupos: `[20, 21]`
- Vitória: ❌ Grupos diferentes
- Resultado: `[7720, 7734]` → Grupos: `[20, 20]`
- Vitória: ✅ Grupos iguais

**Cálculo**:
- Posições fixas: **1º-2º**
- Multiplicador: **150x**

---

## Cálculo de Prêmios

### Fórmula Geral

```
Valor por Palpite = Valor Digitado / Qtd Palpites (se divisão "all")
                   OU
                   Valor Digitado (se divisão "each")

Valor por Variação/Combinação = Valor por Palpite / Qtd Variações

Unidades = Qtd Variações × Qtd Posições

Valor Unitário = Valor por Variação / Qtd Posições

Prêmio por Unidade = Valor Unitário × Multiplicador

Prêmio Total = Acertos × Prêmio por Unidade
```

### Exemplo Completo: Milhar Invertida

**Dados**:
- Modalidade: Milhar Invertida
- Número apostado: `1234` (24 variações)
- Valor digitado: R$ 2,00
- Divisão: "all"
- Qtd palpites: 1
- Posições: 1º ao 5º
- Multiplicador: 200x

**Cálculo**:
1. Valor por palpite: R$ 2,00 / 1 = R$ 2,00
2. Valor por variação: R$ 2,00 / 24 = R$ 0,0833...
3. Unidades: 24 × 5 = 120
4. Valor unitário: R$ 0,0833... / 5 = R$ 0,0166...
5. Se acertar 3 variações:
   - Prêmio por unidade: R$ 0,0166... × 200 = R$ 3,33...
   - Prêmio total: 3 acertos × R$ 3,33... = R$ 10,00

### Exemplo: Grupo com Múltiplos Palpites

**Dados**:
- Modalidade: Grupo
- Grupos apostados: 20, 21, 22 (3 palpites)
- Valor digitado: R$ 6,00
- Divisão: "all"
- Posições: 1º ao 5º
- Multiplicador: 18x

**Cálculo**:
1. Valor por palpite: R$ 6,00 / 3 = R$ 2,00
2. Para cada palpite:
   - Unidades: 1 × 5 = 5
   - Valor unitário: R$ 2,00 / 5 = R$ 0,40
   - Prêmio por unidade: R$ 0,40 × 18 = R$ 7,20
3. Se acertar grupo 20 e 21:
   - Prêmio total: 2 acertos × R$ 7,20 = R$ 14,40

---

## Liquidação de Apostas

### Processo de Liquidação

1. **Busca de Resultados**: Sistema busca resultados da API externa (PosteNoBicho)
2. **Filtragem**: Apenas apostas pendentes da loteria/extração correspondente
3. **Conferência**: Para cada aposta, verifica se ganhou ou perdeu
4. **Atualização**: Atualiza status da aposta e saldo do usuário

### Horários de Apuração

O sistema busca resultados **30 minutos após o horário de fechamento**:
- **PT RIO 09:10** → Busca a partir de **09:30**
- **PT RIO 11:10** → Busca a partir de **11:30**
- **PT RIO 14:10** → Busca a partir de **14:30**
- **PT RIO 16:10** → Busca a partir de **16:30**
- **PT RIO 18:10** → Busca a partir de **18:30**
- **PT RIO 21:10** → Busca a partir de **21:30**
- **Federal 18:00** → Busca a partir de **18:30**

**Verificação**: A cada 5 minutos durante horários ativos (9h-22h)

### Validações na Liquidação

1. **Dia da Semana**: Verifica se há sorteio no dia da semana
2. **Horário**: Verifica se já passou o horário de apuração
3. **Resultado Disponível**: Verifica se o resultado foi encontrado na API
4. **Matching**: Compara aposta com resultado usando regras específicas da modalidade

### Status das Apostas

- **pendente**: Aguardando apuração
- **liquidado**: Ganhou e foi creditado
- **perdida**: Não ganhou
- **cancelada**: Cancelada pelo sistema

---

## Formato JSON para Testes

### Estrutura Completa

#### Aposta Normal com Extração Específica

```json
{
  "apostas": [
    {
      "usuarioId": 1,
      "concurso": "12345",
      "loteria": "PT RIO",
      "estado": "RJ",
      "horario": "14",
      "dataConcurso": "2026-01-24T14:00:00.000Z",
      "modalidade": "Grupo",
      "aposta": "20",
      "valor": 2.00,
      "retornoPrevisto": 36.00,
      "status": "pendente",
      "detalhes": {
        "betData": {
          "modalityName": "Grupo",
          "modality": 1,
          "animalBets": ["20"],
          "numberBets": [],
          "position": "1-5",
          "amount": 2.00,
          "divisionType": "all",
          "qtdExtracoes": 1,
          "extracao": "PT RIO",
          "horario": "14",
          "dataConcurso": "2026-01-24",
          "instant": false,
          "selectedExtracoes": ["16"]
        },
        "qtdPalpites": 1,
        "qtdPosicoes": 5
      }
    }
  ],
  "resultadoEsperado": {
    "dataConcurso": "2026-01-24",
    "horario": "14",
    "loteria": "PT RIO",
    "premios": [
      {
        "posicao": 1,
        "milhar": "7720",
        "grupo": "20",
        "animal": "Peru"
      },
      {
        "posicao": 2,
        "milhar": "8134",
        "grupo": "21",
        "animal": "Touro"
      },
      {
        "posicao": 3,
        "milhar": "5234",
        "grupo": "8",
        "animal": "Camelo"
      },
      {
        "posicao": 4,
        "milhar": "1234",
        "grupo": "9",
        "animal": "Cobra"
      },
      {
        "posicao": 5,
        "milhar": "4321",
        "grupo": "6",
        "animal": "Cabra"
      }
    ]
  }
}
```

#### Aposta com Múltiplas Extrações

```json
{
  "apostas": [
    {
      "usuarioId": 1,
      "loteria": "PT RIO",
      "estado": "RJ",
      "horario": "09",
      "dataConcurso": "2026-01-24T09:00:00.000Z",
      "modalidade": "Grupo",
      "aposta": "20",
      "valor": 2.00,
      "status": "pendente",
      "detalhes": {
        "betData": {
          "modalityName": "Grupo",
          "modality": 1,
          "animalBets": ["20"],
          "numberBets": [],
          "position": "1-5",
          "amount": 2.00,
          "divisionType": "all",
          "qtdExtracoes": 3,
          "instant": false,
          "selectedExtracoes": ["37", "15", "16"]
        },
        "qtdPalpites": 1,
        "qtdPosicoes": 5
      }
    }
  ],
  "resultadoEsperado": {
    "extracoes": [
      {
        "id": "37",
        "loteria": "PT RIO",
        "horario": "09",
        "dataConcurso": "2026-01-24",
        "premios": [
          {"posicao": 1, "milhar": "7720", "grupo": "20"},
          {"posicao": 2, "milhar": "8134", "grupo": "21"}
        ]
      },
      {
        "id": "15",
        "loteria": "PT RIO",
        "horario": "11",
        "dataConcurso": "2026-01-24",
        "premios": [
          {"posicao": 1, "milhar": "1234", "grupo": "9"},
          {"posicao": 2, "milhar": "5678", "grupo": "17"}
        ]
      },
      {
        "id": "16",
        "loteria": "PT RIO",
        "horario": "14",
        "dataConcurso": "2026-01-24",
        "premios": [
          {"posicao": 1, "milhar": "9999", "grupo": "25"},
          {"posicao": 2, "milhar": "0000", "grupo": "25"}
        ]
      }
    ]
  }
}
```

#### Aposta Instantânea

```json
{
  "apostas": [
    {
      "usuarioId": 1,
      "modalidade": "Grupo",
      "aposta": "20",
      "valor": 2.00,
      "status": "liquidado",
      "detalhes": {
        "betData": {
          "modalityName": "Grupo",
          "modality": 1,
          "animalBets": ["20"],
          "numberBets": [],
          "position": "1-5",
          "amount": 2.00,
          "divisionType": "all",
          "instant": true
        },
        "qtdPalpites": 1,
        "qtdPosicoes": 5,
        "resultadoInstantaneo": {
          "prizes": [7720, 8134, 5234, 1234, 4321, 9876, 1111],
          "groups": [20, 21, 8, 9, 6, 24, 3]
        },
        "premioTotal": 7.20
      }
    }
  ],
  "resultadoEsperado": {
    "tipo": "instantaneo",
    "premioTotal": 7.20,
    "status": "liquidado"
  }
}
```

### Campos Obrigatórios

#### Para Apostas Normais
- `loteria`: Nome da loteria (ex: "PT RIO", "LOOK", "NACIONAL", "FEDERAL")
- `horario`: Horário da extração (ex: "09", "11", "14", "16", "18", "21")
- `dataConcurso`: Data em formato ISO (YYYY-MM-DDTHH:mm:ss.sssZ)
- `modalidade`: Nome da modalidade (ex: "Grupo", "Milhar", "Dezena Invertida")
- `aposta`: Número ou grupo apostado (string)
- `valor`: Valor apostado por extração (número)
- `detalhes.betData.modalityName`: Nome da modalidade
- `detalhes.betData.position`: Intervalo de posições (ex: "1-5")
- `detalhes.betData.amount`: Valor por extração
- `detalhes.betData.divisionType`: "all" ou "each"
- `detalhes.betData.selectedExtracoes`: Array de IDs das extrações selecionadas (ex: ["37", "15", "16"])
- `detalhes.betData.instant`: `false` para apostas normais

#### Para Apostas Instantâneas
- `modalidade`: Nome da modalidade
- `aposta`: Número ou grupo apostado
- `valor`: Valor apostado
- `detalhes.betData.instant`: `true`
- `detalhes.resultadoInstantaneo`: Objeto com `prizes` e `groups` (gerado pelo sistema)
- `status`: `liquidado` (se ganhou) ou `perdida` (se perdeu)

### Campos Opcionais

- `usuarioId`: ID do usuário (pode ser fictício para teste)
- `concurso`: Número do concurso
- `estado`: Estado da loteria (ex: "RJ", "SP", "GO", "BR")
- `retornoPrevisto`: Valor esperado de retorno
- `detalhes.betData.qtdExtracoes`: Quantidade de extrações selecionadas
- `detalhes.premioTotal`: Prêmio total ganho (para apostas instantâneas ou já liquidadas)

### IDs de Extrações Comuns

| ID | Nome | Estado | Horário |
|----|------|--------|---------|
| 37 | PT RIO | RJ | 09:20 |
| 15 | PT RIO | RJ | 11:20 |
| 16 | PT RIO | RJ | 14:20 |
| 17 | PT RIO | RJ | 16:20 |
| 18 | PT RIO | RJ | 18:20 |
| 19 | PT RIO | RJ | 21:20 |
| 32 | FEDERAL | BR | 20:00 |
| 8 | LOOK | GO | 11:20 |
| 9 | LOOK | GO | 14:20 |
| 10 | LOOK | GO | 16:20 |
| 11 | LOOK | GO | 18:20 |
| 12 | LOOK | GO | 21:20 |
| 42 | PT SP | SP | 10:00 |
| 43 | PT SP | SP | 13:15 |
| 20 | NACIONAL | BR | 08:00 |
| 21 | NACIONAL | BR | 10:00 |
| 22 | NACIONAL | BR | 12:00 |
| 23 | NACIONAL | BR | 15:00 |
| 24 | NACIONAL | BR | 17:00 |
| 25 | NACIONAL | BR | 21:00 |
| 26 | NACIONAL | BR | 23:00 |

---

## Tabela Resumo de Multiplicadores

| Modalidade | Multiplicador | Posições | Tipo |
|------------|---------------|----------|------|
| Grupo | 18x | 1º, 1º-3º, 1º-5º, 1º-7º | Animal |
| Dupla de Grupo | 180x | 1º, 1º-3º, 1º-5º, 1º-7º | Animal |
| Terno de Grupo | 1800x | 1º, 1º-3º, 1º-5º, 1º-7º | Animal |
| Quadra de Grupo | 5000x | 1º, 1º-3º, 1º-5º, 1º-7º | Animal |
| Quina de Grupo | 5000x | 1º, 1º-3º, 1º-5º, 1º-7º | Animal |
| Terno de Grupo Seco | 150x | 1º, 1º-3º, 1º-5º | Animal |
| Dezena | 60x | 1º, 1º-3º, 1º-5º, 1º-7º | Número |
| Centena | 600x | 1º, 1º-3º, 1º-5º, 1º-7º | Número |
| Milhar | 5000x | 1º, 1º-3º, 1º-5º | Número |
| Dezena Invertida | 60x | 1º, 1º-3º, 1º-5º, 1º-7º | Número |
| Centena Invertida | 600x | 1º, 1º-3º, 1º-5º, 1º-7º | Número |
| Milhar Invertida | 200x | 1º, 1º-3º, 1º-5º | Número |
| Milhar/Centena | 3300x | 1º, 1º-3º, 1º-5º | Número |
| Duque de Dezena | 300x | 1º, 1º-3º, 1º-5º, 1º-7º | Número |
| Terno de Dezena | 5000x | 1º, 1º-3º, 1º-5º, 1º-7º | Número |
| Quadra de Dezena | 300x | 1º, 1º-3º, 1º-5º, 1º-7º | Número |
| Duque de Dezena (EMD) | 300x | 1º, 1º-3º, 1º-5º, 1º-7º | Número |
| Terno de Dezena (EMD) | 5000x | 1º, 1º-3º, 1º-5º, 1º-7º | Número |
| Dezeninha | 15x-1500x* | 1º, 1º-3º, 1º-5º, 1º-7º | Número |
| Passe Vai | 300x | 1º-2º (fixo) | Especial |
| Passe Vai e Vem | 150x | 1º-2º (fixo) | Especial |

\* Dezeninha: 3 dezenas = 15x, 4 dezenas = 150x, 5+ dezenas = 1500x

---

## Observações Importantes

1. **Valor por Extração**: O valor digitado pelo usuário é sempre **por extração**. Se selecionar 3 extrações, o valor total debitado é `valor × 3`.

2. **Divisão "all" vs "each"**:
   - **all**: Valor é dividido entre todos os palpites
   - **each**: Cada palpite tem o valor completo

3. **Modalidades Invertidas**: Cada variação é tratada como um palpite separado. O valor é dividido pelo número de variações antes de calcular o prêmio.

4. **Milhar/Centena**: Sempre gera 2 combinações (milhar + centena). O valor é dividido por 2.

5. **Redução de 1/6**: Aplicada apenas para Milhar e Centena quando estão "cotadas" (especiais).

6. **Horários de Apuração**: O sistema busca resultados 30 minutos após o fechamento e verifica a cada 5 minutos.

7. **Validação de Dias**: Algumas extrações não têm sorteio em certos dias da semana. O sistema valida isso antes de permitir apostas e liquidações.

---

---

## Resumo Executivo

### Tipos de Apostas

1. **Apostas Normais**: Aguardam apuração oficial da extração selecionada
   - Podem selecionar até 3 extrações
   - Valor é dividido entre as extrações selecionadas
   - Status inicial: `pendente`
   - Liquidação: 30 minutos após fechamento da extração

2. **Apostas Instantâneas**: Resultado imediato após registro
   - Não seleciona extração específica
   - Resultado gerado aleatoriamente
   - Status: `liquidado` (se ganhou) ou `perdida` (se perdeu)
   - Prêmio creditado imediatamente

### Extrações Disponíveis

O sistema suporta **46 extrações** de diferentes estados:
- **Rio de Janeiro (RJ)**: 6 extrações PT RIO
- **São Paulo (SP)**: 5 extrações PT SP
- **Goiás (GO)**: 8 extrações LOOK
- **Ceará (CE)**: 4 extrações LOTECE
- **Paraíba (PB)**: 4 extrações LOTEP
- **Bahia (BA)**: 5 extrações PT BAHIA
- **Nacional (BR)**: 14 extrações (NACIONAL, PARA TODOS, FEDERAL)

### Modalidades Suportadas

- **21 modalidades** no total
- **6 modalidades de grupo** (animais)
- **13 modalidades de número** (incluindo invertidas)
- **2 modalidades especiais** (Passe)

### Cálculo de Prêmios

**Fórmula base**:
```
Prêmio = (Valor Unitário × Multiplicador) × Acertos
```

**Considerações especiais**:
- Modalidades invertidas: Valor dividido pelo número de variações
- Milhar/Centena: Valor dividido por 2 (milhar + centena)
- Múltiplas extrações: Valor dividido entre extrações
- Múltiplos palpites: Valor dividido entre palpites (se divisão "all")

### Processo de Liquidação

1. **Busca de resultados**: 30 minutos após fechamento
2. **Verificação**: A cada 5 minutos durante horários ativos
3. **Conferência**: Usa regras específicas de cada modalidade
4. **Atualização**: Status e saldo atualizados automaticamente

---

**Última atualização**: 24/01/2026
