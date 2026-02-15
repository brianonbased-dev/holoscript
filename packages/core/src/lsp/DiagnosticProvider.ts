/**
 * DiagnosticProvider.ts
 *
 * Provides diagnostics (errors, warnings, hints) for HoloScript+ source code.
 * Validates: directive usage, property types, node structure, and trait compatibility.
 */

export type DiagnosticSeverity = 'error' | 'warning' | 'info' | 'hint';

export interface Diagnostic {
    severity: DiagnosticSeverity;
    message: string;
    line: number;
    column: number;
    endLine?: number;
    endColumn?: number;
    source: string;
    code?: string;
}

export interface DiagnosticRule {
    id: string;
    check: (context: DiagnosticContext) => Diagnostic[];
}

export interface DiagnosticContext {
    /** Parsed nodes */
    nodes: Array<{
        type: string;
        name?: string;
        directives?: Array<{ name: string; args?: any }>;
        properties?: Record<string, any>;
        loc?: { start: { line: number; column: number }; end: { line: number; column: number } };
        children?: any[];
    }>;
    /** Known trait names */
    knownTraits: Set<string>;
}

// =============================================================================
// BUILT-IN RULES
// =============================================================================

const unknownDirectiveRule: DiagnosticRule = {
    id: 'HS001',
    check(ctx: DiagnosticContext): Diagnostic[] {
        const diagnostics: Diagnostic[] = [];
        const KNOWN_DIRECTIVES = new Set([
            'version', 'author', 'description', 'tags', 'license', 'deprecated',
            'if', 'each', 'slot', 'switch', 'case', 'default', 'for',
            'on', 'emit', 'once', 'watch', 'computed', 'effect',
        ]);

        for (const node of ctx.nodes) {
            if (!node.directives) continue;
            for (const d of node.directives) {
                if (!KNOWN_DIRECTIVES.has(d.name) && !ctx.knownTraits.has(d.name)) {
                    diagnostics.push({
                        severity: 'error',
                        message: `Unknown directive '@${d.name}'`,
                        line: node.loc?.start.line || 0,
                        column: node.loc?.start.column || 0,
                        source: 'holoscript',
                        code: 'HS001',
                    });
                }
            }
        }
        return diagnostics;
    },
};

const emptyChildrenWarning: DiagnosticRule = {
    id: 'HS002',
    check(ctx: DiagnosticContext): Diagnostic[] {
        const diagnostics: Diagnostic[] = [];
        for (const node of ctx.nodes) {
            if (node.type === 'group' && (!node.children || node.children.length === 0)) {
                diagnostics.push({
                    severity: 'warning',
                    message: `Empty group '${node.name || 'unnamed'}' has no children`,
                    line: node.loc?.start.line || 0,
                    column: node.loc?.start.column || 0,
                    source: 'holoscript',
                    code: 'HS002',
                });
            }
        }
        return diagnostics;
    },
};

const deprecatedDirectiveHint: DiagnosticRule = {
    id: 'HS003',
    check(ctx: DiagnosticContext): Diagnostic[] {
        const diagnostics: Diagnostic[] = [];
        for (const node of ctx.nodes) {
            if (!node.directives) continue;
            for (const d of node.directives) {
                if (d.name === 'deprecated') {
                    diagnostics.push({
                        severity: 'hint',
                        message: `Node '${node.name || node.type}' is marked as deprecated`,
                        line: node.loc?.start.line || 0,
                        column: node.loc?.start.column || 0,
                        source: 'holoscript',
                        code: 'HS003',
                    });
                }
            }
        }
        return diagnostics;
    },
};

// =============================================================================
// DIAGNOSTIC PROVIDER
// =============================================================================

export class DiagnosticProvider {
    private rules: DiagnosticRule[] = [
        unknownDirectiveRule,
        emptyChildrenWarning,
        deprecatedDirectiveHint,
    ];

    /**
     * Add a custom diagnostic rule.
     */
    addRule(rule: DiagnosticRule): void {
        this.rules.push(rule);
    }

    /**
     * Run all rules against the context.
     */
    diagnose(context: DiagnosticContext): Diagnostic[] {
        const all: Diagnostic[] = [];
        for (const rule of this.rules) {
            all.push(...rule.check(context));
        }
        // Sort by line then column
        all.sort((a, b) => a.line - b.line || a.column - b.column);
        return all;
    }

    /**
     * Get count of registered rules.
     */
    get ruleCount(): number {
        return this.rules.length;
    }
}
