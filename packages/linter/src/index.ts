/**
 * HoloScript Linter
 *
 * Static analysis tool for HoloScript (.holo) and HoloScript+ (.hsplus) files.
 * Enforces best practices, catches errors, and improves code quality.
 *
 * @package @hololand/holoscript-linter
 * @version 2.0.0
 */

// =============================================================================
// TYPES
// =============================================================================

export type Severity = 'error' | 'warning' | 'info' | 'hint';

export type RuleCategory =
  | 'syntax'
  | 'naming'
  | 'best-practice'
  | 'performance'
  | 'style'
  | 'type-safety';

export interface LintDiagnostic {
  ruleId: string;
  message: string;
  severity: Severity;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  fix?: LintFix;
}

export interface LintFix {
  range: { start: number; end: number };
  replacement: string;
}

export interface LintResult {
  filePath: string;
  diagnostics: LintDiagnostic[];
  errorCount: number;
  warningCount: number;
  fixableCount: number;
}

export interface LinterConfig {
  // Rule configurations
  rules: Record<string, RuleConfig>;

  // File patterns to ignore
  ignorePatterns: string[];

  // Maximum errors before stopping
  maxErrors: number;

  // Enable type checking (HSPlus only)
  typeChecking: boolean;
}

export type RuleConfig = 'off' | 'warn' | 'error' | 'info' | ['warn' | 'error' | 'info', Record<string, unknown>];

export interface Rule {
  id: string;
  name: string;
  description: string;
  category: RuleCategory;
  defaultSeverity: Severity;
  check(context: RuleContext): LintDiagnostic[];
}

export interface RuleContext {
  source: string;
  lines: string[];
  fileType: 'holo' | 'hsplus';
  config: Record<string, unknown>;
}

// =============================================================================
// DEFAULT CONFIG
// =============================================================================

export const DEFAULT_CONFIG: LinterConfig = {
  rules: {
    // Syntax rules
    'no-syntax-errors': 'error',
    'valid-trait-syntax': 'error',

    // Naming rules
    'composition-naming': 'warn',
    'object-naming': 'warn',
    'template-naming': 'warn',

    // Best practices
    'no-unused-templates': 'warn',
    'no-duplicate-ids': 'error',
    'prefer-templates': 'warn',

    // Performance
    'no-deep-nesting': 'warn',
    'limit-objects-per-group': 'warn',

    // Style
    'consistent-spacing': 'info',
    'sorted-properties': 'info',
  },
  ignorePatterns: ['node_modules/**', 'dist/**', '*.min.holo'],
  maxErrors: 100,
  typeChecking: true,
};

// =============================================================================
// BUILT-IN RULES
// =============================================================================

