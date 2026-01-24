const { HoloScriptCodeParser } = require('./packages/core/dist/index.cjs');
const fs = require('fs');

console.log('=== Testing Security Fix ===\n');

// Test 1: spawn in comment
console.log('Test 1: spawn in comment');
try {
  const parser1 = new HoloScriptCodeParser();
  const result1 = parser1.parse('// spawn point here\ncomposition Test { }');
  console.log('  Success:', result1.success, 'Errors:', result1.errors.length);
} catch(e) {
  console.log('  ERROR:', e.message);
}

// Test 2: spawn in string
console.log('Test 2: spawn in string');
try {
  const parser2 = new HoloScriptCodeParser();
  const result2 = parser2.parse('orb name = "spawn"\ncomposition Test { }');
  console.log('  Success:', result2.success, 'Errors:', result2.errors.length);
} catch(e) {
  console.log('  ERROR:', e.message);
}

// Test 3: eval in multi-line comment
console.log('Test 3: eval in multi-line comment');
try {
  const parser3 = new HoloScriptCodeParser();
  const result3 = parser3.parse('/* eval would be bad */\ncomposition Test { }');
  console.log('  Success:', result3.success, 'Errors:', result3.errors.length);
} catch(e) {
  console.log('  ERROR:', e.message);
}

// Test 4: respawn should NOT match spawn (word boundary)
console.log('Test 4: respawn should not match spawn');
try {
  const parser4 = new HoloScriptCodeParser();
  const result4 = parser4.parse('orb respawnPoint = 1\ncomposition Test { }');
  console.log('  Success:', result4.success, 'Errors:', result4.errors.length);
} catch(e) {
  console.log('  ERROR:', e.message);
}

// Test 5: actual Hololand file
console.log('\nTest 5: arcade_district.holo (parse in chunks)');
const arcadeFile = 'C:/Users/josep/Documents/GitHub/Hololand/examples/hololand-central/src/zones/arcade_district.holo';
try {
  const code = fs.readFileSync(arcadeFile, 'utf8');
  console.log('  File loaded, length:', code.length, 'lines:', code.split('\n').length);
  
  // Test the security stripping function first (to confirm it's not the issue)
  console.log('  Testing security on full code...');
  
  const parser = new HoloScriptCodeParser();
  console.log('  Calling parse...');
  const result = parser.parse(code);
  console.log('  Parse complete!');
  console.log('  Success:', result.success);
  console.log('  Nodes:', result.ast.length);
  console.log('  Errors:', result.errors.length);
  if (result.errors.length > 0) {
    console.log('  First 3 errors:');
    result.errors.slice(0, 3).forEach((e, i) => console.log('    ', i+1, e.message));
  }
} catch(e) {
  console.log('  ERROR:', e.message);
  console.log('  Stack:', e.stack);
}

// Test 6: hello_vr.holo
console.log('\nTest 6: hello_vr.holo');
const helloFile = 'C:/Users/josep/Documents/GitHub/Hololand/examples/fresh/hello_vr.holo';
try {
  const code = fs.readFileSync(helloFile, 'utf8');
  const parser = new HoloScriptCodeParser();
  const result = parser.parse(code);
  console.log('  Success:', result.success);
  console.log('  Nodes:', result.ast.length);
  if (result.ast.length > 0) {
    console.log('  Nodes:');
    result.ast.forEach(n => console.log('    -', n.type, n.name || ''));
  }
  if (result.errors.length > 0 && result.errors.length <= 5) {
    console.log('  Errors:');
    result.errors.forEach(e => console.log('    -', e.message));
  }
} catch(e) {
  console.log('  ERROR:', e.message);
}

console.log('\n=== Test Complete ===');
