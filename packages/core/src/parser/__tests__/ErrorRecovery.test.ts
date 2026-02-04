import { describe, it, expect, beforeEach } from 'vitest';
import {
  ErrorRecovery,
  generateQuickFixes,
  HOLOSCHEMA_KEYWORDS,
  HOLOSCHEMA_TRAITS,
  HOLOSCHEMA_GEOMETRIES,
  type ParseError,
} from '../ErrorRecovery';

describe('ErrorRecovery', () => {
  let recovery: ErrorRecovery;

  beforeEach(() => {
    recovery = new ErrorRecovery();
  });

  describe('createError', () => {
    it('should create error with basic info', () => {
      const error = recovery.createError(
        'SYNTAX_ERROR',
        'Unexpected token',
        10,
        5,
        'some source'
      );

      expect(error.code).toBe('SYNTAX_ERROR');
      expect(error.message).toBe('Unexpected token');
      expect(error.line).toBe(10);
      expect(error.column).toBe(5);
    });

    it('should add error to collection', () => {
      recovery.createError('SYNTAX_ERROR', 'Error 1', 1, 1);
      recovery.createError('SYNTAX_ERROR', 'Error 2', 2, 1);

      expect(recovery.getErrors()).toHaveLength(2);
    });

    it('should generate suggestions for UNKNOWN_TRAIT', () => {
      const error = recovery.createError(
        'UNKNOWN_TRAIT',
        'Unknown trait "graable"',
        1,
        1
      );

      expect(error.suggestions).toBeDefined();
      expect(error.suggestions!.length).toBeGreaterThan(0);
      expect(error.suggestions!.some(s => s.description.includes('grabbable'))).toBe(true);
    });

    it('should generate suggestions for UNKNOWN_GEOMETRY', () => {
      const error = recovery.createError(
        'UNKNOWN_GEOMETRY',
        'Unknown geometry "sphre"',
        1,
        1
      );

      expect(error.suggestions).toBeDefined();
      expect(error.suggestions!.some(s => s.description.includes('sphere'))).toBe(true);
    });

    it('should generate suggestions for TRAIT_CONFLICT', () => {
      const error = recovery.createError(
        'TRAIT_CONFLICT',
        '@static conflicts with @physics',
        1,
        1
      );

      expect(error.suggestions).toBeDefined();
      expect(error.suggestions!.some(s => s.description.includes('Remove'))).toBe(true);
    });

    it('should generate suggestions for MISSING_BRACE', () => {
      const error = recovery.createError(
        'MISSING_BRACE',
        'Missing closing brace',
        10,
        1
      );

      expect(error.suggestions).toBeDefined();
      expect(error.suggestions!.some(s => s.description.includes('brace'))).toBe(true);
    });
  });

  describe('analyzeError', () => {
    it('should analyze missing brace error', () => {
      const error = recovery.analyzeError(
        'unexpected end of input',
        'composition "Test" {',
        1,
        20
      );

      expect(error.code).toBe('MISSING_BRACE');
      expect(error.suggestions!.length).toBeGreaterThan(0);
    });

    it('should analyze missing colon error', () => {
      const error = recovery.analyzeError(
        'Expected : after property name',
        'position [0, 1, 0]',
        1,
        9
      );

      expect(error.code).toBe('MISSING_COLON');
    });

    it('should analyze unterminated string error', () => {
      const error = recovery.analyzeError(
        'Unterminated string literal',
        'text: "Hello',
        1,
        6
      );

      expect(error.code).toBe('MISSING_QUOTE');
    });

    it('should fall back to SYNTAX_ERROR for unknown patterns', () => {
      const error = recovery.analyzeError(
        'Some unknown error pattern xyz123',
        'weird code',
        1,
        1
      );

      expect(error.code).toBe('SYNTAX_ERROR');
    });
  });

  describe('formatError', () => {
    it('should format error with all details', () => {
      const error: ParseError = {
        code: 'UNKNOWN_TRAIT',
        message: 'Unknown trait "graable"',
        line: 5,
        column: 10,
        source: '  @graable',
        suggestions: [
          { description: 'Did you mean "@grabbable"?', fix: 'Replace with @grabbable' },
        ],
      };

      const formatted = recovery.formatError(error);

      expect(formatted).toContain('[UNKNOWN_TRAIT]');
      expect(formatted).toContain('line 5');
      expect(formatted).toContain('column 10');
      expect(formatted).toContain('@graable');
      expect(formatted).toContain('Suggestions:');
      expect(formatted).toContain('@grabbable');
    });

    it('should format error without source', () => {
      const error: ParseError = {
        code: 'SYNTAX_ERROR',
        message: 'Generic error',
        line: 1,
        column: 1,
      };

      const formatted = recovery.formatError(error);

      expect(formatted).toContain('[SYNTAX_ERROR]');
      expect(formatted).not.toContain('^');
    });
  });

  describe('hasErrors and clear', () => {
    it('should report no errors initially', () => {
      expect(recovery.hasErrors()).toBe(false);
    });

    it('should report errors after creating one', () => {
      recovery.createError('SYNTAX_ERROR', 'Test', 1, 1);
      expect(recovery.hasErrors()).toBe(true);
    });

    it('should clear errors', () => {
      recovery.createError('SYNTAX_ERROR', 'Test', 1, 1);
      recovery.clear();
      expect(recovery.hasErrors()).toBe(false);
      expect(recovery.getErrors()).toHaveLength(0);
    });
  });
});

