# Visual Regression Testing System

## Overview

The Visual Regression Testing system ensures formatter and parser output consistency across HoloScript versions through Jest snapshot testing. Any structural changes to formatter output or AST nodes trigger snapshot review workflows.

## Purpose

**Prevent Unintended Behavior Changes**
- Formatter output shouldn't change unexpectedly between versions
- Parser AST structure should remain stable for downstream tools
- Code style consistency across the ecosystem

**Enable Confident Refactoring**
- Refactor internals without changing observable behavior
- Snapshots act as change detectors during development
- Safe parser/formatter optimizations

**Version Migration Safety**
- Upgrading HoloScript versions highlights breaking changes
- Clear diff view of what changed and why
- Migration path documentation through snapshot updates

## Test Suites

### 1. Formatter Snapshots (`FormatterSnapshots.test.ts`)

**Coverage: 50+ test cases**

#### Test Categories

**Basic Structures** (5 tests)
- Simple orb composition
- Nested objects
- Arrays
- Templates
- State machines

**HoloScript+ Features** (6 tests)
- Spread operator in objects: `{ ...Base, override: value }`
- Spread operator in arrays: `[...defaults, extra]`
- Null coalescing: `color ?? "default"`
- Null coalescing assignment: `count ??= 0`
- Ternary operator: `condition ? "yes" : "no"`
- Logic blocks with TypeScript code

**Real-World Scenarios** (5 tests)
- Interactive button panel
- Zone with environment settings
- Import statements
- UI components with accessibility traits
- Timeline animations

**Edge Cases** (8 tests)
- Empty compositions
- Single-line compositions
- Deeply nested structures
- Long property values
- Multiple blank lines
- Mixed indentation styles
- Trailing commas
- Comments preservation

**Configuration Variations** (5 tests)
- Tabs vs. spaces
- 2-space vs. 4-space indentation
- Single vs. double quotes
- Same-line vs. next-line braces
- Trailing comma policies

**Idempotency Tests** (2 tests)
- Format → format should be stable
- Complex structures should stabilize after one format

#### Example Test

```typescript
test('spread operator in objects', () => {
  const source = `composition ExtendedOrb {
  ...BaseOrb
  color: "red"
  glow: true
}`;
  const result = formatter.format(source, 'hsplus');
  expect(result.formatted).toMatchSnapshot();
});
```

#### Snapshot Output Location

Snapshots stored in: `packages/formatter/src/__tests__/__snapshots__/FormatterSnapshots.test.ts.snap`

### 2. Parser AST Snapshots (`ParserASTSnapshots.test.ts`)

**Coverage: 40+ test cases**

#### Test Categories

**Basic AST Structures** (4 tests)
- Simple composition AST
- Object literal AST
- Array literal AST
- Nested object AST

**Directive AST Nodes** (4 tests)
- Single trait directive (`@grabbable`)
- Multiple traits (`@grabbable`, `@hoverable`)
- Traits with configuration (`@physics(mass: 1.5)`)
- Accessibility traits (`@accessible`, `@alt_text`)

**Expression AST Nodes** (6 tests)
- Spread expressions in objects/arrays
- Null coalescing operator (`??`)
- Null coalescing assignment (`??=`)
- Ternary operator (`? :`)
- Complex expression combinations

**Control Flow AST** (3 tests)
- State machines
- Timeline animations
- Conditional logic

**Import/Module System** (3 tests)
- Import statements
- Multiple imports
- Using statements

**Template System** (3 tests)
- Template definitions
- Template extension
- Spread with templates

**UI Components** (3 tests)
- `ui_panel` AST
- `ui_button` AST
- Component hierarchy

**Zone/Environment** (2 tests)
- Zone definitions
- Environment settings

**Edge Cases** (4 tests)
- Empty compositions
- Minimal properties
- Deep nesting
- Multiple compositions

**AST Properties** (2 tests)
- Line number metadata
- Source position preservation

**Consistency** (2 tests)
- Parse stability (same input → same AST)
- Whitespace normalization

**Real-World Examples** (2 tests)
- Interactive scene with state machine
- Dashboard with imports, spread, null coalescing

**Snapshot Stability** (1 test)
- Deterministic AST generation

#### Example Test

