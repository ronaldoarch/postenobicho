# Análise Profunda do Site pontodobicho.com

## Fluxo de Apostas - Etapas Identificadas

### Etapa 1: Seleção de Modalidade
- **URL**: `https://pontodobicho.com/jogo-do-bicho`
- **Componentes**:
  - Tabs: "Bicho" e "Loteria"
  - Botão "📊 Cotações Especiais" - abre modal
  - Botão "Continuar" para avançar

**Modal "Cotações Especiais por Loteria"**:
- Título: "Cotações Especiais por Loteria"
- Categoria ativa: "Milhar"
- Lista de horários especiais:
  - PONTO-NOITE 18h: 1x R$ 7000.00
  - PONTO-MEIO-DIA 12h: 1x R$ 7000.00
  - PONTO-TARDE 15h: 1x R$ 7000.00
  - PONTO-CORUJA 22h: 1x R$ 7000.00
  - PONTO-MADRUGADA: 1x R$ (cortado)

### Etapa 2: Seleção de Animais
- **Progresso**: Indicador visual com 5 etapas (1, 2, 3, 4, 5)
- **Etapa atual**: 2 (1 e 2 destacados em azul)
- **Título**: "Animais:"
- **Instrução**: "Escolha os animais."

**Lista Completa de Animais Disponíveis**:
1. avestruz (Grupo 1)
2. aguia (Grupo 2)
3. burro (Grupo 3)
4. borboleta (Grupo 4)
5. cachorro (Grupo 5)
6. cabra (Grupo 6)
7. carneiro (Grupo 7)
8. camelo (Grupo 8)
9. cobra (Grupo 9)
10. coelho (Grupo 10)
11. cavalo (Grupo 11)
12. elefante (Grupo 12)
13. galo (Grupo 13)
14. gato (Grupo 14)
15. jacare (Grupo 15)
16. leao (Grupo 16)
17. macaco (Grupo 17)
18. porco (Grupo 18)
19. pavao (Grupo 19)
20. peru (Grupo 20)
21. touro (Grupo 21)
22. tigre (Grupo 22)
23. urso (Grupo 23)
24. veado (Grupo 24)
25. vaca (Grupo 25)

- Total: **25 animais/grupos** no sistema
- Cada animal é um botão clicável
- Botões "Voltar" e "Continuar" disponíveis

### Etapa 3: Posição, Quantia e Divisão
- **Título**: "Posição, quantia e divisão:"
- **Componentes**:

**1. Seleção de Posição ("Selecione a posição:")**:
- Radio buttons:
  - 1º Prêmio
  - 1º ao 3º
  - 1º ao 5º
  - 1º ao 7º
  - Personalizado (checkbox)

**2. Quantia (Valor da aposta)**:
- Botão "-" para diminuir (R$ 0,50)
- Campo de input com valor: R$ 2,00 (padrão)
- Botão "+" para aumentar (R$ 0,50)
- Incremento: R$ 0,50

**3. Divisão (Tipo de divisão)**:
- Radio buttons:
  - "Para todo o palpite" (valor aplicado para todos os palpites)
  - "Para cada palpite" (valor aplicado individualmente)

**4. Bônus**:
- Texto informativo: "Bônus disponível: R$ 1,60"
- Checkbox: "Utilizar bônus"
- Opção de aplicar bônus na aposta

- Botões: "Voltar" e "Continuar"

### Etapa 4: Seleção de Localização/Horário
- **Componentes identificados**:

**1. Tipo de Sorteio**:
- Checkbox: "INSTANTANEA" (Sorteio instantâneo)

**2. Localizações Disponíveis (botões com imagens)**:
- "Brasil Ponto do Bicho" (com imagem/flag)
- "Distrito Federal Distrito Federal" (com imagem/flag)
- "Goiás Goiás" (com imagem/flag)

**3. Horários Específicos**:
- Checkbox: "PONTO-CORUJA 22h"

- Botões: "Voltar" e "Continuar"
- Progresso: Etapas 1, 2, 3, 4 destacadas (azuis), etapa 5 ainda pendente

### Etapa 5: (A explorar)

## Modalidades de Aposta Identificadas

### Modalidades Padrão:
1. **Grupo**: 1x R$ 18.00
2. **Milhar**: 1x R$ 6000.00
3. **Centena**: 1x R$ 600.00
4. **Dezena**: 1x R$ 60.00
5. **Passe-vai 1/2**: 1x R$ 160.00
6. **Passe-vai 1/5**: 1x R$ 90.00

### Modalidades Especiais (Cotações Especiais):
- **Milhar Especial**: 1x R$ 7000.00 (diferentes horários)
  - PONTO-NOITE 18h
  - PONTO-MEIO-DIA 12h
  - PONTO-TARDE 15h
  - PONTO-CORUJA 22h
  - PONTO-MADRUGADA

## Sistema de Horários Identificados

- PT-RIO 9h20
- PONTO-NOITE 18h
- PONTO-MEIO-DIA 12h
- PONTO-TARDE 15h
- PONTO-CORUJA 22h
- PONTO-MADRUGADA

## Indicador de Progresso

- Sistema de 5 etapas no fluxo de apostas
- Visual: linha horizontal com círculos numerados (1-5)
- Etapas completas ficam azuis
- Etapas pendentes ficam cinzas
- Linhas entre etapas também mudam de cor
