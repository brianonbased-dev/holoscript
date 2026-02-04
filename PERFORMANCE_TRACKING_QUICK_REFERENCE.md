# HoloScript+ Performance Tracking - Quick Reference

## Quick Start

### Import the Tracker
```typescript
import { performanceTracker } from '@holoscript/core';
```

### Record a Metric
```typescript
// Simple measurement
performanceTracker.recordMetric('My Operation', 5.2);

// With secondary metric (e.g., ops/sec)
performanceTracker.recordMetric('My Operation', 5.2, 192.3);
```

### Generate a Report
```typescript
import { PerformanceReportGenerator } from '@holoscript/core';

const generator = new PerformanceReportGenerator(performanceTracker);
const report = generator.generateReport();

// Print to console
generator.printReport(report);

// Save to file
generator.saveReport(report, 'my-report.json');
```

---

## Common Patterns

### Pattern 1: Measure Operation Duration
```typescript
const start = performance.now();
// ... do work ...
const elapsed = performance.now() - start;
performanceTracker.recordMetric('Operation Name', elapsed);
```

### Pattern 2: Measure Operations Per Second
```typescript
const start = performance.now();
let count = 0;

for (let i = 0; i < iterations; i++) {
  // ... do work ...
  count++;
}

const elapsed = performance.now() - start;
const opsPerSec = (count / elapsed) * 1000;
performanceTracker.recordMetric('My Operation', elapsed, opsPerSec);
```

### Pattern 3: Benchmark Loop
```typescript
function timed(name: string, fn: () => void, iterations = 100) {
  const times: number[] = [];
  
  // Warmup
  for (let i = 0; i < 10; i++) fn();
  
  // Measure
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    times.push(performance.now() - start);
  }
  
  const avgMs = times.reduce((a, b) => a + b) / times.length;
  const opsPerSec = 1000 / avgMs;
  
  performanceTracker.recordMetric(name, avgMs, opsPerSec);
  return { avgMs, opsPerSec };
}
```

### Pattern 4: Memory Tracking
```typescript
const before = process.memoryUsage().heapUsed;

// ... do work ...
for (let i = 0; i < 1000; i++) {
  // ... operation ...
}

if (global.gc) global.gc();
const after = process.memoryUsage().heapUsed;
const memoryMB = (after - before) / 1024 / 1024;

performanceTracker.recordMetric('Memory Growth (MB)', memoryMB);
```

---

## Naming Conventions

Good metric names include these keywords to be auto-categorized:

| Keyword | Category | Example |
|---------|----------|---------|
| Parse | Parser | "Parse Simple Scene" |
| Compile | Compiler | "Compile to visionOS" |
| Generate | Compiler | "Generate USDA" |
| Reduction | Code Metrics | "Code Reduction %" |
| LOC | Code Metrics | "Complex Scene LOC" |
| Memory | Memory | "Memory Increase (MB)" |
| Pipeline | Pipeline | "Full Pipeline" |
| Scalability | Scalability | "Parse Scalability" |

---

## Expected Performance Targets

| Metric | Target | Alert |
|--------|--------|-------|
| Parser | < 15ms | > 15ms |
| Compiler | < 10ms | > 10ms |
| Pipeline | < 50ms | > 50ms |
| Memory Growth | < 50MB | > 50MB |
| Code Reduction | > 50% | < 50% |

---

## In Tests

```typescript
import { describe, it, expect } from 'vitest';
import { performanceTracker } from '@holoscript/core';

describe('My Feature', () => {
  it('should perform well', () => {
    const result = benchmark('My Operation', () => {
      // ... operation ...
    }, 100);
    
    performanceTracker.recordMetric('My Operation', result.avgMs, result.opsPerSecond);
    
    expect(result.avgMs).toBeLessThan(10);
  });
});
```

---

## View Metrics

```typescript
// Get all metrics
const allMetrics = performanceTracker.getAllMetrics();
console.log(allMetrics);

// Get history for specific metric
const history = performanceTracker.getMetricHistory('Parse Simple Scene');
console.log(history);

// Reset all metrics
performanceTracker.reset();
```

---

## Generate Reports

```typescript
import { PerformanceReportGenerator } from '@holoscript/core';

const generator = new PerformanceReportGenerator(performanceTracker);

// Generate complete report
const report = generator.generateReport();

// Print to console
generator.printReport(report);

// Save to JSON
generator.saveReport(report, 'performance-report.json');

// Get formatted text
const text = generator.formatReport(report);
console.log(text);
```

---

## Tips & Tricks

### 1. Warmup Before Measuring
```typescript
// First few runs are slower due to JIT compilation
for (let i = 0; i < 10; i++) fn();

// Now measure
for (let i = 0; i < 100; i++) {
  // measure...
}
```

### 2. Use Consistent Units
- Time: milliseconds (ms)
- Memory: megabytes (MB)
- Count: operations per second (ops/sec)

### 3. Track Multiple Metrics
```typescript
// Record both time and throughput
const elapsed = measureTime(() => doWork());
const throughput = itemsProcessed / (elapsed / 1000);

performanceTracker.recordMetric('Operation', elapsed, throughput);
```

### 4. Name Metrics Consistently
```typescript
// Good
"Parse Simple Scene"
"Compile to visionOS"
"Memory Increase (MB)"

// Avoid
"Perf Test 1"
"Operation"
"Time"
```

---

## Common Mistakes

❌ **Don't:**
```typescript
// Not measuring
doWork();

// Measuring wrong thing
const start = new Date();
```

✅ **Do:**
```typescript
// Measure correctly
const start = performance.now();
doWork();
const elapsed = performance.now() - start;
performanceTracker.recordMetric('Operation', elapsed);
```

---

## Debugging

### No metrics being recorded?
```typescript
// Check if tracker is being used
const metrics = performanceTracker.getAllMetrics();
console.log(metrics); // Should not be empty
```

### Wrong category?
Use standard keywords in metric names:
- "Parse" → Parser
- "Compile" → Compiler
- "Memory" → Memory
- etc.

### Want to check metric value?
```typescript
const history = performanceTracker.getMetricHistory('My Metric');
console.log(history[history.length - 1]); // Latest value
```

---

## Resources

- **Full Guide**: [PERFORMANCE_TRACKING.md](docs/PERFORMANCE_TRACKING.md)
- **Examples**: [CodeReduction.test.ts](__tests__/benchmark/CodeReduction.test.ts)
- **Integration Tests**: [PerformanceTrackingIntegration.test.ts](__tests__/integration/PerformanceTrackingIntegration.test.ts)

---

**Last Updated:** 2024-01-15  
**Version:** 1.0.0
