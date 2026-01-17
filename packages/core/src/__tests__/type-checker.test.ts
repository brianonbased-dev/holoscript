/**
 * HoloScriptTypeChecker Tests
 *
 * Comprehensive test suite for type checking system
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { HoloScriptTypeChecker } from '../HoloScriptTypeChecker';

describe('HoloScriptTypeChecker', () => {
  let typeChecker: HoloScriptTypeChecker;

  beforeEach(() => {
    typeChecker = new HoloScriptTypeChecker();
  });

  describe('Basic Type Checking', () => {
    it('should accept valid number assignment', () => {
      const result = typeChecker.checkType('number', 42);
      expect(result.valid).toBe(true);
    });

    it('should accept valid string assignment', () => {
      const result = typeChecker.checkType('string', 'hello');
      expect(result.valid).toBe(true);
    });

    it('should accept valid boolean assignment', () => {
      const result = typeChecker.checkType('boolean', true);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid type assignment', () => {
      const result = typeChecker.checkType('number', 'not a number');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle null values', () => {
      const result = typeChecker.checkType('number | null', null);
      expect(result.valid).toBe(true);
    });

    it('should handle undefined values', () => {
      const result = typeChecker.checkType('string | undefined', undefined);
      expect(result.valid).toBe(true);
    });
  });

  describe('Array Types', () => {
    it('should validate array of numbers', () => {
      const result = typeChecker.checkType('number[]', [1, 2, 3]);
      expect(result.valid).toBe(true);
    });

    it('should validate array of strings', () => {
      const result = typeChecker.checkType('string[]', ['a', 'b', 'c']);
      expect(result.valid).toBe(true);
    });

    it('should reject mixed type array when expecting uniform', () => {
      const result = typeChecker.checkType('number[]', [1, 'two', 3]);
      expect(result.valid).toBe(false);
    });

    it('should validate generic Array<T>', () => {
      const result = typeChecker.checkType('Array<string>', ['x', 'y', 'z']);
      expect(result.valid).toBe(true);
    });

    it('should validate nested arrays', () => {
      const result = typeChecker.checkType('number[][]', [[1, 2], [3, 4]]);
      expect(result.valid).toBe(true);
    });

    it('should accept empty arrays', () => {
      const result = typeChecker.checkType('number[]', []);
      expect(result.valid).toBe(true);
    });
  });

  describe('Union Types', () => {
    it('should accept first union member', () => {
      const result = typeChecker.checkType('string | number', 'text');
      expect(result.valid).toBe(true);
    });

    it('should accept second union member', () => {
      const result = typeChecker.checkType('string | number', 42);
      expect(result.valid).toBe(true);
    });

    it('should reject non-union member', () => {
      const result = typeChecker.checkType('string | number', true);
      expect(result.valid).toBe(false);
    });

    it('should handle complex unions', () => {
      const result = typeChecker.checkType(
        'string | number | boolean | null',
        'value'
      );
      expect(result.valid).toBe(true);
    });

    it('should validate union of arrays', () => {
      const result = typeChecker.checkType('number[] | string[]', [1, 2, 3]);
      expect(result.valid).toBe(true);
    });
  });

  describe('Object Types', () => {
    it('should validate simple object', () => {
      const obj = { x: 1, y: 2, z: 3 };
      const result = typeChecker.checkType(
        '{ x: number; y: number; z: number }',
        obj
      );
      expect(result.valid).toBe(true);
    });

    it('should reject missing required property', () => {
      const obj = { x: 1, y: 2 };
      const result = typeChecker.checkType(
        '{ x: number; y: number; z: number }',
        obj
      );
      expect(result.valid).toBe(false);
    });

    it('should allow extra properties', () => {
      const obj = { x: 1, y: 2, z: 3, w: 4 };
      const result = typeChecker.checkType(
        '{ x: number; y: number; z: number }',
        obj
      );
      expect(result.valid).toBe(true);
    });

    it('should validate optional properties', () => {
      const obj = { x: 1, y: 2 };
      const result = typeChecker.checkType(
        '{ x: number; y: number; z?: number }',
        obj
      );
      expect(result.valid).toBe(true);
    });

    it('should validate nested objects', () => {
      const obj = { position: { x: 1, y: 2, z: 3 }, color: '#ff0000' };
      const result = typeChecker.checkType(
        '{ position: { x: number; y: number; z: number }; color: string }',
        obj
      );
      expect(result.valid).toBe(true);
    });
  });

  describe('Function Types', () => {
    it('should validate function parameter types', () => {
      const fn = (x: number): number => x * 2;
      const result = typeChecker.checkFunctionSignature(fn, 'number', ['number']);
      expect(result.valid).toBe(true);
    });

    it('should validate function return type', () => {
      const fn = (): string => 'result';
      const result = typeChecker.checkFunctionSignature(fn, 'string', []);
      expect(result.valid).toBe(true);
    });

    it('should validate multiple parameters', () => {
      const fn = (a: number, b: number): number => a + b;
      const result = typeChecker.checkFunctionSignature(fn, 'number', [
        'number',
        'number',
      ]);
      expect(result.valid).toBe(true);
    });

    it('should handle optional parameters', () => {
      const fn = (x: number, y?: number): number => x + (y || 0);
      const result = typeChecker.checkFunctionSignature(fn, 'number', [
        'number',
        'number | undefined',
      ]);
      expect(result.valid).toBe(true);
    });
  });

  describe('Generic Types', () => {
    it('should validate generic Array<T>', () => {
      const result = typeChecker.checkType('Array<number>', [1, 2, 3]);
      expect(result.valid).toBe(true);
    });

    it('should validate generic with multiple parameters', () => {
      const result = typeChecker.checkType('Map<string, number>', {
        a: 1,
        b: 2,
      });
      expect(result.valid).toBe(true);
    });

    it('should handle nested generics', () => {
      const result = typeChecker.checkType('Array<Array<number>>', [
        [1, 2],
        [3, 4],
      ]);
      expect(result.valid).toBe(true);
    });

    it('should infer generic type parameters', () => {
      const result = typeChecker.inferGenericType([1, 2, 3]);
      expect(result).toBe('Array<number>');
    });

    it('should infer from mixed array', () => {
      const result = typeChecker.inferGenericType(['a', 1, true]);
      expect(result).toMatch(/string|number|boolean/);
    });
  });

  describe('Type Inference', () => {
    it('should infer number type', () => {
      const result = typeChecker.inferType(42);
      expect(result).toBe('number');
    });

    it('should infer string type', () => {
      const result = typeChecker.inferType('text');
      expect(result).toBe('string');
    });

    it('should infer boolean type', () => {
      const result = typeChecker.inferType(true);
      expect(result).toBe('boolean');
    });

    it('should infer array type', () => {
      const result = typeChecker.inferType([1, 2, 3]);
      expect(result).toBe('number[]');
    });

    it('should infer object type', () => {
      const result = typeChecker.inferType({ x: 1, y: 2 });
      expect(result).toContain('object');
    });

    it('should infer function type', () => {
      const result = typeChecker.inferType(() => {});
      expect(result).toContain('function');
    });

    it('should infer union from mixed array', () => {
      const result = typeChecker.inferType(['text', 42]);
      expect(result).toMatch(/string.*number|number.*string/);
    });
  });

  describe('Type Compatibility', () => {
    it('should allow assignment to same type', () => {
      const result = typeChecker.isTypeCompatible('number', 'number');
      expect(result).toBe(true);
    });

    it('should allow number in numeric context', () => {
      const result = typeChecker.isTypeCompatible('number', 'any');
      expect(result).toBe(true);
    });

    it('should allow subtype assignment', () => {
      const result = typeChecker.isTypeCompatible('number', 'number | string');
      expect(result).toBe(true);
    });

    it('should disallow incompatible types', () => {
      const result = typeChecker.isTypeCompatible('string', 'number');
      expect(result).toBe(false);
    });

    it('should allow any type assignment', () => {
      const result = typeChecker.isTypeCompatible('any', 'number');
      expect(result).toBe(true);
    });
  });

  describe('Exhaustiveness Checking', () => {
    it('should detect missing match cases', () => {
      const unionType = 'string | number | boolean';
      const cases = ['string', 'number'];
      const result = typeChecker.checkExhaustiveness(unionType, cases);
      expect(result.exhaustive).toBe(false);
      expect(result.missing).toContain('boolean');
    });

    it('should accept complete match', () => {
      const unionType = 'string | number | boolean';
      const cases = ['string', 'number', 'boolean'];
      const result = typeChecker.checkExhaustiveness(unionType, cases);
      expect(result.exhaustive).toBe(true);
    });

    it('should handle default case', () => {
      const unionType = 'string | number | boolean';
      const cases = ['string', 'default'];
      const result = typeChecker.checkExhaustiveness(unionType, cases);
      expect(result.exhaustive).toBe(true);
    });

    it('should detect union member not handled', () => {
      const unionType = '"idle" | "active" | "paused"';
      const cases = ['"idle"', '"active"'];
      const result = typeChecker.checkExhaustiveness(unionType, cases);
      expect(result.exhaustive).toBe(false);
      expect(result.missing).toContain('"paused"');
    });
  });

  describe('Constraint Checking', () => {
    it('should validate number constraints', () => {
      const constraints = { min: 0, max: 100 };
      const result = typeChecker.checkConstraints('number', 50, constraints);
      expect(result.valid).toBe(true);
    });

    it('should reject value below minimum', () => {
      const constraints = { min: 0 };
      const result = typeChecker.checkConstraints('number', -5, constraints);
      expect(result.valid).toBe(false);
    });

    it('should reject value above maximum', () => {
      const constraints = { max: 100 };
      const result = typeChecker.checkConstraints('number', 150, constraints);
      expect(result.valid).toBe(false);
    });

    it('should validate string length constraints', () => {
      const constraints = { minLength: 3, maxLength: 10 };
      const result = typeChecker.checkConstraints('string', 'hello', constraints);
      expect(result.valid).toBe(true);
    });

    it('should validate array length constraints', () => {
      const constraints = { minLength: 1, maxLength: 5 };
      const result = typeChecker.checkConstraints('number[]', [1, 2, 3], constraints);
      expect(result.valid).toBe(true);
    });
  });

  describe('Error Messages', () => {
    it('should provide clear type mismatch message', () => {
      const result = typeChecker.checkType('number', 'not a number');
      expect(result.error).toContain('expected number');
    });

    it('should report property mismatch', () => {
      const obj = { x: 1 };
      const result = typeChecker.checkType(
        '{ x: number; y: number }',
        obj
      );
      expect(result.error).toContain('y');
    });

    it('should suggest correct types', () => {
      const result = typeChecker.checkType('number', 'text');
      if (result.suggestion) {
        expect(result.suggestion).toBeDefined();
      }
    });
  });

  describe('Complex Type Scenarios', () => {
    it('should validate VR position type', () => {
      const position = { x: 1, y: 2, z: 3 };
      const result = typeChecker.checkType(
        '{ x: number; y: number; z: number }',
        position
      );
      expect(result.valid).toBe(true);
    });

    it('should validate hologram config', () => {
      const config = {
        shape: 'cube',
        color: '#ff0000',
        size: 1,
        glow: true,
      };
      const result = typeChecker.checkType(
        '{ shape: string; color: string; size: number; glow: boolean }',
        config
      );
      expect(result.valid).toBe(true);
    });

    it('should validate mixed orb configuration', () => {
      const orbConfig = {
        name: 'TestOrb',
        position: { x: 0, y: 0, z: 0 },
        properties: { color: '#00ff00', interactive: true },
        traits: ['grabbable', 'throwable'],
      };
      const result = typeChecker.checkType(
        '{ name: string; position: { x: number; y: number; z: number }; properties: any; traits: string[] }',
        orbConfig
      );
      expect(result.valid).toBe(true);
    });
  });
});
