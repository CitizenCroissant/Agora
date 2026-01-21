#!/bin/bash

# Agora Setup Verification Script
# This script verifies that all components are properly set up

echo "🏛️  Agora Setup Verification"
echo "======================================"
echo ""

ERRORS=0
WARNINGS=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} Found: $1"
    else
        echo -e "${RED}✗${NC} Missing: $1"
        ((ERRORS++))
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} Directory exists: $1"
    else
        echo -e "${RED}✗${NC} Directory missing: $1"
        ((ERRORS++))
    fi
}

check_env_example() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} Env example found: $1"
    else
        echo -e "${YELLOW}!${NC} No env example: $1"
        ((WARNINGS++))
    fi
}

check_env_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} Env file configured: $1"
    else
        echo -e "${YELLOW}!${NC} Env file not configured: $1"
        echo "   Copy env.example to .env.local and configure"
        ((WARNINGS++))
    fi
}

echo "1. Checking Project Structure"
echo "------------------------------"
check_dir "packages/shared"
check_dir "apps/api"
check_dir "apps/ingestion"
check_dir "apps/web"
check_dir "apps/mobile"
check_dir "database"
check_dir "docs"
echo ""

echo "2. Checking Package Files"
echo "-------------------------"
check_file "package.json"
check_file "turbo.json"
check_file "packages/shared/package.json"
check_file "apps/api/package.json"
check_file "apps/ingestion/package.json"
check_file "apps/web/package.json"
check_file "apps/mobile/package.json"
echo ""

echo "3. Checking Database"
echo "--------------------"
check_file "database/schema.sql"
check_file "database/README.md"
echo ""

echo "4. Checking API"
echo "---------------"
check_file "apps/api/api/agenda.ts"
check_file "apps/api/api/agenda/range.ts"
check_file "apps/api/api/sittings/[id].ts"
check_file "apps/api/lib/supabase.ts"
check_file "apps/api/vercel.json"
check_env_example "apps/api/env.example"
check_env_file "apps/api/.env.local"
echo ""

echo "5. Checking Ingestion"
echo "---------------------"
check_file "apps/ingestion/src/ingest.ts"
check_file "apps/ingestion/src/assemblee-client.ts"
check_file "apps/ingestion/vercel.json"
check_env_example "apps/ingestion/env.example"
check_env_file "apps/ingestion/.env.local"
echo ""

echo "6. Checking Web App"
echo "-------------------"
check_file "apps/web/app/page.tsx"
check_file "apps/web/app/layout.tsx"
check_file "apps/web/app/timeline/page.tsx"
check_file "apps/web/app/sitting/[id]/page.tsx"
check_file "apps/web/next.config.js"
check_env_example "apps/web/env.example"
check_env_file "apps/web/.env.local"
echo ""

echo "7. Checking Mobile App"
echo "----------------------"
check_file "apps/mobile/app/_layout.tsx"
check_file "apps/mobile/app/(tabs)/index.tsx"
check_file "apps/mobile/app.json"
check_file "apps/mobile/babel.config.js"
echo ""

echo "8. Checking Documentation"
echo "-------------------------"
check_file "README.md"
check_file "docs/SETUP_GUIDE.md"
check_file "docs/ARCHITECTURE.md"
check_file "docs/API_DOCUMENTATION.md"
check_file "CONTRIBUTING.md"
check_file "LICENSE"
echo ""

echo "9. Checking Node Modules"
echo "------------------------"
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} Root dependencies installed"
else
    echo -e "${YELLOW}!${NC} Root dependencies not installed"
    echo "   Run: npm install"
    ((WARNINGS++))
fi

if [ -f "packages/shared/dist/index.js" ]; then
    echo -e "${GREEN}✓${NC} Shared package built"
else
    echo -e "${YELLOW}!${NC} Shared package not built"
    echo "   Run: cd packages/shared && npm run build"
    ((WARNINGS++))
fi
echo ""

echo "10. Checking Git"
echo "----------------"
if [ -d ".git" ]; then
    echo -e "${GREEN}✓${NC} Git repository initialized"
else
    echo -e "${YELLOW}!${NC} Git not initialized"
    echo "   Run: git init"
    ((WARNINGS++))
fi
echo ""

# Summary
echo "======================================"
echo "Summary"
echo "======================================"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "Your Agora setup is complete."
    echo ""
    echo "Next steps:"
    echo "1. Configure environment variables in .env.local files"
    echo "2. Set up your Supabase project"
    echo "3. Run 'npm install' if not done"
    echo "4. Build shared package: cd packages/shared && npm run build"
    echo "5. Start development: npm run dev"
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ ${WARNINGS} warning(s) found${NC}"
    echo ""
    echo "Setup is mostly complete, but some configuration is needed."
    echo "Review the warnings above."
elif [ $ERRORS -gt 0 ]; then
    echo -e "${RED}✗ ${ERRORS} error(s) and ${WARNINGS} warning(s) found${NC}"
    echo ""
    echo "Some files are missing. Please check the structure."
fi
echo ""
