#!/bin/bash

echo "🧪 Lightning Dictionary - Test Runner"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to run cache benchmarks
run_cache_benchmarks() {
    echo -e "${YELLOW}Running Cache Benchmarks...${NC}"
    cd src-tauri
    cargo test cache_benchmark::tests::test_benchmarks_run -- --nocapture
    cd ..
}

# Function to run unit tests
run_unit_tests() {
    echo -e "${YELLOW}Running Cache Unit Tests...${NC}"
    cd src-tauri
    cargo test cache::tests
    cd ..
}

# Function to build and check
run_build_check() {
    echo -e "${YELLOW}Checking Rust compilation...${NC}"
    cd src-tauri
    cargo check
    cd ..
}

# Main menu
echo "Select test to run:"
echo "1) Run cache benchmarks"
echo "2) Run cache unit tests"
echo "3) Run all tests"
echo "4) Check compilation only"
echo "5) Start development server"
echo ""
read -p "Enter choice (1-5): " choice

case $choice in
    1)
        run_cache_benchmarks
        ;;
    2)
        run_unit_tests
        ;;
    3)
        run_unit_tests
        echo ""
        run_cache_benchmarks
        ;;
    4)
        run_build_check
        ;;
    5)
        echo -e "${GREEN}Starting development server...${NC}"
        echo "Once started:"
        echo "- Press Alt+J to test hotkey"
        echo "- Use the test interface to check cache"
        echo "- Watch console for debug output"
        echo ""
        npm run tauri dev
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✅ Done!${NC}"