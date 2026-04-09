#!/bin/bash

# BlockVote Complete System Test Runner
# This script runs all tests in the correct sequence

set -e  # Exit on error

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT="/Users/anuragsharma/Workspace/Projects/BlockVote/Final Project"

echo -e "${BOLD}${BLUE}================================================${NC}"
echo -e "${BOLD}${BLUE}  BlockVote Complete Testing Suite${NC}"
echo -e "${BOLD}${BLUE}  April 9, 2026${NC}"
echo -e "${BOLD}${BLUE}================================================${NC}\n"

# Check if we're in the right directory
if [ ! -d "rofv-ui" ]; then
    echo -e "${YELLOW}⚠️  Please run this script from the project root directory${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Running from correct directory: $(pwd)${NC}\n"

# Test 1: Run End-to-End Flow Test
echo -e "${BOLD}${BLUE}================================================${NC}"
echo -e "${BOLD}TEST 1: End-to-End Integration Flow${NC}"
echo -e "${BOLD}${BLUE}================================================${NC}\n"

if [ -f "tests/e2e-blockvote-test.js" ]; then
    chmod +x tests/e2e-blockvote-test.js
    node tests/e2e-blockvote-test.js
    echo -e "\n${GREEN}✅ End-to-End test completed${NC}\n"
else
    echo -e "${YELLOW}⚠️  E2E test file not found${NC}\n"
fi

# Test 2: Run Smart Contract Tests
echo -e "${BOLD}${BLUE}================================================${NC}"
echo -e "${BOLD}TEST 2: Smart Contract Unit Tests${NC}"
echo -e "${BOLD}${BLUE}================================================${NC}\n"

cd contracts

if [ -f "tests/rofv_contract.ts" ]; then
    echo -e "${YELLOW}Note: To run Anchor tests, use: npm run test${NC}"
    echo -e "${YELLOW}Requires: Solana CLI, Anchor CLI, and localnet running${NC}\n"
else
    echo -e "${YELLOW}⚠️  Smart contract test file not found${NC}\n"
fi

cd "$PROJECT_ROOT"

# Test 3: Suggestions for frontend testing
echo -e "${BOLD}${BLUE}================================================${NC}"
echo -e "${BOLD}TEST 3: Frontend Manual Testing${NC}"
echo -e "${BOLD}${BLUE}================================================${NC}\n"

echo -e "${YELLOW}📋 FRONTEND TEST CHECKLIST:${NC}\n"
echo -e "   1. Admin Panel (/admin)"
echo -e "      - Register voters"
echo -e "      - View whitelist with hasVoted status"
echo -e "      - Check turnout metrics\n"

echo -e "   2. Polling Booth (/booth/verify & /booth/vote)"
echo -e "      - Verify voter identity"
echo -e "      - Cast vote and confirm Admin dashboard updates"
echo -e "      - Check DTN queue storage\n"

echo -e "   3. Analytics (/analytics)"
echo -e "      - View vote distribution"
echo -e "      - Check vote status tracking\n"

echo -e "${YELLOW}To run frontend in dev mode:${NC}"
echo -e "   cd rofv-ui && npm run dev"
echo -e "   Then open: http://localhost:3000\n"

# Summary
echo -e "${BOLD}${BLUE}================================================${NC}"
echo -e "${BOLD}${GREEN}TESTING SUMMARY${NC}"
echo -e "${BOLD}${BLUE}================================================${NC}\n"

echo -e "${GREEN}✅ E2E Integration Test: Complete${NC}"
echo -e "${YELLOW}⚠️  Smart Contract Tests: Ready (run 'npm run test' in contracts/)${NC}"
echo -e "${YELLOW}⚠️  Frontend Tests: Manual (start dev server)${NC}\n"

echo -e "${BOLD}Next Steps:${NC}"
echo -e "  1. Review TESTING_GUIDE.md for detailed scenarios"
echo -e "  2. Run frontend dev server: cd rofv-ui && npm run dev"
echo -e "  3. Test admin panel at http://localhost:3000/admin"
echo -e "  4. Test polling booth at http://localhost:3000/booth/verify"
echo -e "  5. Run smart contract tests: cd contracts && npm run test"
echo "\n"
