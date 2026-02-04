import { describe, it, expect } from 'vitest';
import { HoloScriptPlusParser } from './HoloScriptPlusParser';

describe('HoloScriptPlusParser - Extended Features', () => {
  const parser = new HoloScriptPlusParser({ enableVRTraits: true });

  it('Parses @networked trait correctly', () => {
    const source = `cube#networked_box @networked(sync_mode: "reliable", authority: "owner") { position: [1, 2, 3] }`;
    const result = parser.parse(source);
    expect(result.success).toBe(true);

    const node = result.ast.root;
    expect(node.traits.has('networked')).toBe(true);
    const config = node.traits.get('networked');
    expect(config.sync_mode).toBe('reliable');
    expect(config.authority).toBe('owner');
  });

  it('Parses @external_api directive correctly', () => {
    const source = `object api_sensor @external_api(url: "https://api.iot.com/sensor", method: "GET", interval: "10s") {
      @on_data_update(data) => state.val = data.value
    }`;
    const result = parser.parse(source);
    expect(result.success).toBe(true);
    // Note: implementation might put body in directive logic
  });

  it('Handles multiple directives and traits', () => {
    const source = `light#living_room @networked(sync_mode: "state-only") @external_api(url: "https://api.home.com/light", interval: "5m") @grabbable { color: "#ffffff" }`;
    const result = parser.parse(source);
    expect(result.success).toBe(true);
    const node = result.ast.root;
    expect(node.traits.has('networked')).toBe(true);
    expect(node.traits.has('grabbable')).toBe(true);
  });
});

describe('HoloScriptPlusParser - Control Flow', () => {
  const parser = new HoloScriptPlusParser({ enableVRTraits: true });

  it('Parses @while loop correctly', () => {
    const source = `scene#main {
      @while count < 10 {
        orb#item { size: 1 }
      }
    }`;
    const result = parser.parse(source);
    expect(result.success).toBe(true);
  });

  it('Parses @forEach loop correctly', () => {
    const source = `scene#main {
      @forEach item in items {
        orb#item { size: 1 }
      }
    }`;
    const result = parser.parse(source);
    expect(result.success).toBe(true);
  });

  it('Parses @for loop correctly', () => {
    const source = `scene#main {
      @for i in range(5) {
        orb#item { size: 1 }
      }
    }`;
    const result = parser.parse(source);
    expect(result.success).toBe(true);
  });
});

describe('HoloScriptPlusParser - Import Statements', () => {
  it('Parses @import with path', () => {
    const parser = new HoloScriptPlusParser({ enableVRTraits: true, enableTypeScriptImports: true });
    const source = `@import "./utils/helpers.ts"
    scene#main { size: 1 }`;
    const result = parser.parse(source);
    expect(result.success).toBe(true);
    expect(result.ast.imports.length).toBe(1);
    expect(result.ast.imports[0].path).toBe('./utils/helpers.ts');
    expect(result.ast.imports[0].alias).toBe('helpers');
  });

  it('Parses @import with alias', () => {
    const parser = new HoloScriptPlusParser({ enableVRTraits: true, enableTypeScriptImports: true });
    const source = `@import "./utils/math-helpers.ts" as MathUtils
    scene#main { size: 1 }`;
    const result = parser.parse(source);
    expect(result.success).toBe(true);
    expect(result.ast.imports.length).toBe(1);
    expect(result.ast.imports[0].path).toBe('./utils/math-helpers.ts');
    expect(result.ast.imports[0].alias).toBe('MathUtils');
  });

  it('Parses multiple @import statements', () => {
    const parser = new HoloScriptPlusParser({ enableVRTraits: true, enableTypeScriptImports: true });
    const source = `@import "./utils.ts"
    @import "./helpers.ts" as H
    @import "./config.ts"
    scene#main { size: 1 }`;
    const result = parser.parse(source);
    expect(result.success).toBe(true);
    expect(result.ast.imports.length).toBe(3);
    expect(result.ast.imports[0].alias).toBe('utils');
    expect(result.ast.imports[1].alias).toBe('H');
    expect(result.ast.imports[2].alias).toBe('config');
  });
});

describe('HoloScriptPlusParser - Logic Block', () => {
  const parser = new HoloScriptPlusParser({ enableVRTraits: true });

  it('Parses logic block with functions', () => {
    const source = `composition "Game" {
      logic {
        function take_damage(amount) {
          @state.health = @state.health - amount
        }
      }
      object "Player" { position: [0, 0, 0] }
    }`;
    const result = parser.parse(source);
    expect(result.success).toBe(true);
    const logicNode = result.ast.root.children?.find((c: any) => c.type === 'logic');
    expect(logicNode).toBeDefined();
    expect(logicNode.body.functions.length).toBeGreaterThan(0);
  });
});

describe('HoloScriptPlusParser - Environment & Lighting', () => {
  const parser = new HoloScriptPlusParser({ enableVRTraits: true });

  it('Parses environment block', () => {
    const source = `composition "Scene" {
      environment {
        @skybox { type: "procedural" }
        @ambient_light { color: "#ffffff", intensity: 0.4 }
      }
      object "Floor" { geometry: "box" }
    }`;
    const result = parser.parse(source);
    expect(result.success).toBe(true);
  });
});
