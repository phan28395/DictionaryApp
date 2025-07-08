# Known Issues & Workarounds

## ✅ Recently Fixed Issues

### Popup Window Control Issues (Fixed 2025-01-08)
**Issue**: Frameless popup appeared on startup, couldn't be closed or moved
**Solution Implemented**:
- Added window decorations (title bar with close/minimize buttons)
- Made window resizable and movable
- Added multiple close methods:
  - Visual ✕ button in top-right corner
  - Escape key handler
  - Click outside popup to close
  - Auto-close after 10 seconds
- Added 2-second startup delay to prevent ghost popups
**Files Modified**:
- `src-tauri/src/hotkey_v2.rs` - Window configuration
- `src/components/Popup.tsx` - Close handlers
- `src/components/Popup.css` - Close button styling

## 🐛 Current Issues

### 1. Wayland Hotkey Support
**Issue**: Global hotkeys don't work on Wayland (Fedora 42, Ubuntu 22.04+)
**Workaround**: 
- Clipboard monitoring is implemented as fallback
- Users copy words to trigger lookup
- Shows warning message in UI

**Future Fix**: 
- Investigate Wayland protocols for global shortcuts
- Consider desktop environment specific solutions

### 2. Empty Cache (No Dictionary Data)
**Issue**: Cache has no dictionary data loaded
**Impact**: All lookups result in cache miss
**Workaround**: 
- This is expected in current phase
- Dictionary data loading comes in Week 5-6

**Next Steps**:
- Load data from processed JSON files
- Implement data loader on app startup

### 3. ~~Main Window Instead of Popup~~ ✅ FIXED
**Issue**: ~~Currently using main window, not a popup~~
**Status**: ✅ FIXED in Step 2.3 implementation
**Solution**: Popup window now implemented with proper controls

### 4. Platform-Specific Issues

#### Linux
- **xdotool dependency**: Not installed by default
  ```bash
  # Fix:
  sudo apt install xdotool  # Debian/Ubuntu
  sudo dnf install xdotool  # Fedora
  ```

#### macOS
- **Accessibility permissions**: May need manual approval
- **Hotkey conflict**: Cmd+D might be taken by system

#### Windows
- **Run as administrator**: Sometimes needed for global hotkeys
- **Antivirus interference**: May block hotkey registration

## ⚠️ Warnings in Code

### Rust Warnings
```
warning: methods `insert`, `size`, `clear`, and `contains` are never used
```
**Status**: Ignore - these will be used when implementing data loading

### TypeScript Warnings
```
Type 'any' used in event handlers
```
**Fix**: Add proper types for event payloads when stable

## 🔧 Technical Debt

### 1. Clipboard Restoration
**Current**: Basic clipboard save/restore
**Issue**: Might lose clipboard content in edge cases
**Improvement**: More robust clipboard handling with error recovery

### 2. Error Handling
**Current**: Errors logged to console only
**Issue**: Users don't see error messages
**Improvement**: User-facing error notifications

### 3. Memory Management
**Current**: Fixed 10,000 word limit
**Issue**: No user control over cache size
**Improvement**: Configurable cache size in settings

### 4. Event Type Safety
**Current**: Some events use loose typing
**Issue**: Potential runtime errors
**Improvement**: Strict TypeScript types for all events

## 🚨 Performance Concerns

### 1. Clipboard Polling (Wayland)
**Issue**: Polls every 500ms
**Impact**: Unnecessary CPU usage
**Future**: Event-based system when available

### 2. Text Selection Method
**Issue**: Modifies clipboard temporarily
**Impact**: Might interfere with clipboard managers
**Alternative**: Investigate OS-specific selection APIs

## 📋 Compatibility Matrix

| Feature | Windows | macOS | Linux X11 | Linux Wayland |
|---------|---------|--------|-----------|---------------|
| Alt+J Hotkey | ✅ | ⚠️ | ✅ | ❌ |
| Ctrl+Shift+D | ✅ | ✅ | ✅ | ❌ |
| Text Selection | ✅ | ✅ | ✅ | ✅ |
| Clipboard Monitor | ✅ | ✅ | ✅ | ✅ |
| Popup Window | ✅ | ✅ | ✅ | ✅ |

Legend: ✅ Working | ⚠️ Needs Permission | ❌ Not Supported | 🚧 Not Implemented

## 🔍 Debugging These Issues

### Enable Verbose Logging
```bash
RUST_LOG=debug npm run tauri dev
```

### Check Tauri Info
```bash
npm run tauri info
# Verify all dependencies are met
```

### Test Specific Components
```bash
# Test cache only
cargo test cache::

# Test with specific window manager
XDG_SESSION_TYPE=x11 npm run tauri dev
```

## 📝 Reporting New Issues

When discovering new issues:
1. Add to this document
2. Include reproduction steps
3. Document any workarounds
4. Update compatibility matrix if needed

Format:
```markdown
### [Issue Title]
**Issue**: Brief description
**Reproduction**: Steps to reproduce
**Impact**: What doesn't work
**Workaround**: Temporary solution
**Fix**: Planned permanent solution
```

## 🎯 Priority Issues for Next Session

1. **Implement Popup Window** (Step 2.3)
   - Fixes "main window instead of popup"
   - Critical for UX

2. **Load Test Data**
   - Add sample dictionary entries
   - Enables meaningful testing

3. **Improve Error Display**
   - Show errors in UI
   - Better debugging experience

## 💡 Tips for New Contributors

- Start with manual testing to understand current state
- Check console output for debugging info
- Wayland users should use clipboard method
- Performance is measured and logged automatically
- All platform-specific code is marked with comments