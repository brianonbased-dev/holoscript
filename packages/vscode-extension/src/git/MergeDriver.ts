/**
 * @fileoverview Three-way merge driver for HoloScript files
 * @module git/MergeDriver
 */

import * as vscode from 'vscode';
import { SceneNode, MergeConflict, MergeResult, HookResult, PropertyChange } from './GitTypes';

interface ASTNode {
  type: string;
  name?: string;
  line?: number;
  children?: ASTNode[];
  properties?: Record<string, unknown>;
  position?: [number, number, number];
  [key: string]: unknown;
}

/**
 * Three-way merge driver for HoloScript files
 *
 * Performs semantic merging of scene graphs rather than text-based merge.
 * Understands object identity, transforms, and traits.
 */
export class MergeDriver {
  private outputChannel: vscode.OutputChannel;

  constructor() {
    this.outputChannel = vscode.window.createOutputChannel('HoloScript Merge');
  }

  /**
   * Perform a three-way merge
   *
   * @param baseContent - Common ancestor content
   * @param oursContent - Our version content
   * @param theirsContent - Their version content
   * @returns Merge result with merged content or conflicts
   */
  async merge(
    baseContent: string,
    oursContent: string,
    theirsContent: string
  ): Promise<MergeResult> {
    this.log('Starting three-way merge');

    const baseAST = await this.parseHoloScript(baseContent);
    const oursAST = await this.parseHoloScript(oursContent);
    const theirsAST = await this.parseHoloScript(theirsContent);

    const baseNodes = this.extractNodes(baseAST);
    const oursNodes = this.extractNodes(oursAST);
    const theirsNodes = this.extractNodes(theirsAST);

    const conflicts: MergeConflict[] = [];
    const mergedNodes: Map<string, ASTNode> = new Map();
    let oursApplied = 0;
    let theirsApplied = 0;

    // Get all unique node IDs
    const allIds = new Set([...baseNodes.keys(), ...oursNodes.keys(), ...theirsNodes.keys()]);

    for (const id of allIds) {
      const base = baseNodes.get(id);
      const ours = oursNodes.get(id);
      const theirs = theirsNodes.get(id);

      const result = this.mergeNode(id, base, ours, theirs);

      if (result.conflict) {
        conflicts.push(result.conflict);
      } else if (result.node) {
        mergedNodes.set(id, result.node);
        if (result.source === 'ours') oursApplied++;
        if (result.source === 'theirs') theirsApplied++;
      }
    }

    // Generate output
    const mergedAST = this.buildMergedAST(mergedNodes, conflicts);
    const content = this.generateHoloScript(mergedAST, conflicts);

    const result: MergeResult = {
      content,
      scene: conflicts.length === 0 ? this.astNodesToSceneNodes(mergedNodes) : undefined,
      success: conflicts.length === 0,
      conflicts,
      oursApplied,
      theirsApplied,
      hasBase: baseContent.trim().length > 0,
    };

    this.log(
      `Merge complete: ${conflicts.length} conflicts, ${oursApplied} ours, ${theirsApplied} theirs`
    );
    return result;
  }

