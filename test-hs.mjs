import { parseHoloScriptPlus } from './packages/core/dist/index.js';
import * as fs from 'fs';

// Read actual file
const code = fs.readFileSync('./examples/hello-world.hs', 'utf-8');

try {
  const result = parseHoloScriptPlus(code);
  if (result.errors && result.errors.length > 0) {
    console.log('Errors:', result.errors);
  } else {
    console.log('Parse SUCCESS!');
    console.log('Nodes:', result.ast?.children?.length || 0);
  }
} catch (e) {
  console.log('Parse error:', e.message);
}
