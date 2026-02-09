/**
 * tree-sitter-holoscript TypeScript definitions
 */

import type { Language } from 'tree-sitter';

/**
 * The HoloScript tree-sitter language.
 * 
 * @example
 * ```typescript
 * import Parser from 'tree-sitter';
 * import HoloScript from 'tree-sitter-holoscript';
 * 
 * const parser = new Parser();
 * parser.setLanguage(HoloScript);
 * 
 * const tree = parser.parse(`
 *   composition "My Scene" {
 *     object "Cube" @grabbable {
 *       geometry: "cube"
 *     }
 *   }
 * `);
 * 
 * console.log(tree.rootNode.toString());
 * ```
 */
declare const holoscript: Language;

export = holoscript;