  /**
   * Merge a single node with three-way logic
   */
  private mergeNode(
    id: string,
    base: ASTNode | undefined,
    ours: ASTNode | undefined,
    theirs: ASTNode | undefined
  ): { node?: ASTNode; conflict?: MergeConflict; source?: 'base' | 'ours' | 'theirs' | 'merged' } {
    // Case 1: Only in one version (add)
    if (!base && ours && !theirs) {
      return { node: ours, source: 'ours' };
    }
    if (!base && !ours && theirs) {
      return { node: theirs, source: 'theirs' };
    }

    // Case 2: Add-add conflict
    if (!base && ours && theirs) {
      if (this.nodesEqual(ours, theirs)) {
        return { node: ours, source: 'merged' };
      }
      return {
        conflict: {
          id: `add-add-${id}`,
          path: id,
          nodeId: id,
          ours,
          theirs,
          base: undefined,
          type: 'add-add',
          autoResolvable: false,
        },
      };
    }

    // Case 3: Delete in one, unchanged in other
    if (base && !ours && theirs) {
      if (this.nodesEqual(base, theirs)) {
        // We deleted, they didn't change - delete wins
        return { source: 'ours' };
      }
      // Delete-modify conflict
      return {
        conflict: {
          id: `delete-modify-${id}`,
          path: id,
          nodeId: id,
          ours: undefined,
          theirs,
          base,
          type: 'delete-modify',
          autoResolvable: false,
        },
      };
    }
    if (base && ours && !theirs) {
      if (this.nodesEqual(base, ours)) {
        // They deleted, we didn't change - delete wins
        return { source: 'theirs' };
      }
      // Modify-delete conflict
      return {
        conflict: {
          id: `delete-modify-${id}`,
          path: id,
          nodeId: id,
          ours,
          theirs: undefined,
          base,
          type: 'delete-modify',
          autoResolvable: false,
        },
      };
    }

    // Case 4: Both deleted
    if (base && !ours && !theirs) {
      return { source: 'merged' };
    }

    // Case 5: Both modified
    if (base && ours && theirs) {
      const oursChanged = !this.nodesEqual(base, ours);
      const theirsChanged = !this.nodesEqual(base, theirs);

      if (!oursChanged && !theirsChanged) {
        return { node: ours, source: 'base' };
      }
      if (oursChanged && !theirsChanged) {
        return { node: ours, source: 'ours' };
      }
      if (!oursChanged && theirsChanged) {
        return { node: theirs, source: 'theirs' };
      }

      // Both changed - try to merge properties
      const merged = this.mergeNodeProperties(base, ours, theirs);
      if (merged.success) {
        return { node: merged.node, source: 'merged' };
      }

      return {
        conflict: {
          id: `property-${id}`,
          path: id,
          nodeId: id,
          ours,
          theirs,
          base,
          type: 'property',
          autoResolvable: false,
          suggestedResolution: merged.suggested,
        },
      };
    }

    // Shouldn't reach here
    return { node: ours || theirs, source: 'merged' };
  }

  /**
   * Attempt to merge node properties
   */
  private mergeNodeProperties(
    base: ASTNode,
    ours: ASTNode,
    theirs: ASTNode
  ): { success: boolean; node?: ASTNode; suggested?: ASTNode } {
    const merged: ASTNode = { type: ours.type, name: ours.name };
    let hasConflict = false;

    // Get all property keys
    const baseProps = base.properties || {};
    const oursProps = ours.properties || {};
    const theirsProps = theirs.properties || {};
    const allKeys = new Set([
      ...Object.keys(baseProps),
      ...Object.keys(oursProps),
      ...Object.keys(theirsProps),
    ]);

    merged.properties = {};

    for (const key of allKeys) {
      const baseVal = baseProps[key];
      const oursVal = oursProps[key];
      const theirsVal = theirsProps[key];

      const oursChanged = JSON.stringify(baseVal) !== JSON.stringify(oursVal);
      const theirsChanged = JSON.stringify(baseVal) !== JSON.stringify(theirsVal);

      if (!oursChanged && !theirsChanged) {
        if (baseVal !== undefined) merged.properties[key] = baseVal;
      } else if (oursChanged && !theirsChanged) {
        if (oursVal !== undefined) merged.properties[key] = oursVal;
      } else if (!oursChanged && theirsChanged) {
        if (theirsVal !== undefined) merged.properties[key] = theirsVal;
      } else {
        // Both changed - conflict if different
        if (JSON.stringify(oursVal) === JSON.stringify(theirsVal)) {
          if (oursVal !== undefined) merged.properties[key] = oursVal;
        } else {
          hasConflict = true;
          // Use ours as default in suggested
          if (oursVal !== undefined) merged.properties[key] = oursVal;
        }
      }
    }

    // Handle position specially
    const posResult = this.mergePosition(base.position, ours.position, theirs.position);
    if (posResult.conflict) {
      hasConflict = true;
    }
    merged.position = posResult.value;

    if (hasConflict) {
      return { success: false, suggested: merged };
    }

    return { success: true, node: merged };
  }

  /**
   * Merge position vectors
   */
  private mergePosition(
    base?: [number, number, number],
    ours?: [number, number, number],
    theirs?: [number, number, number]
  ): { value?: [number, number, number]; conflict: boolean } {
    const baseStr = JSON.stringify(base);
    const oursStr = JSON.stringify(ours);
    const theirsStr = JSON.stringify(theirs);

    if (oursStr === theirsStr) {
      return { value: ours, conflict: false };
    }
    if (oursStr === baseStr) {
      return { value: theirs, conflict: false };
    }
    if (theirsStr === baseStr) {
      return { value: ours, conflict: false };
    }

    // Both changed - use ours as default
    return { value: ours, conflict: true };
  }

