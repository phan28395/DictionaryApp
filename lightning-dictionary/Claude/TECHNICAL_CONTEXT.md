# Technical Context - Lightning Dictionary

## Architecture Overview

```
┌─────────────────────┐     ┌─────────────────────┐
│   Frontend (React)  │────▶│   Backend (Rust)    │
│  - UI Components    │     │  - Hotkey Handler   │
│  - Event Listeners  │     │  - Memory Cache     │
│  - Test Interface   │     │  - Text Selection   │
└─────────────────────┘     └─────────────────────┘
         │                           │
         └──────── Tauri IPC ────────┘
              (Events & Commands)
```

## Key Technical Decisions

### 1. Cache Implementation
**Decision**: HashMap + VecDeque for LRU
**Rationale**: 
- O(1) lookups and insertions
- O(1) LRU eviction
- Simple and performant

**Code Location**: `src-tauri/src/cache.rs`

### 2. Thread Safety
**Decision**: Arc<Mutex<DictionaryCache>>
**Rationale**:
- Simple to understand and implement
- Sufficient for current performance needs
- Can migrate to lock-free later if needed

### 3. Hotkey System
**Decision**: tauri-plugin-global-shortcut + clipboard manipulation
**Rationale**:
- Official Tauri plugin for cross-platform support
- Clipboard method works universally for text selection
- Fallback options for compatibility

**Code Location**: `src-tauri/src/hotkey_v2.rs`

### 4. Event Communication
**Decision**: Tauri event system
**Rationale**:
- Built-in to Tauri
- Type-safe with TypeScript
- Supports bidirectional communication

## Current Implementation Details

### Cache Module (`cache.rs`)
```rust
pub struct DictionaryCache {
    words: HashMap<String, CacheEntry>,
    lru_order: VecDeque<String>,
    max_size: usize,
}
```
- Stores up to 10,000 words
- Tracks access time for LRU
- Thread-safe wrapper provided

### Hotkey Module (`hotkey_v2.rs`)
- Registers Alt+J and Ctrl+Shift+D
- Captures selected text via clipboard
- Emits events with cache lookup results
- Includes Wayland fallback

### Frontend (`App.tsx`)
- Listens for word-definition events
- Displays cache test interface
- Shows performance metrics
- Handles both hotkey and clipboard events

## Performance Characteristics

### Measured Performance
- **Cache Lookup**: ~100ns (0.0001ms)
- **Hotkey Response**: ~10ms
- **Event Emission**: ~1ms
- **Total Current**: ~11ms

### Target Performance
- **Total Popup Time**: <50ms
- **Remaining Budget**: ~39ms for UI

### Memory Usage
- **Per Word**: ~5KB
- **Full Cache**: ~50MB (10,000 words)
- **Application Base**: ~30MB

## Platform-Specific Considerations

### Linux
- Uses `xdotool` for clipboard manipulation
- May require installation: `sudo apt install xdotool`
- Wayland requires clipboard monitoring fallback

### Windows
- Native clipboard API works well
- No special requirements
- Alt+J may conflict with some applications

### macOS
- Requires accessibility permissions
- Use Cmd+D as primary hotkey
- Clipboard access needs user approval

## Event Flow

1. **User presses hotkey** (Alt+J)
2. **Rust handler triggered** in `handle_hotkey_press`
3. **Text selection captured** via clipboard
4. **Cache lookup performed** (<1ms)
5. **Event emitted** with results:
   ```json
   {
     "word": "example",
     "definition": null,
     "from_cache": false,
     "lookup_time_ms": 0.1
   }
   ```
6. **React receives event** and updates UI

## Tauri Commands

### `lookup_word`
- **Input**: `word: string`
- **Output**: `Definition | null`
- **Usage**: Direct cache lookup from frontend

### `cache_stats`
- **Input**: None
- **Output**: JSON string with cache statistics
- **Usage**: Monitor cache performance

## Next Implementation: Popup Window

### Requirements
1. Create separate window for popup
2. Position near cursor
3. Frameless design
4. Auto-hide functionality

### Suggested Approach
```rust
// In Rust
let popup = tauri::WindowBuilder::new(
    app,
    "popup",
    tauri::WindowUrl::App("popup.html".into())
)
.decorations(false)
.always_on_top(true)
.skip_taskbar(true)
.inner_size(300.0, 200.0)
.build()?;
```

```tsx
// In React (new component)
const PopupWindow: React.FC = () => {
  useEffect(() => {
    // Auto-hide after 10 seconds
    const timer = setTimeout(() => {
      window.close();
    }, 10000);
    return () => clearTimeout(timer);
  }, []);
  
  return <DefinitionDisplay />;
};
```

## Testing Approach

### Unit Tests
- Cache operations: `cargo test cache::`
- Benchmark suite: `cargo test benchmark::`

### Integration Tests
- Hotkey functionality: Manual testing
- Event flow: Console logging
- Performance: Built-in timing

### E2E Tests
- Not yet implemented
- Planned for Phase 2

## Known Technical Debt

1. **Clipboard Restoration**: Currently basic, could be more robust
2. **Error Handling**: Some errors only logged, not surfaced
3. **Wayland Support**: Requires polling, not event-driven
4. **Type Safety**: Some event payloads use `any` type

## Resources

- [Tauri Docs](https://tauri.app/v1/guides/)
- [Tauri Window API](https://tauri.app/v1/api/js/window/)
- [Global Hotkey Plugin](https://github.com/tauri-apps/plugins-workspace/tree/v2/plugins/global-shortcut)
- Project Spec: `/home/phanvu/Documents/Company/DictionaryApp/SAP_Dictionary.md`