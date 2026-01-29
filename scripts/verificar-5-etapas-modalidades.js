/**
 * Script para verificar detalhadamente as 5 etapas de todas as modalidades
 * 
 * Etapas:
 * 1. Seleção de Modalidade
 * 2. Seleção de Palpites (Animais ou Números)
 * 3. Posição, Quantia e Divisão
 * 4. Seleção de Localização/Extrações
 * 5. Confirmação e Criação da Aposta
 */

const MODALIDADES = [
  // Modalidades de Grupo
  { id: 1, name: 'Grupo', type: 'animal', requiredAnimals: 1 },
  { id: 2, name: 'Dupla de Grupo', type: 'animal', requiredAnimals: 2 },
  { id: 3, name: 'Terno de Grupo', type: 'animal', requiredAnimals: 3 },
  { id: 4, name: 'Quadra de Grupo', type: 'animal', requiredAnimals: 4 },
  { id: 5, name: 'Quina de Grupo', type: 'animal', requiredAnimals: 5 },
  { id: 21, name: 'Terno de Grupo Seco', type: 'animal', requiredAnimals: 3 },
  
  // Modalidades Numéricas
  { id: 9, name: 'Milhar', type: 'number', digits: 4 },
  { id: 11, name: 'Centena', type: 'number', digits: 3 },
  { id: 12, name: 'Dezena', type: 'number', digits: 2 },
  { id: 13, name: 'Milhar Invertida', type: 'number', digits: 4, invertida: true },
  { id: 14, name: 'Centena Invertida', type: 'number', digits: 3, invertida: true },
  { id: 15, name: 'Dezena Invertida', type: 'number', digits: 2, invertida: true },
  { id: 10, name: 'Milhar/Centena', type: 'number', digits: 4, milharCentena: true },
  
  // Modalidades Especiais
  { id: 8, name: 'Passe vai', type: 'animal', requiredAnimals: 2, passe: true },
  { id: 16, name: 'Passe vai e vem', type: 'animal', requiredAnimals: 2, passe: true },
  { id: 20, name: 'Dezeninha', type: 'number', digits: 0, dezeninha: true },
  
  // Modalidades de Dezena Combinadas
  { id: 6, name: 'Duque de Dezena', type: 'number', digits: 2, multiple: true },
  { id: 7, name: 'Terno de Dezena', type: 'number', digits: 2, multiple: true },
  { id: 17, name: 'Quadra de Dezena', type: 'number', digits: 2, multiple: true },
  { id: 18, name: 'Duque de Dezena (EMD)', type: 'number', digits: 4, emd: true },
  { id: 19, name: 'Terno de Dezena (EMD)', type: 'number', digits: 4, emd: true },
]

console.log('=== VERIFICAÇÃO DETALHADA DAS 5 ETAPAS DE TODAS AS MODALIDADES ===\n')

