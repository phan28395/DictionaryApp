# CLAUDE.md - Automated Phase Implementation System

## System Overview

This file enables keyword-driven phase implementation with minimal human involvement. Each phase from the grand plan (SAP_Dictionary_MVC.md) can be initiated with a simple keyword, and the system will handle planning, implementation tracking, and handoff between Claude sessions.

## Quick Start Keywords

### Phase Keywords (Human: just type the keyword)
- `PHASE1` - Foundation & Core Experience 
- `PHASE2` - Enhanced Dictionary Features
- `PHASE3` - Language Expansion
- `PHASE4` - Platform Maturity
- `PHASE5` - AI Enhancement (Future)
- `PHASE6` - Ecosystem Building (Future)

### Action Keywords
- `PLAN <phase>` - Generate detailed implementation plan
- `IMPLEMENT <step>` - Execute specific step from plan
- `STATUS` - Show current progress
- `CONTINUE` - Resume from last checkpoint
- `REVIEW` - Audit completed work

## Automated Planning System

When you type a phase keyword (e.g., `PHASE2`), Claude will:

1. **Analyze Current State**
   - Read implementation history from `docs/implementation_log.json`
   - Check existing codebase for completed features
   - Identify dependencies from previous phases

2. **Generate Step-by-Step Plan**
   - Break down phase into 15-20 atomic steps
   - Each step should take 1-2 hours
   - Include verification criteria
   - Save to `docs/phase_X_plan.md`

3. **Create Implementation Tracking**
   - Initialize tracking in `docs/implementation_log.json`
   - Set up test criteria
   - Define success metrics

## Implementation Tracking System

### Implementation Log Structure
```json
{
  "phases": {
    "phase1": {
      "status": "completed",
      "completion_date": "2025-01-08",
      "steps": {
        "1.1": {
          "name": "Environment Setup",
          "status": "completed",
          "files_modified": ["package.json", "tsconfig.json"],
          "test_results": "passed",
          "notes": "Node.js v18, Rust 1.70+"
        }
      }
    },
    "phase2": {
      "status": "in_progress",
      "current_step": "2.3",
      "steps": {
        "2.1": {
          "name": "Multi-definition Display",
          "status": "completed",
          "files_modified": ["src/components/Definition.tsx"],
          "test_results": "passed"
        },
        "2.2": {
          "name": "Cross-references",
          "status": "in_progress",
          "blockers": ["Need hypernym data structure"]
        }
      }
    }
  },
  "current_focus": "phase2",
  "last_update": "2025-01-09T10:30:00Z"
}
```

## Phase Implementation Templates

### PHASE 1: Foundation & Core Experience ✅ COMPLETED
Status: Completed on 2025-01-08
Key Achievement: <30ms popup response time

### PHASE 2: Enhanced Dictionary Features

#### When human types: `PHASE2`

Claude will generate:

```markdown
# Phase 2 Implementation Plan

## Current State Analysis
- Phase 1 completed with <30ms response time
- Basic dictionary with 60k words implemented
- REST API and caching layer operational

## Phase 2 Steps

### Step 2.1: Multi-Definition Display
**Time**: 2 hours
**Files to modify**: 
- src/components/Definition.tsx (new)
- src/types/dictionary.ts
- api/src/services/dictionary.ts

**Implementation**:
1. Create Definition component with POS grouping
2. Update dictionary data structure
3. Modify API to return multiple definitions
4. Add expansion/collapse UI

**Verification**:
- [ ] Shows multiple definitions per word
- [ ] Groups by part of speech
- [ ] Smooth expand/collapse animation
- [ ] Performance still <50ms

### Step 2.2: Clickable Cross-References
**Time**: 3 hours
**Files to modify**:
- src/components/CrossReference.tsx (new)
- src/hooks/useWordNavigation.ts (new)
- src/utils/wordParser.ts (new)

**Implementation**:
1. Parse definition text for word references
2. Create clickable word chips
3. Implement navigation history
4. Add back/forward buttons

**Verification**:
- [ ] Words in definitions are clickable
- [ ] Navigation history works
- [ ] No performance degradation
- [ ] Circular reference handling

[... continue for all steps ...]
```

### PHASE 3: Language Expansion

#### When human types: `PHASE3`

Claude will:
1. Check Phase 2 completion status
2. Analyze existing translation infrastructure
3. Generate language addition plan
4. Create batch processing scripts
5. Design language detection system

### PHASE 4: Platform Maturity

#### When human types: `PHASE4`

Claude will:
1. Audit performance metrics
2. Design plugin architecture
3. Plan monitoring infrastructure
4. Create billing system outline
5. Prepare for production deployment

### PHASE 5: AI Enhancement (Future)

#### When human types: `PHASE5`

Claude will:
1. Review AI placeholder infrastructure
2. Design context analysis system
3. Plan AI API integration
4. Create fallback mechanisms
5. Estimate costs and performance impact

## Step Implementation Protocol

### When human types: `IMPLEMENT 2.1`

Claude will:

