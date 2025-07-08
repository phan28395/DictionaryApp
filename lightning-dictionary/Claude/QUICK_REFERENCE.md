# ⚡ Quick Reference Card

## 🎯 Current Task
**Step 3.1: REST API Server** (Week 5-6 of Phase 1)
**Previous**: Step 2.3 Basic UI Popup ✅ COMPLETE

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
- **Popup Window**: Appears near cursor with definitions ✅
- **Performance**: <50ms achieved ✅
- **Multiple close methods**: ✕ button, Escape, click outside, auto-close
- **Wayland support**: Clipboard monitoring

## ❌ What's Missing
- Dictionary data (cache empty)
- Actual definitions
- API backend
- Pronunciation data

## 🎨 Next Implementation (Step 3.1: API Server)
```javascript
// 1. Create Express/Fastify server
const app = express();
app.use(compression());

// 2. Load dictionary data
const dictionary = require('./data/processed/dictionary.json');

// 3. API endpoints
app.get('/api/v1/define/:word', (req, res) => {
  const word = req.params.word.toLowerCase();
  const definition = dictionary[word];
  res.json(definition || null);
});
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