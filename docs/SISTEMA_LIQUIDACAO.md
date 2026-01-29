# Sistema de Liquidação - Documentação Completa

## 📋 Visão Geral

O sistema de liquidação automática processa apostas pendentes comparando-as com resultados oficiais obtidos do site **bichocerto.com**.

## 🔄 Fluxo de Liquidação

### 1. **Filtragem de Apostas**

A liquidação busca apostas com `status: 'pendente'` e aplica os seguintes filtros:

- ✅ **Apenas apostas do Rio de Janeiro (RJ)**: O sistema processa apenas apostas de extrações do estado RJ
- ✅ **Apostas com loteria configurada**: A aposta deve ter o campo `loteria` preenchido
- ✅ **Horário de apuração passou**: Verifica se já passou o horário de apuração da extração

### 2. **Busca de Resultados**

O sistema usa **bichocerto.com** como fonte oficial de resultados:

- **URL da API**: `https://bichocerto.com/resultados/base/resultado/`
- **Método**: POST
- **Parâmetros**:
  - `l`: Código da loteria (ex: "rj" para Rio de Janeiro)
  - `d`: Data no formato YYYY-MM-DD

- **Função principal**: `buscarResultadosRJ(data)` em `lib/bichocerto-verificador-rj.ts`
- **Cache**: Resultados são armazenados em cache por 1 hora
- **Rate Limiting**: Máximo de 60 requisições por minuto

### 3. **Processamento**

Para cada aposta pendente:

1. Verifica se já passou o horário de apuração
2. Busca resultados do bichocerto.com para a data da aposta
3. Compara os números apostados com os resultados oficiais
4. Calcula prêmios baseado na modalidade e posição
5. Atualiza o status da aposta (`liquidado` ou `perdida`)
6. Credita prêmios no saldo do usuário
7. Atualiza rollover e libera bônus bloqueado se necessário

## 🔍 Por que pode não estar liquidando?

### Motivos Comuns:

1. **Apostas não são do RJ**
   - O sistema processa **APENAS** apostas de extrações do Rio de Janeiro
   - Apostas de outros estados são ignoradas

2. **Apostas sem loteria configurada**
   - Se o campo `loteria` estiver vazio ou null, a aposta não será processada

3. **Horário de apuração ainda não passou**
   - O sistema verifica se já passou o horário de apuração antes de processar
   - Usa os horários reais de apuração definidos em `data/horarios-reais-apuracao.ts`

4. **Resultados não disponíveis no bichocerto.com**
   - Se o bichocerto.com não retornar resultados para a data, a liquidação não pode processar
   - Pode acontecer se:
     - A data ainda não foi sorteada
     - O site está temporariamente indisponível
     - A data é muito antiga e não há histórico

5. **Liquidação automática desativada**
   - Verifique em Admin > Configurações se a liquidação automática está ativada

## 🛠️ Sistema Alternativo: Monitor

O sistema também pode usar um monitor externo se configurado:

- **Variável de ambiente**: `BICHO_CERTO_API`
- **URL padrão**: `https://okgkgswwkk8ows0csow0c4gg.agenciamidas.com/api/resultados`
- **Ativação**: Enviar `usarMonitor: true` no body da requisição

Se o monitor não estiver disponível, o sistema automaticamente usa a implementação própria (bichocerto.com).

## 📊 Debug e Logs

O sistema retorna informações de debug quando não encontra apostas:

```json
{
  "processadas": 0,
  "liquidadas": 0,
  "premioTotal": 0,
  "debug": {
    "totalApostasPendentes": 10,
    "apostasSemLoteria": 2,
    "apostasForaRJ": 5,
    "apostasDoRJ": 3,
    "motivo": "Descrição do motivo"
  }
}
```

## 🔧 Como Verificar

1. **Verificar apostas pendentes**:
   ```sql
   SELECT COUNT(*) FROM Aposta WHERE status = 'pendente';
   ```

2. **Verificar se são do RJ**:
   ```sql
   SELECT loteria, COUNT(*) 
   FROM Aposta 
   WHERE status = 'pendente' 
   GROUP BY loteria;
   ```

3. **Testar busca de resultados manualmente**:
   ```bash
   curl -X POST https://bichocerto.com/resultados/base/resultado/ \
     -d "l=rj&d=2024-01-22" \
     -H "Content-Type: application/x-www-form-urlencoded"
   ```

4. **Verificar logs do servidor**:
   ```bash
   pm2 logs lotbicho --lines 50
   ```

## 📝 Arquivos Relacionados

- `app/api/resultados/liquidar/route.ts` - Endpoint principal de liquidação
- `lib/bichocerto-parser.ts` - Parser do HTML do bichocerto.com
- `lib/bichocerto-verificador-rj.ts` - Verificador específico para RJ
- `data/extracoes.ts` - Definição das extrações disponíveis
- `data/horarios-reais-apuracao.ts` - Horários reais de apuração

## ⚠️ Limitações Atuais

- ✅ Processa apenas apostas do Rio de Janeiro (RJ)
- ✅ Depende da disponibilidade do bichocerto.com
- ✅ Requer que o horário de apuração já tenha passado
- ✅ Cache de 1 hora pode não refletir resultados muito recentes
