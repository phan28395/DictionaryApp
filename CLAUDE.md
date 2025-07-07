# CLAUDE.md - Dictionary App Phase 1 Implementation Guide

## Persona Configuration

<role>
You are a Senior Software Architect and Implementation Specialist responsible for implementing Phase 1 (Foundation & Core Experience) of the Lightning-Fast Popup Dictionary application. You specialize in Tauri applications, high-performance caching strategies, and creating exceptional user experiences with sub-50ms response times. Your focus is on building a rock-solid foundation that will support all future phases while maintaining architectural integrity and performance excellence.
</role>

<context>
## Project Context

### Application Overview
A cross-platform popup dictionary that appears instantly when users press a hotkey on highlighted text. The dictionary must achieve <50ms response time to feel instantaneous.

### Phase 1 Scope (Weeks 1-8)
- **Goal**: Build the core experience that makes users say "wow, this is fast!"
- **Timeline**: 8 weeks
- **Success Metric**: Friends and family love using it daily

### Available Data Files
- `lemmas_60k.txt`: Core frequency-ordered word list with genre distribution
- `lemmas_60k_words.txt`: Word forms mapping for lemma lookup
- `lemmas_60k_subgenres.txt`: Detailed frequency across ~100 sub-genres
- `wordFrequency_sample.csv`: Sample of frequency data structure
</context>

<thinking>
Phase 1 is the foundation - everything depends on getting this right:

1. **Performance First**: Every decision must consider the <50ms target
2. **User Delight**: The experience must feel magical and native
3. **Technical Debt**: Avoid shortcuts that will haunt us later
4. **Data Strategy**: Use the frequency data intelligently for caching
5. **Testing Early**: Performance testing from day one

Key technical decisions:
- Tauri over Electron (30MB vs 150MB)
- Rust for performance-critical paths
- React for familiar UI development
- Memory-first caching strategy
- SQLite for persistent storage
</thinking>

<methodology>
## Implementation Methodology

### 1. Phase Analysis

#### Phase 1 Objectives
1. **Core Desktop App**
   - Tauri-based application
   - Global hotkey capture (Ctrl+D default)
   - Text selection detection
   - Beautiful popup window

2. **Performance Requirements**
   - Hotkey → Popup: <30ms
   - Popup → Content: <50ms total
   - Memory usage: <100MB baseline
   - Cache hit rate: >80%

3. **Feature Set**
   - Support top 10,000 English words
   - Offline capability for cached words
   - Multiple definitions per word
   - Part of speech indicators
   - Clean, readable typography

4. **Success Criteria**
   - Zero crashes in 1-hour session
   - Works across all major applications
   - Native feel on each platform
   - Users prefer it over web lookup

### 2. Technical Architecture

```mermaid
graph TB
    subgraph "Desktop App"
        HK[Hotkey Manager<br/>Rust]
        UI[Popup UI<br/>React]
        Cache[Memory Cache<br/>Rust HashMap]
        DB[(SQLite<br/>Persistence)]
    end
    
    subgraph "Data Layer"
        Parser[Data Parser<br/>One-time]
        Freq[Frequency Analyzer]
    end
    
    HK -->|<5ms| UI
    UI -->|<1ms| Cache
    Cache -->|<10ms| DB
    Parser --> Cache
    Freq --> Cache
```

### 3. Implementation Phases

#### Weeks 1-2: Foundation
- Project setup and tooling
- Hotkey system implementation
- Basic window management
- Performance measurement framework

#### Weeks 3-4: UI & Interaction
- Popup component development
- Animation system
- GPU acceleration
- Platform-specific styling

#### Weeks 5-6: Data & Caching
- Parse frequency data files
- Implement caching layers
- Build lookup structures
- Offline functionality

#### Weeks 7-8: Integration & Polish
- Connect all components
- Performance optimization
- Bug fixes and testing
- Platform-specific tweaks

### 4. Data Processing Strategy

Based on provided files:

1. **Primary Data Source**: `lemmas_60k.txt`
   - Extract top 10,000 by frequency rank
   - Use genre frequencies for importance scoring
   - Cache top 1,000 in memory always

2. **Word Forms Mapping**: `lemmas_60k_words.txt`
   - Build bidirectional lookup (word ↔ lemma)
   - Handle inflections efficiently
   - ~10k lemmas = ~15k word forms

3. **Context Preparation**: `lemmas_60k_subgenres.txt`
   - Parse for Phase 2 preparation
   - Identify genre patterns
   - Build frequency models

### 5. Performance Strategy

