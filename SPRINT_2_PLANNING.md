# Sprint 2 Planning & Roadmap

**Status**: Planning  
**Target Start**: February 3, 2026  
**Estimated Duration**: 2-3 weeks

---

## Sprint 1 Recap

**Completion Status**: ✅ COMPLETE  
- Core Parser: 1,048/1,048 tests passing ✅
- Formatter: 36/36 tests passing ✅
- Sprint 1 Acceptance: 160/160 tests passing ✅
- Legacy Failures Resolved: 5/7 (3 fixed, 2+ deferred)

---

## Sprint 2 High-Level Goals

### Primary Objective
**Expand parser capabilities and advance testing infrastructure**

- Implement deferred language features
- Enhance error recovery for edge cases
- Improve incremental compilation
- Stabilize visual testing framework

### Secondary Objective
**Improve developer experience**

- Better error messages and recovery suggestions
- Performance optimization
- Enhanced IDE integration

---

## Sprint 2 Work Breakdown

### Phase 1: Deferred Language Features (4-5 days)

#### 1.1 Advanced Spread Operator Support
**Blocker Test**: Modernization.test.ts (2 tests skipped)

**Current Status**: 
- Basic spread works in arrays
- Need: Object spread, nested spread patterns, function arguments

**Implementation**:
```
- Update lexer to recognize spread in more contexts
- Extend parser to handle spread in objects and function calls
- Update type checker for spread type inference
- Tests: Add 5+ new test cases
```

**Acceptance Criteria**:
- ✅ Spread works in objects: `{ ...obj }` 
- ✅ Nested spread: `{ a: { ...inner } }`
- ✅ Function arguments: `func(...args)`
- ✅ Type inference for spread operations
- ✅ 2 deferred Modernization tests pass

**Files to Modify**:
- [packages/core/src/parser/HoloScriptPlusParser.ts](packages/core/src/parser/HoloScriptPlusParser.ts)
- [packages/core/src/HoloScriptTypeChecker.ts](packages/core/src/HoloScriptTypeChecker.ts)
- [packages/core/src/__tests__/Modernization.test.ts](packages/core/src/__tests__/Modernization.test.ts)

---

#### 1.2 Enhanced Error Recovery
**Blocker Test**: ParserRecovery.test.ts (1 test skipped)

**Current Status**:
- Basic error recovery works
- Need: Property syntax recovery, advanced patterns

**Implementation**:
```
- Implement recovery for missing colons in properties
- Handle recovery from invalid syntax within blocks
- Add recovery for incomplete statements
- Tests: Add recovery tests for edge cases
```

**Acceptance Criteria**:
- ✅ Recover from missing property colons
- ✅ Continue parsing after invalid property syntax
- ✅ Provide meaningful error locations
- ✅ 1 deferred ParserRecovery test passes

**Files to Modify**:
- [packages/core/src/parser/ErrorRecovery.ts](packages/core/src/parser/ErrorRecovery.ts)
- [packages/core/src/parser/HoloScriptPlusParser.ts](packages/core/src/parser/HoloScriptPlusParser.ts)
- [packages/core/src/__tests__/ParserRecovery.test.ts](packages/core/src/__tests__/ParserRecovery.test.ts)

---

#### 1.3 Trait Change Detection in Incremental Compiler
**Blocker Test**: IncrementalCompiler.test.ts (1 test skipped)

**Current Status**:
- Incremental compiler exists but doesn't track trait changes
- Need: Diff system for trait modifications

**Implementation**:
```
- Extend diff system to track trait changes
- Implement individual add/remove detection for traits
- Cache trait states between compilations
- Tests: Add trait change detection tests
```

**Acceptance Criteria**:
- ✅ Detect trait additions
- ✅ Detect trait removals
- ✅ Detect trait modifications
- ✅ Perform incremental recompile on trait change
- ✅ 1 deferred IncrementalCompiler test passes

**Files to Modify**:
- [packages/core/src/compiler/IncrementalCompiler.ts](packages/core/src/compiler/IncrementalCompiler.ts)
- [packages/core/src/__tests__/compiler/IncrementalCompiler.test.ts](packages/core/src/__tests__/compiler/IncrementalCompiler.test.ts)

---

### Phase 2: Testing Infrastructure (3-4 days)

#### 2.1 Visual Test Runner Stabilization
**Issue**: @holoscript/test visual test timeout (1 failure)

**Current Status**:
- Test times out waiting for HOLO_RENDERED signal
- Affects visual regression testing framework

**Root Cause Analysis**:
```
Tests/Scope:
1. Check if rendering engine is available
2. Verify signal passing mechanism
3. Increase timeout threshold
4. Implement fallback rendering
```

**Implementation Options**:

**Option A: Fix Signal Passing** (Preferred)
```typescript
// Current: Waits 5000ms for signal
// Proposed: Improve signal mechanism or use alternative approach
- Implement event-based signal passing
- Add retry mechanism for signal detection
- Increase timeout to 10000ms for complex scenes
```

