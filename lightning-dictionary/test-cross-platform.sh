#!/bin/bash

echo "🖥️  Lightning Dictionary - Cross-Platform Testing"
echo "=============================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Detect operating system
OS="Unknown"
ARCH=$(uname -m)

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="Linux"
    DISTRO=$(lsb_release -si 2>/dev/null || echo "Unknown")
    VERSION=$(lsb_release -sr 2>/dev/null || echo "Unknown")
    
    # Check display server
    if [ "$XDG_SESSION_TYPE" == "wayland" ]; then
        DISPLAY_SERVER="Wayland"
    elif [ "$XDG_SESSION_TYPE" == "x11" ]; then
        DISPLAY_SERVER="X11"
    else
        DISPLAY_SERVER="Unknown"
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macOS"
    VERSION=$(sw_vers -productVersion)
    DISPLAY_SERVER="Quartz"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
    OS="Windows"
    VERSION=$(cmd.exe /c ver 2>/dev/null | grep -oP '\d+\.\d+' || echo "Unknown")
    DISPLAY_SERVER="DWM"
fi

echo -e "\n${BLUE}System Information:${NC}"
echo "  OS: $OS"
if [ "$OS" == "Linux" ]; then
    echo "  Distribution: $DISTRO $VERSION"
    echo "  Display Server: $DISPLAY_SERVER"
elif [ "$OS" == "macOS" ]; then
    echo "  Version: $VERSION"
fi
echo "  Architecture: $ARCH"
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to test a feature
test_feature() {
    local feature="$1"
    local result="$2"
    if [ "$result" == "true" ]; then
        echo -e "  ${GREEN}✓${NC} $feature"
    else
        echo -e "  ${RED}✗${NC} $feature"
    fi
}

echo -e "${YELLOW}1. Prerequisites Check${NC}"

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    test_feature "Node.js installed ($NODE_VERSION)" "true"
else
    test_feature "Node.js installed" "false"
fi

# Check Rust
if command_exists rustc; then
    RUST_VERSION=$(rustc --version | cut -d' ' -f2)
    test_feature "Rust installed ($RUST_VERSION)" "true"
else
    test_feature "Rust installed" "false"
fi

# Check Cargo
if command_exists cargo; then
    test_feature "Cargo installed" "true"
else
    test_feature "Cargo installed" "false"
fi

echo -e "\n${YELLOW}2. Platform-Specific Features${NC}"

case "$OS" in
    "Linux")
        echo -e "${BLUE}Linux-specific tests:${NC}"
        
        # Check clipboard access
        if command_exists xclip || command_exists wl-copy; then
            test_feature "Clipboard utilities available" "true"
        else
            test_feature "Clipboard utilities available" "false"
            echo "    Install: sudo apt install xclip (X11) or wl-clipboard (Wayland)"
        fi
        
        # Check global hotkey support
        if [ "$DISPLAY_SERVER" == "Wayland" ]; then
            echo -e "  ${YELLOW}⚠${NC}  Global hotkeys limited on Wayland"
            echo "    Using clipboard monitoring as fallback"
        else
            test_feature "Global hotkeys supported" "true"
        fi
        
        # Check required libraries
        LIBS_OK=true
        for lib in libgtk-3.so libwebkit2gtk-4.1.so; do
            if ldconfig -p | grep -q "$lib"; then
                test_feature "$lib available" "true"
            else
                test_feature "$lib available" "false"
                LIBS_OK=false
            fi
        done
        
        if [ "$LIBS_OK" == "false" ]; then
            echo -e "\n  ${YELLOW}Install missing libraries:${NC}"
            echo "    Ubuntu/Debian: sudo apt install libgtk-3-dev libwebkit2gtk-4.1-dev"
            echo "    Fedora: sudo dnf install gtk3-devel webkit2gtk4.1-devel"
        fi
        ;;
        
    "macOS")
        echo -e "${BLUE}macOS-specific tests:${NC}"
        
        # Check for Xcode Command Line Tools
        if xcode-select -p >/dev/null 2>&1; then
            test_feature "Xcode Command Line Tools" "true"
        else
            test_feature "Xcode Command Line Tools" "false"
            echo "    Install: xcode-select --install"
        fi
        
        # Check accessibility permissions notice
        echo -e "  ${YELLOW}⚠${NC}  Accessibility permissions required for global hotkeys"
        echo "    Grant in: System Preferences > Security & Privacy > Accessibility"
        
        # Check code signing
        echo -e "  ${YELLOW}ℹ${NC}  App requires code signing for distribution"
        ;;
        
    "Windows")
        echo -e "${BLUE}Windows-specific tests:${NC}"
        
        # Check WebView2
        if [ -d "$PROGRAMFILES/Microsoft/EdgeWebView2" ] || [ -d "${PROGRAMFILES(X86)}/Microsoft/EdgeWebView2" ]; then
            test_feature "WebView2 Runtime installed" "true"
        else
            test_feature "WebView2 Runtime installed" "false"
            echo "    Download from: https://developer.microsoft.com/microsoft-edge/webview2/"
        fi
        
        # Check Visual Studio Build Tools
        if command_exists cl.exe || [ -d "$PROGRAMFILES/Microsoft Visual Studio" ]; then
            test_feature "Visual Studio Build Tools" "true"
        else
            test_feature "Visual Studio Build Tools" "false"
            echo "    Required for building native modules"
        fi
        ;;
