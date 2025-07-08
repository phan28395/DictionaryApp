#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Lightning Dictionary - Claude Handoff Documents ===${NC}"
echo ""
echo -e "${BLUE}Available Documents:${NC}"
echo "1. README.md           - Start here! Overview and index"
echo "2. QUICK_REFERENCE.md  - Quick commands and current status"
echo "3. PROJECT_STATUS.md   - Detailed progress and next steps"
echo "4. TECHNICAL_CONTEXT.md - Architecture and design decisions"
echo "5. DEVELOPMENT_GUIDE.md - How to implement next features"
echo "6. TESTING_GUIDE.md    - How to test the implementation"
echo "7. KNOWN_ISSUES.md     - Current issues and workarounds"
echo ""
echo -e "${YELLOW}Quick Actions:${NC}"
echo "a. View all files     - ls -la"
echo "b. Start development  - cd .. && npm run tauri dev"
echo "c. Run tests         - cd .. && ./run-tests.sh"
echo ""
read -p "Enter number/letter to view (or 'q' to quit): " choice

case $choice in
    1) cat README.md | less ;;
    2) cat QUICK_REFERENCE.md | less ;;
    3) cat PROJECT_STATUS.md | less ;;
    4) cat TECHNICAL_CONTEXT.md | less ;;
    5) cat DEVELOPMENT_GUIDE.md | less ;;
    6) cat TESTING_GUIDE.md | less ;;
    7) cat KNOWN_ISSUES.md | less ;;
    a) ls -la ;;
    b) cd .. && npm run tauri dev ;;
    c) cd .. && ./run-tests.sh ;;
    q) echo "Goodbye!" ;;
    *) echo "Invalid choice" ;;
esac