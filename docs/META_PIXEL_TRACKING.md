# 📊 Meta Pixel - Sistema de Rastreamento Avançado

## 🎯 Visão Geral

Este sistema implementa rastreamento avançado usando **Facebook Pixel** (frontend) + **Conversions API** (backend) da Meta para máxima precisão e cobertura de eventos.

## ✨ Recursos Implementados

### 1. **Facebook Pixel (Frontend)**
- Carregamento automático quando ativado
- Rastreamento de PageView automático
- Eventos customizados via JavaScript

### 2. **Conversions API (Backend)**
- Rastreamento server-side (não bloqueado por adblockers)
- Matching avançado usando dados do usuário (email, telefone, nome)
- Hash SHA256 dos dados para privacidade (conforme requisitos da Meta)

### 3. **Eventos Rastreados**

#### Eventos Automáticos:
- ✅ **PageView** - A cada página visitada
- ✅ **CompleteRegistration** - Quando usuário se cadastra
- ✅ **BetPlaced** - Quando uma aposta é realizada
- ✅ **Deposit** - Quando um depósito é feito
- ✅ **Withdrawal** - Quando um saque é solicitado
- ✅ **InitiateCheckout** - Quando inicia processo de aposta
- ✅ **AddPaymentInfo** - Quando adiciona método de pagamento

#### Eventos Customizados:
- ✅ **ViewContent** - Visualização de conteúdo específico
- ✅ **Search** - Buscas realizadas

## 🔧 Configuração

### 1. Obter Credenciais da Meta

1. Acesse [Facebook Events Manager](https://business.facebook.com/events_manager2)
2. Vá em **Data Sources** → Seu Pixel
3. Anote o **Pixel ID** (ex: `123456789012345`)
4. Vá em **Settings** → **Conversions API** → **Generate Access Token**
5. Copie o **Access Token**

### 2. Configurar no Admin

1. Acesse `/admin/configuracoes`
2. Role até a seção **"Meta Pixel (Facebook) - Rastreamento Avançado"**
3. Ative o toggle **"Ativar Meta Pixel"**
4. Cole o **Meta Pixel ID**
5. Cole o **Conversions API Access Token**
6. Clique em **"Salvar Configurações"**

## 📍 Onde os Eventos são Rastreados

### Frontend (Facebook Pixel):
- `app/layout.tsx` - Carrega o pixel automaticamente
- `app/cadastro/page.tsx` - Rastreia cadastro
- `components/BetFlow.tsx` - Rastreia apostas

### Backend (Conversions API):
- `app/api/auth/register/route.ts` - Cadastro de usuário
- `app/api/apostas/route.ts` - Criação de apostas
- `app/api/deposito/pix/route.ts` - Início de depósito
- `app/api/webhooks/receba/route.ts` - Confirmação de depósito

## 🎨 Como Usar no Código

### Frontend (Client Components):

```typescript
import { useMetaTracking } from '@/hooks/useMetaTracking'

function MeuComponente() {
  const { trackBet, trackDeposit, trackViewContent } = useMetaTracking()
  
  // Rastrear aposta
  trackBet(50.00, 'Milhar')
  
  // Rastrear depósito
  trackDeposit(100.00, 'PIX')
  
  // Rastrear visualização
  trackViewContent('Página de Cotações', 'Cotação')
}
```

### Backend (Server Components/API Routes):

```typescript
import { MetaTrackingServer } from '@/lib/meta-tracking-server'

// Rastrear aposta
await MetaTrackingServer.trackBet(userId, valor, 'Milhar')

// Rastrear depósito
await MetaTrackingServer.trackDeposit(userId, valor, 'PIX')

// Rastrear cadastro
await MetaTrackingServer.trackRegistration(userId)
```

## 🔒 Privacidade e Segurança

- ✅ Todos os dados pessoais são hasheados com SHA256 antes de enviar
- ✅ Apenas dados necessários são enviados (email, telefone, nome)
- ✅ Access Token é armazenado de forma segura no banco
- ✅ Rastreamento pode ser desativado a qualquer momento

## 📊 Vantagens do Sistema Duplo

1. **Facebook Pixel (Frontend)**:
   - Rápido e responsivo
   - Funciona mesmo se Conversions API falhar
   - Rastreia eventos de interação do usuário

2. **Conversions API (Backend)**:
   - Não é bloqueado por adblockers
   - Mais preciso (usa dados do servidor)
   - Melhor matching de usuários
   - Funciona mesmo com JavaScript desabilitado

## 🧪 Testando

### 1. Verificar se Pixel está carregando:
```javascript
// No console do navegador:
console.log(window.fbq)
// Deve mostrar a função fbq se estiver carregado
```

### 2. Verificar eventos no Facebook Events Manager:
- Acesse Events Manager → Test Events
- Realize ações no site (cadastro, aposta, depósito)
- Os eventos devem aparecer em tempo real

### 3. Verificar logs do servidor:
```bash
# No servidor, verifique os logs do PM2
pm2 logs --lines 50
# Procure por "Erro ao rastrear" se houver problemas
```

## ⚠️ Troubleshooting

### Pixel não está carregando:
1. Verifique se `metaPixelEnabled` está `true` no banco
2. Verifique se `metaPixelId` está preenchido
3. Verifique o console do navegador para erros

### Conversions API não está funcionando:
1. Verifique se `metaAccessToken` está correto
2. Verifique se o token tem permissões corretas
3. Verifique os logs do servidor para erros específicos

### Eventos não aparecem no Events Manager:
1. Aguarde alguns minutos (pode haver delay)
2. Verifique se está na aba "Test Events" (modo teste)
3. Verifique se o Pixel ID está correto

## 📝 Notas Importantes

- O sistema funciona mesmo se apenas um dos métodos (Pixel ou Conversions API) estiver funcionando
- Eventos são enviados de forma assíncrona (não bloqueiam a aplicação)
- Erros de rastreamento não afetam a funcionalidade principal do site
- Todos os eventos incluem dados de valor e moeda (BRL) quando aplicável
