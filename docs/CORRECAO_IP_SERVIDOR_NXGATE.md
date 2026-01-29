# 🔧 Correção: IP do Servidor vs IP do Cliente

## 🔍 Problema Identificado

O código estava tentando descobrir o IP do servidor usando headers do cliente (`x-forwarded-for`, `x-real-ip`), o que resultava em mostrar o IP do usuário (`177.192.9.91`) em vez do IP do servidor (`104.218.52.159`).

## ✅ Solução

### 1. Configurar IP do Servidor no .env

Adicione no `.env` do servidor:

```bash
SERVER_IP=104.218.52.159
```

Este é o IP público do servidor que o Nxgate deve ver nas requisições HTTP.

### 2. Headers Limpos

O código agora remove headers do cliente (`x-forwarded-for`, `x-real-ip`, etc.) antes de fazer requisições para o Nxgate, garantindo que apenas o IP do servidor seja usado.

### 3. Como Funciona

Quando o servidor Next.js faz uma requisição HTTP usando `fetch()` para o Nxgate:

1. **IP de Origem TCP**: O IP de origem da conexão TCP é o IP do servidor (`104.218.52.159`)
2. **Headers HTTP**: Não enviamos headers do cliente que possam confundir o Nxgate
3. **Nxgate vê**: O IP do servidor (`104.218.52.159`), não o IP do cliente

## 📋 Checklist

- [ ] Adicionar `SERVER_IP=104.218.52.159` no `.env` do servidor
- [ ] Reiniciar PM2: `pm2 restart lotbicho --update-env`
- [ ] Verificar se o IP `104.218.52.159` está autorizado no Nxgate para saques
- [ ] Tentar fazer um saque novamente

## 🎯 Resultado Esperado

Após configurar o `SERVER_IP` no `.env` e reiniciar o PM2:

- O Nxgate verá o IP `104.218.52.159` nas requisições
- O IP `104.218.52.159` deve estar autorizado no painel do Nxgate para saques
- Os saques devem funcionar normalmente

## ⚠️ Nota Importante

**O IP do cliente (`177.192.9.91`) não é usado pelo Nxgate** - apenas o IP do servidor (`104.218.52.159`) é verificado. Por isso não precisamos autorizar o IP do cliente.
