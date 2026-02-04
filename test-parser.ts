import { HoloScriptPlusParser } from './packages/core/src/parser/HoloScriptPlusParser';

const source = `@import "./utils/math-helpers.ts" as MathUtils
scene#main { size: 1 }`;

console.log('Testing Parser...');
const parser = new HoloScriptPlusParser({ enableVRTraits: true, enableTypeScriptImports: true });
const result = parser.parse(source);

console.log('Success:', result.success);
if (!result.success) {
  console.log('Errors:', JSON.stringify(result.errors, null, 2));
} else {
  console.log('Imports:', result.ast.imports);
}
