# Wayland Global Hotkey Solution

## Problem
Global hotkeys don't work on Wayland due to protocol limitations. The Wayland security model prevents applications from capturing keyboard events when they don't have focus.

## Solution Approach

We'll implement a multi-pronged approach:

1. **Runtime Detection**: Detect if running on X11 or Wayland
2. **Fallback Methods**: Provide alternative interaction methods for Wayland users
3. **Proper Configuration**: Use Tauri's official plugin with correct permissions

## Implementation Steps

### 1. Switch to Tauri's Official Plugin

Replace `global-hotkey` crate with `tauri-plugin-global-shortcut`.

### 2. Add Runtime Detection

Detect display server and provide appropriate UI/UX based on capabilities.

### 3. Alternative Interaction Methods

For Wayland users:
- System tray icon with quick access menu
- Command palette (Ctrl+K when window focused)̣
- Clipboard monitoring (optional, with user permission)
- Browser extension integration (future)

### 4. User Communication

Clearly inform users about Wayland limitations and available alternatives.

## Testing Commands

```bash
# Check display server
echo $XDG_SESSION_TYPE

# Force X11 (for testing)
GDK_BACKEND=x11 npm run tauri dev

# Test on Wayland
GDK_BACKEND=wayland npm run tauri dev
```