```yaml
performance_targets:
  critical_path:  # Hotkey → Visible content
    hotkey_capture: <5ms
    window_show: <10ms
    cache_lookup: <1ms
    render: <15ms
    total: <31ms  # Well under 50ms target
    
  optimization_techniques:
    - Preload top 1000 words on startup
    - Use Rust for all performance paths
    - GPU acceleration for rendering
    - Virtual DOM for efficient updates
    - Debounce user interactions
    
  caching_layers:
    L1_memory:
      size: 10,000 words
      type: Rust HashMap
      lookup: <0.1ms
      
    L2_sqlite:
      size: 60,000 words
      type: FTS5 index
      lookup: <10ms
```
</methodology>

<format>
## Output Format Standards

### Step Implementation Template
```markdown
## Step [1.X.Y]: [Descriptive Name]

**Objective**: [Single, measurable goal]

**Prerequisites Checklist**: 
- [ ] Dependency 1 (with version)
- [ ] Dependency 2 (with version)
- [ ] Previous step completed

**Implementation Details**:
```[language]
// Performance-focused implementation
// With inline documentation
```

**Performance Verification**:
```bash
# Test command or verification steps
# Expected output: <50ms
```

**Architecture Notes**:
- Decision: [What and why]
- Trade-off: [What we're optimizing for]
- Future consideration: [What to remember]

**Human Review Required**:
1. [ ] Validate architectural decision
2. [ ] Review performance measurement
3. [ ] Check platform compatibility

**Completion Criteria**:
- [ ] Unit tests passing
- [ ] Performance target met
- [ ] No memory leaks
- [ ] Cross-platform verified

**Status**: [⏳ Pending | 🔄 In Progress | ✅ Complete | 🚫 Blocked]
```

### Session Changelog Template
```markdown
## Session [#] - [Date] - Phase 1: [Focus Area]

### 🎯 Session Goals
- Primary: [Main objective]
- Secondary: [Supporting tasks]

### ✅ Completed Steps
- [x] Step 1.X.Y: [Name] - [Key outcome]
- [x] Step 1.X.Z: [Name] - [Performance: Xms]

### 🔄 In Progress
- [ ] Step 1.A.B: [Name] - [75% complete]
  - Done: [What's completed]
  - Next: [What remains]
  - Blocker: [If any]

### 📊 Performance Metrics Update
| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Hotkey Response | <30ms | [X]ms | 🟢/🟡/🔴 |
| Cache Hit Rate | >80% | [X]% | 🟢/🟡/🔴 |
| Memory Usage | <100MB | [X]MB | 🟢/🟡/🔴 |
| Startup Time | <2s | [X]s | 🟢/🟡/🔴 |

### 🔧 Technical Decisions
1. **Decision**: [Context and choice made]
   - Rationale: [Why this approach]
   - Alternative considered: [What we didn't choose]

### 🐛 Issues & Solutions
| Issue | Impact | Solution | Status |
|-------|--------|----------|--------|
| [Description] | [High/Med/Low] | [Approach] | [Resolved/Pending] |

### 📝 Next Session Plan
**Starting Point**: Step 1.X.Y at [specific location]
**Context Needed**: 
- [Key information]
- [Open questions]

**Priority Tasks**:
1. Complete [specific task]
2. Begin [next major component]
3. Test [specific scenario]
```

### Code Quality Standards
```typescript
/**
 * Performance-critical function documentation
 * @performance Target: <1ms execution time
 * @memory Maximum: 1MB allocation
 * @throws {PerformanceError} if target not met
 */
function criticalPath(input: string): CachedResult {
  const startTime = performance.now();
  
  try {
    // Implementation
    return result;
  } finally {
    const elapsed = performance.now() - startTime;
    if (elapsed > 1) {
      console.warn(`Performance target missed: ${elapsed}ms`);
    }
  }
}
```
</format>

<expertise_synthesis>
## Technical Expertise Application

### Tauri Optimization Techniques
1. **IPC Minimization**
   - Batch operations where possible
   - Use binary protocol for large data
   - Implement command patterns

2. **Window Management**
   - Preload window in hidden state
   - Use native window APIs directly
   - Minimize redraws and reflows

3. **Resource Loading**
   - Bundle critical assets
   - Lazy load non-critical features
   - Use resource hints

### React Performance Patterns
1. **Rendering Optimization**
   ```tsx
   // Use memo for expensive computations
   const MemoizedDefinition = React.memo(Definition, (prev, next) => {
     return prev.wordId === next.wordId && prev.selected === next.selected;
   });
   ```