const BUILT_IN_RULES: Rule[] = [
  // No duplicate IDs
  {
    id: 'no-duplicate-ids',
    name: 'No Duplicate IDs',
    description: 'Ensure all object IDs are unique within a composition',
    category: 'syntax',
    defaultSeverity: 'error',
    check(context: RuleContext): LintDiagnostic[] {
      const diagnostics: LintDiagnostic[] = [];
      const ids = new Map<string, number>();

      // Simple regex to find IDs (object#id or id: "value")
      const idRegex = /#([a-zA-Z_][a-zA-Z0-9_]*)\b/g;

      for (let i = 0; i < context.lines.length; i++) {
        const line = context.lines[i];
        let match;
        while ((match = idRegex.exec(line)) !== null) {
          const id = match[1];
          if (ids.has(id)) {
            diagnostics.push({
              ruleId: 'no-duplicate-ids',
              message: `Duplicate ID "${id}" (first defined on line ${ids.get(id)! + 1})`,
              severity: 'error',
              line: i + 1,
              column: match.index + 1,
            });
          } else {
            ids.set(id, i);
          }
        }
      }

      return diagnostics;
    },
  },

  // Composition naming
  {
    id: 'composition-naming',
    name: 'Composition Naming',
    description: 'Compositions should use PascalCase names',
    category: 'naming',
    defaultSeverity: 'warning',
    check(context: RuleContext): LintDiagnostic[] {
      const diagnostics: LintDiagnostic[] = [];
      const compositionRegex = /composition\s+["']([^"']+)["']/g;

      for (let i = 0; i < context.lines.length; i++) {
        const line = context.lines[i];
        let match;
        while ((match = compositionRegex.exec(line)) !== null) {
          const name = match[1];
          if (!/^[A-Z][a-zA-Z0-9]*$/.test(name.replace(/\s/g, ''))) {
            diagnostics.push({
              ruleId: 'composition-naming',
              message: `Composition name "${name}" should use PascalCase`,
              severity: 'warning',
              line: i + 1,
              column: match.index + 1,
            });
          }
        }
      }

      return diagnostics;
    },
  },

  // No deep nesting
  {
    id: 'no-deep-nesting',
    name: 'No Deep Nesting',
    description: 'Avoid deeply nested structures for better performance',
    category: 'performance',
    defaultSeverity: 'warning',
    check(context: RuleContext): LintDiagnostic[] {
      const diagnostics: LintDiagnostic[] = [];
      const maxDepth = (context.config['maxDepth'] as number) || 5;
      let currentDepth = 0;
      let maxReached = 0;
      let maxLine = 0;

      for (let i = 0; i < context.lines.length; i++) {
        const line = context.lines[i];
        const opens = (line.match(/{/g) || []).length;
        const closes = (line.match(/}/g) || []).length;
        currentDepth += opens - closes;

        if (currentDepth > maxReached) {
          maxReached = currentDepth;
          maxLine = i + 1;
        }
      }

      if (maxReached > maxDepth) {
        diagnostics.push({
          ruleId: 'no-deep-nesting',
          message: `Nesting depth ${maxReached} exceeds maximum of ${maxDepth}`,
          severity: 'warning',
          line: maxLine,
          column: 1,
        });
      }

      return diagnostics;
    },
  },

  // Valid trait syntax
  {
    id: 'valid-trait-syntax',
    name: 'Valid Trait Syntax',
    description: 'Ensure trait annotations use valid syntax',
    category: 'syntax',
    defaultSeverity: 'error',
    check(context: RuleContext): LintDiagnostic[] {
      const diagnostics: LintDiagnostic[] = [];
      const validTraits = [
        'grabbable',
        'throwable',
        'pointable',
        'hoverable',
        'scalable',
        'rotatable',
        'stackable',
        'snappable',
        'breakable',
        'talkable',
        'patrol',
        'merchant',
        'physics',
        'collision',
      ];

      const traitRegex = /@([a-zA-Z_][a-zA-Z0-9_]*)/g;

      for (let i = 0; i < context.lines.length; i++) {
        const line = context.lines[i];
        let match;
        while ((match = traitRegex.exec(line)) !== null) {
          const trait = match[1].toLowerCase();
          // Skip control flow keywords
          if (['if', 'for', 'while', 'import', 'export'].includes(trait)) {
            continue;
          }
          if (!validTraits.includes(trait)) {
            diagnostics.push({
              ruleId: 'valid-trait-syntax',
              message: `Unknown trait "@${match[1]}"`,
              severity: 'warning',
              line: i + 1,
              column: match.index + 1,
            });
          }
        }
      }

      return diagnostics;
    },
  },

  // No unused templates
  {
    id: 'no-unused-templates',
    name: 'No Unused Templates',
    description: 'Templates should be used at least once',
    category: 'best-practice',
    defaultSeverity: 'warning',
    check(context: RuleContext): LintDiagnostic[] {
      const diagnostics: LintDiagnostic[] = [];
      const templates = new Map<string, number>();
      const usages = new Set<string>();

      const templateDefRegex = /template\s+["']([^"']+)["']/g;
      const templateUseRegex = /using\s+["']([^"']+)["']/g;

      for (let i = 0; i < context.lines.length; i++) {
        const line = context.lines[i];

        let match;
        while ((match = templateDefRegex.exec(line)) !== null) {
          templates.set(match[1], i + 1);
        }
        while ((match = templateUseRegex.exec(line)) !== null) {
          usages.add(match[1]);
        }
      }

      for (const [name, line] of templates) {
        if (!usages.has(name)) {
          diagnostics.push({
            ruleId: 'no-unused-templates',
            message: `Template "${name}" is defined but never used`,
            severity: 'warning',
            line,
            column: 1,
          });
        }
      }

      return diagnostics;
    },
  },
];

