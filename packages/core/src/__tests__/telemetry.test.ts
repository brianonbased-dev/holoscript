/**
 * Performance Telemetry Tests
 *
 * Tests for frame timing, memory profiling, performance budgets
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PerformanceTelemetry } from '../runtime/PerformanceTelemetry';

describe('PerformanceTelemetry', () => {
  let telemetry: PerformanceTelemetry;

  beforeEach(() => {
    telemetry = new PerformanceTelemetry();
  });

  describe('Frame Timing', () => {
    it('should record frame duration', () => {
      telemetry.recordFrame(16.67); // 60 FPS
      expect(telemetry.getCurrentFPS()).toBeCloseTo(60, 0);
    });

    it('should track average FPS', () => {
      telemetry.recordFrame(16.67);
      telemetry.recordFrame(16.67);
      telemetry.recordFrame(16.67);

      expect(telemetry.getAverageFPS()).toBeCloseTo(60, 0);
    });

    it('should detect frame drops', () => {
      telemetry.recordFrame(16.67); // 60 FPS
      telemetry.recordFrame(50); // 20 FPS - drop
      telemetry.recordFrame(16.67); // 60 FPS

      const drops = telemetry.getFrameDrops();
      expect(drops.length).toBeGreaterThan(0);
    });

    it('should calculate min/max frame time', () => {
      telemetry.recordFrame(10);
      telemetry.recordFrame(20);
      telemetry.recordFrame(15);

      const stats = telemetry.getFrameStats();
      expect(stats.minTime).toBe(10);
      expect(stats.maxTime).toBe(20);
    });

    it('should estimate frame variance', () => {
      telemetry.recordFrame(16.67);
      telemetry.recordFrame(16.67);
      telemetry.recordFrame(33.34); // Variance spike

      const stats = telemetry.getFrameStats();
      expect(stats.variance).toBeGreaterThan(0);
    });

    it('should track jitter', () => {
      telemetry.recordFrame(16);
      telemetry.recordFrame(17);
      telemetry.recordFrame(16.5);

      const jitter = telemetry.getJitter();
      expect(jitter).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Memory Profiling', () => {
    it('should record memory usage', () => {
      telemetry.recordMemory({ usedJSHeapSize: 10000000 });
      const memory = telemetry.getCurrentMemory();

      expect(memory).toBeGreaterThan(0);
    });

    it('should track peak memory', () => {
      telemetry.recordMemory({ usedJSHeapSize: 10000000 });
      telemetry.recordMemory({ usedJSHeapSize: 20000000 });
      telemetry.recordMemory({ usedJSHeapSize: 15000000 });

      const peak = telemetry.getPeakMemory();
      expect(peak).toBe(20000000);
    });

    it('should detect memory leaks', () => {
      // Simulate gradual memory growth
      for (let i = 0; i < 100; i++) {
        telemetry.recordMemory({ usedJSHeapSize: 10000000 + i * 100000 });
      }

      const leak = telemetry.detectMemoryLeak();
      expect(leak).toBeDefined();
    });

    it('should calculate memory churn rate', () => {
      telemetry.recordMemory({ usedJSHeapSize: 10000000 });
      telemetry.recordMemory({ usedJSHeapSize: 12000000 });
      telemetry.recordMemory({ usedJSHeapSize: 11000000 });

      const churn = telemetry.getMemoryChurnRate();
      expect(churn).toBeGreaterThanOrEqual(0);
    });

    it('should track garbage collection', () => {
      telemetry.recordGarbageCollection({
        duration: 5,
        collected: 2000000,
      });

      const gcStats = telemetry.getGCStats();
      expect(gcStats.totalGCs).toBeGreaterThan(0);
    });

    it('should monitor heap fragmentation', () => {
      telemetry.recordMemory({
        usedJSHeapSize: 50000000,
        jsHeapSizeLimit: 100000000,
      });

      const fragmentation = telemetry.getHeapFragmentation();
      expect(fragmentation).toBeCloseTo(0.5, 1);
    });
  });

  describe('Performance Budgets', () => {
    it('should set frame time budget', () => {
      telemetry.setFrameBudget(16.67); // 60 FPS target
      expect(telemetry.getFrameBudget()).toBe(16.67);
    });

    it('should check frame time budget', () => {
      telemetry.setFrameBudget(16.67);
      telemetry.recordFrame(16); // Within budget
      telemetry.recordFrame(20); // Over budget

      const budgetStatus = telemetry.checkFrameBudget();
      expect(budgetStatus.exceeded).toBe(1);
    });

    it('should set memory budget', () => {
      telemetry.setMemoryBudget(50000000); // 50MB
      expect(telemetry.getMemoryBudget()).toBe(50000000);
    });

    it('should alert when memory budget exceeded', () => {
      telemetry.setMemoryBudget(20000000);
      telemetry.recordMemory({ usedJSHeapSize: 25000000 });

      const budgetStatus = telemetry.checkMemoryBudget();
      expect(budgetStatus.exceeded).toBe(true);
    });

    it('should provide budget recommendations', () => {
      for (let i = 0; i < 60; i++) {
        telemetry.recordFrame(20); // Below 60 FPS
      }

      const recommendations = telemetry.getBudgetRecommendations();
      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Analytics Export', () => {
    it('should export basic metrics', () => {
      telemetry.recordFrame(16.67);
      telemetry.recordMemory({ usedJSHeapSize: 15000000 });

      const metrics = telemetry.exportMetrics();
      expect(metrics.fps).toBeDefined();
      expect(metrics.memory).toBeDefined();
    });

    it('should generate JSON report', () => {
      telemetry.recordFrame(16.67);
      telemetry.recordMemory({ usedJSHeapSize: 15000000 });

      const report = telemetry.generateJSONReport();
      expect(report).toContain('{');
      expect(report).toContain('}');
    });

    it('should export to analytics platform', async () => {
      telemetry.recordFrame(16.67);
      telemetry.recordMemory({ usedJSHeapSize: 15000000 });

      const result = await telemetry.exportToAnalytics('test-session-id');
      expect(result).toBeDefined();
    });

    it('should create performance snapshot', () => {
      telemetry.recordFrame(16.67);
      telemetry.recordFrame(16.67);
      telemetry.recordMemory({ usedJSHeapSize: 15000000 });

      const snapshot = telemetry.createSnapshot();
      expect(snapshot).toBeDefined();
      expect(snapshot.timestamp).toBeDefined();
    });
  });

  describe('Real-time Monitoring', () => {
    it('should provide live metrics', () => {
      telemetry.recordFrame(16.67);
      const liveMetrics = telemetry.getLiveMetrics();

      expect(liveMetrics.fps).toBeDefined();
      expect(liveMetrics.frameTime).toBeDefined();
    });

    it('should detect performance issues in real-time', () => {
      telemetry.setFrameBudget(16.67);
      telemetry.recordFrame(50); // Slow frame

      const issues = telemetry.detectIssues();
      expect(issues.length).toBeGreaterThan(0);
    });

    it('should track performance degradation', () => {
      for (let i = 0; i < 10; i++) {
        telemetry.recordFrame(16.67);
      }
      for (let i = 0; i < 10; i++) {
        telemetry.recordFrame(25); // Degradation
      }

      const degradation = telemetry.getPerformanceDegradation();
      expect(degradation).toBeGreaterThan(0);
    });

    it('should alert on critical issues', () => {
      let alertCalled = false;
      telemetry.onAlert((alert) => {
        alertCalled = true;
      });

      telemetry.setFrameBudget(16.67);
      for (let i = 0; i < 10; i++) {
        telemetry.recordFrame(50); // Trigger alert
      }

      expect(alertCalled || telemetry.getIssueCount() > 0).toBe(true);
    });
  });

  describe('Profiling Features', () => {
    it('should profile function execution', async () => {
      const fn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      };

      const profile = await telemetry.profileFunction(fn);
      expect(profile.duration).toBeGreaterThanOrEqual(10);
    });

    it('should identify hot functions', () => {
      telemetry.recordFunctionCall('expensiveOp', 50);
      telemetry.recordFunctionCall('expensiveOp', 45);
      telemetry.recordFunctionCall('cheapOp', 2);

      const hotFunctions = telemetry.getHotFunctions();
      expect(hotFunctions[0].name).toBe('expensiveOp');
    });

    it('should track call stacks', () => {
      telemetry.pushCallStack('main');
      telemetry.pushCallStack('helper');
      telemetry.pushCallStack('utility');
      telemetry.popCallStack();

      const stack = telemetry.getCallStack();
      expect(stack.length).toBeGreaterThan(0);
    });

    it('should generate flame graph data', () => {
      telemetry.recordFunctionCall('func1', 100);
      telemetry.recordFunctionCall('func2', 50);

      const flameGraph = telemetry.generateFlameGraphData();
      expect(flameGraph).toBeDefined();
    });
  });

  describe('Advanced Analytics', () => {
    it('should calculate performance percentiles', () => {
      for (let i = 0; i < 100; i++) {
        telemetry.recordFrame(16.67 + Math.random() * 5);
      }

      const p95 = telemetry.getPercentile(95);
      expect(p95).toBeGreaterThan(16.67);
    });

    it('should identify performance bottlenecks', () => {
      telemetry.recordFrame(50);
      telemetry.recordFrame(45);
      telemetry.recordFrame(48);

      const bottlenecks = telemetry.findBottlenecks();
      expect(bottlenecks.length).toBeGreaterThan(0);
    });

    it('should suggest optimizations', () => {
      telemetry.setFrameBudget(16.67);
      for (let i = 0; i < 20; i++) {
        telemetry.recordFrame(30);
      }

      const suggestions = telemetry.suggestOptimizations();
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should track trends over time', () => {
      telemetry.recordFrame(16.67);
      telemetry.recordFrame(17);
      telemetry.recordFrame(18);
      telemetry.recordFrame(19);

      const trend = telemetry.analyzeTrend();
      expect(trend).toBeDefined();
      expect(trend.direction).toMatch(/increasing|decreasing|stable/);
    });
  });
});
