import { HoloScriptPlusParser } from './src/parser/HoloScriptPlusParser.js';

const parser = new HoloScriptPlusParser();

// Test 1: Dotted reference spread
const source1 = `
  orb item {
    ...Templates.Button
    ...config.defaults.orb
    color: "green"
  }
`;

console.log('=== Test 1: Dotted Reference Spread ===');
const result1 = parser.parse(source1);
console.log('Success:', result1.success);
if (result1.errors.length > 0) {
  console.log('Errors:');
  result1.errors.forEach((err, i) => {
    console.log(`  ${i + 1}. ${err.message} (line ${err.line})`);
  });
}

// Test 2: On-node container with @state spread
const source2 = `
  orb player {
    ...ActorBase
    
    children: [
      ...actorChildren
      orb head { ...BaseHead }
      orb body { ...BaseBody }
      ...additionalParts
    ]
    
    @state {
      ...defaultState
      health: 100
    }
  }
`;

console.log('\n=== Test 2: On-node Container with @state ===');
const result2 = parser.parse(source2);
console.log('Success:', result2.success);
if (result2.errors.length > 0) {
  console.log('Errors:');
  result2.errors.forEach((err, i) => {
    console.log(`  ${i + 1}. ${err.message} (line ${err.line})`);
  });
}
