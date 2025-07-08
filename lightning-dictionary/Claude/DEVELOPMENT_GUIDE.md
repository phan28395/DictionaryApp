# Development Guide - Lightning Dictionary

## 🚀 Starting Development

### Prerequisites Check
```bash
# Verify installations
node --version  # Should be 18+
rustc --version # Should be 1.70+
cargo --version
git --version
```

### Project Setup
```bash
# Clone and setup
cd /home/phanvu/Documents/Company/DictionaryApp/lightning-dictionary
npm install
npm run tauri dev
```

## 📁 Project Structure

```
lightning-dictionary/
├── src/                    # React frontend
│   ├── App.tsx            # Main app with test interface
│   ├── App.css            # Styles
│   └── main.tsx           # Entry point
├── src-tauri/             # Rust backend
│   ├── src/
│   │   ├── lib.rs         # Main library, Tauri commands
│   │   ├── main.rs        # Application entry
│   │   ├── cache.rs       # Cache implementation ✅
│   │   ├── hotkey_v2.rs   # Hotkey system ✅
│   │   └── cache_benchmark.rs # Performance tests
│   ├── Cargo.toml         # Rust dependencies
│   └── tauri.conf.json    # Tauri configuration
├── CLAUDE.md              # Main implementation guide
├── CHANGELOG.md           # Progress tracking
└── Claude/                # Handoff documentation
```

## 🎯 Next Task: Step 2.3 - Basic UI Popup

### Implementation Steps

#### 1. Create Popup Window (Rust Side)
Location: `src-tauri/src/lib.rs` or new `popup.rs`

```rust
// Add to lib.rs
pub fn create_popup_window(app: &AppHandle) -> Result<Window, Error> {
    let window = WindowBuilder::new(
        app,
        "popup",
        WindowUrl::App("popup.html".into())
    )
    .title("")
    .decorations(false)
    .always_on_top(true)
    .skip_taskbar(true)
    .inner_size(350.0, 250.0)
    .visible(false) // Start hidden
    .build()?;
    
    Ok(window)
}
```

#### 2. Position Near Cursor
```rust
// Get cursor position and position window
use tauri::PhysicalPosition;

fn position_popup_near_cursor(window: &Window) {
    // Get cursor position (platform specific)
    let (x, y) = get_cursor_position();
    
    // Offset slightly so popup doesn't cover selection
    window.set_position(PhysicalPosition::new(
        x + 10,
        y + 10
    )).ok();
}
```

#### 3. Create Popup React Component
Location: `src/components/PopupWindow.tsx`

```tsx
import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { appWindow } from '@tauri-apps/api/window';

export const PopupWindow: React.FC = () => {
    const [definition, setDefinition] = useState(null);
    
    useEffect(() => {
        // Auto-hide timer
        const timer = setTimeout(() => {
            appWindow.hide();
        }, 10000);
        
        // Listen for definition events
        const unlisten = listen('show-definition', (event) => {
            setDefinition(event.payload);
            appWindow.show();
        });
        
        return () => {
            clearTimeout(timer);
            unlisten.then(fn => fn());
        };
    }, []);
    
    return (
        <div className="popup-container">
            {/* Definition display */}
        </div>
    );
};
```

#### 4. Update Hotkey Handler
Modify `src-tauri/src/hotkey_v2.rs`:

```rust
// Instead of showing main window, show popup
if let Some(popup) = app.get_window("popup") {
    position_popup_near_cursor(&popup);
    popup.show().unwrap();
    popup.set_focus().unwrap();
}
```

### 🎨 Design Requirements

#### CSS for Popup (`src/popup.css`)
```css
.popup-container {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    padding: 16px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.word-header {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 4px;
}

.pronunciation {
    color: #666;
    font-size: 14px;
    margin-bottom: 8px;
}

.part-of-speech {
    color: #0066cc;
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
}

.definition {
    font-size: 14px;
    line-height: 1.5;
    color: #333;
}
```

### 🧪 Testing the Implementation

#### Manual Testing Checklist
- [ ] Popup appears near cursor
- [ ] Popup shows for exactly 10 seconds
- [ ] Popup is always on top
- [ ] Popup has no window decorations
- [ ] Definition displays correctly
- [ ] Performance is under 50ms

#### Performance Testing
```typescript
// Add to hotkey handler
const startTime = performance.now();
// ... show popup ...
console.log(`Popup time: ${performance.now() - startTime}ms`);
```

## 🔧 Common Development Tasks

### Adding a New Tauri Command
```rust
// In lib.rs
#[tauri::command]
fn my_new_command(param: String) -> Result<String, String> {
    Ok(format!("Received: {}", param))
}

// Add to invoke_handler
.invoke_handler(tauri::generate_handler![
    greet,
    lookup_word,
    cache_stats,
    my_new_command // Add here
])
```

### Adding a New Event
```rust
// Emit from Rust
app.emit("my-event", payload)?;

// Listen in React
useEffect(() => {
    const unlisten = listen('my-event', (event) => {
        console.log('Received:', event.payload);
    });
    return () => { unlisten.then(fn => fn()); };
}, []);
```

### Running Specific Tests
```bash
# Cache tests only
cd src-tauri
cargo test cache::

# Benchmarks
cargo test benchmark:: -- --nocapture

# Frontend tests (when added)
npm test
```

## 📝 Code Style Guidelines

### Rust
- Use `rustfmt` for formatting
- Prefer `Result<T, E>` for error handling
- Add doc comments for public functions
- Keep functions small and focused

### TypeScript/React
- Use functional components
- Prefer hooks over class components
- Type all props and state
- Use `const` by default

### Git Commits
- Use present tense ("Add feature" not "Added feature")
- Keep commits atomic
- Reference issue numbers when applicable

## 🐛 Debugging Tips

### Rust Backend
```rust
// Use println! for quick debugging
println!("Debug: {:?}", variable);

// Use log crate for production
log::debug!("Cache hit for word: {}", word);
```

### React Frontend
```typescript
// Console logging
console.log('Event received:', event);

// React DevTools
// Install browser extension for component inspection
```

### Tauri Specific
```bash
# Enable Rust backtrace
RUST_BACKTRACE=1 npm run tauri dev

# Check Tauri info
npm run tauri info
```

## 📚 Helpful Resources

### Documentation
- [Tauri Guides](https://tauri.app/v1/guides/)
- [Tauri API](https://tauri.app/v1/api/js/)
- [Rust Book](https://doc.rust-lang.org/book/)
- [React Docs](https://react.dev/)

### Project Specific
- Main spec: `SAP_Dictionary.md`
- Implementation guide: `CLAUDE.md`
- Current status: `Claude/PROJECT_STATUS.md`

### Community
- [Tauri Discord](https://discord.com/invite/tauri)
- [Rust Discord](https://discord.gg/rust-lang)

## ⚡ Performance Tips

1. **Minimize Re-renders**: Use React.memo and useMemo
2. **Lazy Load**: Don't load all definitions at once
3. **Debounce Events**: Prevent rapid-fire lookups
4. **Profile First**: Measure before optimizing

## 🚨 Common Pitfalls

1. **Window Management**: Always check if window exists before using
2. **Event Cleanup**: Always unlisten in useEffect cleanup
3. **Thread Safety**: Use Arc<Mutex<>> for shared state
4. **Platform Differences**: Test on all target platforms