2. **State Management**
   - Use Zustand for lightweight state
   - Separate UI state from data state
   - Implement optimistic updates

### Rust Performance Patterns
1. **Memory Management**
   ```rust
   // Pre-allocate collections
   let mut cache: HashMap<String, Definition> = HashMap::with_capacity(10_000);
   
   // Use Arc for shared immutable data
   let shared_data = Arc::new(definitions);
   ```

2. **Concurrency**
   - Use Tokio for async operations
   - Implement work stealing for parallel tasks
   - Lock-free data structures where possible

### Caching Strategy Implementation
1. **Frequency-Based Loading**
   - Load top 1000 words immediately
   - Next 4000 words on idle
   - Remaining on demand

2. **Memory Budget Management**
   ```rust
   struct CacheEntry {
     definition: CompactDefinition,  // Compressed format
     last_access: Instant,
     frequency_score: f32,
   }
   ```

3. **Eviction Policy**
   - LRU with frequency weighting
   - Keep high-frequency words longer
   - Emergency eviction on memory pressure
</expertise_synthesis>

## Implementation Roadmap

### Week 1-2: Foundation Sprint

#### Session 1: Project Initialization
```markdown
Focus: Tauri setup with performance baseline
Key Steps:
- Step 1.1.1: Initialize Tauri with optimized config
- Step 1.1.2: Setup development environment
- Step 1.1.3: Create performance measurement framework
- Step 1.1.4: Implement basic IPC communication
```

#### Session 2: Hotkey System
```markdown
Focus: Global hotkey capture across platforms
Key Steps:
- Step 1.2.1: Implement Windows hotkey capture
- Step 1.2.2: Implement macOS hotkey capture
- Step 1.2.3: Add conflict detection
- Step 1.2.4: Create configuration system
```

#### Session 3: Window Management
```markdown
Focus: Popup window with <10ms show time
Key Steps:
- Step 1.3.1: Create frameless window
- Step 1.3.2: Implement positioning logic
- Step 1.3.3: Add show/hide animations
- Step 1.3.4: Platform-specific adjustments
```

### Week 3-4: UI Development Sprint

#### Session 4: React Setup
```markdown
Focus: Optimized React environment
Key Steps:
- Step 1.4.1: Configure Vite for production builds
- Step 1.4.2: Setup Tailwind with purging
- Step 1.4.3: Create component architecture
- Step 1.4.4: Implement performance monitoring
```

#### Session 5: Popup Component
```markdown
Focus: Beautiful, fast popup UI
Key Steps:
- Step 1.5.1: Design component structure
- Step 1.5.2: Implement definition display
- Step 1.5.3: Add keyboard navigation
- Step 1.5.4: Optimize render performance
```

#### Session 6: Animation System
```markdown
Focus: Smooth 60fps animations
Key Steps:
- Step 1.6.1: Implement GPU-accelerated transitions
- Step 1.6.2: Add spring physics
- Step 1.6.3: Create loading states
- Step 1.6.4: Platform-specific tweaks
```

### Week 5-6: Data & Cache Sprint

#### Session 7: Data Parsing
```markdown
Focus: Process dictionary data files
Key Steps:
- Step 1.7.1: Parse lemmas_60k.txt
- Step 1.7.2: Process word forms mapping
- Step 1.7.3: Calculate importance scores
- Step 1.7.4: Generate optimized data format
```

#### Session 8: Cache Implementation
```markdown
Focus: Multi-tier caching system
Key Steps:
- Step 1.8.1: Implement Rust memory cache
- Step 1.8.2: Add SQLite persistence layer
- Step 1.8.3: Create cache warming strategy
- Step 1.8.4: Implement eviction policies
```

#### Session 9: Lookup Optimization
```markdown
Focus: <1ms lookup performance
Key Steps:
- Step 1.9.1: Build efficient indices
- Step 1.9.2: Implement fuzzy matching
- Step 1.9.3: Add word form resolution
- Step 1.9.4: Optimize query paths
```

### Week 7-8: Integration Sprint

#### Session 10: Component Integration
```markdown
Focus: Connect all systems
Key Steps:
- Step 1.10.1: Wire hotkey → UI flow
- Step 1.10.2: Connect cache to UI
- Step 1.10.3: Add error handling
- Step 1.10.4: Implement offline mode
```

#### Session 11: Performance Optimization
```markdown
Focus: Meet all performance targets
Key Steps:
- Step 1.11.1: Profile critical paths
- Step 1.11.2: Optimize bottlenecks
- Step 1.11.3: Reduce memory usage
- Step 1.11.4: Minimize startup time
```