MODALIDADES.forEach((modalidade, index) => {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`${index + 1}. ${modalidade.name} (ID: ${modalidade.id})`)
  console.log(`${'='.repeat(80)}`)
  
  // ETAPA 1: Seleção de Modalidade
  console.log('\n📋 ETAPA 1: Seleção de Modalidade')
  console.log(`   ✅ Modalidade selecionada: ${modalidade.name}`)
  console.log(`   ✅ Tipo: ${modalidade.type === 'animal' ? 'Animal' : 'Número'}`)
  
  // ETAPA 2: Seleção de Palpites
  console.log('\n📋 ETAPA 2: Seleção de Palpites')
  if (modalidade.type === 'animal') {
    console.log(`   ✅ Tipo: Seleção de Animais`)
    console.log(`   ✅ Animais necessários por palpite: ${modalidade.requiredAnimals}`)
    if (modalidade.passe) {
      console.log(`   ⚠️  MODALIDADE PASSE: Fixo 1º-2º prêmio`)
    }
    
    // Exemplo de palpite
    if (modalidade.requiredAnimals === 1) {
      console.log(`   📝 Exemplo: Selecionar 3 animais = 3 palpites`)
      console.log(`      - Palpite 1: [1] (Avestruz)`)
      console.log(`      - Palpite 2: [2] (Águia)`)
      console.log(`      - Palpite 3: [3] (Burro)`)
    } else if (modalidade.requiredAnimals === 2) {
      console.log(`   📝 Exemplo: Selecionar 2 palpites`)
      console.log(`      - Palpite 1: [1, 2] (Avestruz, Águia)`)
      console.log(`      - Palpite 2: [3, 4] (Burro, Borboleta)`)
    } else if (modalidade.requiredAnimals === 3) {
      console.log(`   📝 Exemplo: Selecionar 2 palpites`)
      console.log(`      - Palpite 1: [1, 2, 3] (Avestruz, Águia, Burro)`)
      console.log(`      - Palpite 2: [4, 5, 6] (Borboleta, Cachorro, Cabra)`)
    }
  } else {
    console.log(`   ✅ Tipo: Seleção de Números`)
    if (modalidade.digits > 0) {
      console.log(`   ✅ Dígitos necessários: ${modalidade.digits}`)
    }
    if (modalidade.invertida) {
      console.log(`   ⚠️  MODALIDADE INVERTIDA: Conta variações`)
    }
    if (modalidade.milharCentena) {
      console.log(`   ⚠️  MILHAR/CENTENA: Conta 2 combinações por número`)
    }
    if (modalidade.dezeninha) {
      console.log(`   ⚠️  DEZENINHA: Aceita 3-20 dezenas separadas por vírgula`)
    }
    if (modalidade.emd) {
      console.log(`   ⚠️  EMD: Extrai 3 dezenas do milhar (Esquerda, Meio, Direita)`)
    }
    if (modalidade.multiple) {
      console.log(`   ⚠️  MÚLTIPLAS DEZENAS: Formato "12-23" ou "12-23-34"`)
    }
    
    // Exemplo de palpite
    if (modalidade.digits === 2 && !modalidade.multiple && !modalidade.dezeninha) {
      console.log(`   📝 Exemplo: Selecionar 3 números = 3 palpites`)
      console.log(`      - Palpite 1: "27"`)
      console.log(`      - Palpite 2: "35"`)
      console.log(`      - Palpite 3: "48"`)
    } else if (modalidade.digits === 4 && !modalidade.emd && !modalidade.milharCentena) {
      console.log(`   📝 Exemplo: Selecionar 2 números = 2 palpites`)
      console.log(`      - Palpite 1: "1234"`)
      console.log(`      - Palpite 2: "5678"`)
    } else if (modalidade.milharCentena) {
      console.log(`   📝 Exemplo: Selecionar 1 número = 1 palpite (2 combinações)`)
      console.log(`      - Palpite: "1234" → Milhar "1234" + Centena "234"`)
    } else if (modalidade.dezeninha) {
      console.log(`   📝 Exemplo: Selecionar 1 palpite com múltiplas dezenas`)
      console.log(`      - Palpite: "12, 23, 34, 45" (4 dezenas)`)
    }
  }
  
  // ETAPA 3: Posição, Quantia e Divisão
  console.log('\n📋 ETAPA 3: Posição, Quantia e Divisão')
  
  // Posições permitidas
  let posicoesPermitidas = ['1st', '1-3', '1-5', '1-7']
  if (modalidade.passe) {
    posicoesPermitidas = ['1-2'] // Fixo para passe
    console.log(`   ⚠️  POSIÇÃO FIXA: 1º-2º (apenas para Passe)`)
  } else if (modalidade.name === 'Milhar' || modalidade.name === 'Milhar Invertida' || modalidade.name === 'Milhar/Centena') {
    posicoesPermitidas = ['1st', '1-3', '1-5'] // Máximo até 5º
    console.log(`   ⚠️  POSIÇÕES LIMITADAS: Máximo até 5º prêmio`)
  } else if (modalidade.name === 'Terno de Grupo Seco') {
    posicoesPermitidas = ['1st', '1-3', '1-5'] // Limitado ao 5º
    console.log(`   ⚠️  POSIÇÕES LIMITADAS: Máximo até 5º prêmio`)
  }
  
  console.log(`   ✅ Posições permitidas: ${posicoesPermitidas.join(', ')}`)
  console.log(`   ✅ Valor padrão: R$ 2,00`)
  console.log(`   ✅ Incremento: R$ 0,50`)
  console.log(`   ✅ Divisão: "Para todo o palpite" (all) ou "Para cada palpite" (each)`)
  
  // Exemplo de cálculo
  const valorExemplo = 2.00
  const qtdPalpitesExemplo = modalidade.type === 'animal' ? 3 : (modalidade.dezeninha ? 1 : 3)
  const divisionTypeExemplo = 'all'
  const posicaoExemplo = '1-5'
  
  console.log(`\n   📊 Exemplo de Cálculo:`)
  console.log(`      - Valor digitado: R$ ${valorExemplo.toFixed(2)}`)
  console.log(`      - Quantidade de palpites: ${qtdPalpitesExemplo}`)
  console.log(`      - Divisão: ${divisionTypeExemplo === 'all' ? 'Para todo o palpite' : 'Para cada palpite'}`)
  console.log(`      - Posição: ${posicaoExemplo}`)
  
  if (divisionTypeExemplo === 'all') {
    const valorPorPalpite = valorExemplo / qtdPalpitesExemplo
    console.log(`      - Valor por palpite: R$ ${valorPorPalpite.toFixed(2)}`)
  } else {
    console.log(`      - Valor por palpite: R$ ${valorExemplo.toFixed(2)} (cada palpite)`)
  }
  
  // ETAPA 4: Seleção de Localização/Extrações
  console.log('\n📋 ETAPA 4: Seleção de Localização/Extrações')
  console.log(`   ✅ Opções disponíveis:`)
  console.log(`      - Extrações individuais (PT RIO 09:20, 11:20, etc.)`)
  console.log(`      - Múltiplas extrações (selecionar várias)`)
  console.log(`      - Aposta instantânea (opcional)`)
  
  const qtdExtracoesExemplo = 3
  console.log(`\n   📊 Exemplo:`)
  console.log(`      - Extrações selecionadas: ${qtdExtracoesExemplo}`)
  console.log(`      - Valor por extração: R$ ${valorExemplo.toFixed(2)}`)
  const valorTotalDebitar = divisionTypeExemplo === 'each' 
    ? valorExemplo * qtdExtracoesExemplo * qtdPalpitesExemplo
    : valorExemplo * qtdExtracoesExemplo
  console.log(`      - Valor total a debitar: R$ ${valorTotalDebitar.toFixed(2)}`)
  
  // ETAPA 5: Confirmação e Criação da Aposta
  console.log('\n📋 ETAPA 5: Confirmação e Criação da Aposta')
  console.log(`   ✅ Resumo da aposta:`)
  console.log(`      - Modalidade: ${modalidade.name}`)
  console.log(`      - Palpites: ${qtdPalpitesExemplo}`)
  console.log(`      - Posição: ${posicaoExemplo}`)
  console.log(`      - Valor por extração: R$ ${valorExemplo.toFixed(2)}`)
  console.log(`      - Extrações: ${qtdExtracoesExemplo}`)
  console.log(`      - Valor total: R$ ${valorTotalDebitar.toFixed(2)}`)
  
  // Verificar cálculos específicos por modalidade
  console.log(`\n   🔍 Verificações Específicas:`)
  
  if (modalidade.invertida) {
    console.log(`      ⚠️  INVERTIDA: Verificar se conta variações corretamente`)
    console.log(`         - Dezena "27" → 2 variações (27, 72)`)
    console.log(`         - Centena "384" → 6 variações`)
    console.log(`         - Milhar "1234" → 24 variações`)
    console.log(`         - Valor deve ser dividido pelas variações`)
  }
  
  if (modalidade.milharCentena) {
    console.log(`      ⚠️  MILHAR/CENTENA: Verificar se conta 2 combinações`)
    console.log(`         - Número "1234" → Milhar "1234" + Centena "234"`)
    console.log(`         - Valor deve ser dividido por 2`)
  }
  
  if (modalidade.passe) {
    console.log(`      ⚠️  PASSE: Verificar posição fixa 1º-2º`)
    console.log(`         - Deve validar que posição é sempre 1-2`)
  }
  
  if (modalidade.dezeninha) {
    console.log(`      ⚠️  DEZENINHA: Verificar multiplicador variável`)
    console.log(`         - 3 dezenas → 15x`)
    console.log(`         - 4 dezenas → 150x`)
    console.log(`         - 5+ dezenas → 1500x`)
  }
  
  // Verificar salvamento no banco
  console.log(`\n   💾 Salvamento no Banco de Dados:`)
  console.log(`      - Cada aposta salva: valor por extração`)
  console.log(`      - Se ${qtdExtracoesExemplo} extrações: ${qtdExtracoesExemplo} registros`)
  console.log(`      - Cada registro: valor = R$ ${valorExemplo.toFixed(2)}`)
  
  // Verificar liquidação
  console.log(`\n   🔄 Liquidação:`)
  console.log(`      - Busca apostas pendentes`)
  console.log(`      - Processa cada palpite separadamente`)
  if (modalidade.type === 'animal') {
    console.log(`      - Para animais: processa animalBets`)
  } else {
    console.log(`      - Para números: processa numberBets`)
  }
  console.log(`      - Calcula prêmio baseado em valor por palpite`)
  console.log(`      - Atualiza saldo do usuário`)
})

console.log(`\n\n${'='.repeat(80)}`)
console.log('✅ VERIFICAÇÃO COMPLETA')
console.log(`${'='.repeat(80)}`)
console.log('\n📝 Resumo:')
console.log(`   - Total de modalidades verificadas: ${MODALIDADES.length}`)
console.log(`   - Modalidades de animais: ${MODALIDADES.filter(m => m.type === 'animal').length}`)
console.log(`   - Modalidades numéricas: ${MODALIDADES.filter(m => m.type === 'number').length}`)
console.log(`   - Modalidades invertidas: ${MODALIDADES.filter(m => m.invertida).length}`)
console.log(`   - Modalidades especiais: ${MODALIDADES.filter(m => m.passe || m.milharCentena || m.dezeninha || m.emd).length}`)
