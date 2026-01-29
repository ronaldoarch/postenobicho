# 🗺️ Implementação: Mapa de Localizações por IP

## 📋 Resumo

Sistema completo para rastrear e visualizar a localização geográfica dos usuários baseado no IP quando eles:
- Fazem cadastro
- Fazem apostas
- Fazem login (futuro)

## ✅ O que foi implementado

### 1. Modelo de Dados (Prisma)
- **Tabela `UsuarioLocalizacao`** criada no schema Prisma
- Campos: `id`, `usuarioId`, `ip`, `tipo`, `latitude`, `longitude`, `cidade`, `estado`, `pais`, `regiao`, `timezone`, `isp`, `createdAt`
- Relação com `Usuario` (cascade delete)

### 2. Biblioteca de Geolocalização (`lib/ip-geolocation.ts`)
- `getClientIP()`: Extrai o IP real do cliente dos headers HTTP
- `geolocateIP()`: Usa ip-api.com (gratuito) para geolocalizar IP
- `salvarLocalizacaoUsuario()`: Salva localização no banco de dados

### 3. Integração nas Rotas
- **Cadastro** (`app/api/auth/register/route.ts`): Captura IP e geolocaliza ao criar conta
- **Apostas** (`app/api/apostas/route.ts`): Captura IP e geolocaliza ao fazer aposta

### 4. API Admin (`app/api/admin/localizacoes/route.ts`)
- Endpoint GET `/api/admin/localizacoes`
- Filtros: `tipo` (cadastro/aposta/login), `usuarioId`
- Retorna até 1000 registros mais recentes
- Agrupa localizações duplicadas

### 5. Página Admin (`app/admin/localizacoes/page.tsx`)
- Estatísticas: Total, Cadastros, Apostas, Países únicos
- Filtros por tipo de evento
- Tabela com últimas 20 localizações
- Integração com componente de mapa

### 6. Componente de Mapa (`components/MapaLocalizacoes.tsx`)
- Usa Leaflet (OpenStreetMap) - gratuito
- Marcadores coloridos por tipo:
  - 🔵 Azul: Cadastros
  - 🟢 Verde: Apostas
  - ⚪ Cinza: Logins
- Popups com informações do usuário e localização
- Agrupa marcadores próximos para evitar sobreposição

## 🚀 Como aplicar no servidor

### 1. Aplicar Migration do Prisma

```bash
# No servidor, executar:
cd /var/www/postenobicho
npx prisma migrate dev --name add_usuario_localizacao
# OU se já estiver em produção:
npx prisma db push
```

### 2. Gerar Prisma Client

```bash
npx prisma generate
```

### 3. Reiniciar aplicação

```bash
pm2 restart lotbicho
```

## 📊 Como usar

1. Acesse `/admin/localizacoes` no painel admin
2. Visualize o mapa com todas as localizações
3. Use os filtros para ver apenas cadastros ou apostas
4. Clique nos marcadores para ver detalhes
5. Veja estatísticas no topo da página

## 🔧 Configuração

O sistema usa **ip-api.com** que é gratuito e permite até **45 requisições por minuto**.

Se precisar de mais requisições, pode alternar para:
- **ipapi.co**: 1000 requisições/dia grátis
- **ipgeolocation.io**: 1000 requisições/mês grátis

Para alterar, edite `lib/ip-geolocation.ts` na função `geolocateIP()`.

## ⚠️ Limitações

- IPs privados (localhost, 192.168.x.x, etc.) não são geolocalizados
- A precisão depende do provedor de internet do usuário
- Alguns IPs podem não retornar localização (VPN, proxies, etc.)
- O serviço ip-api.com tem limite de 45 req/min (suficiente para a maioria dos casos)

## 🎯 Próximos passos (opcionais)

- Adicionar captura de IP no login
- Adicionar gráficos de distribuição geográfica
- Exportar dados para CSV/Excel
- Adicionar filtros por data/período
- Mostrar heatmap de concentração de usuários