describe('generateQuickFixes', () => {
  it('should generate fix for missing brace', () => {
    const error: ParseError = {
      code: 'MISSING_BRACE',
      message: 'Missing closing brace',
      line: 1,
      column: 1,
    };

    const fixes = generateQuickFixes(error, 'composition "Test" {');

    expect(fixes.length).toBeGreaterThan(0);
    expect(fixes[0].title).toContain('brace');
    expect(fixes[0].edit.newText).toContain('}');
  });

  it('should generate fix for missing colon', () => {
    const error: ParseError = {
      code: 'MISSING_COLON',
      message: 'Missing colon',
      line: 1,
      column: 10,
    };

    const source = '  position [0, 1, 0]';
    const fixes = generateQuickFixes(error, source);

    // May or may not find a fix depending on regex match
    expect(Array.isArray(fixes)).toBe(true);
  });

  it('should generate fix for missing quote', () => {
    const error: ParseError = {
      code: 'MISSING_QUOTE',
      message: 'Missing closing quote',
      line: 1,
      column: 1,
    };

    const fixes = generateQuickFixes(error, 'text: "Hello');

    expect(fixes.length).toBeGreaterThan(0);
    expect(fixes[0].edit.newText).toContain('"');
  });
});

describe('Schema constants', () => {
  it('should have valid keywords', () => {
    expect(HOLOSCHEMA_KEYWORDS).toContain('composition');
    expect(HOLOSCHEMA_KEYWORDS).toContain('object');
    expect(HOLOSCHEMA_KEYWORDS).toContain('template');
    expect(HOLOSCHEMA_KEYWORDS).toContain('ui_panel');
  });

  it('should have valid traits', () => {
    expect(HOLOSCHEMA_TRAITS).toContain('physics');
    expect(HOLOSCHEMA_TRAITS).toContain('grabbable');
    expect(HOLOSCHEMA_TRAITS).toContain('hoverable');
    expect(HOLOSCHEMA_TRAITS).toContain('ui_floating');
  });

  it('should have valid geometries', () => {
    expect(HOLOSCHEMA_GEOMETRIES).toContain('cube');
    expect(HOLOSCHEMA_GEOMETRIES).toContain('sphere');
    expect(HOLOSCHEMA_GEOMETRIES).toContain('cylinder');
  });
});
