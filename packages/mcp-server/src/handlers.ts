/**
 * MCP Tool Handlers for HoloScript
 * 
 * Implements the logic for each MCP tool.
 */

import {
  HoloScriptParser,
  HoloScriptPlusParser,
  HoloCompositionParser,
  HoloScriptValidator,
  parseHoloScriptPlus,
  parseHolo,
  parseHoloStrict,
  formatRichError,
  formatRichErrors,
} from '@holoscript/core';

import { generateObject, generateScene, suggestTraits } from './generators';
import { renderPreview, createShareLink } from './renderer';
import { TRAIT_DOCS, SYNTAX_DOCS, EXAMPLES } from './documentation';

// Trait categories mapping
const TRAIT_CATEGORIES: Record<string, string[]> = {
  interaction: ['@grabbable', '@throwable', '@holdable', '@clickable', '@hoverable', '@draggable', '@pointable', '@scalable'],
  physics: ['@collidable', '@physics', '@rigid', '@kinematic', '@trigger', '@gravity'],
  visual: ['@glowing', '@emissive', '@transparent', '@reflective', '@animated', '@billboard'],
  networking: ['@networked', '@synced', '@persistent', '@owned', '@host_only'],
  behavior: ['@stackable', '@attachable', '@equippable', '@consumable', '@destructible'],
  spatial: ['@anchor', '@tracked', '@world_locked', '@hand_tracked', '@eye_tracked'],
  audio: ['@spatial_audio', '@ambient', '@voice_activated'],
  state: ['@state', '@reactive', '@observable', '@computed'],
};

const ALL_TRAITS = Object.values(TRAIT_CATEGORIES).flat();

/**
 * Main handler dispatcher for all tools
 */
export async function handleTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'parse_hs':
      return handleParseHs(args);
    case 'parse_holo':
      return handleParseHolo(args);
    case 'validate_holoscript':
      return handleValidate(args);
    case 'list_traits':
      return handleListTraits(args);
    case 'explain_trait':
      return handleExplainTrait(args);
    case 'suggest_traits':
      return handleSuggestTraits(args);
    case 'generate_object':
      return handleGenerateObject(args);
    case 'generate_scene':
      return handleGenerateScene(args);
    case 'get_syntax_reference':
      return handleGetSyntaxReference(args);
    case 'get_examples':
      return handleGetExamples(args);
    case 'explain_code':
      return handleExplainCode(args);
    case 'analyze_code':
      return handleAnalyzeCode(args);
    case 'render_preview':
      return handleRenderPreview(args);
    case 'create_share_link':
      return handleCreateShareLink(args);
    case 'convert_format':
      return handleConvertFormat(args);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// === PARSING HANDLERS ===

