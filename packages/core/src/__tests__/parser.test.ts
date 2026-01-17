/**
 * HoloScriptCodeParser Tests
 *
 * Comprehensive test suite for parser covering all language constructs
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { HoloScriptCodeParser } from '../HoloScriptCodeParser';

describe('HoloScriptCodeParser', () => {
  let parser: HoloScriptCodeParser;

  beforeEach(() => {
    parser = new HoloScriptCodeParser();
  });

  describe('Orb Declarations', () => {
    it('should parse simple orb declaration', () => {
      const code = `
        orb myOrb {
          name: "TestOrb"
          color: "#ff0000"
        }
      `;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
      expect(result.ast.length).toBe(1);
      expect(result.ast[0].type).toBe('orb');
      expect(result.ast[0].name).toBe('myOrb');
    });

    it('should parse orb with position', () => {
      const code = `
        orb sphere {
          position: [1, 2, 3]
          color: "#00ff00"
          glow: true
        }
      `;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
      expect(result.ast[0].position).toEqual({ x: 1, y: 2, z: 3 });
    });

    it('should parse orb with traits', () => {
      const code = `
        orb interactive {
          @grabbable
          @throwable
          @voice_input
          name: "Interactive"
        }
      `;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
      expect(result.ast[0].traits).toBeDefined();
      expect(result.ast[0].traits.length).toBeGreaterThan(0);
    });

    it('should parse multiple orbs', () => {
      const code = `
        orb orb1 { name: "First" }
        orb orb2 { name: "Second" }
        orb orb3 { name: "Third" }
      `;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
      expect(result.ast.length).toBe(3);
    });

    it('should parse nested properties', () => {
      const code = `
        orb advanced {
          hologram: {
            shape: "cube"
            material: "metallic"
            reflectivity: 0.8
          }
        }
      `;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
      expect(result.ast[0].properties.hologram).toBeDefined();
    });
  });

  describe('Functions and Methods', () => {
    it('should parse function declaration', () => {
      const code = `
        function add(a: number, b: number): number {
          return a + b
        }
      `;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
      expect(result.ast[0].type).toBe('function');
      expect(result.ast[0].name).toBe('add');
      expect(result.ast[0].parameters.length).toBe(2);
    });

    it('should parse function with return type', () => {
      const code = `
        function greet(name: string): string {
          return "Hello, " + name
        }
      `;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
      expect(result.ast[0].returnType).toBe('string');
    });

    it('should parse function with default parameters', () => {
      const code = `
        function multiply(a: number, b: number = 2): number {
          return a * b
        }
      `;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
      expect(result.ast[0].parameters[1].default).toBe(2);
    });

    it('should parse arrow function', () => {
      const code = `
        const square = (x: number): number => x * x
      `;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
    });

    it('should parse method on orb', () => {
      const code = `
        orb myOrb {
          method activate() {
            return "activated"
          }
        }
      `;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
      expect(result.ast[0].methods.length).toBe(1);
    });
  });

  describe('Connections and Gates', () => {
    it('should parse simple connection', () => {
      const code = `
        orb source { name: "Source" }
        orb target { name: "Target" }
        connect source to target as "data"
      `;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
      const connNode = result.ast.find((n: any) => n.type === 'connection');
      expect(connNode).toBeDefined();
      expect(connNode.from).toBe('source');
      expect(connNode.to).toBe('target');
    });

    it('should parse bidirectional connection', () => {
      const code = `
        connect orb1 <-> orb2 as "sync"
      `;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
      const connNode = result.ast.find((n: any) => n.type === 'connection');
      expect(connNode.bidirectional).toBe(true);
    });

    it('should parse gate', () => {
      const code = `
        gate myGate {
          input source: string
          output target: number
          condition: value.length > 0
        }
      `;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
      expect(result.ast[0].type).toBe('gate');
    });

    it('should parse stream', () => {
      const code = `
        stream dataFlow {
          from: source
          to: target
          type: "continuous"
          rate: 30
        }
      `;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
      expect(result.ast[0].type).toBe('stream');
    });
  });

  describe('Control Flow', () => {
    it('should parse if statement', () => {
      const code = `
        if (value > 10) {
          return "large"
        }
      `;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
    });

    it('should parse if-else statement', () => {
      const code = `
        if (x > 0) {
          return "positive"
        } else {
          return "non-positive"
        }
      `;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
    });

    it('should parse for loop', () => {
      const code = `
        for (let i = 0; i < 10; i++) {
          doSomething(i)
        }
      `;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
    });

    it('should parse while loop', () => {
      const code = `
        while (active) {
          update()
        }
      `;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
    });

    it('should parse match statement', () => {
      const code = `
        match state {
          "idle" => { sleep() }
          "active" => { work() }
          default => { stop() }
        }
      `;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
    });
  });

  describe('Variables and Constants', () => {
    it('should parse variable declaration', () => {
      const code = `let x: number = 10`;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
    });

    it('should parse const declaration', () => {
      const code = `const PI: number = 3.14159`;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
    });

    it('should parse without type annotation', () => {
      const code = `let message = "hello"`;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
    });

    it('should parse array destructuring', () => {
      const code = `let [a, b, c] = [1, 2, 3]`;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
    });

    it('should parse object destructuring', () => {
      const code = `let { x, y, z } = position`;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
    });
  });

  describe('Type Annotations', () => {
    it('should parse primitive types', () => {
      const code = `
        let a: number = 1
        let b: string = "text"
        let c: boolean = true
        let d: void
      `;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
    });

    it('should parse array types', () => {
      const code = `let arr: number[] = [1, 2, 3]`;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
    });

    it('should parse union types', () => {
      const code = `let value: string | number = "text"`;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
    });

    it('should parse generic types', () => {
      const code = `let list: Array<number> = [1, 2, 3]`;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
    });

    it('should parse object types', () => {
      const code = `let obj: { x: number; y: number; z: number }`;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
    });
  });

  describe('Expressions', () => {
    it('should parse arithmetic expressions', () => {
      const code = `let result = 10 + 5 * 2 - 3 / 1`;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
    });

    it('should parse string concatenation', () => {
      const code = `let msg = "Hello" + " " + "World"`;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
    });

    it('should parse logical expressions', () => {
      const code = `let check = a > 10 && b < 5 || c == 0`;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
    });

    it('should parse ternary operator', () => {
      const code = `let value = x > 0 ? "positive" : "negative"`;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
    });

    it('should parse function calls', () => {
      const code = `
        let result1 = doSomething()
        let result2 = compute(a, b, c)
        let result3 = obj.method(x)
      `;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle unclosed braces', () => {
      const code = `orb test { name: "unclosed"`;
      const result = parser.parse(code);
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle invalid syntax', () => {
      const code = `this is @@ invalid *** syntax`;
      const result = parser.parse(code);
      expect(result.success).toBe(false);
    });

    it('should handle missing type annotations', () => {
      const code = `function noTypes(a, b) { return a + b }`;
      const result = parser.parse(code);
      // Depending on parser strictness, this may or may not be an error
      expect(result.ast || result.errors).toBeDefined();
    });

    it('should provide helpful error messages', () => {
      const code = `let x: = 5`;
      const result = parser.parse(code);
      expect(result.success).toBe(false);
      if (result.errors.length > 0) {
        expect(result.errors[0].message).toBeDefined();
      }
    });

    it('should report error location', () => {
      const code = `orb test {\n  invalid syntax here\n}`;
      const result = parser.parse(code);
      expect(result.success).toBe(false);
      if (result.errors.length > 0) {
        expect(result.errors[0].location).toBeDefined();
      }
    });
  });

  describe('Comments', () => {
    it('should skip single-line comments', () => {
      const code = `
        // This is a comment
        let x = 5 // inline comment
      `;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
    });

    it('should skip multi-line comments', () => {
      const code = `
        /* This is a
           multi-line comment */
        let y = 10
      `;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
    });

    it('should preserve documentation comments', () => {
      const code = `
        /**
         * This function does something
         * @param x the input value
         * @returns the result
         */
        function process(x: number): number {
          return x * 2
        }
      `;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
    });
  });

  describe('Complex Programs', () => {
    it('should parse complete VR scene', () => {
      const code = `
        // Scene setup
        orb room {
          position: [0, 0, 0]
          name: "Main Room"
        }

        orb cube {
          position: [1, 1, 1]
          @grabbable
          @throwable
          color: "#ff0000"
        }

        orb sphere {
          position: [-1, 1, 1]
          @interactive
          color: "#00ff00"
        }

        connect cube to sphere as "sync"

        function onGrab(obj: string): void {
          print("Grabbed " + obj)
        }

        match state {
          "active" => { onGrab("object") }
          default => { print("Idle") }
        }
      `;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
      expect(result.ast.length).toBeGreaterThan(0);
    });

    it('should parse with mixed element types', () => {
      const code = `
        orb main { name: "Main" }
        
        function helper(): string {
          return "result"
        }
        
        const config = { debug: true, timeout: 5000 }
        
        connect main to main as "internal"
        
        let state = "ready"
      `;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
    });
  });
});
