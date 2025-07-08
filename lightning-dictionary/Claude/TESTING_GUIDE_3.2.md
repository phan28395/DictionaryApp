# Testing Guide for Step 3.2: Client-Server Integration

## Setup

### 1. Start the API Server
```bash
cd lightning-dictionary/api
npm run dev
```

You should see:
- Server starts on port 3001
- "Loaded 10 words into memory" message
- Server listening confirmation

### 2. Start the Tauri App
```bash
cd lightning-dictionary
npm run tauri dev
```

You should see:
- Vite dev server on http://localhost:1420/
- Global shortcuts registered (Alt+J or Ctrl+Shift+D)
- Clipboard monitoring active (for Wayland)

## Test Scenarios

### Test 1: Basic Word Lookup in Main Window

1. **Open the app** - A window should appear with "Lightning Dictionary - Cache Test"
2. **Test cache lookup:**
   - In the "Cache Testing" section, type: `hello`
   - Click "Test Lookup" or press Enter
   - **Expected Result:**
     - Word definition appears
     - Shows "hello" as the word
     - Shows part of speech (e.g., "noun")
     - Shows definitions list
     - Shows lookup time (should be >5ms for first lookup - API call)
     - Shows "Source: Not in cache (MISS)"

3. **Test cache hit:**
   - Type `hello` again
   - Click "Test Lookup"
   - **Expected Result:**
     - Same definition appears
     - Lookup time should be <5ms
     - Shows "Source: Cache (HIT)"
     - Cache stats should show "Size: 1/10000 words"

### Test 2: Word Not Found

1. **Test non-existent word:**
   - Type: `xyz123`
   - Click "Test Lookup"
   - **Expected Result:**
     - Error message: "'xyz123' not found in dictionary"
     - Red error box with warning icon
     - No definition shown

### Test 3: Network Error Simulation

1. **Stop the API server** (Ctrl+C in the API terminal)
2. **Clear cache and try a new word:**
   - Type: `world`
   - Click "Test Lookup"
   - **Expected Result:**
     - Error message: "Unable to connect to dictionary service. Please check your internet connection."
     - Suggestion to check connection
     - Lookup still completes (shows error time)

### Test 4: Hotkey/Clipboard Testing (Wayland)

Since you're on Wayland (Fedora 42), global hotkeys won't work, but clipboard monitoring will:

1. **Copy a word to clipboard:**
   - Select and copy any single word like "test" from any application
   - **Expected Result:**
     - Popup window appears near cursor
     - Shows definition if word exists
     - Shows error if word not found
     - Auto-closes after 10 seconds

2. **Test popup controls:**
   - Copy another word
   - When popup appears:
     - Press `Esc` to close immediately
     - Or click the ✕ button
     - Or click outside the popup

### Test 5: Multiple Words (Cache Building)

1. **Test multiple different words:**
   - Look up: `hello`, `world`, `test`, `example`, `word`
   - **Expected Results:**
     - First lookup of each: API call (>5ms)
     - Subsequent lookups: Cache hit (<5ms)
     - Cache stats update: "Size: 5/10000 words"
     - Memory usage shown (~X MB)

### Test 6: API Response Time

1. **Check the performance metrics:**
   - Look at the lookup times displayed
   - **Expected Results:**
     - Cache hits: <5ms (usually <1ms)
     - API calls: <50ms (target)
     - Network timeout: 100ms (if server is slow)

### Test 7: Error Recovery

1. **Start with API stopped:**
   - Stop API server
   - Try to look up a new word
   - See error message
   
2. **Restart API while app is running:**
   - Start API server again
   - Try the same word lookup
   - **Expected Result:**
     - Should work immediately
     - No need to restart the app
     - Automatic retry logic handles reconnection

## Current Test Data

The API currently has 10 test words loaded:
- hello, world, test, example, word, api, cache, fast, lightning, dictionary

Each word has:
- Part of speech (noun/verb/adjective)
- Rank (1-10)
- Frequency number
- Basic definitions

## Performance Benchmarks

You should see:
- **Cache Hit**: <1ms typical, <5ms maximum
- **API Call**: 10-30ms typical, <50ms target
- **Popup Display**: <50ms from hotkey/clipboard to visible

## Troubleshooting

1. **Port 1420 already in use:**
   ```bash
   lsof -i :1420
   kill <PID>
   ```

2. **API not responding:**
   - Check if port 3001 is accessible
   - Ensure API server is running
   - Check console for CORS or network errors

3. **Popup not appearing:**
   - On Wayland: Make sure you're copying single words
   - Check console for "Clipboard changed" messages
   - Ensure the word is alphabetic (no numbers/special chars)

4. **High memory usage:**
   - Check cache stats
   - Cache is limited to 10,000 words
   - Each word uses ~5KB average

## What Success Looks Like

✅ Words load from API when not in cache
✅ Cached words return instantly (<5ms)
✅ Errors show user-friendly messages
✅ App continues working if API goes down (for cached words)
✅ Clipboard monitoring works on Wayland
✅ Performance meets <50ms target