async function handleParseHs(args: Record<string, unknown>) {
  const code = args.code as string;
  const format = (args.format as string) || 'hsplus';
  
  try {
    const parser = new HoloScriptPlusParser();
    const result = parser.parse(code);
    
    return {
      success: true,
      ast: result.ast,
      errors: result.errors || [],
      warnings: result.warnings || [],
      ...(args.includeSourceMap && { sourceMap: result.sourceMap }),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function handleParseHolo(args: Record<string, unknown>) {
  const code = args.code as string;
  const strict = args.strict as boolean;
  
  try {
    const result = strict ? parseHoloStrict(code) : parseHolo(code);
    
    return {
      success: true,
      composition: result,
      errors: result.errors || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// === VALIDATION HANDLER ===

async function handleValidate(args: Record<string, unknown>) {
  const code = args.code as string;
  const format = (args.format as string) || 'auto';
  const includeWarnings = args.includeWarnings !== false;
  const includeSuggestions = args.includeSuggestions !== false;
  
  try {
    // Detect format if auto
    const detectedFormat = format === 'auto' ? detectFormat(code) : format;
    
    // Parse based on format
    let parseResult;
    if (detectedFormat === 'holo') {
      parseResult = parseHolo(code);
    } else {
      const parser = new HoloScriptPlusParser();
      parseResult = parser.parse(code);
    }
    
    const errors: AIFriendlyError[] = [];
    const warnings: AIFriendlyError[] = [];
    
    // Convert errors to AI-friendly format
    if (parseResult.errors) {
      for (const err of parseResult.errors) {
        const aiError = toAIFriendlyError(err, code, includeSuggestions);
        errors.push(aiError);
      }
    }
    
    if (includeWarnings && parseResult.warnings) {
      for (const warn of parseResult.warnings) {
        const aiWarn = toAIFriendlyError(warn, code, includeSuggestions);
        warnings.push(aiWarn);
      }
    }
    
    return {
      valid: errors.length === 0,
      format: detectedFormat,
      errors,
      ...(includeWarnings && { warnings }),
      summary: errors.length === 0 
        ? '✅ Valid HoloScript code'
        : `❌ Found ${errors.length} error(s)`,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// === TRAITS HANDLERS ===

async function handleListTraits(args: Record<string, unknown>) {
  const category = (args.category as string) || 'all';
  
  if (category === 'all') {
    return {
      total: ALL_TRAITS.length,
      categories: TRAIT_CATEGORIES,
      list: ALL_TRAITS,
    };
  }
  
  const traits = TRAIT_CATEGORIES[category];
  if (!traits) {
    return {
      error: `Unknown category: ${category}`,
      validCategories: Object.keys(TRAIT_CATEGORIES),
    };
  }
  
  return {
    category,
    count: traits.length,
    traits,
  };
}

async function handleExplainTrait(args: Record<string, unknown>) {
  let trait = args.trait as string;
  
  // Normalize trait name
  if (!trait.startsWith('@')) {
    trait = '@' + trait;
  }
  
  const doc = TRAIT_DOCS[trait];
  if (!doc) {
    // Find similar traits
    const similar = findSimilarTraits(trait);
    return {
      error: `Unknown trait: ${trait}`,
      suggestion: similar.length > 0 ? `Did you mean: ${similar.join(', ')}?` : null,
      allTraits: ALL_TRAITS,
    };
  }
  
  return doc;
}

async function handleSuggestTraits(args: Record<string, unknown>) {
  const description = args.description as string;
  const context = args.context as string | undefined;
  
  return suggestTraits(description, context);
}

// === GENERATION HANDLERS ===

async function handleGenerateObject(args: Record<string, unknown>) {
  const description = args.description as string;
  const format = (args.format as string) || 'hsplus';
  const includeDocs = args.includeDocs as boolean;
  
  return generateObject(description, { format, includeDocs });
}

async function handleGenerateScene(args: Record<string, unknown>) {
  const description = args.description as string;
  const style = (args.style as string) || 'detailed';
  const features = (args.features as string[]) || [];
  
  return generateScene(description, { style, features });
}

// === DOCUMENTATION HANDLERS ===

async function handleGetSyntaxReference(args: Record<string, unknown>) {
  const topic = args.topic as string;
  
  const doc = SYNTAX_DOCS[topic];
  if (!doc) {
    return {
      error: `Unknown topic: ${topic}`,
      availableTopics: Object.keys(SYNTAX_DOCS),
    };
  }
  
  return doc;
}

async function handleGetExamples(args: Record<string, unknown>) {
  const pattern = args.pattern as string;
  
  const example = EXAMPLES[pattern];
  if (!example) {
    return {
      error: `Unknown pattern: ${pattern}`,
      availablePatterns: Object.keys(EXAMPLES),
    };
  }
  
  return example;
}

async function handleExplainCode(args: Record<string, unknown>) {
  const code = args.code as string;
  const detail = (args.detail as string) || 'detailed';
  
  // Parse the code first
  const format = detectFormat(code);
  let parsed;
  
  try {
    if (format === 'holo') {
      parsed = parseHolo(code);
    } else {
      const parser = new HoloScriptPlusParser();
      parsed = parser.parse(code);
    }
  } catch (error) {
    return {
      error: 'Failed to parse code',
      parseError: error instanceof Error ? error.message : String(error),
    };
  }
  
  // Generate explanation based on AST
  const explanation = generateExplanation(parsed, detail);
  
  return {
    format,
    explanation,
    detail,
  };
}

async function handleAnalyzeCode(args: Record<string, unknown>) {
  const code = args.code as string;
  const format = detectFormat(code);
  
  let parsed;
  try {
    if (format === 'holo') {
      parsed = parseHolo(code);
    } else {
      const parser = new HoloScriptPlusParser();
      parsed = parser.parse(code);
    }
  } catch (error) {
    return {
      error: 'Failed to parse code',
      parseError: error instanceof Error ? error.message : String(error),
    };
  }
  
  return analyzeAST(parsed, code);
}

// === RENDERING HANDLERS ===

async function handleRenderPreview(args: Record<string, unknown>) {
  return renderPreview({
    code: args.code as string,
    format: (args.format as string) || 'png',
    resolution: (args.resolution as number[]) || [800, 600],
    camera: args.camera as { position?: number[]; target?: number[] },
    duration: args.duration as number,
    quality: (args.quality as string) || 'preview',
  });
}

async function handleCreateShareLink(args: Record<string, unknown>) {
  return createShareLink({
    code: args.code as string,
    title: args.title as string,
    description: args.description as string,
    platform: (args.platform as string) || 'x',
  });
}

// === CONVERSION HANDLER ===

async function handleConvertFormat(args: Record<string, unknown>) {
  const code = args.code as string;
  const from = args.from as string;
  const to = args.to as string;
  
  // TODO: Implement full conversion logic
  return {
    success: true,
    original: from,
    target: to,
    code: code, // Placeholder - actual conversion logic needed
    note: 'Format conversion is a best-effort process',
  };
}

// === HELPER FUNCTIONS ===

interface AIFriendlyError {
  code: string;
  line: number;
  column?: number;
  message: string;
  context?: string;
  suggestion?: string;
  fix?: {
    type: 'replace' | 'insert' | 'delete';
    old?: string;
    new?: string;
    position?: number;
  };
}

function detectFormat(code: string): 'hs' | 'hsplus' | 'holo' {
  if (code.includes('composition') && code.includes('{')) {
    return 'holo';
  }
  if (code.includes('@') || code.includes('state {')) {
    return 'hsplus';
  }
  return 'hs';
}

function toAIFriendlyError(
  error: { message: string; line?: number; column?: number },
  code: string,
  includeSuggestions: boolean
): AIFriendlyError {
  const message = error.message;
  const line = error.line || 1;
  
  const aiError: AIFriendlyError = {
    code: extractErrorCode(message),
    line,
    column: error.column,
    message,
  };
  
  // Add context from source
  const lines = code.split('\n');
  if (line > 0 && line <= lines.length) {
    aiError.context = lines[line - 1].trim();
  }
  
  // Add suggestions if enabled
  if (includeSuggestions) {
    const suggestion = generateSuggestion(message);
    if (suggestion) {
      aiError.suggestion = suggestion.message;
      aiError.fix = suggestion.fix;
    }
  }
  
  return aiError;
}

function extractErrorCode(message: string): string {
  // Extract error code from message if present
  const match = message.match(/\[(E\d+|W\d+)\]/);
  if (match) return match[1];
  
  // Generate a code based on error type
  if (message.includes('Unknown trait')) return 'E001';
  if (message.includes('syntax')) return 'E002';
  if (message.includes('unexpected')) return 'E003';
  if (message.includes('missing')) return 'E004';
  return 'E999';
}

function generateSuggestion(message: string): { message: string; fix?: AIFriendlyError['fix'] } | null {
  // Unknown trait
  const traitMatch = message.match(/Unknown trait:?\s*[@]?(\w+)/i);
  if (traitMatch) {
    const trait = '@' + traitMatch[1];
    const similar = findSimilarTraits(trait);
    if (similar.length > 0) {
      return {
        message: `Did you mean ${similar[0]}?`,
        fix: { type: 'replace', old: trait, new: similar[0] },
      };
    }
  }
  
  // Typo in geometry
  const geoMatch = message.match(/(spher|cub|cylinder|con|plan)/i);
  if (geoMatch) {
    const corrections: Record<string, string> = {
      sper: 'sphere',
      spher: 'sphere',
      cub: 'cube',
      con: 'cone',
      plan: 'plane',
    };
    const key = geoMatch[1].toLowerCase();
    if (corrections[key]) {
      return {
        message: `Did you mean '${corrections[key]}'?`,
        fix: { type: 'replace', old: geoMatch[0], new: corrections[key] },
      };
    }
  }
  
  return null;
}

function findSimilarTraits(trait: string): string[] {
  const normalized = trait.replace('@', '').toLowerCase();
  
  return ALL_TRAITS.filter(t => {
    const tName = t.replace('@', '').toLowerCase();
    // Simple Levenshtein-like matching
    if (tName.includes(normalized) || normalized.includes(tName)) return true;
    // Check first few chars
    if (tName.substring(0, 3) === normalized.substring(0, 3)) return true;
    return false;
  }).slice(0, 3);
}

function generateExplanation(parsed: unknown, detail: string): string {
  // TODO: Generate actual explanation from AST
  // This is a placeholder
  return 'This HoloScript code defines a 3D scene with objects, traits, and behavior. ' +
    'See the parsed AST for detailed structure.';
}

function analyzeAST(parsed: unknown, code: string) {
  const lines = code.split('\n').length;
  const objects = (code.match(/\b(orb|object|cube|sphere|model)\s+\w+/gi) || []).length;
  const traits = (code.match(/@\w+/g) || []).length;
  const functions = (code.match(/\b(function|action|on_\w+)\s*\(/gi) || []).length;
  
  return {
    stats: {
      lines,
      objects,
      traits,
      functions,
      characters: code.length,
    },
    complexity: {
      score: Math.min(10, Math.round((objects + traits + functions) / 5)),
      level: objects + traits + functions < 10 ? 'simple' :
             objects + traits + functions < 30 ? 'moderate' : 'complex',
    },
    suggestions: [
      ...(traits === 0 ? ['Consider adding VR traits for interactivity'] : []),
      ...(objects > 20 ? ['Consider using templates to reduce duplication'] : []),
      ...(lines > 200 ? ['Consider splitting into multiple composition files'] : []),
    ],
  };
}
