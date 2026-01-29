#!/bin/bash
# Script simples para reiniciar PM2

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"

echo "🔄 Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart all"
echo ""
echo "✅ PM2 reiniciado!"
echo ""
echo "📝 Agora você pode fazer login:"
echo "   Email: admin@postenobicho.com"
echo "   Senha: admin123"
