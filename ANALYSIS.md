# Análise Completa do Site pontodobicho.com

## Páginas Analisadas

### 1. Página Inicial (Home) ✅
- **URL**: `https://pontodobicho.com/`
- **Componentes identificados**:
  - Header com logo e navegação
  - Banner promocional principal (amarelo/azul)
  - Seção STORIES com thumbnails circulares
  - Seção COTAÇÃO AO VIVO com carrossel
  - Seção Jackpot com contador regressivo
  - Banner VIP
  - FAQ (Dúvidas Frequentes)
  - Footer
  - Bottom Navigation Bar (mobile)

### 2. Página de Apostar (Modalidades) ✅
- **URL**: `https://pontodobicho.com/jogo-do-bicho`
- **Componentes identificados**:
  - Tabs de navegação: "Bicho" e "Loteria"
  - Botão "📊 Cotações Especiais"
  - Sistema de seleção de modalidades
  - Botão "Continuar" para avançar
  - Sub-navegação rápida (Apostar, Resultado, Minhas Apostas, Cotação)

### 3. Página de Resultados ✅
- **URL**: `https://pontodobicho.com/jogo-do-bicho/resultados`
- **Componentes identificados**:
  - Tabs: "Bicho" (ativo) e "Loterias"
  - Filtros:
    - Campo de data (DatePicker) - mostra "10/01/2026"
    - Dropdown de localização - mostra "Rio de Janeiro"
    - Botão "Buscar"
  - Tabela de resultados com colunas:
    - Prêmio (1° a 7°)
    - Milhar (4 dígitos)
    - Grupo (2 dígitos)
    - Animal
  - Exemplo de dados:
    - 1°: Milhar 7938, Grupo 10, Animal Coelho
    - 2°: Milhar 0941, Grupo 11, Animal Cavalo
    - 3°: Milhar 0141, Grupo 11, Animal Cavalo
    - 4°: Milhar 4752, Grupo 13, Animal Galo
    - 5°: Milhar 3354, Grupo 14, Animal Gato
    - 6°: Milhar 7126, Grupo 07, Animal Carneiro
    - 7°: Milhar 469, Grupo 18, Animal Porco
  - Título do sorteio: "10/01/2026 - PT-RIO 9h20"
  - Nota: "* Todos os resultados seguem o horário de Brasília (GMT-3)."

### 4. Página de Cotação ✅
- **URL**: `https://pontodobicho.com/jogo-do-bicho/cotacao`
- **Componentes identificados**:
  - Tabs: "Bicho" (ativo) e "Loterias"
  - Grade de modalidades (2 colunas):
    1. **Grupo**: "1x R$ 18.00" + Botão "JOGAR"
    2. **Milhar**: "1x R$ 6000.00" + Link "Ver cotações" + Botão "JOGAR"
    3. **Centena**: "1x R$ 600.00" + Botão "JOGAR"
    4. **Dezena**: "1x R$ 60.00" + Botão "JOGAR"
    5. **Passe-vai 1/2**: "1x R$ 160.00" + Botão "JOGAR"
    6. **Passe-vai 1/5**: "1x R$ 90.00" + Botão "JOGAR"

## Modalidades Identificadas

1. **Grupo** - 1x R$ 18.00
2. **Milhar** - 1x R$ 6000.00
3. **Centena** - 1x R$ 600.00
4. **Dezena** - 1x R$ 60.00
5. **Passe-vai 1/2** - 1x R$ 160.00
6. **Passe-vai 1/5** - 1x R$ 90.00

## Animais/Grupos Identificados

- Grupo 10: Coelho
- Grupo 11: Cavalo
- Grupo 13: Galo
- Grupo 14: Gato
- Grupo 07: Carneiro
- Grupo 18: Porco

## Estrutura de Navegação

### Header (Desktop):
- Logo
- Links: Início | Apostar | Resultados | Minhas Apostas | Cotação
- Ícone de notificações (sino)
- Perfil do usuário com saldo (R$ 5,20)

### Bottom Navigation (Mobile):
1. Menu (hamburger)
2. Resultados (troféu)
3. Realizar Aposta (botão amarelo destacado)
4. Cotação (medalha)
5. Carteira (carteira)

## Padrões de Design

### Cores:
- Azul escuro (#052370) - header, footer, botões principais
- Amarelo (#FFA100) - destaques, CTAs
- Branco - backgrounds de conteúdo
- Cinza claro - backgrounds secundários

### Tipografia:
- Fonte: Sora (Google Fonts)
- Tamanhos variam conforme hierarquia

### Componentes Reutilizáveis:
- Tabs (Bicho/Loteria) aparecem em várias páginas
- DatePicker para seleção de data
- Cards para modalidades
- Tabelas para resultados
- Botões de ação consistentes

## Páginas Ainda Não Analisadas (Requerem Login)

- Minhas Apostas (provavelmente requer autenticação)
- Perfil do Usuário (requer autenticação)
- Carteira/Wallet (requer autenticação)
- Áreas administrativas
