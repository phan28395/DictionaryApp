# CLAUDE.md - Popup Dictionary Phase 1 Implementation Guide

## Persona Configuration

<role>
You are a Senior Software Engineer implementing the Popup Dictionary project. You work methodically through Phase 1 (Foundation & Core Experience), creating a desktop application with sub-50ms popup performance. You document every decision, test thoroughly, and ensure seamless handoffs between implementation sessions. You explain technical concepts clearly for users with limited CS knowledge.
</role>

<current_phase>
**Phase 1: Foundation & Core Experience (Weeks 1-8)**
- Goal: Build the core dictionary experience with instant popup response
- Focus: Tauri desktop app, hotkey capture, memory cache, basic API
- Target: <50ms popup response time
</current_phase>

## Phase 1 Implementation Checklist

### Week 1-2: Development Environment & Project Setup

#### Step 1.1: Environment Setup
- [x] **1.1.1** Install development tools
  - [x] Install Node.js (v18+) and npm
  - [x] Install Rust and Cargo
  - [x] Install Git
  - [x] Install VS Code with extensions
- [x] **1.1.2** Verify installations
  - [x] Run `node --version` (should show v18+)
  - [x] Run `rustc --version` (should show 1.70+)
  - [x] Run `cargo --version`
  - [x] Run `git --version`

#### Step 1.2: Project Initialization
- [x] **1.2.1** Create project structure
  ```
  lightning-dictionary/
  ├── src-tauri/       (Rust backend)
  ├── src/             (React frontend)
  ├── data/            (Dictionary data)
  └── docs/            (Documentation)
  ```
- [ ] **1.2.2** Initialize Tauri project
  - [x] Run `npm create tauri-app@latest`
  - [x] Choose: React, TypeScript, npm
  - [x] Project name: `lightning-dictionary`
- [x] **1.2.3** Configure Git repository
  - [x] Initialize Git: `git init`
  - [x] Create `.gitignore`
  - [x] Initial commit

#### Step 1.3: Data Processing Setup
- [x] **1.3.1** Process dictionary data files
  - [x] Parse `lightning-dictionary/data/wordFrequency.xlsx` (Tab "1 lemmas", column B) for word list
  - [x] Create JSON structure for quick lookup
- [x] **1.3.2** Create data loader utility
  - [x] Build script to convert xlsx to JSON
  - [x] Optimize for memory efficiency
  - [x] Add data validation

### Week 3-4: Core Functionality Implementation

#### Step 2.1: Hotkey System
- [ ] **2.1.1** Implement global hotkey capture (Rust)
  - [ ] Use `global-hotkey` crate
  - [ ] Default: Alt+J (Windows/Linux), Cmd+D (macOS)
  - [ ] Make configurable
- [ ] **2.1.2** Text selection capture
  - [ ] Get selected text from active window
  - [ ] Handle different OS clipboard APIs
  - [ ] Add error handling
- [ ] **2.1.3** Hotkey testing
  - [ ] Test in 10+ applications
  - [ ] Document any conflicts
  - [ ] Create fallback options

#### Step 2.2: Memory Cache Implementation
- [ ] **2.2.1** Design cache structure
  ```rust
  struct DictionaryCache {
      words: HashMap<String, Definition>,
      lru_order: VecDeque<String>,
      max_size: usize,
  }
  ```
- [ ] **2.2.2** Implement LRU eviction
  - [ ] Track access order
  - [ ] Evict oldest when full
  - [ ] Target: 10,000 words in memory
- [ ] **2.2.3** Cache performance testing
  - [ ] Measure lookup time (<1ms target)
  - [ ] Test memory usage
  - [ ] Optimize data structures

#### Step 2.3: Basic UI Popup
- [ ] **2.3.1** Create popup window (React)
  - [ ] Frameless window design
  - [ ] Position near cursor
  - [ ] Auto-hide after 10 seconds
- [ ] **2.3.2** Definition display component
  - [ ] Word header with pronunciation
  - [ ] Part of speech tags
  - [ ] Definition list
  - [ ] Simple, clean design
- [ ] **2.3.3** Performance optimization
  - [ ] Minimize React re-renders
  - [ ] Use CSS for animations
  - [ ] Measure render time

### Week 5-6: API Development & Integration

#### Step 3.1: REST API Server
- [ ] **3.1.1** Setup Express/Fastify server
  - [ ] Choose lightweight framework
  - [ ] Configure for performance
  - [ ] Add compression
- [ ] **3.1.2** Dictionary endpoints
  - [ ] `GET /api/v1/define/:word`
  - [ ] `GET /api/v1/search?q=:query`
  - [ ] Add response caching headers
- [ ] **3.1.3** Data loading
  - [ ] Load processed dictionary data
  - [ ] Keep in server memory
  - [ ] Implement efficient search

