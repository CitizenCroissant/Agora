#!/bin/bash

# Script to verify testing and linting setup
# Usage: ./scripts/verify-tests.sh

set -e

echo "🔍 Verifying Testing and Linting Setup..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v)
echo "   Node.js: $NODE_VERSION"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules not found. Running npm install...${NC}"
    npm install
else
    echo -e "${GREEN}✓${NC} node_modules found"
fi

# Check for ESLint
echo ""
echo "🔍 Checking ESLint configuration..."
if [ -f ".eslintrc.js" ]; then
    echo -e "${GREEN}✓${NC} Root .eslintrc.js found"
else
    echo -e "${RED}✗${NC} Root .eslintrc.js not found"
    exit 1
fi

# Check for test configurations
echo ""
echo "🧪 Checking test configurations..."
if [ -f "vitest.config.ts" ]; then
    echo -e "${GREEN}✓${NC} Root vitest.config.ts found"
else
    echo -e "${RED}✗${NC} Root vitest.config.ts not found"
    exit 1
fi

if [ -f "apps/mobile/jest.config.js" ]; then
    echo -e "${GREEN}✓${NC} Mobile jest.config.js found"
else
    echo -e "${RED}✗${NC} Mobile jest.config.js not found"
    exit 1
fi

# Check for test files
echo ""
echo "📝 Checking test files..."
TEST_COUNT=$(find . -name "*.test.ts" -o -name "*.test.tsx" | grep -v node_modules | wc -l)
echo "   Found $TEST_COUNT test files"

if [ "$TEST_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓${NC} Test files found"
else
    echo -e "${YELLOW}⚠️${NC}  No test files found"
fi

# Try running linting (dry run)
echo ""
echo "🔍 Testing linting..."
if npm run lint > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Linting works"
else
    echo -e "${YELLOW}⚠️${NC}  Linting has issues (this is normal if there are code issues)"
fi

# Check if CI workflow exists
echo ""
echo "🔄 Checking CI/CD configuration..."
if [ -f ".github/workflows/ci.yml" ]; then
    echo -e "${GREEN}✓${NC} GitHub Actions CI workflow found"
    if grep -q "npm run test" .github/workflows/ci.yml; then
        echo -e "${GREEN}✓${NC} CI includes test job"
    else
        echo -e "${RED}✗${NC} CI does not include test job"
    fi
else
    echo -e "${YELLOW}⚠️${NC}  No CI workflow found"
fi

echo ""
echo -e "${GREEN}✅ Verification complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Run 'npm run test' to run all tests"
echo "  2. Run 'npm run lint' to check code quality"
echo "  3. Run 'npm run test:coverage' to see test coverage"
echo ""
echo "For more information, see docs/TESTING_AND_LINTING.md"
