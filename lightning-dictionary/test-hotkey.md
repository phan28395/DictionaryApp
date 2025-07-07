# Hotkey Testing Guide

## Prerequisites
1. Install xdotool if not already installed:
   ```bash
   sudo dnf install -y xdotool
   ```

2. Make sure the app is running:
   ```bash
   npm run tauri dev
   ```

## Test Steps

1. **Basic Window Test**
   - The Lightning Dictionary window should appear
   - You should see "Select any text and press Alt+J to look it up!"

2. **Hotkey Registration Test**
   - Check the terminal for: "Hotkey Alt+J registered successfully"

3. **Text Selection Test**
   - Open a text editor (gedit, VSCode, etc.)
   - Type some text like: "hello world test"
   - Select a word with your mouse
   - Press Alt+J
   - The app window should show the selected word

## Troubleshooting

If hotkey doesn't work:
1. Check if xdotool is installed: `which xdotool`
2. Check terminal for any error messages
3. Try selecting text in different applications
4. Make sure no other app is using Alt+J

## Expected Behavior
- Selected text appears in the app window
- Shows "Looking up definition for: [your word]"
- Window focuses when hotkey is pressed