#### Step 3.2: Client-Server Integration
- [ ] **3.2.1** HTTP client in Tauri
  - [ ] Use `reqwest` for async requests
  - [ ] Add timeout handling (100ms)
  - [ ] Implement retry logic
- [ ] **3.2.2** Fallback strategy
  - [ ] Check memory cache first
  - [ ] Fall back to API if miss
  - [ ] Show cached while fetching
- [ ] **3.2.3** Error handling
  - [ ] Network failure handling
  - [ ] Show user-friendly messages
  - [ ] Log errors for debugging

### Week 7-8: Polish & Performance

#### Step 4.1: Performance Optimization
- [ ] **4.1.1** Measure end-to-end latency
  - [ ] Hotkey press → popup visible
  - [ ] Use performance marks
  - [ ] Create benchmark suite
- [ ] **4.1.2** Optimize critical path
  - [ ] Profile with Chrome DevTools
  - [ ] Minimize IPC calls
  - [ ] Reduce bundle size
- [ ] **4.1.3** Achieve <50ms target
  - [ ] Test on various hardware
  - [ ] Document performance metrics
  - [ ] Create performance budget

#### Step 4.2: Cross-Platform Testing
- [ ] **4.2.1** Windows testing
  - [ ] Windows 10 compatibility
  - [ ] Windows 11 compatibility
  - [ ] Handle DPI scaling
- [ ] **4.2.2** macOS testing
  - [ ] macOS 11+ compatibility
  - [ ] Permissions handling
  - [ ] Retina display support
- [ ] **4.2.3** Linux testing
  - [ ] Ubuntu 20.04+
  - [ ] X11 and Wayland
  - [ ] Package formats (.deb, .rpm)

#### Step 4.3: User Experience Polish
- [ ] **4.3.1** Smooth animations
  - [ ] Fade in/out effects
  - [ ] No visual glitches
  - [ ] 60fps animations
- [ ] **4.3.2** Keyboard navigation
  - [ ] Escape to close
  - [ ] Tab through content
  - [ ] Copy definition shortcut
- [ ] **4.3.3** Settings interface
  - [ ] Hotkey customization
  - [ ] Theme selection
  - [ ] Cache size control

## Implementation Instructions for Non-Technical Users

### Getting Started (Step-by-Step)

1. **Install Required Software**
   ```bash
   # Windows users:
   # 1. Download Node.js from https://nodejs.org (click "LTS" version)
   # 2. Download Rust from https://rustup.rs (run the installer)
   # 3. Download Git from https://git-scm.com
   # 4. Download VS Code from https://code.visualstudio.com
   
   # Linux/Mac users can use terminal:
   # Ubuntu/Debian:
   sudo apt update
   sudo apt install nodejs npm git
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   
   # macOS:
   brew install node git
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **Create Your First Tauri App**
   ```bash
   # Open terminal/command prompt
   # Navigate to where you want your project:
   cd ~/Documents
   
   # Create the app:
   npm create tauri-app@latest
   # When prompted:
   # - Project name: popup-dictionary
   # - Package manager: npm
   # - UI template: React
   # - Language: TypeScript
   ```

3. **Understanding the Code Structure**
   - `src/` folder: Your web app (React/TypeScript)
   - `src-tauri/` folder: Your desktop app logic (Rust)
   - Think of it like: React = what users see, Rust = system integration

### Changelog Format

## Changelog Entry - [Date] - Session [#]

### Session 1 - 2024-01-07

#### Completed
- [x] Environment setup documentation (Step 1.1)
- [x] Project structure planning (Step 1.2)
- [x] Data processing strategy defined (Step 1.3)

#### In Progress
- [ ] Hotkey system implementation (Step 2.1) - 0% complete
  - Next: Install global-hotkey crate
  - Research OS-specific implementations

#### Decisions Made
- **Tech Stack**: Tauri + React + TypeScript confirmed
- **Cache Size**: 10,000 words in memory (approx 50MB)
- **Hotkey**: Alt+J (customizable) as default

#### Blockers/Issues
- Need to test hotkey conflicts with common applications
- Clipboard access may require permissions on macOS

#### Next Session Starting Point
- Begin with Step 2.1.1: Implement global hotkey capture
- Resources needed:
  - global-hotkey crate documentation
  - OS-specific clipboard APIs
  - Test applications list

### Code Templates

#### Rust Hotkey Handler Template
```rust
// src-tauri/src/hotkey.rs
use global_hotkey::{GlobalHotKeyManager, HotKey, KeyCode, Modifiers};

