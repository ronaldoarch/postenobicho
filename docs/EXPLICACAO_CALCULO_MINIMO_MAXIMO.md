# 📊 Explicação do Cálculo de Retorno Mínimo e Máximo

## 🎯 Caso da Aposta da Imagem

**Dados da Aposta:**
- Valor apostado: **R$ 2,00**
- Modalidade: **Grupo**
- Palpites: **3 grupos** (Burro=03, Cobra=09, Pavão=19)
- Posições: **1º ao 7º** (7 prêmios)
- Divisão: **Total dividido** (não "para cada")

---

## 📐 Passo a Passo do Cálculo

### 1️⃣ **Valor por Palpite**

Como a divisão é "Total dividido" (`all`), o valor é dividido igualmente entre os 3 grupos:

```
Valor por palpite = Valor total ÷ Quantidade de palpites
Valor por palpite = R$ 2,00 ÷ 3
Valor por palpite = R$ 0,6667
```

**Explicação:** Cada um dos 3 grupos recebe R$ 0,6667 do valor total apostado.

---

### 2️⃣ **Unidades da Aposta**

Para modalidade **Grupo**, o cálculo de unidades é:

```
Combinações = 1 (grupo simples não tem combinações)
Posições = 7 (do 1º ao 7º prêmio)
Unidades = Combinações × Posições
Unidades = 1 × 7 = 7 unidades
```

**Explicação:** Cada grupo está apostado em 7 posições diferentes (1º, 2º, 3º, 4º, 5º, 6º e 7º prêmio).

---

### 3️⃣ **Valor Unitário**

O valor por palpite é dividido igualmente entre todas as unidades:

```
Valor unitário = Valor por palpite ÷ Unidades
Valor unitário = R$ 0,6667 ÷ 7
Valor unitário = R$ 0,0952
```

**Explicação:** Cada unidade (cada grupo em cada posição) recebe R$ 0,0952.

---

### 4️⃣ **Prêmio por Unidade**

A odd para **Grupo** nas posições 1-7 é **18x** (multiplicador fixo):

```
Prêmio por unidade = Odd × Valor unitário
Prêmio por unidade = 18 × R$ 0,0952
Prêmio por unidade = R$ 1,714
```

**Explicação:** Se um grupo acertar em uma posição, ganha R$ 1,714.

---

### 5️⃣ **Retorno Mínimo (por Palpite)**

O retorno mínimo ocorre quando o grupo acerta em **apenas 1 posição**:

```
Retorno mínimo = Prêmio por unidade × 1 posição
Retorno mínimo = R$ 1,714 × 1
Retorno mínimo = R$ 1,71 (arredondado)
```

**Explicação:** Se o grupo acertar em apenas 1 das 7 posições, o retorno é R$ 1,71.

---

### 6️⃣ **Retorno Máximo (por Palpite)**

O retorno máximo ocorre quando o grupo acerta em **todas as 7 posições**:

```
Retorno máximo = Prêmio por unidade × 7 posições
Retorno máximo = R$ 1,714 × 7
Retorno máximo = R$ 11,998 ≈ R$ 12,00 (arredondado)
```

**Explicação:** Se o grupo acertar em todas as 7 posições, o retorno é R$ 12,00.

---

## ❓ Resposta à Pergunta do Cliente

### **"Caso não tivesse mínimo e máximo, o previsto seria R$ 1,94?"**

**Resposta:** Não exatamente. O valor de **R$ 1,94** que você calculou está baseado em uma **odd de 20x**, mas o sistema usa **odd de 18x** para Grupo nas posições 1-7.

**Seu cálculo (assumindo odd = 20x):**
```
R$ 2,00 ÷ 3 grupos = R$ 0,6667 por grupo
R$ 0,6667 ÷ 7 prêmios = R$ 0,0952 por grupo por prêmio
Cada acerto paga: R$ 0,0952 × 20 = R$ 1,904 ≈ R$ 1,94 ✅
```

**Cálculo do sistema (odd = 18x):**
```
R$ 2,00 ÷ 3 grupos = R$ 0,6667 por grupo
R$ 0,6667 ÷ 7 prêmios = R$ 0,0952 por grupo por prêmio
Cada acerto paga: R$ 0,0952 × 18 = R$ 1,714 ≈ R$ 1,71 ✅
```

**Conclusão:** Se não houvesse mínimo e máximo, o valor previsto seria **R$ 1,71** (usando a odd de 18x do sistema), não R$ 1,94.

---

## 📋 Resumo para o Cliente Responder

**Como chegamos no valor mínimo e máximo:**

1. **Valor mínimo (R$ 1,71):** Representa o retorno quando o grupo acerta em **apenas 1 posição** das 7 apostadas.
   - Cálculo: R$ 2,00 ÷ 3 grupos ÷ 7 posições × 18 (odd) × 1 posição = **R$ 1,71**

2. **Valor máximo (R$ 12,00):** Representa o retorno quando o grupo acerta em **todas as 7 posições**.
   - Cálculo: R$ 2,00 ÷ 3 grupos ÷ 7 posições × 18 (odd) × 7 posições = **R$ 12,00**

3. **Por que mostramos mínimo e máximo?**
   - Porque cada grupo pode acertar em **1 até 7 posições**, e o prêmio varia conforme a quantidade de acertos.
   - O mínimo mostra o cenário mais conservador (1 acerto).
   - O máximo mostra o cenário ideal (todos os acertos).

**Sobre o valor R$ 1,94:**
- Esse valor seria correto se a odd fosse 20x, mas o sistema usa **18x** para Grupo nas posições 1-7.
- Com a odd de 18x, o valor previsto (sem mínimo/máximo) seria **R$ 1,71**, que corresponde ao mínimo exibido.

---

## 🔍 Observação Importante

A odd pode ser alterada pelo administrador no painel. Se a odd for modificada no banco de dados, o cálculo usará a odd configurada, não a padrão (18x).