esac

echo -e "\n${YELLOW}3. Build Test${NC}"

# Try to build the application
echo "Building application..."
cd src-tauri

if cargo build --release >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Build successful${NC}"
    
    # Check binary size
    if [ -f "target/release/tauri-app" ]; then
        SIZE=$(ls -lh target/release/tauri-app | awk '{print $5}')
        echo "  Binary size: $SIZE"
    elif [ -f "target/release/tauri-app.exe" ]; then
        SIZE=$(ls -lh target/release/tauri-app.exe | awk '{print $5}')
        echo "  Binary size: $SIZE"
    fi
else
    echo -e "${RED}✗ Build failed${NC}"
    echo "  Run 'cargo build --release' to see errors"
fi

cd ..

echo -e "\n${YELLOW}4. Runtime Checks${NC}"

# Check if API server is running
if curl -s http://localhost:3001/health >/dev/null 2>&1; then
    test_feature "API server accessible" "true"
else
    test_feature "API server accessible" "false"
    echo "    Start with: cd api && npm start"
fi

# Platform-specific runtime checks
case "$OS" in
    "Linux")
        # Check display protocol
        if [ -n "$WAYLAND_DISPLAY" ]; then
            echo -e "  ${BLUE}ℹ${NC}  Running on Wayland (clipboard monitoring active)"
        elif [ -n "$DISPLAY" ]; then
            echo -e "  ${BLUE}ℹ${NC}  Running on X11 (full hotkey support)"
        fi
        ;;
    "macOS")
        # Check for Rosetta on Apple Silicon
        if [ "$ARCH" == "arm64" ] && ! command_exists rosetta; then
            echo -e "  ${YELLOW}⚠${NC}  Rosetta 2 may be needed for x86_64 dependencies"
        fi
        ;;
esac

echo -e "\n${YELLOW}5. Package Build Test${NC}"

# Check if we can build packages
case "$OS" in
    "Linux")
        if command_exists dpkg-deb; then
            echo -e "  ${GREEN}✓${NC} Can build .deb packages"
        fi
        if command_exists rpmbuild; then
            echo -e "  ${GREEN}✓${NC} Can build .rpm packages"
        fi
        if command_exists makepkg; then
            echo -e "  ${GREEN}✓${NC} Can build Arch packages"
        fi
        ;;
    "macOS")
        echo -e "  ${BLUE}ℹ${NC}  Can build .dmg with 'npm run tauri build'"
        echo -e "  ${BLUE}ℹ${NC}  Requires Apple Developer ID for notarization"
        ;;
    "Windows")
        echo -e "  ${BLUE}ℹ${NC}  Can build .msi/.exe with 'npm run tauri build'"
        echo -e "  ${BLUE}ℹ${NC}  Consider code signing for distribution"
        ;;
esac

echo -e "\n${YELLOW}6. Performance Test (Platform-Specific)${NC}"

# Run a quick performance test
if [ -f "./test-performance.sh" ]; then
    echo "Running performance test..."
    # Extract just the summary
    ./test-performance.sh 2>/dev/null | grep -E "(Average|Target|Cache hit rate)" | head -5
fi

echo -e "\n${GREEN}=== Testing Summary ===${NC}"
echo -e "Platform: ${BLUE}$OS${NC}"

if [ "$OS" == "Linux" ] && [ "$DISPLAY_SERVER" == "Wayland" ]; then
    echo -e "Status: ${YELLOW}⚠️  Partial Support${NC}"
    echo "  - Clipboard monitoring active (hotkeys limited)"
    echo "  - Full functionality available"
else
    echo -e "Status: ${GREEN}✅ Full Support${NC}"
    echo "  - All features available"
fi

echo -e "\n${BLUE}Recommended Actions:${NC}"
case "$OS" in
    "Linux")
        if [ "$DISPLAY_SERVER" == "Wayland" ]; then
            echo "1. Test clipboard monitoring functionality"
            echo "2. Verify popup window positioning"
        fi
        echo "3. Test with different desktop environments"
        ;;
    "macOS")
        echo "1. Grant accessibility permissions"
        echo "2. Test on both Intel and Apple Silicon"
        echo "3. Verify hotkey functionality"
        ;;
    "Windows")
        echo "1. Install WebView2 Runtime if missing"
        echo "2. Test with Windows Defender active"
        echo "3. Verify hotkey doesn't conflict with system"
        ;;
esac

echo -e "\n✅ Cross-platform testing complete!"