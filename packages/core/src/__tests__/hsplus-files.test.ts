/**
 * HoloScript+ File Tests
 *
 * Tests that parse actual .hsplus files from fixtures and examples
 *
 * NOTE: This test file causes memory issues in vitest worker pools.
 * The tests pass but the worker runs out of memory during cleanup.
 * Skip this file until vitest memory handling is improved.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadFixture,
  loadExample,
  getAllFixtures,
  getAllExamples,
  createTestParser,
  serializeAST,
  ALL_VR_TRAITS,
  testAllTraitsparse,
} from './test-utils';
import { HoloScriptPlusParser } from '../parser/HoloScriptPlusParser';

describe.skip('HoloScript+ File Parsing', () => {
  let parser: HoloScriptPlusParser;

  beforeEach(() => {
    parser = createTestParser();
  });

  // ==========================================================================
  // Fixture File Tests
  // ==========================================================================

  describe('Fixture Files', () => {
    it('parses basic-orb.hsplus', () => {
      const source = loadFixture('basic-orb');
      const result = parser.parse(source);

      // Parser should return a result (even if success is undefined for simple parse)
      expect(result).toBeDefined();
      expect(result.ast).toBeDefined();
    });

    it('parses traits-basic.hsplus', () => {
      const source = loadFixture('traits-basic');
      const result = parser.parse(source);

      expect(result).toBeDefined();
      expect(result.ast).toBeDefined();
    });

    it('parses humanoid-avatar.hsplus', () => {
      const source = loadFixture('humanoid-avatar');
      const result = parser.parse(source);

      expect(result).toBeDefined();
      expect(result.ast).toBeDefined();
    });

    it('parses stretchable-atoms.hsplus', () => {
      const source = loadFixture('stretchable-atoms');
      const result = parser.parse(source);

      expect(result).toBeDefined();
      expect(result.ast).toBeDefined();
    });

    it('parses all fixtures without throwing', () => {
      const fixtures = getAllFixtures();
      expect(fixtures.length).toBeGreaterThan(0);

      for (const fixture of fixtures) {
        const source = loadFixture(fixture);
        expect(() => parser.parse(source)).not.toThrow();
      }
    });
  });

  // ==========================================================================
  // Example File Tests
  // ==========================================================================

  describe('Example Files', () => {
    it('parses vr-interactions.hsplus', () => {
      const source = loadExample('vr-interactions');
      const result = parser.parse(source);

      expect(result).toBeDefined();
      expect(result.ast).toBeDefined();
    });

    it('parses researcher-viralist.hsplus', () => {
      const source = loadExample('researcher-viralist');
      const result = parser.parse(source);

      expect(result).toBeDefined();
      expect(result.ast).toBeDefined();
    });

    it('parses all examples without throwing', () => {
      const examples = getAllExamples();
      expect(examples.length).toBeGreaterThan(0);

      for (const example of examples) {
        const source = loadExample(example);
        expect(() => parser.parse(source)).not.toThrow();
      }
    });
  });

  // ==========================================================================
  // Trait Coverage Tests
  // ==========================================================================

  describe('Trait Coverage', () => {
    it('recognizes all defined VR traits', () => {
      // Test that the parser can at least attempt to parse each trait
      const results = testAllTraitsparse(parser);

      // Log any failures for debugging
      const failures = results.filter(r => !r.success);
      if (failures.length > 0) {
        console.log('Trait parsing failures:', failures);
      }

      // At minimum, the parser should not throw for any trait
      expect(results.every(r => r.error === undefined)).toBe(true);
    });

    it('exports ALL_VR_TRAITS constant with expected traits', () => {
      // Should match VR_TRAITS from constants.ts
      // 11 core + 11 humanoid + 2 networking + 4 media + 4 analytics + 4 social + 4 effects + 3 audio + 4 AI + 2 timeline = 49
      expect(ALL_VR_TRAITS.length).toBeGreaterThanOrEqual(40); // At least 40 traits
      expect(ALL_VR_TRAITS).toContain('grabbable');
      expect(ALL_VR_TRAITS).toContain('skeleton');
      expect(ALL_VR_TRAITS).toContain('stretchable');
    });
  });

  // ==========================================================================
  // Snapshot Tests
  // ==========================================================================

  describe('AST Snapshots', () => {
    // Skip snapshot tests - they cause memory issues in vitest
    it.skip('basic-orb AST matches snapshot', () => {
      const source = loadFixture('basic-orb');
      const result = parser.parse(source);
      const serialized = serializeAST(result.ast);

      expect(serialized).toMatchSnapshot();
    });

    it.skip('traits-basic AST matches snapshot', () => {
      const source = loadFixture('traits-basic');
      const result = parser.parse(source);
      const serialized = serializeAST(result.ast);

      expect(serialized).toMatchSnapshot();
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('handles empty file', () => {
      expect(() => parser.parse('')).not.toThrow();
    });

    it('handles comment-only file', () => {
      const source = `
        // This is a comment
        // Another comment
      `;
      expect(() => parser.parse(source)).not.toThrow();
    });

    it('handles file with only whitespace', () => {
      expect(() => parser.parse('   \n\n   \t\t   ')).not.toThrow();
    });

    it('handles multiple traits on single line', () => {
      const source = `orb#test @grabbable @throwable @hoverable { position: [0,0,0] }`;
      const result = parser.parse(source);
      expect(result).toBeDefined();
    });

    it('handles traits with complex config', () => {
      const source = `
        avatar#npc @skeleton(type: "humanoid", ik_enabled: true, ik_targets: { left_hand: "ik_lh", right_hand: "ik_rh" }) {
          name: "NPC"
        }
      `;
      const result = parser.parse(source);
      expect(result).toBeDefined();
    });
  });
});
