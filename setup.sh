#!/bin/bash

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "===================================="
echo "  RULETA TIKTOK - SETUP AUTOMATICO"
echo "===================================="
echo -e "${NC}"

# Verificar si Node.js esta instalado
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no esta instalado. Descargalo desde: https://nodejs.org/${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js detectado${NC}"
node --version

# Verificar si PostgreSQL esta ejecutandose
if ! pg_isready -h localhost -p 5432 &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL no esta ejecutandose. Asegurate de que este iniciado.${NC}"
    echo -e "${YELLOW}   Si no tienes PostgreSQL, descargalo desde: https://www.postgresql.org/${NC}"
fi

echo -e "\n${BLUE}📦 Instalando dependencias del backend...${NC}"
cd backend
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error instalando dependencias del backend${NC}"
    exit 1
fi

echo -e "\n${BLUE}📦 Instalando dependencias del frontend...${NC}"
cd ../frontend
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error instalando dependencias del frontend${NC}"
    exit 1
fi

cd ..

# Verificar si existe .env
if [ ! -f "backend/.env" ]; then
    echo -e "\n${BLUE}⚙️  Configurando variables de entorno...${NC}"
    cp backend/.env.example backend/.env
    echo -e "\n${YELLOW}⚠️  IMPORTANTE: Edita backend/.env con tus credenciales de PostgreSQL${NC}"
    echo -e "${YELLOW}   Especialmente DB_PASS y JWT_SECRET${NC}"
    echo ""
    read -p "Presiona Enter para continuar..."
fi

echo -e "\n${BLUE}🗄️  Ejecutando migraciones de base de datos...${NC}"
cd backend
npm run migrate
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error ejecutando migraciones. Verifica tu configuracion de PostgreSQL.${NC}"
    echo -e "${YELLOW}   1. Asegurate de que PostgreSQL este ejecutandose${NC}"
    echo -e "${YELLOW}   2. Verifica las credenciales en backend/.env${NC}"
    echo -e "${YELLOW}   3. Crea la base de datos 'ruleta_tiktok' si no existe${NC}"
    exit 1
fi

cd ..

echo -e "\n${GREEN}✅ ¡Instalacion completada exitosamente!${NC}"
echo ""
echo -e "${BLUE}🚀 Para iniciar la aplicacion:${NC}"
echo -e "   ${GREEN}npm run dev${NC}"
echo ""
echo -e "${BLUE}🌐 URLs:${NC}"
echo -e "   ${GREEN}Frontend: http://localhost:3000${NC}"
echo -e "   ${GREEN}Backend:  http://localhost:3001${NC}"
echo ""
echo -e "${BLUE}📖 Lee README.md para instrucciones completas${NC}"
echo ""