  /**
   * Check if two nodes are equal
   */
  private nodesEqual(a: ASTNode, b: ASTNode): boolean {
    return JSON.stringify(this.normalizeNode(a)) === JSON.stringify(this.normalizeNode(b));
  }

  private normalizeNode(node: ASTNode): object {
    const { line, ...rest } = node;
    return rest;
  }

  /**
   * Extract nodes by ID from AST
   */
  private extractNodes(ast: ASTNode): Map<string, ASTNode> {
    const nodes = new Map<string, ASTNode>();
    const children = ast.children || [];

    for (const child of children) {
      if (child.name) {
        nodes.set(child.name, child);
      }
    }

    return nodes;
  }

  /**
   * Build merged AST
   */
  private buildMergedAST(nodes: Map<string, ASTNode>, conflicts: MergeConflict[]): ASTNode {
    return {
      type: 'Scene',
      children: Array.from(nodes.values()),
    };
  }

  /**
   * Generate HoloScript source from AST
   */
  private generateHoloScript(ast: ASTNode, conflicts: MergeConflict[]): string {
    const lines: string[] = [];

    // Add header
    lines.push('// Merged HoloScript file');
    if (conflicts.length > 0) {
      lines.push(`// WARNING: ${conflicts.length} merge conflicts require manual resolution`);
    }
    lines.push('');

    // Generate each node
    const children = ast.children || [];
    for (const node of children) {
      lines.push(this.generateNodeSource(node));
      lines.push('');
    }

    // Add conflict markers
    for (const conflict of conflicts) {
      lines.push('');
      lines.push('// >>>>>>> CONFLICT');
      lines.push(`// Path: ${conflict.path}`);
      lines.push(`// Type: ${conflict.type}`);
      lines.push('// <<<<<<<< OURS');
      lines.push(this.generateNodeSource(conflict.ours as ASTNode));
      lines.push('// ======== THEIRS');
      lines.push(this.generateNodeSource(conflict.theirs as ASTNode));
      lines.push('// >>>>>>>> END CONFLICT');
    }

    return lines.join('\n');
  }

  /**
   * Generate source for a single node
   */
  private generateNodeSource(node: ASTNode | undefined): string {
    if (!node) return '// (deleted)';

    const parts: string[] = [];

    // Type and name
    parts.push(`${node.type} ${node.name}`);

    // Position
    if (node.position) {
      parts.push(` @ (${node.position.join(', ')})`);
    }

    parts.push(' {\n');

    // Properties
    const props = node.properties || {};
    for (const [key, value] of Object.entries(props)) {
      parts.push(`  ${key}: ${JSON.stringify(value)};\n`);
    }

    parts.push('}');

    return parts.join('');
  }

  /**
   * Convert AST nodes to scene nodes
   */
  private astNodesToSceneNodes(nodes: Map<string, ASTNode>): SceneNode[] {
    return Array.from(nodes.values()).map((node) => ({
      type: node.type,
      id: node.name || '',
      name: node.name,
      position: node.position,
      properties: node.properties as Record<string, unknown>,
    }));
  }

  /**
   * Parse HoloScript content to AST
   */
  private async parseHoloScript(content: string): Promise<ASTNode> {
    // Use same parsing logic as SemanticGit
    try {
      return {
        type: 'Scene',
        children: this.simpleParseScene(content),
      };
    } catch (error) {
      this.log(`Parse error: ${error}`);
      return { type: 'Scene', children: [] };
    }
  }

