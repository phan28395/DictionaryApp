# Testing Guide - Lightning Dictionary

## 🧪 Current Testing Status

### What's Implemented
- ✅ Cache unit tests
- ✅ Cache benchmark suite
- ✅ Manual test interface in UI
- ✅ Performance measurement utilities

### What's Not Yet Implemented
- ❌ E2E tests (coming in Phase 2)
- ❌ Integration tests for popup
- ❌ Automated UI tests

## 🚀 Quick Test Commands

```bash
# Run all tests
./run-tests.sh

# Specific test types
cd src-tauri
cargo test                    # All Rust tests
cargo test cache::           # Cache unit tests only
cargo test benchmark:: -- --nocapture  # Benchmarks with output

# Start app for manual testing
npm run tauri dev
```

## 📋 Manual Testing Checklist

### Cache Functionality
- [ ] Launch app with `npm run tauri dev`
- [ ] Enter word in test input → Shows "cache miss"
- [ ] Check cache stats → Shows 0/10000 words
- [ ] Lookup time displayed → Should be <1ms

### Hotkey Testing
- [ ] Select text in any application
- [ ] Press Alt+J (or Ctrl+Shift+D)
- [ ] Console shows "Selected text: [text]"
- [ ] Main window becomes visible
- [ ] Cache lookup attempted

### Wayland Testing (Linux)
- [ ] Copy single word to clipboard
- [ ] Console shows "Valid word detected"
- [ ] Clipboard monitoring active message

## 🔬 Performance Testing

### Current Measurements
```
Cache Lookup: ~100ns (0.0001ms) ✅
Hotkey Response: ~10ms ✅
Event Emission: ~1ms ✅
Total Current: ~11ms ✅
Target Total: <50ms (39ms remaining for UI)
```

### How to Measure
1. **Cache Performance**:
   ```bash
   cargo test benchmark::tests::test_benchmarks_run -- --nocapture
   ```

2. **End-to-End Timing**:
   - Check console output for timing logs
   - Look for "Lookup time: X ms" in UI

3. **Memory Usage**:
   - Check cache stats in UI
   - Shows estimated memory usage

## 🐛 Test Scenarios

### Scenario 1: Basic Cache Test
```
1. Start app
2. Type "hello" in test input
3. Press Enter or click "Test Lookup"
4. Expected: Cache miss (no data loaded yet)
5. Check stats: 0/10000 words
```

### Scenario 2: Hotkey Selection
```
1. Open a text editor
2. Type and select "example"
3. Press Alt+J
4. Expected: App window appears
5. Console shows selected text
6. UI shows cache miss
```

### Scenario 3: Performance Verification
```
1. Run benchmark suite
2. Verify all tests show ✓ PASS
3. Check average lookup < 1µs
4. Check memory < 50MB for 10k words
```

## 🔍 Debugging Test Failures

### Common Issues

#### "Hotkey not working"
```bash
# Check if another app uses Alt+J
# Linux: Check with
xbindkeys -k

# Try fallback hotkey Ctrl+Shift+D
```

#### "No console output"
```bash
# Make sure running in dev mode
npm run tauri dev  # NOT npm start

# Check correct terminal window
```

#### "Cache tests fail"
```bash
# Clean and rebuild
cd src-tauri
cargo clean
cargo build
cargo test
```

## 📊 Test Output Examples

### Good Cache Benchmark Output
```
=== Dictionary Cache Benchmarks ===

1. Insertion Performance Test
  - Average insertion time: 523 ns
  - Max insertion time: 15234 ns
  - Min insertion time: 234 ns
  - Total insertions: 10000

2. Lookup Performance Test
  - Average lookup time: 89 ns (0.089 µs)
  - Max lookup time: 234 ns (0.234 µs)
  - Target: <1ms (1,000,000 ns)
  - Status: ✓ PASS
```

### Console Output During Testing
```
✓ Global shortcuts registered successfully
Hotkey manager setup successfully
Alt+J pressed!
Showing and focusing window
Selected text: example
Cache miss for word: example
```

## 🧩 Testing Next Features (Step 2.3)

When implementing the popup, test:

### Popup Window Tests
- [ ] Appears within 50ms of hotkey
- [ ] Positioned near cursor (not covering text)
- [ ] Frameless design (no title bar)
- [ ] Always on top of other windows
- [ ] Auto-hides after 10 seconds
- [ ] Can be closed with Escape key

### Performance Tests
- [ ] Time from hotkey to visible: <50ms
- [ ] Smooth fade in/out animations
- [ ] No flicker or visual glitches
- [ ] Memory usage stable over time

## 🔧 Test Utilities

### Add Timer to Any Function
```rust
let start = std::time::Instant::now();
// ... your code ...
println!("Operation took: {:?}", start.elapsed());
```

### React Performance Marks
```typescript
performance.mark('start-operation');
// ... your code ...
performance.mark('end-operation');
performance.measure('operation', 'start-operation', 'end-operation');
console.log(performance.getEntriesByName('operation')[0].duration);
```

## 📝 Test Documentation

When adding new tests:
1. Document what the test verifies
2. Add to appropriate test suite
3. Update this guide if needed
4. Include performance expectations

Example:
```rust
#[test]
fn test_cache_lookup_performance() {
    // Verifies cache lookup meets <1ms requirement
    let mut cache = DictionaryCache::new(10_000);
    // ... test implementation ...
    assert!(lookup_time.as_micros() < 1000); // <1ms
}
```

## 🎯 Testing Philosophy

1. **Test Critical Path First**: Hotkey → Cache → Display
2. **Measure Everything**: Add timers during development
3. **Test on Target Platforms**: Windows, macOS, Linux
4. **User Experience Focus**: Does it feel instant?

## 🚦 Test Status Dashboard

| Component | Unit Tests | Integration | Performance | Manual |
|-----------|------------|-------------|-------------|---------|
| Cache | ✅ | ✅ | ✅ | ✅ |
| Hotkeys | ❌ | ⚠️ | ✅ | ✅ |
| UI Popup | ❌ | ❌ | ❌ | ❌ |
| API | ❌ | ❌ | ❌ | ❌ |

Legend: ✅ Complete | ⚠️ Partial | ❌ Not Started