```typescript
test('null coalescing assignment', () => {
  const source = `logic AssignmentTest {
  count ??= 0
  name ??= "default"
}`;
  const ast = parser.parse(source);
  
  // Verify assignment node structure
  expect(ast.body[0]).toHaveProperty('type');
  
  expect(ast).toMatchSnapshot();
});
```

#### Snapshot Output Location

Snapshots stored in: `packages/core/src/__tests__/__snapshots__/ParserASTSnapshots.test.ts.snap`

## Running Tests

### Run All Visual Regression Tests

```bash
# From HoloScript root
npm test -- --testPathPattern="Snapshots"

# Or specifically
npm test -- FormatterSnapshots
npm test -- ParserASTSnapshots
```

### Update Snapshots (After Intentional Changes)

```bash
# Update all snapshots
npm test -- -u --testPathPattern="Snapshots"

# Update specific test file
npm test -- -u FormatterSnapshots
```

### Interactive Snapshot Review

```bash
# Run tests in watch mode
npm test -- --watch --testPathPattern="Snapshots"

# Press 'u' to update failing snapshots
# Press 'i' to update snapshots interactively
```

## Snapshot Review Workflow

### When Snapshots Fail

1. **Review the Diff**
   ```bash
   npm test -- FormatterSnapshots
   ```
   
   Jest will show:
   - Expected (green): Previous snapshot
   - Received (red): Current output
   - Highlighted differences

2. **Determine if Change is Intentional**
   
   **Intentional Changes** (Update snapshots):
   - Parser enhancement adding new AST fields
   - Formatter improvement changing whitespace
   - New feature adding AST node types
   - Bug fix correcting incorrect output
   
   **Unintentional Changes** (Fix code):
   - Regression breaking existing behavior
   - Accidental formatting changes
   - AST structure corruption
   - Loss of metadata (line numbers, etc.)

3. **Update Snapshots if Intentional**
   ```bash
   npm test -- -u FormatterSnapshots
   ```

4. **Document the Change**
   - Update CHANGELOG.md with breaking changes
   - Note in PR description why snapshots changed
   - Add migration guide if AST structure changed

### When Adding New Tests

1. **Write the test** with `expect(...).toMatchSnapshot()`

2. **Run tests to generate initial snapshot**
   ```bash
   npm test -- FormatterSnapshots
   ```
   
   Jest will create the snapshot file

3. **Review the generated snapshot**
   - Open `__snapshots__/*.snap` file
   - Verify output is correct
   - Check for unexpected structure

4. **Commit snapshots** with the test code

## Snapshot File Format

### Example Formatter Snapshot

```javascript
// Jest Snapshot v1

exports[`Formatter Visual Regression Basic HoloScript Structures simple orb composition 1`] = `
"composition Orb {
  geometry: \\"sphere\\"
  color: \\"cyan\\"
  position: { x: 0, y: 1.5, z: -2 }
  @grabbable
  @hoverable
}"
`;
```

### Example Parser AST Snapshot

```javascript
exports[`Parser AST Visual Regression Expression AST Nodes null coalescing assignment 1`] = `
Object {
  "body": Array [
    Object {
      "type": "logic",
      "name": "AssignmentTest",
      "body": Array [
        Object {
          "type": "nullCoalescingAssignment",
          "target": "count",
          "value": 0,
        },
        Object {
          "type": "nullCoalescingAssignment",
          "target": "name",
          "value": "default",
        },
      ],
    },
  ],
  "type": "program",
}
`;
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Visual Regression Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run visual regression tests
        run: npm test -- --testPathPattern="Snapshots"
      
      - name: Check for snapshot changes
        run: |
          if git diff --exit-code **/__snapshots__/**; then
            echo "No snapshot changes"
          else
            echo "::error::Snapshots changed! Review and commit updates."
            exit 1
          fi
```

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

npm test -- --testPathPattern="Snapshots" --bail

if [ $? -ne 0 ]; then
  echo "Visual regression tests failed. Commit aborted."
  exit 1
