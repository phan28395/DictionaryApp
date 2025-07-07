# Testing Clipboard Monitoring (Wayland)

Since you're on Wayland (Fedora 42), global hotkeys won't work due to Wayland's security model. However, the clipboard monitoring is active!

## How to Test:

1. **Copy a single word** to your clipboard from any application:
   - Select a word (e.g., "hello", "world", "test")
   - Press Ctrl+C or right-click → Copy

2. **Watch the Lightning Dictionary window** - it should automatically detect the word and update

3. **Requirements for detection:**
   - Must be a single word (no spaces)
   - Less than 50 characters
   - Only alphabetic characters, hyphens, or apostrophes

## Test Words:
- hello
- world
- lightning
- dictionary
- test
- amazing
- can't
- well-being

## Console Output:
You should see messages like:
```
Clipboard word detected: hello
```

## Troubleshooting:
- Make sure the app window is visible
- Check the browser console (F12) for any JavaScript errors
- The clipboard is checked every 500ms

## Next Steps:
Once we confirm clipboard monitoring works, we'll:
1. Add actual dictionary lookups
2. Improve the UI/UX
3. Add system tray integration as another alternative