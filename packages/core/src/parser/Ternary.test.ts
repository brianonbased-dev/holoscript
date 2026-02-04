
import { describe, it, expect } from 'vitest';
import { HoloScriptPlusParser } from './HoloScriptPlusParser';

describe('HoloScriptPlusParser - Ternary Operators', () => {
  const parser = new HoloScriptPlusParser({ strict: false });

  it('Parses simple ternary expression', () => {
    const source = `
    object "Test" {
      isEnabled: isActive ? true : false
    }`;
    const result = parser.parse(source);
    
    expect(result.success).toBe(true);
    const root = result.ast.root;
    const node = root.type === 'fragment' ? root.children![0] : root;
    const expr = node.properties.isEnabled as any;
    
    expect(expr.type).toBe('ternary');
    expect(expr.condition.__ref).toBe('isActive');
    expect(expr.trueValue).toBe(true);
    expect(expr.falseValue).toBe(false);
  });

  it('Parses nested ternary (right-associative)', () => {
    // a ? b : c ? d : e  Should be a ? b : (c ? d : e)
    const source = `
    object "Test" {
      val: condA ? 1 : condB ? 2 : 3
    }`;
    const result = parser.parse(source);
    
    expect(result.success).toBe(true);
    const root = result.ast.root;
    const node = root.type === 'fragment' ? root.children![0] : root;
    const expr = node.properties.val as any;
    
    expect(expr.type).toBe('ternary');
    expect(expr.condition.__ref).toBe('condA');
    expect(expr.trueValue).toBe(1);
    
    // The false branch should be another ternary
    expect(expr.falseValue.type).toBe('ternary');
    expect(expr.falseValue.condition.__ref).toBe('condB');
    expect(expr.falseValue.trueValue).toBe(2);
    expect(expr.falseValue.falseValue).toBe(3);
  });

  it('Parses ternary with null coalescing', () => {
    // a ?? b ? c : d  => (a ?? b) ? c : d
    const source = `
    object "Test" {
      val: a ?? b ? "yes" : "no"
    }`;
    const result = parser.parse(source);
    
    expect(result.success).toBe(true);
    const root = result.ast.root;
    const node = root.type === 'fragment' ? root.children![0] : root;
    const expr = node.properties.val as any;
    
    expect(expr.type).toBe('ternary');
    // Condition is binary ??
    expect(expr.condition.type).toBe('binary');
    expect(expr.condition.operator).toBe('??');
    expect(expr.trueValue).toBe("yes");
    expect(expr.falseValue).toBe("no");
  });
});