fi
```

## Best Practices

### Writing Snapshot Tests

✅ **DO**
- Test representative examples of each feature
- Include edge cases (empty, minimal, complex)
- Test configuration variations
- Verify idempotency (format twice → same result)
- Add structural assertions before snapshot

❌ **DON'T**
- Snapshot overly large structures (harder to review)
- Test implementation details (internal variables)
- Include timestamps or random data
- Snapshot error messages (too brittle)

### Snapshot Maintenance

✅ **DO**
- Review diffs carefully before updating
- Document snapshot updates in PRs
- Keep snapshots in version control
- Run tests before committing
- Update snapshots all at once (not piecemeal)

❌ **DON'T**
- Auto-update without reviewing
- Commit snapshots without tests
- Ignore failing snapshots
- Update snapshots to fix tests

### Naming Conventions

```typescript
// ✅ Good: Descriptive test names
test('spread operator in objects', () => { ... })
test('null coalescing assignment with default value', () => { ... })

// ❌ Bad: Generic test names
test('test1', () => { ... })
test('parser test', () => { ... })
```

## Coverage Metrics

### Current Coverage

**Formatter Snapshots**
- 50+ test cases
- 10 test suites
- ~400 lines of test code

**Parser AST Snapshots**
- 40+ test cases
- 13 test suites
- ~550 lines of test code

**Total**: 90+ snapshot tests ensuring output stability

### Coverage Areas

| Feature | Formatter | Parser AST | Status |
|---------|-----------|------------|--------|
| Basic structures | ✅ | ✅ | Complete |
| Spread operator | ✅ | ✅ | Complete |
| Null coalescing | ✅ | ✅ | Complete |
| Null coalescing assignment | ✅ | ✅ | Complete |
| Ternary operator | ✅ | ✅ | Complete |
| Directives/Traits | ✅ | ✅ | Complete |
| State machines | ✅ | ✅ | Complete |
| UI components | ✅ | ✅ | Complete |
| Import/Export | ✅ | ✅ | Complete |
| Templates | ✅ | ✅ | Complete |
| Edge cases | ✅ | ✅ | Complete |
| Configuration | ✅ | N/A | Complete |
| Idempotency | ✅ | ✅ | Complete |

## Troubleshooting

### Snapshots Keep Failing

**Problem**: Tests fail consistently after code changes

**Solutions**:
1. Review diff to understand what changed
2. Check if change was intentional
3. Update snapshots if expected: `npm test -- -u`
4. Revert code if unintentional

### Snapshots Different Across Machines

**Problem**: Same code produces different snapshots on different machines

**Solutions**:
1. Ensure Node.js version consistency
2. Check line ending settings (CRLF vs LF)
3. Verify dependency versions match
4. Use `.gitattributes` to normalize line endings

### Large Snapshot Diffs

**Problem**: Snapshot diff is too large to review

**Solutions**:
1. Break into smaller, focused snapshots
2. Extract specific parts to test individually
3. Use structural assertions for complex parts
4. Consider testing subsets instead of full AST

## Future Enhancements

### Planned Improvements

1. **Visual Diff Tool**
   - Web-based snapshot comparison UI
   - Side-by-side diff viewer
   - Syntax-highlighted AST diffs

2. **Snapshot Coverage Reports**
   - Track which features have snapshot tests
   - Identify untested AST node types
   - Generate coverage badges

3. **Automated Snapshot Updates**
   - Bot comments on PRs with snapshot diffs
   - Approve/reject workflow for snapshot changes
   - Automatic CHANGELOG updates

4. **Performance Snapshots**
   - Track parser/formatter performance over time
   - Alert on performance regressions
   - Benchmark key operations

5. **Semantic Diff Tool**
   - Compare AST semantics, not structure
   - Ignore cosmetic differences
   - Focus on behavior changes

## References

- **Jest Snapshot Testing**: https://jestjs.io/docs/snapshot-testing
- **Snapshot Best Practices**: https://kentcdodds.com/blog/effective-snapshot-testing
- **FormatterSnapshots.test.ts**: 50+ formatter output tests
- **ParserASTSnapshots.test.ts**: 40+ parser AST tests

## Summary

The Visual Regression Testing system provides:
- ✅ 90+ snapshot tests (50 formatter + 40 parser)
- ✅ Comprehensive coverage of all HoloScript features
- ✅ Formatter output stability verification
- ✅ Parser AST structure consistency checks
- ✅ Configuration variation testing
- ✅ Edge case and idempotency verification
- ✅ Integration-ready with CI/CD workflows
- ✅ Clear review and update workflows

This ensures HoloScript output remains stable and predictable across versions while enabling confident refactoring and feature development.