pub fn setup_hotkey() -> Result<(), Box<dyn std::error::Error>> {
    let manager = GlobalHotKeyManager::new()?;
    let hotkey = HotKey::new(
        Modifiers::CONTROL,
        KeyCode::D
    );
    
    manager.register(hotkey, || {
        // Get selected text
        // Show popup window
    })?;
    
    Ok(())
}
```

#### React Popup Component Template
```tsx
// src/components/Popup.tsx
import React, { useEffect, useState } from 'react';

interface Definition {
  word: string;
  pos: string;
  definitions: string[];
}

export const Popup: React.FC = () => {
  const [definition, setDefinition] = useState<Definition | null>(null);
  
  useEffect(() => {
    // Listen for word lookup events from Rust
  }, []);
  
  return (
    <div className="popup">
      {definition && (
        <>
          <h2>{definition.word}</h2>
          <span className="pos">{definition.pos}</span>
          <ul>
            {definition.definitions.map((def, i) => (
              <li key={i}>{def}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};
```

#### Data Processing Script Template
```javascript
// scripts/process-dictionary.js
const fs = require('fs');
const path = require('path');

function processDictionary() {
  // Read the lemmas file
  const data = fs.readFileSync('data_structure/lemmas_60k.txt', 'utf8');
  const lines = data.split('\n');
  
  const words = {};
  
  // Skip header lines
  for (let i = 8; i < lines.length; i++) {
    const parts = lines[i].split('\t');
    if (parts.length > 3) {
      const rank = parseInt(parts[0]);
      const word = parts[1];
      const pos = parts[2];
      const freq = parseInt(parts[3]);
      
      // Only keep top 10,000 words
      if (rank <= 10000) {
        words[word] = {
          rank,
          pos,
          frequency: freq,
          definitions: [] // To be populated from other sources
        };
      }
    }
  }
  
  // Save as JSON
  fs.writeFileSync(
    'data/dictionary.json',
    JSON.stringify(words, null, 2)
  );
  
  console.log(`Processed ${Object.keys(words).length} words`);
}

processDictionary();
```

## Performance Measurement Guide

### How to Measure <50ms Response Time
```javascript
// In your Rust code:
let start = std::time::Instant::now();
// ... your code ...
println!("Time taken: {:?}", start.elapsed());

// In your React code:
performance.mark('hotkey-pressed');
// ... render popup ...
performance.mark('popup-visible');
performance.measure('popup-time', 'hotkey-pressed', 'popup-visible');
console.log(performance.getEntriesByName('popup-time')[0].duration);
```

### Performance Testing Checklist
- [ ] Cold start: First popup after app launch
- [ ] Warm start: Subsequent popups
- [ ] Cache hit: Word already in memory
- [ ] Cache miss: Word needs loading
- [ ] Large definition: Multiple meanings
- [ ] Rapid lookups: 10 words in 10 seconds

## Review Checkpoints

### After Each Major Step
1. **Code Review Questions**:
   - Does it work on all target platforms?
   - Is the code readable and documented?
   - Are there any performance bottlenecks?

2. **User Testing**:
   - Can you trigger the popup reliably?
   - Does it feel instant (<50ms)?
   - Is the definition clear and readable?

3. **Technical Metrics**:
   - Memory usage under 100MB?
   - CPU usage minimal when idle?
   - No memory leaks after extended use?

## Troubleshooting Guide

### Common Issues and Solutions

1. **Hotkey Not Working**
   - Windows: Run as administrator
   - macOS: Grant accessibility permissions
   - Linux: Check window manager settings

2. **Slow Popup**
   - Check Chrome DevTools Performance tab
   - Reduce initial render complexity
   - Preload popup window

3. **High Memory Usage**
   - Reduce cache size
   - Implement better eviction
   - Check for memory leaks

## Handoff Protocol

When ending a session, always provide:
1. Last completed step number
2. Any partial work (with TODOs)
3. Specific next action needed
4. Any discovered issues or blockers
5. Test results from completed work

Example:
```
Session ending at Step 2.1.2
- Completed: Global hotkey registration works on Windows
- TODO: Test on macOS, implement Linux support
- Next: Implement text selection capture
- Issue: macOS requires accessibility permissions
- Tests: Windows hotkey triggers in 8/10 test apps
```

## Next Claude Session Startup

When starting a new session, the Claude should:
1. Read the previous changelog entry
2. Identify the current step from checklist
3. Review any blockers or issues
4. Continue implementation from last point
5. Update changelog with new progress

### Session Startup Template
```
I'm continuing implementation of Phase 1 of the Popup Dictionary.

**Previous Session Summary**:
- Last completed: [Step number and description]
- Current task: [What needs to be done]
- Known issues: [Any blockers]

**Today's Goals**:
1. [Specific task 1]
2. [Specific task 2]
3. [Specific task 3]

Shall I proceed with [specific next action]?
```