  private simpleParseScene(content: string): ASTNode[] {
    const nodes: ASTNode[] = [];
    const objectRegex = /(\w+)\s+(\w+)\s*(?:@\s*\(([^)]*)\))?\s*{([^}]*)}/g;

    let match;
    let line = 1;

    while ((match = objectRegex.exec(content)) !== null) {
      const [, type, name, position, body] = match;
      line = content.slice(0, match.index).split('\n').length;

      nodes.push({
        type,
        name,
        line,
        position: position ? this.parsePosition(position) : undefined,
        properties: this.parseProperties(body),
      });
    }

    return nodes;
  }

  private parsePosition(posStr: string): [number, number, number] {
    const parts = posStr.split(',').map((s) => parseFloat(s.trim()));
    return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
  }

  private parseProperties(body: string): Record<string, unknown> {
    const props: Record<string, unknown> = {};
    const propRegex = /(\w+)\s*[:=]\s*(.+?)(?:;|$)/g;

    let match;
    while ((match = propRegex.exec(body)) !== null) {
      const [, key, value] = match;
      props[key] = this.parseValue(value.trim());
    }

    return props;
  }

  private parseValue(value: string): unknown {
    // Try JSON parse
    try {
      return JSON.parse(value);
    } catch {
      // Return as string
      return value;
    }
  }

  private log(message: string): void {
    this.outputChannel.appendLine(`[Merge] ${message}`);
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.outputChannel.dispose();
  }
}

/**
 * Git hooks for HoloScript validation
 */
export class HoloScriptGitHooks {
  private outputChannel: vscode.OutputChannel;

  constructor() {
    this.outputChannel = vscode.window.createOutputChannel('HoloScript Hooks');
  }

  /**
   * Pre-commit hook - validate and format HoloScript files
   */
  async preCommit(files: string[]): Promise<HookResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const modifiedFiles: string[] = [];

    for (const file of files) {
      if (!file.endsWith('.holo') && !file.endsWith('.hs')) {
        continue;
      }

      // Validate
      const validationErrors = await this.validateFile(file);
      if (validationErrors.length > 0) {
        errors.push(...validationErrors.map((e) => `${file}: ${e}`));
      }

      // Format
      const formatted = await this.formatFile(file);
      if (formatted) {
        modifiedFiles.push(file);
        warnings.push(`${file}: Formatted`);
      }
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
      modifiedFiles,
    };
  }

  /**
   * Pre-merge hook - check for potential conflicts
   */
  async preMerge(_baseRef: string, _oursRef: string, _theirsRef: string): Promise<HookResult> {
    // Placeholder for merge checking
    return {
      passed: true,
      errors: [],
      warnings: [],
      modifiedFiles: [],
    };
  }

  /**
   * Post-merge hook - validate merged files
   */
  async postMerge(files: string[]): Promise<HookResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const file of files) {
      if (!file.endsWith('.holo') && !file.endsWith('.hs')) {
        continue;
      }

      // Check for conflict markers
      const hasConflicts = await this.hasConflictMarkers(file);
      if (hasConflicts) {
        errors.push(`${file}: Contains unresolved conflict markers`);
      }

      // Validate
      const validationErrors = await this.validateFile(file);
      errors.push(...validationErrors.map((e) => `${file}: ${e}`));
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
      modifiedFiles: [],
    };
  }

  /**
   * Validate a HoloScript file
   */
  private async validateFile(_filePath: string): Promise<string[]> {
    // Placeholder - would use actual validator
    return [];
  }

  /**
   * Format a HoloScript file
   */
  private async formatFile(_filePath: string): Promise<boolean> {
    // Placeholder - would use actual formatter
    return false;
  }

  /**
   * Check for conflict markers in file
   */
  private async hasConflictMarkers(filePath: string): Promise<boolean> {
    try {
      const uri = vscode.Uri.file(filePath);
      const bytes = await vscode.workspace.fs.readFile(uri);
      const content = Buffer.from(bytes).toString('utf-8');

      return (
        content.includes('<<<<<<<') || content.includes('=======') || content.includes('>>>>>>>')
      );
    } catch {
      return false;
    }
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.outputChannel.dispose();
  }
}

/**
 * Create merge conflict resolution UI
 */
export class MergeConflictResolver {
  private panel?: vscode.WebviewPanel;

  constructor(private readonly extensionUri: vscode.Uri) {}