// =============================================================================
// LINTER CLASS
// =============================================================================

export class HoloScriptLinter {
  private config: LinterConfig;
  private rules: Map<string, Rule>;

  constructor(config: Partial<LinterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.rules = new Map();

    // Register built-in rules
    for (const rule of BUILT_IN_RULES) {
      this.rules.set(rule.id, rule);
    }
  }

  /**
   * Lint HoloScript or HoloScript+ code
   */
  lint(source: string, filePath = 'input.holo'): LintResult {
    const fileType = filePath.endsWith('.hsplus') ? 'hsplus' : 'holo';
    const lines = source.split('\n');
    const diagnostics: LintDiagnostic[] = [];

    for (const [ruleId, rule] of this.rules) {
      const ruleConfig = this.config.rules[ruleId];

      // Skip disabled rules
      if (ruleConfig === 'off') {
        continue;
      }

      const severity = this.getSeverity(ruleConfig, rule.defaultSeverity);
      const config = this.getRuleOptions(ruleConfig);

      const context: RuleContext = {
        source,
        lines,
        fileType,
        config,
      };

      try {
        const ruleDiagnostics = rule.check(context);
        for (const d of ruleDiagnostics) {
          diagnostics.push({
            ...d,
            severity,
          });
        }
      } catch (error) {
        diagnostics.push({
          ruleId: 'internal-error',
          message: `Rule "${ruleId}" threw an error: ${error}`,
          severity: 'error',
          line: 1,
          column: 1,
        });
      }

      // Stop if too many errors
      if (diagnostics.filter((d) => d.severity === 'error').length >= this.config.maxErrors) {
        break;
      }
    }

    // Sort by line number
    diagnostics.sort((a, b) => a.line - b.line || a.column - b.column);

    return {
      filePath,
      diagnostics,
      errorCount: diagnostics.filter((d) => d.severity === 'error').length,
      warningCount: diagnostics.filter((d) => d.severity === 'warning').length,
      fixableCount: diagnostics.filter((d) => d.fix !== undefined).length,
    };
  }

  /**
   * Register a custom rule
   */
  registerRule(rule: Rule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Get all registered rules
   */
  getRules(): Rule[] {
    return Array.from(this.rules.values());
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  private getSeverity(config: RuleConfig | undefined, defaultSeverity: Severity): Severity {
    if (!config || config === 'off') {
      return defaultSeverity;
    }
    if (config === 'warn' || (Array.isArray(config) && config[0] === 'warn')) {
      return 'warning';
    }
    if (config === 'error' || (Array.isArray(config) && config[0] === 'error')) {
      return 'error';
    }
    return defaultSeverity;
  }

  private getRuleOptions(config: RuleConfig | undefined): Record<string, unknown> {
    if (Array.isArray(config) && config[1]) {
      return config[1];
    }
    return {};
  }

  getConfig(): LinterConfig {
    return { ...this.config };
  }

  setConfig(config: Partial<LinterConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Lint HoloScript code with default config
 */
export function lint(source: string, filePath = 'input.holo'): LintResult {
  const linter = new HoloScriptLinter();
  return linter.lint(source, filePath);
}

/**
 * Create a linter with custom config
 */
export function createLinter(config: Partial<LinterConfig> = {}): HoloScriptLinter {
  return new HoloScriptLinter(config);
}

// Default export
export default HoloScriptLinter;
