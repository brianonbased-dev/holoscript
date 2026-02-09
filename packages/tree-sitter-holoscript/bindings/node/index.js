/**
 * tree-sitter-holoscript Node.js bindings
 */

const path = require('path');

try {
  // Try to load native binding
  module.exports = require('node-gyp-build')(path.join(__dirname, '..', '..'));
} catch (e) {
  // Fallback to tree-sitter WASM if native binding not available
  console.warn('Native tree-sitter-holoscript binding not found, some features may be unavailable');
  module.exports = null;
}
