/**
 * AlertTrait Tests
 *
 * Tests for threshold-based alerting system
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { alertHandler } from '../AlertTrait';
import {
  createMockContext,
  createMockNode,
  attachTrait,
  sendEvent,
  getLastEvent,
  getEventCount,
} from './traitTestHelpers';

describe('AlertTrait', () => {
  let node: Record<string, unknown>;
  let ctx: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    node = createMockNode('alert-node');
    ctx = createMockContext();
  });

  describe('initialization', () => {
    it('should have correct default config', () => {
      expect(alertHandler.defaultConfig.severity).toBe('warning');
      expect(alertHandler.defaultConfig.cooldown).toBe(5000);
      expect(alertHandler.defaultConfig.max_active).toBe(5);
    });

    it('should attach and initialize state', () => {
      attachTrait(alertHandler, node, {}, ctx);
      
      const state = (node as any).__alertState;
      expect(state).toBeDefined();
      expect(state.activeAlerts.size).toBe(0);
      expect(state.lastTriggerTime).toBe(0);
    });
  });

  describe('alert triggering', () => {
    beforeEach(() => {
      attachTrait(alertHandler, node, {
        severity: 'warning',
        cooldown: 0,
      }, ctx);
      ctx.clearEvents();
    });

    it('should trigger alert event', () => {
      sendEvent(alertHandler, node, { severity: 'warning', cooldown: 0 }, ctx, {
        type: 'alert_trigger',
        message: 'Test alert',
      });
      
      expect(getEventCount(ctx, 'on_alert_triggered')).toBe(1);
      const alert = getLastEvent(ctx, 'on_alert_triggered');
      expect(alert.severity).toBe('warning');
    });

    it('should create alert instance', () => {
      sendEvent(alertHandler, node, { severity: 'warning', cooldown: 0 }, ctx, {
        type: 'alert_trigger',
        id: 'test-alert',
        message: 'Test message',
      });
      
      const state = (node as any).__alertState;
      expect(state.activeAlerts.size).toBe(1);
      expect(state.activeAlerts.has('test-alert')).toBe(true);
    });
  });

  describe('severity levels', () => {
    it('should support all severity levels', () => {
      const severities = ['info', 'warning', 'error', 'critical'];
      
      for (const severity of severities) {
        const testNode = createMockNode('test');
        const testCtx = createMockContext();
        
        attachTrait(alertHandler, testNode, {
          severity,
          cooldown: 0,
        }, testCtx);
        testCtx.clearEvents();
        
        sendEvent(alertHandler, testNode, { severity, cooldown: 0 }, testCtx, {
          type: 'alert_trigger',
        });
        
        const alert = getLastEvent(testCtx, 'on_alert_triggered');
        expect(alert.severity).toBe(severity);
      }
    });
  });

  describe('cooldown', () => {
    beforeEach(() => {
      attachTrait(alertHandler, node, {
        cooldown: 5000,
      }, ctx);
      ctx.clearEvents();
    });

    it('should set cooldown flag after trigger', () => {
      sendEvent(alertHandler, node, { cooldown: 5000 }, ctx, {
        type: 'alert_trigger',
      });
      
      const state = (node as any).__alertState;
      expect(state.isOnCooldown).toBe(true);
    });

    it('should block alerts during cooldown', () => {
      sendEvent(alertHandler, node, { cooldown: 5000 }, ctx, {
        type: 'alert_trigger',
      });
      ctx.clearEvents();
      
      // Second trigger should be blocked
      sendEvent(alertHandler, node, { cooldown: 5000 }, ctx, {
        type: 'alert_trigger',
      });
      
      expect(getEventCount(ctx, 'on_alert_triggered')).toBe(0);
    });
  });

  describe('max active alerts', () => {
    beforeEach(() => {
      attachTrait(alertHandler, node, {
        max_active: 2,
        cooldown: 0,
      }, ctx);
      ctx.clearEvents();
    });

    it('should limit active alerts', () => {
      // Trigger 3 alerts
      for (let i = 0; i < 3; i++) {
        sendEvent(alertHandler, node, { max_active: 2, cooldown: 0 }, ctx, {
          type: 'alert_trigger',
          id: `alert-${i}`,
        });
      }
      
      const state = (node as any).__alertState;
      expect(state.activeAlerts.size).toBeLessThanOrEqual(2);
    });
  });

  describe('alert acknowledgement', () => {
    beforeEach(() => {
      attachTrait(alertHandler, node, {
        cooldown: 0,
      }, ctx);
      
      sendEvent(alertHandler, node, { cooldown: 0 }, ctx, {
        type: 'alert_trigger',
        id: 'test-alert',
      });
      ctx.clearEvents();
    });

    it('should acknowledge alert', () => {
      sendEvent(alertHandler, node, {}, ctx, {
        type: 'alert_acknowledge',
        alertId: 'test-alert',
      });
      
      const state = (node as any).__alertState;
      const alert = state.activeAlerts.get('test-alert');
      expect(alert.acknowledged).toBe(true);
    });
  });

  describe('visual effects', () => {
    it('should emit visual effect on trigger', () => {
      attachTrait(alertHandler, node, {
        visual_effect: 'pulse',
        cooldown: 0,
      }, ctx);
      ctx.clearEvents();
      
      sendEvent(alertHandler, node, { visual_effect: 'pulse', cooldown: 0 }, ctx, {
        type: 'alert_trigger',
      });
      
      expect(getEventCount(ctx, 'alert_visual_effect')).toBe(1);
    });
  });

  describe('haptic feedback', () => {
    it('should emit haptic event on trigger', () => {
      attachTrait(alertHandler, node, {
        haptic: true,
        cooldown: 0,
      }, ctx);
      ctx.clearEvents();
      
      sendEvent(alertHandler, node, { haptic: true, cooldown: 0 }, ctx, {
        type: 'alert_trigger',
      });
      
      expect(getEventCount(ctx, 'alert_haptic')).toBe(1);
    });
  });

  describe('cleanup', () => {
    it('should clean up state on detach', () => {
      attachTrait(alertHandler, node, {}, ctx);
      
      sendEvent(alertHandler, node, { cooldown: 0 }, ctx, {
        type: 'alert_trigger',
      });
      
      alertHandler.onDetach?.(node, alertHandler.defaultConfig, ctx);
      
      expect((node as any).__alertState).toBeUndefined();
    });
  });
});
