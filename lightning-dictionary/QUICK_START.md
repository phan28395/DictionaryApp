# 🚀 Quick Start Guide - Lightning Dictionary

## Prerequisites
Make sure you have:
- Node.js 18+ installed
- Rust installed (via rustup)
- Git installed

## Method 1: Using the Run Script (Recommended)

```bash
# From the lightning-dictionary directory
./run-app.sh
```

This script will:
1. Check if the API server is running
2. Start it if needed
3. Launch the desktop app
4. Open the dictionary window

## Method 2: Manual Start

### Step 1: Start the API Server
```bash
# Terminal 1
cd api
npm start
```

You should see:
```
Loaded 10 words into memory
Server listening at http://0.0.0.0:3001
```

### Step 2: Run the Desktop App
```bash
# Terminal 2 (new terminal)
cd lightning-dictionary
npm run tauri dev
```

This will:
- Build the Rust backend
- Start the React frontend
- Open the dictionary window

## Method 3: Production Build

```bash
# Build for production
npm run tauri build

# The executable will be in:
# Linux: src-tauri/target/release/bundle/
# Windows: src-tauri/target/release/bundle/msi/
# macOS: src-tauri/target/release/bundle/dmg/
```

## Troubleshooting

### API Server Issues
If port 3001 is already in use:
```bash
# Find and kill the process
lsof -i :3001
kill -9 <PID>

# Or use a different port
cd api
PORT=3002 npm start
```

### Build Errors
If you get Rust compilation errors:
```bash
# Clean and rebuild
cd src-tauri
cargo clean
cd ..
npm run tauri dev
```

### Missing Dependencies
```bash
# Install all dependencies
npm install
cd api && npm install
cd ../src-tauri && cargo build
```

## How to Use

1. **Hotkey Method** (if supported on your platform):
   - Select any text
   - Press `Alt+J` or `Ctrl+Shift+D`
   - Dictionary popup appears instantly

2. **Clipboard Method** (Wayland/Linux):
   - Copy any word (Ctrl+C)
   - Popup appears automatically

3. **Manual Test**:
   - Use the test input in the app
   - Type a word and click "Test Lookup"

## Test Words Available
The demo includes these test words:
- example
- test
- cache
- memory
- performance
- dictionary
- quick
- lightning
- popup
- api

## Features to Try

1. **Performance Dashboard**
   - Click "Load Stats" to see metrics
   - Check the <50ms response time

2. **Settings**
   - Click the ⚙️ Settings button
   - Customize appearance, behavior, and performance

3. **Keyboard Navigation**
   - Use Tab to navigate
   - Arrow keys to select definitions
   - Ctrl+C to copy
   - Escape to close

## Need Help?

- Check the logs in the terminal
- Make sure both API and app are running
- On Linux/Wayland, use clipboard method
- File issues at: [your-repo-url]

---
**Enjoy Lightning Dictionary! ⚡**