  /**
   * Show merge conflict resolution UI
   */
  showConflicts(conflicts: MergeConflict[], filePath: string): void {
    this.panel = vscode.window.createWebviewPanel(
      'holoscriptMergeConflicts',
      `Resolve Conflicts: ${filePath}`,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    this.panel.webview.html = this.getConflictHTML(conflicts, filePath);

    this.panel.webview.onDidReceiveMessage((message) => {
      switch (message.command) {
        case 'resolveConflict':
          this.handleResolve(message.conflictId, message.choice);
          break;
        case 'resolveAll':
          this.handleResolveAll(message.choice);
          break;
        case 'apply':
          this.handleApply();
          break;
      }
    });
  }

  private handleResolve(conflictId: string, choice: 'ours' | 'theirs' | 'both'): void {
    // Would update internal state
    this.panel?.webview.postMessage({
      command: 'conflictResolved',
      conflictId,
      choice,
    });
  }

  private handleResolveAll(choice: 'ours' | 'theirs'): void {
    // Would resolve all conflicts
    this.panel?.webview.postMessage({
      command: 'allResolved',
      choice,
    });
  }

  private handleApply(): void {
    // Would apply resolutions
    this.panel?.dispose();
    vscode.window.showInformationMessage('Merge conflicts resolved');
  }

  private getConflictHTML(conflicts: MergeConflict[], filePath: string): string {
    return `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: var(--vscode-font-family);
      padding: 20px;
      background: var(--vscode-editor-background);
      color: var(--vscode-foreground);
    }
    h1 { font-size: 18px; margin-bottom: 16px; }
    .conflict {
      background: var(--vscode-panel-background);
      border-radius: 8px;
      margin-bottom: 16px;
      overflow: hidden;
    }
    .conflict-header {
      padding: 12px 16px;
      background: var(--vscode-sideBarSectionHeader-background);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .conflict-type {
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 3px;
      background: var(--vscode-badge-background);
    }
    .versions {
      display: flex;
    }
    .version {
      flex: 1;
      padding: 12px 16px;
      border-right: 1px solid var(--vscode-panel-border);
    }
    .version:last-child { border-right: none; }
    .version h3 {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 8px;
    }
    .version pre {
      font-family: var(--vscode-editor-font-family);
      font-size: 12px;
      white-space: pre-wrap;
      margin: 0;
    }
    .version.ours h3 { color: #4CAF50; }
    .version.theirs h3 { color: #2196F3; }
    .actions {
      padding: 12px 16px;
      background: var(--vscode-sideBar-background);
      display: flex;
      gap: 8px;
    }
    button {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    .btn-ours { background: #4CAF50; color: white; }
    .btn-theirs { background: #2196F3; color: white; }
    .btn-both { background: #FF9800; color: white; }
    .btn-apply {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      margin-top: 16px;
      padding: 10px 20px;
    }
    .resolved {
      opacity: 0.5;
    }
    .resolved::after {
      content: '✓';
      margin-left: 8px;
    }
  </style>
</head>
<body>
  <h1>Merge Conflicts: ${filePath}</h1>
  <p>${conflicts.length} conflict(s) to resolve</p>
  
  ${conflicts
    .map(
      (c) => `
    <div class="conflict" data-id="${c.id}">
      <div class="conflict-header">
        <span>${c.path}</span>
        <span class="conflict-type">${c.type}</span>
      </div>
      <div class="versions">
        <div class="version ours">
          <h3>Ours</h3>
          <pre>${this.formatValue(c.ours)}</pre>
        </div>
        <div class="version theirs">
          <h3>Theirs</h3>
          <pre>${this.formatValue(c.theirs)}</pre>
        </div>
      </div>
      <div class="actions">
        <button class="btn-ours" onclick="resolve('${c.id}', 'ours')">Use Ours</button>
        <button class="btn-theirs" onclick="resolve('${c.id}', 'theirs')">Use Theirs</button>
        <button class="btn-both" onclick="resolve('${c.id}', 'both')">Keep Both</button>
      </div>
    </div>
  `
    )
    .join('')}

  <button class="btn-apply" onclick="apply()">Apply Resolutions</button>

  <script>
    const vscode = acquireVsCodeApi();
    
    function resolve(id, choice) {
      vscode.postMessage({ command: 'resolveConflict', conflictId: id, choice });
    }
    
    function apply() {
      vscode.postMessage({ command: 'apply' });
    }
    
    window.addEventListener('message', event => {
      const msg = event.data;
      if (msg.command === 'conflictResolved') {
        document.querySelector('[data-id="' + msg.conflictId + '"]').classList.add('resolved');
      }
    });
  </script>
</body>
</html>`;
  }

  private formatValue(value: unknown): string {
    if (value === undefined) return '(deleted)';
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  }

  dispose(): void {
    this.panel?.dispose();
  }
}
