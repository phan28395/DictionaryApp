# Testing Guide for Phase 1 - Step 2.2

## Quick Start Testing

### 1. Build and Run the Application

```bash
# In the project root directory
cd lightning-dictionary

# Install dependencies
npm install

# Run in development mode
npm run tauri dev
```

### 2. Test Cache Functionality

Since we don't have the UI popup yet, let's add some test functionality to the React app to visualize the cache.

## What to Test

### A. Hotkey Testing
1. **Test Alt+J**:
   - Select any text in a browser or text editor
   - Press Alt+J
   - Check the console output in the terminal
   - You should see: "Selected text: [your text]"

2. **Test Ctrl+Shift+D** (fallback):
   - Same as above but with Ctrl+Shift+D

3. **Wayland Users**:
   - Copy a single word to clipboard
   - The app should detect it automatically
   - Check console for "Valid word detected"

### B. Cache Performance Testing

Run the cache benchmarks:
```bash
cd src-tauri
cargo test cache_benchmark::tests::test_benchmarks_run -- --nocapture
```

Expected output:
```
=== Dictionary Cache Benchmarks ===

1. Insertion Performance Test
  - Average insertion time: <1000 ns
  - Total insertions: 10000

2. Lookup Performance Test
  - Average lookup time: <1000 ns (<1 µs)
  - Target: <1ms (1,000,000 ns)
  - Status: ✓ PASS

3. LRU Eviction Performance Test
  - Cache size maintained at: 1000

4. Memory Usage Test
  - Total memory usage: <50 MB
  - Status: ✓ PASS
```

### C. Manual Testing Steps

1. **Test Cache Hit/Miss**:
   - Select the word "hello"
   - Press Alt+J
   - Console shows: "Cache miss for word: hello"
   - Add test data to cache (see below)
   - Select "hello" again
   - Console shows: "Cache hit! Lookup time: [time]"

2. **Test LRU Eviction**:
   - Add 10,001 words to cache
   - Verify oldest word is evicted
   - Check cache stats show size = 10,000

## Adding Test Data

For now, you can test by modifying the React app. I'll create a test interface...

## Console Output to Verify

When everything is working correctly, you should see:

```
✓ Global shortcuts registered successfully
Hotkey manager setup successfully
Alt+J pressed!
Showing and focusing window
Selected text: example
Cache miss for word: example
```

## Troubleshooting

### Issue: Hotkeys not working
- **Linux**: Make sure no other app is using Alt+J
- **Wayland**: Use the clipboard monitoring method
- **Windows**: Run as administrator if needed

### Issue: No console output
- Make sure you're running with `npm run tauri dev`
- Check the terminal where you started the app
- Look for any error messages

### Issue: Cache tests fail
- Run: `cargo clean` then rebuild
- Check memory usage on your system
- Verify Rust version: `rustc --version` (needs 1.70+)

## Performance Verification

The cache implementation should achieve:
- ✅ Lookup time: <1ms (typically <1µs)
- ✅ Memory usage: ~5KB per word
- ✅ LRU eviction: O(1) complexity
- ✅ Thread-safe operations

## Next Steps

Once you've verified the cache is working:
1. Move to Step 2.3: Create the UI popup
2. The popup will visualize the cache hits/misses
3. Add real dictionary data to test with actual words