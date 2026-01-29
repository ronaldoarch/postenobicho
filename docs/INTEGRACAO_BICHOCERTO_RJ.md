# 📚 Integração com Bicho Certo - Rio de Janeiro

**Sistema completo para buscar e verificar resultados do Jogo do Bicho do Rio de Janeiro através do bichocerto.com**

---

## 🎯 Visão Geral

Este sistema foi desenvolvido especificamente para **Rio de Janeiro (RJ)** inicialmente, com foco em:

- ✅ Busca automática de resultados do bichocerto.com
- ✅ Verificação de apostas com cache inteligente
- ✅ Rate limiting para evitar sobrecarga
- ✅ Tratamento robusto de erros
- ✅ Integração com sistema de liquidação automática

---

## 📋 Índice

1. [Início Rápido](#início-rápido)
2. [API e Funções](#api-e-funções)
3. [Uso Básico](#uso-básico)
4. [Integração com Liquidação](#integração-com-liquidação)
5. [Cache e Performance](#cache-e-performance)
6. [Rate Limiting](#rate-limiting)
7. [Tratamento de Erros](#tratamento-de-erros)
8. [Exemplos Práticos](#exemplos-práticos)

---

## ⚡ Início Rápido

### Verificar uma aposta

```typescript
import { verificarApostaRJ } from '@/lib/bichocerto-verificador-rj'

const resultado = await verificarApostaRJ(
  'PT RIO',           // Nome da loteria
  '2026-01-17',       // Data no formato YYYY-MM-DD
  ['2047', '2881', '2289'] // Números apostados
)

if (resultado.sucesso && resultado.total_acertos > 0) {
  console.log(`🎉 Você acertou ${resultado.total_acertos} número(s)!`)
  resultado.acertos.forEach(acerto => {
    console.log(`✅ ${acerto.numero} - ${acerto.posicao} lugar`)
  })
}
```

### Buscar resultados

```typescript
import { buscarResultadosRJ } from '@/lib/bichocerto-verificador-rj'

const resultados = await buscarResultadosRJ('2026-01-17')

resultados.forEach(resultado => {
  console.log(`${resultado.titulo}:`)
  resultado.premios.forEach(premio => {
    console.log(`  ${premio.posicao}: ${premio.numero} (Grupo ${premio.grupo} - ${premio.animal})`)
  })
})
```

---

## 🔌 API e Funções

### `verificarApostaRJ`

Verifica se números apostados foram sorteados no Rio de Janeiro.

**Parâmetros:**
- `nomeLoteria` (string): Nome da loteria (ex: "PT RIO", "PTV-RJ")
- `data` (string): Data no formato YYYY-MM-DD
- `numerosApostados` (string[]): Array de números apostados (ex: ['2047', '2881'])

**Retorno:**
```typescript
interface VerificacaoAposta {
  sucesso: boolean
  data: string
  loteria: string
  total_apostado: number
  total_acertos: number
  acertos: AcertoDetalhado[]
  erro?: string
}

interface AcertoDetalhado {
  numero: string        // Número que acertou (ex: "2047")
  horario: string      // Horário do sorteio (ex: "Resultado PTV-RJ 16:30")
  posicao: string      // Posição do prêmio (ex: "1º")
  animal: string       // Nome do animal
  grupo: string        // Grupo do animal (ex: "12")
  premio?: number      // Valor do prêmio (opcional)
}
```

**Exemplo:**
```typescript
const resultado = await verificarApostaRJ('PT RIO', '2026-01-17', ['2047', '2881'])

if (resultado.sucesso) {
  console.log(`Total de acertos: ${resultado.total_acertos}`)
  resultado.acertos.forEach(acerto => {
    console.log(`${acerto.numero} - ${acerto.posicao} lugar`)
  })
}
```

---

### `buscarResultadosRJ`

Busca todos os resultados de uma data específica do Rio de Janeiro.

**Parâmetros:**
- `data` (string): Data no formato YYYY-MM-DD

**Retorno:**
```typescript
interface BichoCertoResultado[] {
  horario: string      // Horário do sorteio (ex: "16:30")
  titulo: string       // Título completo (ex: "Resultado PTV-RJ 16:30")
  premios: BichoCertoPremio[]
}

interface BichoCertoPremio {
  posicao: string      // "1º", "2º", etc.
  numero: string       // "2047" (sempre 4 dígitos)
  grupo: string        // "12"
  animal: string       // "Elefante"
}
```

**Exemplo:**
```typescript
const resultados = await buscarResultadosRJ('2026-01-17')

resultados.forEach(resultado => {
  console.log(`${resultado.titulo}:`)
  resultado.premios.forEach(premio => {
    console.log(`  ${premio.posicao}: ${premio.numero} - ${premio.animal}`)
  })
})
```

---

### Funções Auxiliares

#### `limparCache()`

Limpa o cache de resultados em memória.

```typescript
import { limparCache } from '@/lib/bichocerto-verificador-rj'

limparCache()
```

#### `obterEstatisticasCache()`

Obtém estatísticas do cache atual.

```typescript
import { obterEstatisticasCache } from '@/lib/bichocerto-verificador-rj'

const stats = obterEstatisticasCache()
console.log(`Cache: ${stats.tamanho} entradas`)
console.log(`Chaves: ${stats.chaves.join(', ')}`)
```

---

## 💻 Uso Básico

### Exemplo 1: Verificar uma única aposta

```typescript
import { verificarApostaRJ } from '@/lib/bichocerto-verificador-rj'

async function verificarMinhaAposta() {
  const resultado = await verificarApostaRJ(
    'PT RIO',
    '2026-01-17',
    ['2047', '2881', '2289']
  )

  if (!resultado.sucesso) {
    console.error('Erro:', resultado.erro)
    return
  }

  if (resultado.total_acertos === 0) {
    console.log('😔 Nenhum acerto desta vez')
    return
  }

  console.log(`🎉 Você acertou ${resultado.total_acertos} número(s)!`)
  
  resultado.acertos.forEach(acerto => {
    console.log(`
      ✅ Número: ${acerto.numero}
      📍 Posição: ${acerto.posicao}
      🦁 Animal: ${acerto.animal}
      📊 Grupo: ${acerto.grupo}
      ⏰ Horário: ${acerto.horario}
    `)
  })
}

verificarMinhaAposta()
```

---

### Exemplo 2: Buscar todos os resultados do dia

```typescript
import { buscarResultadosRJ } from '@/lib/bichocerto-verificador-rj'

async function buscarResultadosDoDia() {
  const hoje = new Date().toISOString().split('T')[0]
  const resultados = await buscarResultadosRJ(hoje)

  if (resultados.length === 0) {
    console.log('Nenhum resultado encontrado para hoje')
    return
  }

  console.log(`📊 Encontrados ${resultados.length} resultado(s) para hoje:\n`)

  resultados.forEach(resultado => {
    console.log(`\n${resultado.titulo}`)
    console.log('─'.repeat(50))
    
    resultado.premios.forEach(premio => {
      console.log(
        `${premio.posicao.padEnd(4)} | ${premio.numero} | Grupo ${premio.grupo.padStart(2, '0')} | ${premio.animal}`
      )
    })
  })
}

buscarResultadosDoDia()
```

---

### Exemplo 3: Verificar múltiplas apostas

```typescript
import { verificarApostaRJ } from '@/lib/bichocerto-verificador-rj'

async function verificarMultiplasApostas() {
  const apostas = [
    { loteria: 'PT RIO', data: '2026-01-17', numeros: ['2047', '2881'] },
    { loteria: 'PTV-RJ', data: '2026-01-17', numeros: ['1234', '5678'] },
  ]

  for (const aposta of apostas) {
    const resultado = await verificarApostaRJ(
      aposta.loteria,
      aposta.data,
      aposta.numeros
    )

    console.log(`\n📋 ${aposta.loteria} - ${aposta.data}`)
    console.log(`   Números apostados: ${aposta.numeros.join(', ')}`)
    
    if (resultado.sucesso) {
      console.log(`   ✅ Acertos: ${resultado.total_acertos}`)
      if (resultado.total_acertos > 0) {
        resultado.acertos.forEach(acerto => {
          console.log(`      🎯 ${acerto.numero} - ${acerto.posicao}`)
        })
      }
    } else {
      console.log(`   ❌ Erro: ${resultado.erro}`)
    }
  }
}

verificarMultiplasApostas()
```

---

## 🔄 Integração com Liquidação

O sistema de liquidação automática já está integrado com o verificador RJ. A rota `/api/resultados/liquidar` usa automaticamente:

```typescript
// app/api/resultados/liquidar/route.ts
import { buscarResultadosRJ } from '@/lib/bichocerto-verificador-rj'

// Buscar resultados com cache e rate limiting
const resultadosBichoCerto = await buscarResultadosRJ(data)
```

**Vantagens:**
- ✅ Cache automático (1 hora)
- ✅ Rate limiting integrado
- ✅ Apenas RJ processado inicialmente
- ✅ Tratamento de erros robusto

---

## 📦 Cache e Performance

### Como Funciona

O sistema usa cache em memória com TTL de **1 hora**:

```typescript
// Cache automático
const resultados = await buscarResultadosRJ('2026-01-17')
// Primeira chamada: busca do servidor
// Chamadas subsequentes (dentro de 1h): retorna do cache
```

### Limpar Cache Manualmente

```typescript
import { limparCache } from '@/lib/bichocerto-verificador-rj'

// Limpar todo o cache
limparCache()
```

### Estatísticas do Cache

```typescript
import { obterEstatisticasCache } from '@/lib/bichocerto-verificador-rj'

const stats = obterEstatisticasCache()
console.log(`Cache: ${stats.tamanho} entradas`)
console.log(`Chaves: ${stats.chaves.join(', ')}`)
```

**Nota:** Para produção em escala, considere usar Redis ou similar para cache distribuído.

---

## 🚦 Rate Limiting

O sistema implementa rate limiting automático:

- **Limite:** 60 requisições por minuto
- **Janela:** 1 minuto
- **Chave:** Por loteria + data

**Comportamento:**
- ✅ Primeiras 60 requisições: permitidas
- ❌ Requisição 61+: retorna erro "Rate limit excedido"

**Exemplo de erro:**
```typescript
{
  sucesso: false,
  erro: 'Rate limit excedido. Aguarde alguns instantes.'
}
```

---

## ⚠️ Tratamento de Erros

### Erros Comuns

#### 1. Dados Inválidos

```typescript
{
  sucesso: false,
  erro: 'Dados inválidos: loteria, data e números são obrigatórios'
}
```

**Solução:** Verifique se todos os parâmetros foram fornecidos.

---

#### 2. Formato de Data Inválido

```typescript
{
  sucesso: false,
  erro: 'Formato de data inválido. Use YYYY-MM-DD'
}
```

**Solução:** Use formato `YYYY-MM-DD` (ex: `2026-01-17`).

---

#### 3. Rate Limit Excedido

```typescript
{
  sucesso: false,
  erro: 'Rate limit excedido. Aguarde alguns instantes.'
}
```

**Solução:** Aguarde alguns segundos antes de tentar novamente.

---

#### 4. Loteria Não é do RJ

```typescript
{
  sucesso: false,
  erro: 'Esta função é apenas para loterias do Rio de Janeiro (RJ)'
}
```

**Solução:** Use apenas loterias do Rio de Janeiro (ex: "PT RIO", "PTV-RJ").

---

#### 5. Nenhum Resultado Encontrado

```typescript
{
  sucesso: true,
  total_acertos: 0,
  acertos: [],
  erro: 'Nenhum resultado encontrado para esta data'
}
```

**Solução:** Verifique se a data está correta e se há resultados disponíveis.

---

## 📝 Exemplos Práticos

### Exemplo Completo: Sistema de Notificações

```typescript
import { verificarApostaRJ } from '@/lib/bichocerto-verificador-rj'

async function verificarEAvisarUsuario(userId: number, aposta: any) {
  const resultado = await verificarApostaRJ(
    aposta.loteria,
    aposta.data,
    aposta.numeros
  )

  if (!resultado.sucesso) {
    console.error(`Erro ao verificar aposta ${aposta.id}:`, resultado.erro)
    return
  }

  if (resultado.total_acertos > 0) {
    // Criar notificação
    await criarNotificacao(userId, {
      tipo: 'acerto',
      mensagem: `🎉 Você acertou ${resultado.total_acertos} número(s)!`,
      dados: resultado.acertos,
    })

    // Enviar email (opcional)
    await enviarEmail(userId, {
      assunto: 'Você acertou!',
      corpo: `Parabéns! Você acertou ${resultado.total_acertos} número(s) na sua aposta.`,
    })
  }
}
```

---

### Exemplo: Widget de Resultados ao Vivo

```typescript
import { buscarResultadosRJ } from '@/lib/bichocerto-verificador-rj'

async function atualizarWidgetResultados() {
  const hoje = new Date().toISOString().split('T')[0]
  
  try {
    const resultados = await buscarResultadosRJ(hoje)
    
    // Atualizar UI
    atualizarInterface(resultados)
  } catch (error) {
    console.error('Erro ao atualizar resultados:', error)
    mostrarErro('Erro ao carregar resultados')
  }
}

// Atualizar a cada 5 minutos
setInterval(atualizarWidgetResultados, 5 * 60 * 1000)
atualizarWidgetResultados() // Primeira chamada
```

---

## 🔐 Segurança

### Validação de Dados

O sistema valida automaticamente:
- ✅ Formato de data (YYYY-MM-DD)
- ✅ Presença de todos os parâmetros obrigatórios
- ✅ Loteria é do Rio de Janeiro

### Rate Limiting

- ✅ Proteção contra abuso
- ✅ Limite de 60 requisições/minuto
- ✅ Reset automático após 1 minuto

### Cache

- ✅ Cache em memória (1 hora)
- ✅ Reduz carga no servidor externo
- ✅ Melhora performance

---

## 📊 Monitoramento

### Logs

O sistema gera logs detalhados:

```
🌐 Buscando resultados do bichocerto.com para rj em 2026-01-17
📦 Cache hit para rj em 2026-01-17
📊 Div 16: 7 prêmio(s) extraído(s)
✅ 1º PRÊMIO extraído: número="2047", grupo="12", animal="Elefante"
```

### Métricas Recomendadas

- Número de requisições por minuto
- Taxa de cache hit
- Tempo médio de resposta
- Taxa de erros

---

## 🚀 Próximos Passos

1. **Expandir para outros estados:** Adicionar suporte para SP, BA, etc.
2. **Cache distribuído:** Migrar para Redis
3. **Webhooks:** Notificações automáticas de resultados
4. **Histórico:** Armazenar resultados históricos no banco

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do sistema
2. Consulte a seção "Tratamento de Erros"
3. Verifique se a data está no formato correto
4. Confirme que a loteria é do Rio de Janeiro

---

**Última atualização:** Janeiro 2026  
**Versão:** 1.0.0  
**Foco:** Rio de Janeiro (RJ)
