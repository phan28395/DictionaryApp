# 🧪 Testing the Lightning Dictionary Cache

## Quick Start

```bash
# Run the test script
./run-tests.sh

# Or start the app directly
npm run tauri dev
```

## What You Can Test Right Now

### 1. **Cache Performance** ⚡
Run option 1 or 3 in the test script to see:
- Insertion speed: Should be <1000ns per word
- Lookup speed: Should be <1µs (way below our 1ms target!)
- Memory usage: ~50MB for 10,000 words
- LRU eviction working correctly

### 2. **Hotkey Functionality** ⌨️
1. Start the app with `npm run tauri dev`
2. Select any text in another application
3. Press **Alt+J** (or Ctrl+Shift+D)
4. Watch the console output - you'll see:
   ```
   Alt+J pressed!
   Selected text: [your text]
   Cache miss for word: [your text]
   ```

### 3. **Cache Testing Interface** 🖥️
The React app now includes a test interface:
1. Enter any word in the test input
2. Click "Test Lookup" or press Enter
3. See:
   - Cache hit/miss status
   - Lookup time in milliseconds
   - Cache statistics (size, memory usage)

### 4. **Console Debugging** 📊
Keep the terminal open to see:
- Hotkey events
- Cache hits/misses
- Performance timings
- Error messages

## Expected Results

✅ **Good Performance**:
- Cache lookup: <1ms (usually <0.1ms)
- Hotkey response: Instant
- Memory per word: ~5KB

❌ **Current Limitations**:
- Cache starts empty (no dictionary data yet)
- All lookups will be cache misses
- No actual definitions (coming in next phase)

## Test Scenarios

### Basic Cache Test
1. Type "hello" in test input → Cache miss
2. Type "hello" again → Still miss (no data loaded)
3. Check cache stats → 0/10000 words

### Hotkey Test
1. Select text "example" in browser
2. Press Alt+J
3. App window appears
4. Shows "example" with cache miss

### Performance Test
1. Run benchmark (option 1)
2. Verify <1ms lookup time
3. Check 10,000 word capacity

## Troubleshooting

**Hotkeys not working?**
- Linux: Check if another app uses Alt+J
- Wayland: Use clipboard monitoring
- Try the fallback: Ctrl+Shift+D

**No console output?**
- Make sure you run with `npm run tauri dev`
- Check the terminal, not browser console

**Build errors?**
- Run `cargo clean` in src-tauri/
- Check Rust version: `rustc --version`

## Next Steps

Once cache is verified working:
1. ✅ Cache implementation complete
2. ⏳ Add UI popup (Step 2.3)
3. ⏳ Load real dictionary data
4. ⏳ Implement API fallback