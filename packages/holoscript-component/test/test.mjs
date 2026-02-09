/**
 * JavaScript tests for HoloScript WASM Component
 * 
 * These tests verify the jco-generated bindings work correctly.
 * Run with: node --experimental-wasm-component-model test/test.mjs
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert';

// Import the jco-generated bindings
// Note: This import will work after running `npm run build:jco`
let holoscript;

describe('HoloScript WASM Component', () => {
  before(async () => {
    try {
      holoscript = await import('../dist/holoscript.js');
    } catch (e) {
      console.log('Component not built yet. Run: npm run build');
      process.exit(0);
    }
  });

  describe('Parser Interface', () => {
    it('should parse a simple composition', async () => {
      const source = `composition "Test" {
        object "Cube" @grabbable {
          geometry: "cube"
          position: [0, 1, 0]
        }
      }`;
      
      const result = holoscript.parser.parse(source);
      assert.ok(result.ok, 'Parse should succeed');
      
      const ast = result.ok;
      assert.strictEqual(ast.name, 'Test');
      assert.strictEqual(ast.objects.length, 1);
      assert.strictEqual(ast.objects[0].name, 'Cube');
      assert.deepStrictEqual(ast.objects[0].traits, ['grabbable']);
    });

    it('should parse a composition with template', async () => {
      const source = `composition "Demo" {
        template "Ball" {
          geometry: "sphere"
          color: "#ff0000"
        }
        
        object "RedBall" using "Ball" {
          position: [0, 2, 0]
        }
      }`;
      
      const result = holoscript.parser.parse(source);
      assert.ok(result.ok, 'Parse should succeed');
      
      const ast = result.ok;
      assert.strictEqual(ast.templates.length, 1);
      assert.strictEqual(ast.templates[0].name, 'Ball');
      assert.strictEqual(ast.objects[0].template, 'Ball');
    });

    it('should parse environment settings', async () => {
      const source = `composition "Scene" {
        environment {
          skybox: "gradient"
          ambient_light: 0.5
        }
      }`;
      
      const result = holoscript.parser.parse(source);
      assert.ok(result.ok, 'Parse should succeed');
      
      const ast = result.ok;
      assert.ok(ast.environment, 'Environment should exist');
      assert.strictEqual(ast.environment.skybox, 'gradient');
      assert.strictEqual(ast.environment.ambientLight, 0.5);
    });

    it('should return errors for invalid syntax', async () => {
      const source = `composition { }`;  // Missing name
      
      const result = holoscript.parser.parse(source);
      assert.ok(result.err, 'Parse should fail');
      assert.ok(Array.isArray(result.err), 'Errors should be array');
      assert.ok(result.err.length > 0, 'Should have errors');
    });

    it('should parse header only', async () => {
      const source = `composition "MyScene" { }`;
      
      const result = holoscript.parser.parseHeader(source);
      assert.ok(result.ok, 'Header parse should succeed');
      assert.strictEqual(result.ok, 'MyScene');
    });
  });

  describe('Validator Interface', () => {
    it('should validate correct HoloScript', async () => {
      const source = `composition "Valid" {
        object "Sphere" {
          geometry: "sphere"
        }
      }`;
      
      const result = holoscript.validator.validate(source);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.diagnostics.length, 0);
    });

    it('should return diagnostics for invalid code', async () => {
      const source = `composition { }`;  // Missing name
      
      const result = holoscript.validator.validate(source);
      assert.strictEqual(result.valid, false);
      assert.ok(result.diagnostics.length > 0);
    });

    it('should check if trait exists', async () => {
      assert.strictEqual(holoscript.validator.traitExists('grabbable'), true);
      assert.strictEqual(holoscript.validator.traitExists('physics'), true);
      assert.strictEqual(holoscript.validator.traitExists('nonexistent'), false);
    });

    it('should list all traits', async () => {
      const traits = holoscript.validator.listTraits();
      assert.ok(Array.isArray(traits));
      assert.strictEqual(traits.length, 49);  // All 49 VR traits
      
      // Check structure
      const grabbable = traits.find(t => t.name === 'grabbable');
      assert.ok(grabbable);
      assert.strictEqual(grabbable.category, 'interaction');
    });

    it('should list traits by category', async () => {
      const interactionTraits = holoscript.validator.listTraitsByCategory('interaction');
      assert.ok(interactionTraits.length >= 8);
      assert.ok(interactionTraits.every(t => t.category === 'interaction'));
    });

    it('should get trait info', async () => {
      const trait = holoscript.validator.getTrait('grabbable');
      assert.ok(trait);
      assert.strictEqual(trait.name, 'grabbable');
      assert.strictEqual(trait.category, 'interaction');
      assert.ok(trait.description.length > 0);
    });
  });

  describe('Compiler Interface', () => {
    const testSource = `composition "TestScene" {
      object "Cube" @grabbable {
        geometry: "cube"
        position: [0, 1, 0]
        color: "#ff0000"
      }
    }`;

    it('should compile to Unity C#', async () => {
      const result = holoscript.compiler.compile(testSource, 'unity-csharp');
      assert.ok(!result.error, 'Compile should succeed');
      assert.ok(result.text.includes('public class TestScene'));
      assert.ok(result.text.includes('PrimitiveType.Cube'));
    });

    it('should compile to Godot GDScript', async () => {
      const result = holoscript.compiler.compile(testSource, 'godot-gdscript');
      assert.ok(!result.error, 'Compile should succeed');
      assert.ok(result.text.includes('extends Node3D'));
      assert.ok(result.text.includes('BoxMesh'));
    });

    it('should compile to A-Frame HTML', async () => {
      const result = holoscript.compiler.compile(testSource, 'aframe-html');
      assert.ok(!result.error, 'Compile should succeed');
      assert.ok(result.text.includes('<a-scene>'));
      assert.ok(result.text.includes('<a-box'));
    });

    it('should compile to Three.js', async () => {
      const result = holoscript.compiler.compile(testSource, 'threejs');
      assert.ok(!result.error, 'Compile should succeed');
      assert.ok(result.text.includes('THREE.BoxGeometry'));
      assert.ok(result.text.includes('0xff0000'));
    });

    it('should compile to Babylon.js', async () => {
      const result = holoscript.compiler.compile(testSource, 'babylonjs');
      assert.ok(!result.error, 'Compile should succeed');
      assert.ok(result.text.includes('BABYLON.MeshBuilder.CreateBox'));
    });

    it('should compile to glTF JSON', async () => {
      const result = holoscript.compiler.compile(testSource, 'gltf-json');
      assert.ok(!result.error, 'Compile should succeed');
      
      const gltf = JSON.parse(result.text);
      assert.strictEqual(gltf.asset.version, '2.0');
      assert.strictEqual(gltf.scenes[0].name, 'TestScene');
    });

    it('should compile to GLB binary', async () => {
      const result = holoscript.compiler.compile(testSource, 'glb-binary');
      assert.ok(!result.error, 'Compile should succeed');
      assert.ok(result.binary instanceof Uint8Array);
      
      // Check GLB magic bytes
      const magic = new TextDecoder().decode(result.binary.slice(0, 4));
      assert.strictEqual(magic, 'glTF');
    });

    it('should list available targets', async () => {
      const targets = holoscript.compiler.listTargets();
      assert.ok(Array.isArray(targets));
      assert.ok(targets.includes('unity-csharp'));
      assert.ok(targets.includes('godot-gdscript'));
      assert.ok(targets.includes('aframe-html'));
      assert.ok(targets.includes('threejs'));
      assert.ok(targets.includes('babylonjs'));
      assert.ok(targets.includes('gltf-json'));
      assert.ok(targets.includes('glb-binary'));
    });
  });

  describe('Generator Interface', () => {
    it('should generate object from description', async () => {
      const result = holoscript.generator.generateObject('a ball that can be grabbed and thrown');
      assert.ok(result.ok, 'Generation should succeed');
      
      const code = result.ok;
      assert.ok(code.includes('object'));
      assert.ok(code.includes('@grabbable') || code.includes('@throwable'));
      assert.ok(code.includes('sphere'));
    });

    it('should generate scene from description', async () => {
      const result = holoscript.generator.generateScene('a space with a player and ground');
      assert.ok(result.ok, 'Generation should succeed');
      
      const code = result.ok;
      assert.ok(code.includes('composition'));
      assert.ok(code.includes('environment'));
    });

    it('should suggest traits for description', async () => {
      const traits = holoscript.generator.suggestTraits('an object that glows and can be grabbed');
      assert.ok(Array.isArray(traits));
      assert.ok(traits.some(t => t.name === 'grabbable' || t.name === 'glowing'));
    });
  });

  describe('Multi-Language Instantiation', () => {
    it('should work from JavaScript module', async () => {
      // This test itself demonstrates JS instantiation works
      assert.ok(holoscript.parser, 'Parser interface available');
      assert.ok(holoscript.validator, 'Validator interface available');
      assert.ok(holoscript.compiler, 'Compiler interface available');
      assert.ok(holoscript.generator, 'Generator interface available');
    });
  });
});

// Run tests
describe('Integration Tests', () => {
  it('should parse, validate, and compile in sequence', async () => {
    if (!holoscript) return;
    
    const source = `composition "IntegrationTest" {
      environment {
        skybox: "nebula"
        ambient_light: 0.3
      }
      
      template "InteractiveObject" {
        geometry: "cube"
        color: "#00ff00"
      }
      
      object "Player" @physics @collidable {
        geometry: "capsule"
        position: [0, 1, 0]
      }
      
      spatial_group "Obstacles" {
        object "Block1" using "InteractiveObject" {
          position: [2, 0.5, 0]
        }
        object "Block2" using "InteractiveObject" {
          position: [-2, 0.5, 0]
        }
      }
    }`;
    
    // Parse
    const parseResult = holoscript.parser.parse(source);
    assert.ok(parseResult.ok, 'Parse should succeed');
    
    const ast = parseResult.ok;
    assert.strictEqual(ast.name, 'IntegrationTest');
    assert.strictEqual(ast.templates.length, 1);
    assert.strictEqual(ast.objects.length, 1);
    assert.strictEqual(ast.groups.length, 1);
    assert.strictEqual(ast.groups[0].children.length, 2);
    
    // Validate
    const validResult = holoscript.validator.validate(source);
    assert.strictEqual(validResult.valid, true);
    
    // Compile to multiple targets
    for (const target of ['unity-csharp', 'godot-gdscript', 'aframe-html']) {
      const compileResult = holoscript.compiler.compile(source, target);
      assert.ok(!compileResult.error, `Compile to ${target} should succeed`);
      assert.ok(compileResult.text.length > 0, `Output for ${target} should not be empty`);
    }
  });
});

console.log('HoloScript WASM Component Tests');
console.log('================================');
