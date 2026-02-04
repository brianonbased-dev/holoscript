import { HoloScriptCodeParser } from './packages/core/src/HoloScriptCodeParser';
import { inspect } from 'util';

const parser = new HoloScriptCodeParser();

const code = `
environment #mainEnv {
  sky: "blue"
}

composition "Level1" {
  cylinder #pillar1 { position: [0, 0, 0] }
  
  composition "SubLevel" {
    sphere #orb1 { position: [1, 1, 1] }
  }
}
`;

console.log('--- Testing Parser Features ---');
const result = parser.parse(code);

if (!result.success) {
  console.error('Parser failed:', result.errors);
  process.exit(1);
}

const ast = result.ast;
console.log('AST Root Nodes:', ast.length);

const env = ast.find(n => n.type === 'environment');
if (env && (env as any).settings.id === 'mainEnv') {
  console.log('✅ Environment #id supported');
} else {
  console.error('❌ Environment #id failed');
  console.log('Env settings:', (env as any)?.settings);
}

const level1 = ast.find(n => n.type === 'composition' && (n as any).name === 'Level1');
if (level1) {
  console.log('✅ Composition "Level1" found');
  const children = (level1 as any).children || [];
  const pillar = children.find((n: any) => n.properties?.id === 'pillar1');
  
  if (pillar) {
    console.log('✅ Primitive #id in composition supported');
  } else {
    console.error('❌ Primitive #id in composition failed');
    console.log('Children of Level1:', children.map((c: any) => c.type));
  }

  const subLevel = children.find((n: any) => n.type === 'composition' && n.name === 'SubLevel');
  if (subLevel) {
    console.log('✅ Nested Composition found');
    const subChildren = (subLevel as any).children || [];
    const orb = subChildren.find((n: any) => n.properties?.id === 'orb1');
    if (orb) {
      console.log('✅ Primitive inside nested composition found');
    } else {
      console.error('❌ Primitive inside nested composition failed');
    }
  } else {
    console.error('❌ Nested Composition failed');
  }
} else {
  console.error('❌ Composition "Level1" failed');
}

console.log('--- Testing Zone Parsing ---');
const zoneCode = `
zone #dangerZone {
  bounds: "box(10, 10, 10)"
  on_enter: "damage(player)"
}
`;

const zoneResult = parser.parse(zoneCode);
if (zoneResult.success) {
  const zone = zoneResult.ast.find(n => n.type === 'zone');
  if (zone && (zone as any).id === 'dangerZone') {
      console.log('✅ Zone #id supported');
      console.log('Zone properties:', (zone as any).properties);
  } else {
      console.error('❌ Zone parsing failed (node not found or id mismatch)');
      console.log('AST:', zoneResult.ast);
  }
} else {
  console.error('❌ Zone parsing errors:', zoneResult.errors);
}