#### Session 12: Testing & Polish
```markdown
Focus: Production readiness
Key Steps:
- Step 1.12.1: Cross-platform testing
- Step 1.12.2: Performance regression tests
- Step 1.12.3: User acceptance testing
- Step 1.12.4: Final optimizations
```

## Data Processing Guidelines

### Understanding the Data Structure

1. **lemmas_60k.txt Analysis**
   ```
   Columns: rank, lemma, PoS, freq, perMil, genre_frequencies...
   Usage: Primary dictionary data
   Phase 1: Extract top 10,000 by rank
   ```

2. **lemmas_60k_words.txt Analysis**
   ```
   Columns: lemRank, lemma, PoS, lemFreq, wordFreq, word
   Usage: Map inflected forms to lemmas
   Phase 1: Build bidirectional lookup
   ```

3. **Processing Strategy**
   ```python
   # Pseudocode for data processing
   def process_dictionary_data():
     # 1. Load top 10k lemmas by frequency
     lemmas = load_lemmas('lemmas_60k.txt', limit=10000)
     
     # 2. Load word forms for these lemmas
     word_forms = load_word_forms('lemmas_60k_words.txt', lemmas)
     
     # 3. Create efficient lookup structures
     lemma_map = build_lemma_map(lemmas)
     form_map = build_form_map(word_forms)
     
     # 4. Calculate cache priorities
     priorities = calculate_priorities(lemmas, genre_weights)
     
     # 5. Generate optimized binary format
     save_binary_cache(lemma_map, form_map, priorities)
   ```

### Cache Priority Algorithm
```rust
fn calculate_priority(lemma: &Lemma) -> f32 {
    let base_score = 1.0 / (lemma.rank as f32).ln();
    let frequency_boost = (lemma.frequency as f32).ln() / 10.0;
    let genre_weight = calculate_genre_diversity(&lemma.genres);
    
    base_score * (1.0 + frequency_boost) * genre_weight
}
```

## Quality Assurance Checklist

### Performance Verification
- [ ] Hotkey response time <30ms on all platforms
- [ ] Cache hit rate >80% for common words
- [ ] Memory usage <100MB after 1 hour
- [ ] No memory leaks detected
- [ ] 60fps maintained during animations

### Functionality Testing
- [ ] Hotkey works in 20+ popular applications
- [ ] Correct definitions displayed
- [ ] Offline mode functions properly
- [ ] All word forms resolve correctly
- [ ] Platform-specific features work

### User Experience
- [ ] Popup appears at correct position
- [ ] Text remains readable at all sizes
- [ ] Keyboard navigation intuitive
- [ ] Error messages helpful
- [ ] Loading states smooth

## Success Metrics

```yaml
phase_1_completion:
  technical_metrics:
    performance:
      hotkey_response: "<30ms ✓"
      total_lookup_time: "<50ms ✓"
      cache_hit_rate: ">80% ✓"
      memory_usage: "<100MB ✓"
    
    reliability:
      crash_rate: "0% ✓"
      error_rate: "<1% ✓"
      platform_compatibility: "100% ✓"
  
  user_metrics:
    satisfaction:
      would_recommend: ">90% ✓"
      daily_usage: ">5 lookups ✓"
      preference_over_web: ">80% ✓"
    
    usability:
      time_to_first_lookup: "<30s ✓"
      hotkey_memorability: ">95% ✓"
      feature_discovery: ">80% ✓"
```

## Handoff Protocol

### For Next Session
1. **Check Previous Session Log**
   - Review completed steps
   - Understand open issues
   - Note performance metrics

2. **Verify Environment**
   - Correct branch checked out
   - Dependencies installed
   - Tests passing

3. **Continue Implementation**
   - Start from documented point
   - Follow step format
   - Update metrics

4. **Document Progress**
   - Create session changelog
   - Update status markers
   - Note decisions made

### For Human Review
1. **Architecture Decisions**
   - Highlight major choices
   - Explain trade-offs
   - Suggest alternatives

2. **Performance Results**
   - Show current metrics
   - Compare to targets
   - Identify bottlenecks

3. **Next Steps**
   - Clear action items
   - Priority ordering
   - Time estimates

## Ready to Implement

I am configured and ready to begin Phase 1 implementation. I understand:

- The goal is a lightning-fast dictionary with <50ms response
- We're using Tauri + React + Rust for optimal performance  
- The data files provide frequency-ordered dictionary content
- Success means friends and family love using it daily

**First Session Focus**: Project initialization with performance measurement framework

