# Lightning Dictionary User Guide v2.0

Welcome to Lightning Dictionary v2.0! This guide covers all the new features and enhancements added in Phase 2.

## Table of Contents

1. [Getting Started](#getting-started)
2. [New Features Overview](#new-features-overview)
3. [Multi-Definition Display](#multi-definition-display)
4. [Cross-Reference Navigation](#cross-reference-navigation)
5. [User Accounts](#user-accounts)
6. [Search & Suggestions](#search--suggestions)
7. [Word History](#word-history)
8. [Preferences & Settings](#preferences--settings)
9. [Keyboard Shortcuts](#keyboard-shortcuts)
10. [Performance Features](#performance-features)
11. [Tips & Tricks](#tips--tricks)

## Getting Started

Lightning Dictionary v2.0 maintains the same lightning-fast performance (<30ms response time) while adding powerful new features to enhance your dictionary experience.

### System Requirements
- Windows 10/11, macOS 10.15+, or Linux
- 4GB RAM minimum (8GB recommended)
- 200MB free disk space
- Internet connection for cloud features

### Installation
1. Download the installer for your platform
2. Run the installer and follow the prompts
3. Launch Lightning Dictionary from your applications menu

## New Features Overview

### Phase 2 Enhancements
- 📚 **Multi-Definition Display** - See all meanings grouped by part of speech
- 🔗 **Clickable Cross-References** - Navigate between related words instantly
- 👤 **User Accounts** - Save preferences and sync across devices
- 🔍 **Smart Search** - Fuzzy matching and intelligent suggestions
- 📜 **Word History** - Track and search your lookup history
- ⚡ **Smart Prefetching** - Even faster lookups with predictive caching
- 🎨 **Enhanced UI** - Improved design with platform-specific styling
- 🤖 **AI Ready** - Infrastructure for future AI-powered features

## Multi-Definition Display

### Viewing Multiple Definitions
When you look up a word, you'll now see:
- All available definitions grouped by part of speech (noun, verb, adjective, etc.)
- Synonyms and antonyms for each meaning
- Usage examples where available
- Etymology and origin information

### Expanding/Collapsing Definitions
- Click the arrow icon next to each part of speech to expand/collapse
- Use `Space` key to toggle the focused definition
- Press `E` to expand all, `C` to collapse all

### Understanding the Display
```
example (noun) ▼
├─ Definition 1: A thing characteristic of its kind...
│  ├─ Example: "It's a good example of teamwork"
│  ├─ Synonyms: specimen, sample, exemplar
│  └─ Antonyms: counterexample
└─ Definition 2: A person or thing regarded as...
   └─ Example: "She's an example to us all"

example (verb) ▶
```

## Cross-Reference Navigation

### Clickable Words
- Any word appearing in blue within definitions is clickable
- Click to instantly look up that word
- Hover to see a preview tooltip

### Navigation History
- Use the **Back** (←) and **Forward** (→) buttons to navigate
- Keyboard shortcuts: `Alt+Left` for back, `Alt+Right` for forward
- View your navigation path in the breadcrumb trail

### Breadcrumb Trail
Shows your navigation path:
```
example → specimen → sample → example
```
Click any word in the trail to jump directly to it.

## User Accounts

### Creating an Account
1. Click the **Sign Up** button in the top-right corner
2. Enter your email and choose a password
3. Verify your email address
4. Start enjoying synced preferences and history!

### Benefits of an Account
- ☁️ Sync preferences across all your devices
- 📊 Track your word lookup statistics
- 🔒 Save your word history securely
- ⚡ Higher API rate limits
- 🎯 Personalized word suggestions

### Managing Your Account
- Click your profile icon to access account settings
- Update your display name, email, or password
- Download your data anytime
- Delete your account if needed

## Search & Suggestions

### Smart Search Features
- **Fuzzy Matching**: Handles typos automatically
  - Type "exampl" → finds "example"
  - Type "dictonary" → finds "dictionary"
- **Autocomplete**: Start typing and see suggestions
- **Contains Search**: Find words containing specific letters

### Using Search
1. Press `Ctrl+K` (or `Cmd+K` on Mac) to focus search
2. Start typing your word
3. Use arrow keys to navigate suggestions
4. Press `Enter` to select

### Search Tips
- Use `*` as a wildcard: `ex*ple` finds "example"
- Search by definition: prefix with `def:` 
- Filter by part of speech: add `noun:` or `verb:`

## Word History

### Viewing Your History
- Click the **History** icon in the toolbar
- Or press `Ctrl+H` (`Cmd+H` on Mac)
- See all your recently looked up words

### History Features
- **Search**: Find specific words in your history
- **Filter by Date**: Today, This Week, This Month
- **Group by Day**: Organized view of your lookups
- **Export**: Download as CSV or JSON
- **Clear**: Remove individual items or clear all

### Privacy Mode
Enable Privacy Mode to temporarily disable history tracking:
1. Go to Settings → Privacy
2. Toggle "Privacy Mode"
3. History icon will show a lock when active

## Preferences & Settings

### Preference Profiles
Choose from preset profiles or create your own:
- **Minimal**: Clean, distraction-free interface
- **Power User**: All features enabled
- **Academic**: Focus on etymology and references
- **Language Learner**: Emphasis on examples and usage

### Customizable Settings

#### Appearance
- Theme: Light, Dark, System
- Font size: Small, Medium, Large, Extra Large
- Popup position: Top, Center, Bottom
- Animation speed: Instant, Fast, Normal, Slow

#### Behavior
- Popup trigger: Hotkey, Double-click, Selection
- Popup duration: 3s, 5s, 10s, Stay open
- Auto-collapse definitions: On/Off
- Show word history: On/Off

#### Performance
- Prefetch aggressiveness: Conservative, Balanced, Aggressive
- Cache size: 1k, 5k, 10k, 20k words
- Enable performance monitor: On/Off

#### Advanced
- API endpoint (for self-hosted servers)
- Export/Import settings
- Reset to defaults

## Keyboard Shortcuts

### Global Shortcuts
- `Ctrl+Shift+D` - Show/hide dictionary popup
- `Ctrl+K` - Focus search box
- `Escape` - Close popup or dialog

### Navigation
- `Alt+←` - Go back
- `Alt+→` - Go forward
- `Tab` - Next focusable element
- `Shift+Tab` - Previous focusable element

### In Popup
- `E` - Expand all definitions
- `C` - Collapse all definitions
- `Space` - Toggle current definition
- `S` - Save to favorites (coming soon)
- `H` - Show/hide history

### Search
- `↑/↓` - Navigate suggestions
- `Enter` - Select suggestion
- `Escape` - Clear search

### Customizing Shortcuts
1. Go to Settings → Keyboard Shortcuts
2. Click on any shortcut to change it
3. Press your desired key combination
4. Click Save

## Performance Features

### Smart Prefetching
Lightning Dictionary learns from your usage patterns:
- Predicts which words you might look up next
- Preloads related words and variations
- Achieves >80% cache hit rate

### Performance Monitor
Enable the performance monitor to see:
- Current FPS
- Memory usage
- Cache hit rate
- Response times

Access via Settings → Advanced → Show Performance Monitor

### Optimization Tips
1. Adjust prefetch aggressiveness based on your internet speed
2. Increase cache size if you have plenty of RAM
3. Disable animations on older hardware
4. Use Privacy Mode to reduce memory usage

## Tips & Tricks

### Power User Tips
1. **Quick Definition**: Select any text and press the hotkey
2. **Batch Lookup**: Paste multiple words separated by commas
3. **Definition Search**: Find words by their definitions
4. **Export Learning**: Export your history to track learning progress

### Productivity Features
- **Pin Popup**: Click the pin icon to keep definitions visible
- **Mini Mode**: Shrink popup to show just the primary definition
- **Quick Copy**: Right-click any definition to copy
- **Share**: Generate shareable links for definitions

### Hidden Features
- **Easter Eggs**: Try looking up "lightning" or "dictionary"
- **Stats Page**: View your usage statistics in profile
- **Debug Mode**: Hold Shift while clicking Settings
- **Offline Mode**: Works with cached words when offline

## Troubleshooting

### Common Issues

**Popup not appearing**
- Check if hotkey is correctly set in Settings
- Ensure Lightning Dictionary has accessibility permissions
- Try restarting the application

**Slow performance**
- Clear cache in Settings → Advanced
- Reduce prefetch aggressiveness
- Check Performance Monitor for bottlenecks

**Sync not working**
- Verify you're logged in
- Check internet connection
- Try logging out and back in

### Getting Help
- **Documentation**: [docs.lightning-dictionary.com](https://docs.lightning-dictionary.com)
- **Support**: support@lightning-dictionary.com
- **Community**: [reddit.com/r/lightningdictionary](https://reddit.com/r/lightningdictionary)
- **Bug Reports**: [github.com/lightning-dictionary/issues](https://github.com/lightning-dictionary/issues)

## What's Next?

### Coming in Phase 3
- 🌍 10+ language translations
- 🔄 Real-time sync across devices
- 📖 Wikipedia integration
- 🎯 Language learning tools

### Future Features (Phase 4+)
- 🤖 AI-powered context definitions
- 🔌 Plugin ecosystem
- 📱 Mobile apps
- 🎓 Educational integrations

---

Thank you for using Lightning Dictionary! We hope these new features enhance your word lookup experience. Happy exploring!

*Last updated: January 2025 | Version 2.0.0*