**Option B: Use Alternative Renderer**
```
- Replace with simpler rendering approach
- Use canvas/image buffer directly
- Remove signal dependency
```

**Acceptance Criteria**:
- ✅ Visual test passes without timeout
- ✅ Diff detection works properly
- ✅ Report generation works
- ✅ 9/9 test package tests passing

**Files to Modify**:
- [packages/test/src/VisualTestRunner.ts](packages/test/src/VisualTestRunner.ts)
- [packages/test/src/__tests__/visual.test.ts](packages/test/src/__tests__/visual.test.ts)

---

#### 2.2 Parser Benchmarking
**Goal**: Establish performance baselines

**Scope**:
```
- Benchmark parse time for various file sizes
- Track memory usage
- Identify performance bottlenecks
- Set performance targets for future sprints
```

**Deliverables**:
- Performance baseline document
- Benchmark test suite
- Performance regression detection in CI

---

### Phase 3: Performance Optimization (2-3 days)

#### 3.1 Parser Performance
**Goals**:
- Make incremental parsing faster
- Reduce memory footprint
- Optimize AST traversal

**Potential Improvements**:
```
1. Cache AST nodes
2. Implement lazy parsing
3. Optimize string operations
4. Use worker threads for large files
```

**Success Metrics**:
- 20% faster parse time
- 30% less memory for large files
- <100ms parse time for typical files

---

#### 3.2 Formatter Performance
**Goals**:
- Optimize indentation calculation
- Speed up import sorting for large files
- Parallel formatting for multi-file operations

---

### Phase 4: Developer Experience (1-2 days)

#### 4.1 Improved Error Messages
**Goal**: Make errors more helpful and actionable

**Examples**:
```
Current: "Unexpected token }"
Improved: "Unexpected closing brace at line 42. 
           Expected property or closing composition block.
           
           composition MyComp {
             object Cube {
               position: [0, 0, 0]
           } <- Remove this brace or add property after closing brace"
```

**Implementation**:
- Add error suggestions
- Include code context
- Add "did you mean?" functionality

---

#### 4.2 VSCode Extension Enhancements
**Improvements**:
- Better syntax highlighting
- Code snippets for common patterns
- Quick fixes for common errors
- Hover documentation

---

## Deferred Features (Future Sprints)

### Browser Support
- Compile parser to WebAssembly
- Browser-based IDE
- Online playground

### Distributed Compilation
- Cloud-based compilation
- Worker thread support
- Build cache distribution

### Advanced Language Features
- Generic types
- Advanced trait constraints
- Macro system
- Module system enhancements

---

## Sprint 2 Success Criteria

### Hard Requirements
- ✅ All 3 deferred tests passing (Modernization, ParserRecovery, IncrementalCompiler)
- ✅ Visual test runner working (9/9 tests passing)
- ✅ No regression in core tests (1,048/1,048 maintained)
- ✅ No regression in formatter tests (36/36 maintained)

### Soft Requirements
- ✅ Performance baseline established
- ✅ Error messages improved significantly
- ✅ Documentation updated
- ✅ IDE integration enhanced

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Signal mechanism broken | Medium | High | Option B: Alternative renderer |
| Performance regression | Low | Medium | Benchmark before optimizing |
| Feature scope creep | Medium | High | Strict scope adherence |
| Incremental compiler complexity | High | Medium | Start with basic diff system |

---

## Resource Allocation

### By Phase
- Phase 1 (Features): 40% effort
- Phase 2 (Testing): 35% effort
- Phase 3 (Performance): 15% effort
- Phase 4 (DX): 10% effort

### Team Size Estimate
- 1-2 developers full-time
- Part-time QA for testing validation

---

## Deliverables Checklist

- [ ] All 3 deferred tests passing
- [ ] Visual test runner stabilized
- [ ] Performance baseline document
- [ ] Improved error messages
- [ ] Enhanced VSCode extension
- [ ] Updated documentation
- [ ] Sprint 2 completion report
- [ ] Sprint 2 retrospective

---

## Timeline

| Phase | Days | Target Completion |
|-------|------|-------------------|
| Phase 1 (Features) | 4-5  | Feb 7-8 |
| Phase 2 (Testing) | 3-4  | Feb 11-12 |
| Phase 3 (Performance) | 2-3  | Feb 13-14 |
| Phase 4 (DX) | 1-2  | Feb 14-15 |
| QA & Buffer | 2-3  | Feb 17-18 |
| **Sprint 2 Complete** | **~14 days** | **Feb 17-18** |

---

## Next Steps

1. **Review** this plan with stakeholders
2. **Adjust** scope based on feedback
3. **Prioritize** work items
4. **Create** detailed JIRA/GitHub issues
5. **Begin** Phase 1 on next working day

---

*Plan created: February 3, 2026*  
*Prepared for: Sprint 2 kickoff*  
*Status: Ready for approval*
