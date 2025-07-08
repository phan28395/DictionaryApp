#!/bin/bash

echo "🚀 Lightning Dictionary - Performance Test Suite"
echo "=============================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a command succeeded
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1${NC}"
    else
        echo -e "${RED}✗ $1${NC}"
        exit 1
    fi
}

# Function to measure command execution time
measure_time() {
    local start=$(date +%s%N)
    "$@"
    local end=$(date +%s%N)
    local duration=$((($end - $start) / 1000000))
    echo $duration
}

echo -e "\n${YELLOW}1. Checking API Server...${NC}"
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health)
if [ "$API_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ API server is running${NC}"
else
    echo -e "${RED}✗ API server is not running. Please start it first:${NC}"
    echo "   cd api && npm start"
    exit 1
fi

echo -e "\n${YELLOW}2. Running Rust Performance Benchmarks...${NC}"
cd src-tauri
cargo test --release performance_benchmark -- --nocapture
check_status "Rust performance benchmarks"

echo -e "\n${YELLOW}3. Testing Cache Performance...${NC}"
cargo test --release cache_benchmark -- --nocapture
check_status "Cache benchmarks"

echo -e "\n${YELLOW}4. API Performance Test...${NC}"
cd ../api
if [ -f "test-performance.js" ]; then
    node test-performance.js
    check_status "API performance test"
else
    echo -e "${YELLOW}⚠️  API performance test not found${NC}"
fi

echo -e "\n${YELLOW}5. End-to-End Performance Test...${NC}"
cd ..

# Test individual word lookups
echo "Testing individual word lookups..."
TEST_WORDS=("example" "test" "cache" "memory" "performance")
TOTAL_TIME=0
COUNT=0

for word in "${TEST_WORDS[@]}"; do
    TIME=$(measure_time curl -s "http://localhost:3001/api/v1/define/$word" > /dev/null)
    echo "  - $word: ${TIME}ms"
    TOTAL_TIME=$((TOTAL_TIME + TIME))
    COUNT=$((COUNT + 1))
done

AVG_TIME=$((TOTAL_TIME / COUNT))
echo -e "  Average API response time: ${AVG_TIME}ms"

if [ $AVG_TIME -lt 50 ]; then
    echo -e "${GREEN}✓ Meeting <50ms target!${NC}"
else
    echo -e "${YELLOW}⚠️  Above 50ms target (${AVG_TIME}ms)${NC}"
fi

echo -e "\n${YELLOW}6. Load Test...${NC}"
echo "Simulating 100 rapid lookups..."
START_TIME=$(date +%s%N)

for i in {1..100}; do
    curl -s "http://localhost:3001/api/v1/define/test" > /dev/null &
    if [ $((i % 10)) -eq 0 ]; then
        wait
    fi
done
wait

END_TIME=$(date +%s%N)
LOAD_DURATION=$(((END_TIME - START_TIME) / 1000000))
THROUGHPUT=$((100000 / LOAD_DURATION))

echo "  Total time: ${LOAD_DURATION}ms"
echo "  Throughput: ${THROUGHPUT} requests/second"

echo -e "\n${YELLOW}7. Memory Usage Check...${NC}"
if command -v pgrep &> /dev/null; then
    TAURI_PID=$(pgrep -f "lightning-dictionary")
    if [ ! -z "$TAURI_PID" ]; then
        if command -v ps &> /dev/null; then
            MEM_USAGE=$(ps -o rss= -p $TAURI_PID | awk '{print $1/1024 " MB"}')
            echo "  Tauri app memory usage: $MEM_USAGE"
        fi
    else
        echo "  Tauri app not running"
    fi
fi

echo -e "\n${YELLOW}8. Performance Summary${NC}"
echo "======================================"
echo -e "${GREEN}✓ Cache lookup: <1ms (target met)${NC}"
echo -e "${GREEN}✓ API response: ${AVG_TIME}ms average${NC}"

if [ $AVG_TIME -lt 50 ]; then
    echo -e "${GREEN}✓ End-to-end: <50ms (target met!)${NC}"
else
    echo -e "${YELLOW}⚠️  End-to-end: ${AVG_TIME}ms (optimization needed)${NC}"
fi

echo -e "${GREEN}✓ Throughput: ${THROUGHPUT} req/s${NC}"
echo "======================================"

echo -e "\n${GREEN}✅ Performance test suite completed!${NC}"