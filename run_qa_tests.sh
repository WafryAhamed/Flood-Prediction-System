#!/bin/bash
# Comprehensive QA Test Orchestration Script for Flood Resilience System
# For Linux/Mac systems

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Configuration
BACKEND_PORT=${BACKEND_PORT:-8001}
FRONTEND_PORT=${FRONTEND_PORT:-5173}
SKIP_BACKEND_START=${SKIP_BACKEND_START:-false}
SKIP_FRONTEND_START=${SKIP_FRONTEND_START:-false}
VERBOSE=${VERBOSE:-false}
TEST_TIMEOUT=${TEST_TIMEOUT:-600}

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Functions
print_header() {
    echo ""
    echo -e "${CYAN}${BOLD}$(printf '=%.0s' {1..80})${NC}"
    printf "%-80s\n" "$1" | sed "s/^/${CYAN}${BOLD}/; s/$/${NC}/"
    echo -e "${CYAN}${BOLD}$(printf '=%.0s' {1..80})${NC}\n"
}

print_status() {
    local TYPE=$1
    local MESSAGE=$2
    
    case $TYPE in
        "info")
            echo -e "ℹ️  $MESSAGE"
            ;;
        "success")
            echo -e "${GREEN}✓${NC} $MESSAGE"
            ;;
        "warning")
            echo -e "${YELLOW}⚠${NC}  $MESSAGE"
            ;;
        "error")
            echo -e "${RED}✗${NC}  $MESSAGE"
            ;;
    esac
}

wait_port() {
    local PORT=$1
    local TIMEOUT=${2:-30}
    local ELAPSED=0
    
    print_status "info" "Waiting for service on port $PORT to be ready..."
    
    while [ $ELAPSED -lt $TIMEOUT ]; do
        if nc -z localhost $PORT 2>/dev/null; then
            print_status "success" "Service on port $PORT is ready"
            return 0
        fi
        
        sleep 1
        ELAPSED=$((ELAPSED + 1))
        echo -n "."
    done
    
    echo ""
    print_status "error" "Service on port $PORT did not respond within $TIMEOUT seconds"
    return 1
}

start_backend() {
    print_header "STARTING BACKEND SERVER"
    
    # Check if backend is already running
    if nc -z localhost $BACKEND_PORT 2>/dev/null; then
        print_status "info" "Backend already running on port $BACKEND_PORT"
        return 0
    fi
    
    # Check if Python is available
    if ! command -v python &> /dev/null; then
        print_status "error" "Python not found in PATH"
        return 1
    fi
    
    print_status "info" "Starting backend server..."
    
    cd "$SCRIPT_DIR/server" || {
        print_status "error" "Cannot change to server directory"
        return 1
    }
    
    export PYTHONUNBUFFERED=1
    
    # Start backend in background
    python -m uvicorn app.main:app --reload --port $BACKEND_PORT > /tmp/backend.log 2>&1 &
    BACKEND_PID=$!
    
    # Wait for backend to be ready
    if wait_port $BACKEND_PORT 15; then
        print_status "success" "Backend started successfully (PID: $BACKEND_PID)"
        echo $BACKEND_PID > /tmp/backend.pid
        cd "$SCRIPT_DIR" || exit 1
        return 0
    else
        print_status "error" "Backend failed to start"
        cat /tmp/backend.log
        return 1
    fi
}

start_frontend() {
    print_header "STARTING FRONTEND SERVER"
    
    # Check if frontend is already running
    if nc -z localhost $FRONTEND_PORT 2>/dev/null; then
        print_status "info" "Frontend already running on port $FRONTEND_PORT"
        return 0
    fi
    
    print_status "info" "Starting frontend dev server..."
    
    cd "$SCRIPT_DIR/client" || {
        print_status "error" "Cannot change to client directory"
        return 1
    }
    
    # Start frontend in background
    npm run dev > /tmp/frontend.log 2>&1 &
    FRONTEND_PID=$!
    
    # Wait for frontend to be ready
    if wait_port $FRONTEND_PORT 30; then
        print_status "success" "Frontend started successfully (PID: $FRONTEND_PID)"
        echo $FRONTEND_PID > /tmp/frontend.pid
        cd "$SCRIPT_DIR" || exit 1
        return 0
    else
        print_status "warning" "Frontend failed to start (not critical)"
        cd "$SCRIPT_DIR" || exit 1
        return 0
    fi
}

