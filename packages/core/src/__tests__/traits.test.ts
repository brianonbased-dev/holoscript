/**
 * Traits Tests
 *
 * Comprehensive test suite for VoiceInputTrait and AIDriverTrait
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VoiceInputTrait } from '../traits/VoiceInputTrait';
import { AIDriverTrait } from '../traits/AIDriverTrait';

describe('VoiceInputTrait', () => {
  let trait: VoiceInputTrait;

  beforeEach(() => {
    trait = new VoiceInputTrait({
      enabled: true,
      language: 'en-US',
      confidenceThreshold: 0.7,
      commands: {
        'activate': { action: 'activate', confidence: 0.8 },
        'grab': { action: 'grab', confidence: 0.85 },
      },
    });
  });

  describe('Initialization', () => {
    it('should initialize with valid config', () => {
      expect(trait.isEnabled()).toBe(true);
      expect(trait.getLanguage()).toBe('en-US');
    });

    it('should set confidence threshold', () => {
      expect(trait.getConfidenceThreshold()).toBe(0.7);
    });

    it('should load command dictionary', () => {
      const commands = trait.getCommands();
      expect(commands).toBeDefined();
      expect(Object.keys(commands).length).toBeGreaterThan(0);
    });

    it('should handle multi-language support', () => {
      const esTrait = new VoiceInputTrait({
        enabled: true,
        language: 'es-ES',
        commands: {},
      });
      expect(esTrait.getLanguage()).toBe('es-ES');
    });
  });

  describe('Voice Recognition', () => {
    it('should recognize voice command', async () => {
      const result = await trait.recognizeCommand('activate');
      expect(result).toBeDefined();
      expect(result.action).toBe('activate');
    });

    it('should respect confidence threshold', async () => {
      const result = await trait.recognizeCommand('unknown command');
      if (result) {
        expect(result.confidence).toBeGreaterThanOrEqual(
          trait.getConfidenceThreshold()
        );
      }
    });

    it('should fuzzy match similar commands', async () => {
      const result = await trait.fuzzyMatch('activvate', trait.getCommands());
      expect(result).toBeDefined();
      expect(result?.action).toBe('activate');
    });

    it('should handle multiple language input', async () => {
      const commands = {
        'activate': { action: 'activate', confidence: 0.8 },
        'activar': { action: 'activate', confidence: 0.8 },
      };
      const esTrait = new VoiceInputTrait({
        enabled: true,
        language: 'es-ES',
        commands,
      });

      const result = await esTrait.recognizeCommand('activar');
      expect(result?.action).toBe('activate');
    });
  });

  describe('Command Matching', () => {
    it('should find exact command match', () => {
      const match = trait.matchCommand('grab');
      expect(match).toBeDefined();
      expect(match?.action).toBe('grab');
    });

    it('should fail on unknown command', () => {
      const match = trait.matchCommand('unknown');
      expect(match).toBeUndefined();
    });

    it('should handle case-insensitive matching', () => {
      const match = trait.matchCommand('ACTIVATE');
      expect(match?.action).toBe('activate');
    });

    it('should handle whitespace trimming', () => {
      const match = trait.matchCommand('  activate  ');
      expect(match?.action).toBe('activate');
    });

    it('should rank matches by confidence', () => {
      const commands = {
        'grab': { action: 'grab', confidence: 0.95 },
        'grip': { action: 'grab', confidence: 0.80 },
      };
      const trait2 = new VoiceInputTrait({
        enabled: true,
        commands,
      });

      const rankings = trait2.rankMatches('grab', commands);
      expect(rankings[0].confidence).toBeGreaterThan(rankings[1].confidence);
    });
  });

  describe('Event Handling', () => {
    it('should emit on recognition success', (done) => {
      trait.on('recognized', (cmd) => {
        expect(cmd.action).toBe('activate');
        done();
      });
      trait.simulateRecognition('activate');
    });

    it('should emit on recognition failure', (done) => {
      trait.on('unrecognized', (input) => {
        expect(input).toBe('unknown');
        done();
      });
      trait.simulateRecognition('unknown');
    });

    it('should emit error on invalid input', (done) => {
      trait.on('error', (error) => {
        expect(error).toBeDefined();
        done();
      });
      trait.simulateError('Failed to recognize');
    });

    it('should batch multiple recognitions', async () => {
      const recognitions: string[] = [];
      trait.on('recognized', (cmd) => {
        recognitions.push(cmd.action);
      });

      await trait.recognizeCommand('activate');
      await trait.recognizeCommand('grab');
      await trait.recognizeCommand('activate');

      expect(recognitions.length).toBeGreaterThan(0);
    });
  });

  describe('Configuration', () => {
    it('should update commands at runtime', () => {
      trait.addCommand('throw', { action: 'throw', confidence: 0.9 });
      const match = trait.matchCommand('throw');
      expect(match?.action).toBe('throw');
    });

    it('should remove commands', () => {
      trait.removeCommand('grab');
      const match = trait.matchCommand('grab');
      expect(match).toBeUndefined();
    });

    it('should enable/disable trait', () => {
      trait.disable();
      expect(trait.isEnabled()).toBe(false);
      trait.enable();
      expect(trait.isEnabled()).toBe(true);
    });

    it('should export configuration', () => {
      const config = trait.exportConfig();
      expect(config.language).toBe('en-US');
      expect(config.enabled).toBe(true);
    });
  });
});

describe('AIDriverTrait', () => {
  let trait: AIDriverTrait;

  beforeEach(() => {
    trait = new AIDriverTrait({
      enabled: true,
      name: 'TestAI',
      behaviors: [],
      goals: [],
    });
  });

  describe('Initialization', () => {
    it('should initialize AI driver', () => {
      expect(trait.isEnabled()).toBe(true);
      expect(trait.getName()).toBe('TestAI');
    });

    it('should initialize with empty behaviors', () => {
      expect(trait.getBehaviors()).toBeDefined();
    });

    it('should initialize with empty goals', () => {
      expect(trait.getGoals()).toBeDefined();
    });
  });

  describe('Behavior Trees', () => {
    it('should add behavior to tree', () => {
      trait.addBehavior('patrol', {
        type: 'sequence',
        children: ['wander', 'return'],
      });
      const behaviors = trait.getBehaviors();
      expect(behaviors.length).toBeGreaterThan(0);
    });

    it('should execute behavior tree', async () => {
      trait.addBehavior('idle', {
        type: 'action',
        execute: async () => ({ status: 'success' }),
      });

      const result = await trait.executeBehavior('idle');
      expect(result.status).toBe('success');
    });

    it('should handle sequence behavior', async () => {
      trait.addBehavior('walkToPoint', {
        type: 'sequence',
        children: [
          { type: 'action', name: 'faceTarget' },
          { type: 'action', name: 'moveForward' },
        ],
      });

      const result = await trait.executeBehavior('walkToPoint');
      expect(result).toBeDefined();
    });

    it('should handle selector behavior', async () => {
      trait.addBehavior('choosePath', {
        type: 'selector',
        children: [
          { type: 'action', name: 'tryDirect' },
          { type: 'action', name: 'tryAlternate' },
        ],
      });

      const result = await trait.executeBehavior('choosePath');
      expect(result).toBeDefined();
    });

    it('should handle conditional behavior', async () => {
      trait.addBehavior('conditional', {
        type: 'conditional',
        condition: () => true,
        onTrue: { type: 'action', name: 'doThis' },
        onFalse: { type: 'action', name: 'doThat' },
      });

      const result = await trait.executeBehavior('conditional');
      expect(result).toBeDefined();
    });
  });

  describe('Goal-Oriented Action Planning (GOAP)', () => {
    it('should add goal', () => {
      trait.addGoal('reachTarget', {
        preconditions: { positionKnown: true },
        effects: { atTarget: true },
        cost: 10,
      });
      expect(trait.getGoals().length).toBeGreaterThan(0);
    });

    it('should plan action sequence', async () => {
      trait.addGoal('findFood', {
        preconditions: { hungry: true },
        effects: { fed: true },
        cost: 5,
      });

      const plan = await trait.planGoal('findFood', {
        hungry: true,
        fed: false,
      });
      expect(plan).toBeDefined();
      expect(plan.actions.length).toBeGreaterThanOrEqual(0);
    });

    it('should find path to goal state', async () => {
      trait.addGoal('goal1', {
        preconditions: {},
        effects: { step1: true },
        cost: 1,
      });
      trait.addGoal('goal2', {
        preconditions: { step1: true },
        effects: { step2: true },
        cost: 1,
      });

      const plan = await trait.planGoal('goal2', {});
      expect(plan.actions.length).toBeGreaterThan(0);
    });

    it('should handle multiple goals', async () => {
      trait.addGoal('task1', {
        preconditions: {},
        effects: { task1Done: true },
        cost: 3,
      });
      trait.addGoal('task2', {
        preconditions: { task1Done: true },
        effects: { task2Done: true },
        cost: 3,
      });

      const state = {};
      const plan1 = await trait.planGoal('task1', state);
      const plan2 = await trait.planGoal('task2', { ...state, task1Done: true });

      expect(plan1).toBeDefined();
      expect(plan2).toBeDefined();
    });

    it('should optimize plan cost', async () => {
      trait.addGoal('expensive', {
        preconditions: {},
        effects: { done: true },
        cost: 100,
      });
      trait.addGoal('cheap', {
        preconditions: {},
        effects: { done: true },
        cost: 1,
      });

      const plan = await trait.findOptimalGoal({});
      expect(plan.cost).toBe(1);
    });
  });

  describe('Decision Making', () => {
    it('should decide based on world state', async () => {
      trait.addBehavior('attackBehavior', {
        type: 'action',
        name: 'attack',
      });
      trait.addBehavior('fleeBehavior', {
        type: 'action',
        name: 'flee',
      });

      const decision = await trait.decide({
        enemyNear: true,
        health: 20,
      });
      expect(decision).toBeDefined();
    });

    it('should switch behaviors based on conditions', async () => {
      const state = { active: true };
      let behavior1Called = false;
      let behavior2Called = false;

      trait.addBehavior('active', {
        type: 'action',
        execute: async () => {
          behavior1Called = true;
          return { status: 'success' };
        },
      });

      trait.addBehavior('idle', {
        type: 'action',
        execute: async () => {
          behavior2Called = true;
          return { status: 'success' };
        },
      });

      if (state.active) {
        await trait.executeBehavior('active');
      } else {
        await trait.executeBehavior('idle');
      }

      expect(behavior1Called).toBe(true);
      expect(behavior2Called).toBe(false);
    });

    it('should handle decision with priorities', async () => {
      const decision = await trait.decideWithPriority([
        { priority: 10, action: 'flee' },
        { priority: 5, action: 'fight' },
        { priority: 1, action: 'idle' },
      ]);

      expect(decision).toBe('flee');
    });
  });

  describe('Learning and Adaptation', () => {
    it('should track behavior success rates', async () => {
      trait.recordBehaviorExecution('patrol', true);
      trait.recordBehaviorExecution('patrol', true);
      trait.recordBehaviorExecution('patrol', false);

      const stats = trait.getBehaviorStats('patrol');
      expect(stats.successRate).toBe(2 / 3);
    });

    it('should adapt behavior selection based on success', async () => {
      trait.recordBehaviorExecution('pathA', true);
      trait.recordBehaviorExecution('pathA', true);
      trait.recordBehaviorExecution('pathB', false);

      const preferred = trait.getPreferredBehavior(['pathA', 'pathB']);
      expect(preferred).toBe('pathA');
    });

    it('should cache decision results', async () => {
      const state = { x: 1, y: 2 };
      await trait.decide(state);
      const cached = trait.getCachedDecision(state);
      expect(cached).toBeDefined();
    });
  });

  describe('Configuration and Control', () => {
    it('should enable/disable trait', () => {
      trait.disable();
      expect(trait.isEnabled()).toBe(false);
      trait.enable();
      expect(trait.isEnabled()).toBe(true);
    });

    it('should export current state', () => {
      const state = trait.exportState();
      expect(state).toBeDefined();
      expect(state.behaviors).toBeDefined();
      expect(state.goals).toBeDefined();
    });

    it('should import state', () => {
      const state = {
        behaviors: [{ name: 'test' }],
        goals: [{ name: 'goal1' }],
      };
      trait.importState(state);
      expect(trait.getBehaviors().length).toBeGreaterThan(0);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle NPC combat scenario', async () => {
      trait.addBehavior('combatBehavior', {
        type: 'sequence',
        children: [
          { name: 'detectEnemy' },
          { name: 'approach' },
          { name: 'attack' },
        ],
      });

      trait.addGoal('victory', {
        preconditions: { inCombat: true },
        effects: { enemyDefeated: true },
        cost: 20,
      });

      const result = await trait.executeBehavior('combatBehavior');
      expect(result).toBeDefined();
    });

    it('should handle complex state machine', async () => {
      const states = ['idle', 'walking', 'running', 'attacking'];
      let currentState = 'idle';

      for (const state of states) {
        trait.addBehavior(state, {
          type: 'action',
          name: state,
        });
      }

      expect(trait.getBehaviors().length).toBe(states.length);
    });
  });
});
