/**
 * @holoscript/cli
 *
 * Command-line interface for HoloScript.
 * Parse, execute, and debug HoloScript files.
 */

export { HoloScriptCLI } from './HoloScriptCLI';
export { parseArgs, type CLIOptions } from './args';
export { formatAST, formatError } from './formatters';
export { HoloScriptREPL, startREPL } from './repl';

// Traits & Generation
export { TRAITS, formatTrait, formatAllTraits, suggestTraits, getTraitsByCategory, getCategories, type TraitInfo } from './traits';
export { generateObject, generateScene, listTemplates, getTemplate, type GeneratorOptions, type GeneratedObject } from './generator';