run_tests() {
    print_header "RUNNING QA TEST SUITE"
    
    # Check if test script exists
    TEST_SCRIPT="$SCRIPT_DIR/qa_comprehensive_test.py"
    if [ ! -f "$TEST_SCRIPT" ]; then
        print_status "error" "Test script not found at $TEST_SCRIPT"
        return 1
    fi
    
    print_status "info" "Test Configuration:"
    echo "  Backend: http://localhost:$BACKEND_PORT"
    echo "  Time: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    
    # Run the test script with timeout
    TIMEOUT_CMD=""
    if command -v timeout &> /dev/null; then
        TIMEOUT_CMD="timeout $TEST_TIMEOUT"
    fi
    
    cd "$SCRIPT_DIR" || exit 1
    
    if [ "$VERBOSE" = "true" ]; then
        print_status "info" "Running tests with verbose output..."
        $TIMEOUT_CMD python "$TEST_SCRIPT"
    else
        print_status "info" "Running tests..."
        $TIMEOUT_CMD python "$TEST_SCRIPT"
    fi
    
    local EXIT_CODE=$?
    
    if [ $EXIT_CODE -eq 0 ]; then
        print_status "success" "All tests passed successfully!"
        return 0
    elif [ $EXIT_CODE -eq 124 ]; then
        print_status "error" "Tests timed out after $TEST_TIMEOUT seconds"
        return 1
    else
        print_status "warning" "Some tests failed. Check output above."
        return 1
    fi
}

cleanup() {
    print_status "info" "Cleaning up..."
    
    # Kill backend if we started it
    if [ -f /tmp/backend.pid ]; then
        BACKEND_PID=$(cat /tmp/backend.pid)
        if kill -0 $BACKEND_PID 2>/dev/null; then
            kill $BACKEND_PID 2>/dev/null || true
            print_status "info" "Backend stopped (PID: $BACKEND_PID)"
        fi
        rm /tmp/backend.pid
    fi
    
    # Kill frontend if we started it
    if [ -f /tmp/frontend.pid ]; then
        FRONTEND_PID=$(cat /tmp/frontend.pid)
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            kill $FRONTEND_PID 2>/dev/null || true
            print_status "info" "Frontend stopped (PID: $FRONTEND_PID)"
        fi
        rm /tmp/frontend.pid
    fi
}

show_menu() {
    print_header "FLOOD RESILIENCE QA TEST SUITE"
    
    echo "Select test phase to run:"
    echo ""
    echo "  1.   Phase 1:  Server Connectivity & Baseline"
    echo "  2.   Phase 2:  Authentication & Authorization"
    echo "  3.   Phase 3:  Core User Flows"
    echo "  4.   Phase 4:  API Validation"
    echo "  5.   Phase 5:  Real-time Features"
    echo "  6.   Phase 6:  Security & Headers"
    echo "  7.   Phase 7:  Performance Baseline"
    echo "  all. Run all phases (recommended)"
    echo "  exit. Exit"
    echo ""
}

main() {
    # Print banner
    echo -e "${BOLD}${BLUE}┏$(printf '━%.0s' {1..78})┓${NC}"
    echo -e "${BOLD}${BLUE}┃$(printf ' %.0s' {1..78})┃${NC}"
    echo -e "${BOLD}${BLUE}┃     FLOOD RESILIENCE SYSTEM - QA TESTING SUITE                         ┃${NC}"
    echo -e "${BOLD}${BLUE}┃$(printf ' %.0s' {1..78})┃${NC}"
    echo -e "${BOLD}${BLUE}┗$(printf '━%.0s' {1..78})┛${NC}\n"
    
    # Setup cleanup on exit
    trap cleanup EXIT
    
    # Start servers
    if [ "$SKIP_BACKEND_START" = "false" ]; then
        if ! start_backend; then
            print_status "error" "Cannot proceed without backend server"
            exit 1
        fi
    else
        print_status "info" "Backend startup skipped (using existing service)"
    fi
    
    if [ "$SKIP_FRONTEND_START" = "false" ]; then
        start_frontend || true
    fi
    
    # Run tests
    if run_tests; then
        TESTS_PASSED=true
    else
        TESTS_PASSED=false
    fi
    
    # Show results
    print_header "TEST EXECUTION COMPLETED"
    
    if [ "$TESTS_PASSED" = "true" ]; then
        echo -e "${GREEN}${BOLD}✅ QA Testing Suite Completed Successfully${NC}"
        echo ""
        print_status "success" "System is ready for staging deployment"
    else
        echo -e "${YELLOW}${BOLD}⚠️  Some tests did not pass${NC}"
        echo ""
        print_status "warning" "Review the test output above and fix issues before deploying"
    fi
    
    echo ""
    print_status "info" "Next Steps:"
    echo "  1. Review test results above"
    echo "  2. Check QA_TEST_EXECUTION_GUIDE.md for troubleshooting"
    echo "  3. Address any failed tests"
    echo "  4. Re-run tests after fixes"
    echo ""
    
    # Exit with appropriate code
    if [ "$TESTS_PASSED" = "true" ]; then
        exit 0
    else
        exit 1
    fi
}

# Check required commands
check_requirements() {
    local missing=()
    
    if ! command -v python &> /dev/null; then
        missing+=("python")
    fi
    
    if ! command -v nc &> /dev/null; then
        # nc might be called netcat on some systems
        if ! command -v netcat &> /dev/null; then
            print_status "warning" "netcat not found - will skip port checks"
        fi
    fi
    
    if [ ${#missing[@]} -gt 0 ]; then
        print_status "error" "Missing required commands: ${missing[*]}"
        exit 1
    fi
}

# Check requirements
check_requirements

# Run main
main
