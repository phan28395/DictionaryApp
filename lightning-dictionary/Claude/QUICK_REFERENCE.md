# ⚡ Quick Reference Card

## 🎯 Current Task
**Step 2.3: Basic UI Popup** (Week 3-4 of Phase 1)

## 📍 Key Commands
```bash
cd /home/phanvu/Documents/Company/DictionaryApp/lightning-dictionary
npm run tauri dev          # Start development
./run-tests.sh            # Run test suite
```

## 🔑 Important Files
| Purpose | Location |
|---------|----------|
| Main Guide | `/CLAUDE.md` |
| Project Spec | `/SAP_Dictionary.md` |
| Cache Code | `src-tauri/src/cache.rs` |
| Hotkey Code | `src-tauri/src/hotkey_v2.rs` |
| React App | `src/App.tsx` |
| Status | `Claude/PROJECT_STATUS.md` |

## ✅ What's Working
- Hotkeys: Alt+J, Ctrl+Shift+D
- Cache: <1ms lookups, 10k capacity
- Events: Frontend ↔ Backend communication
- Performance: ~11ms current (target <50ms)

## ❌ What's Missing
- Popup window (using main window)
- Dictionary data (cache empty)
- Actual definitions
- API backend

## 🎨 Next Implementation
```rust
// 1. Create popup window in Rust
WindowBuilder::new(app, "popup", WindowUrl::App("popup.html"))
    .decorations(false)
    .always_on_top(true)
    .inner_size(350.0, 250.0)

// 2. Position near cursor
window.set_position(cursor_x + 10, cursor_y + 10)

// 3. Show/hide on hotkey
popup.show() / popup.hide()
```

```tsx
// 4. React popup component
const PopupWindow = () => {
  // Auto-hide after 10 seconds
  // Display definition
  // Clean design
}
```

## 🧪 Test Flow
1. Select text anywhere
2. Press Alt+J
3. Popup appears near cursor *(not yet)*
4. Shows definition *(cache miss currently)*
5. Auto-hides after 10s *(not yet)*

## 📊 Performance Budget
- Used: ~11ms ✅
- Remaining: ~39ms
- Target: <50ms total

## 🐛 Quick Fixes
| Problem | Solution |
|---------|----------|
| Hotkey not working | Try Ctrl+Shift+D or check console |
| No output | Make sure using `npm run tauri dev` |
| Wayland user | Use clipboard copy method |
| Build errors | `cargo clean` then rebuild |

## 📈 Progress
Phase 1: Foundation & Core Experience
- [x] Week 1-2: Setup ✅
- [x] Week 3: Hotkeys + Cache ✅
- [ ] Week 4: UI Popup 🚧
- [ ] Week 5-6: API
- [ ] Week 7-8: Polish

## 💬 Key Decisions Made
1. LRU cache with HashMap + VecDeque
2. Clipboard method for text selection
3. Tauri events for IPC
4. 10,000 word cache limit
5. Thread-safe with Arc<Mutex<>>

## 🚀 Success Criteria for Next Step
- [ ] Frameless popup window
- [ ] Appears within 50ms
- [ ] Positioned near cursor
- [ ] Auto-hide timer works
- [ ] Clean, beautiful design
- [ ] No performance regression