1. **Pre-Implementation Check**
   ```
   - Dependencies satisfied? ✓
   - Previous step completed? ✓
   - Tests passing? ✓
   ```

2. **Implementation**
   - Create/modify required files
   - Write comprehensive tests
   - Commit with descriptive message

3. **Verification**
   - Claude run tests 
   - Check performance metrics
   - Update implementation log
   - Prepare handoff notes

4. **Update Tracking**
   ```json
   {
     "step": "2.1",
     "status": "completed",
     "duration": "1h 45m",
     "files_modified": [...],
     "tests_added": 5,
     "performance_impact": "none"
   }
   ```

## Handoff Between Claude Sessions

### Session End Protocol
When implementation session ends, Claude will:

1. **Save Progress**
   - Update `docs/implementation_log.json`
   - Commit all changes
   - Document any blockers

2. **Create Handoff File**
   `docs/handoff_stepX.md`:
   ```markdown
   # Implementation Handoff
   
   ## Completed
   - Step 2.1: Multi-definition display ✓
   - Step 2.2: Cross-references (partial)
   
   ## Current State
   - Working on: CrossReference component
   - Line 45 in src/components/CrossReference.tsx
   - TODO: Implement circular reference detection
   
   ## Next Actions
   1. Complete circular reference detection
   2. Add tests for edge cases
   3. Start Step 2.3: Prefetching logic
   
   ## Known Issues
   - None
   
   ## Performance Metrics
   - Still meeting <50ms target
   - Memory usage: 8.2MB (acceptable)
   ```

### Session Start Protocol
When new session starts with `CONTINUE`:

1. **Load State**
   - Read latest handoff file
   - Check implementation log
   - Verify environment

2. **Resume Work**
   - Continue from exact stopping point
   - Run tests to ensure stability
   - Complete current step

## Success Metrics by Phase

### Phase 2 Metrics
- [ ] All definitions display correctly
- [ ] Cross-references work instantly
- [ ] Prefetching improves perceived speed
- [ ] User accounts functional
- [ ] Performance <50ms maintained

### Phase 3 Metrics
- [ ] 10 languages fully supported
- [ ] Translation quality verified
- [ ] Language auto-detection works
- [ ] Wikipedia integration <2s
- [ ] Sync works across devices

### Phase 4 Metrics
- [ ] 99.5% uptime achieved
- [ ] Plugin API documented
- [ ] Monitoring dashboards live
- [ ] Billing system operational
- [ ] 100k+ users supported

## Emergency Protocols

### If implementation fails:
1. Type `ROLLBACK <step>`
2. Claude will revert changes
3. Analyze failure
4. Propose alternative approach

### If performance degrades:
1. Type `PERFORMANCE`
2. Claude will run benchmarks
3. Identify bottlenecks
4. Optimize critical paths

## File Organization

```
DictionaryApp/
├── CLAUDE.md (this file)
├── SAP_Dictionary_MVC.md (grand plan)
├── docs/
│   ├── implementation_log.json
│   ├── phase_1_plan.md
│   ├── phase_2_plan.md (generated)
│   ├── handoff_YYYYMMDD_HHMM.md
│   └── test_results/
├── lightning-dictionary/
│   ├── src/ (frontend)
│   ├── src-tauri/ (backend)
│   ├── api/ (REST API)
│   └── tests/
└── scripts/
    ├── plan_generator.py
    └── progress_tracker.py
```

## Usage Examples

### Human: Starting Phase 2
```
Human: PHASE2
Claude: [Generates complete Phase 2 plan with 15 steps]
```

### Human: Implementing a step
```
Human: IMPLEMENT 2.1
Claude: [Implements multi-definition display, runs tests, updates tracking]
```

### Human: Checking status
```
Human: STATUS
Claude: Phase 2 in progress (3/15 steps completed)
        Current: Step 2.4 - User accounts
        Time spent: 6 hours
        Performance: ✓ <50ms maintained
```

### Human: Continuing work
```
Human: CONTINUE
Claude: Resuming from Step 2.4 - User accounts
        Last action: Created user schema
        Next: Implement authentication endpoints
```

## Automated Testing Protocol

Each step implementation includes:
1. Unit tests (minimum 80% coverage)
2. Integration tests for API changes
3. Performance benchmarks
4. Cross-platform verification
5. User acceptance criteria

## Documentation Requirements

Each implementation automatically updates:
1. API documentation (OpenAPI spec)
2. Component documentation (JSDoc/TSDoc)
3. Architecture diagrams (if structural changes)
4. User guides (for new features)
5. Developer guides (for new APIs)

## Version Control Strategy

- Branch naming: `phase-X-step-Y`
- Commit format: `feat(phaseX): Implement step X.Y - description`
- PR description includes implementation log excerpt
- Automated PR creation for review

---

**Note**: This system is designed for maximum automation. Human involvement is limited to:
1. Typing phase keywords to initiate planning
2. Typing step numbers to trigger implementation
3. Reviewing completed work (optional)

All planning, implementation, testing, and documentation happens automatically based on the patterns established in this file.