/**
 * @fileoverview Git-aware semantic diff for HoloScript files
 * @module git/SemanticGit
 */

import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import {
  SceneNode,
  SceneDiff,
  PropertyChange,
  HoloScriptGitStatus,
  GitIntegrationConfig,
  DEFAULT_GIT_CONFIG,
  DiffVisualization,
  DiffHighlight,
  DIFF_COLORS,
} from './GitTypes';

const execAsync = promisify(exec);

// Import from core package - will use dynamic import in real usage
// import { SemanticDiffEngine, semanticDiff } from '@holoscript/core';

/**
 * Interface matching the core SemanticDiffEngine result
 */
interface SemanticDiffResult {
  equivalent: boolean;
  changeCount: number;
  changes: DiffChange[];
  summary: Record<string, number>;
}

interface DiffChange {
  type: 'added' | 'removed' | 'modified' | 'renamed' | 'moved' | 'unchanged';
  path: string;
  description: string;
  oldValue?: unknown;
  newValue?: unknown;
  oldLine?: number;
  newLine?: number;
  oldName?: string;
  newName?: string;
}

interface ASTNode {
  type: string;
  name?: string;
  line?: number;
  children?: ASTNode[];
  [key: string]: unknown;
}

/**
 * SemanticGit - Git integration with semantic diff awareness for HoloScript
 * 
 * Provides scene-aware diff, merge, and version control utilities
 * that understand HoloScript structure rather than raw text.
 */
export class SemanticGit {
  private config: GitIntegrationConfig;
  private workspaceRoot: string;
  private outputChannel: vscode.OutputChannel;
  private statusBarItem: vscode.StatusBarItem;
  private diffCache: Map<string, SemanticDiffResult> = new Map();

  constructor(
    workspaceRoot: string,
    config: Partial<GitIntegrationConfig> = {}
  ) {
    this.config = { ...DEFAULT_GIT_CONFIG, ...config };
    this.workspaceRoot = workspaceRoot;
    this.outputChannel = vscode.window.createOutputChannel('HoloScript Git');
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
  }

  /**
   * Initialize git integration
   */
  async initialize(): Promise<void> {
    try {
      // Check if git is available
      await this.execGit('--version');
      
      // Check if we're in a git repo
      await this.execGit('rev-parse', '--git-dir');
      
      this.log('Git integration initialized');
    } catch (error) {
      this.log(`Git not available or not in a git repository: ${error}`);
      throw new Error('Not a git repository');
    }
  }

  /**
   * Get the semantic diff between two versions of a HoloScript file
   */
  async getSemanticDiff(
    filePath: string,
    revision1: string = 'HEAD',
    revision2?: string
  ): Promise<SceneDiff> {
    const content1 = await this.getFileAtRevision(filePath, revision1);
    const content2 = revision2
      ? await this.getFileAtRevision(filePath, revision2)
      : await this.getCurrentContent(filePath);

    const ast1 = await this.parseHoloScript(content1);
    const ast2 = await this.parseHoloScript(content2);

    const diff = await this.diffASTs(ast1, ast2);
    
    return this.convertToSceneDiff(diff, ast1, ast2);
  }

  /**
   * Get diff between working copy and staged version
   */
  async getStagedDiff(filePath: string): Promise<SceneDiff> {
    return this.getSemanticDiff(filePath, ':0');
  }

  /**
   * Get diff between working copy and HEAD
   */
  async getUnstagedDiff(filePath: string): Promise<SceneDiff> {
    return this.getSemanticDiff(filePath, 'HEAD');
  }

  /**
   * Get visual diff representation for preview
   */
  async getVisualDiff(
    filePath: string,
    revision: string = 'HEAD'
  ): Promise<DiffVisualization> {
    const sceneDiff = await this.getSemanticDiff(filePath, revision);
    
    const beforeScene = await this.getSceneNodes(filePath, revision);
    const afterScene = await this.getSceneNodes(filePath);
    
    const highlights = this.createHighlights(sceneDiff);
    const summary = this.formatSummary(sceneDiff);
    const changeList = this.createChangeList(sceneDiff);

    return {
      beforeScene,
      afterScene,
      highlights,
      summary,
      changeList,
    };
  }

  /**
   * Get HoloScript file status
   */
  async getFileStatus(filePath: string): Promise<HoloScriptGitStatus> {
    const relativePath = this.getRelativePath(filePath);
    
    try {
      const statusOutput = await this.execGit('status', '--porcelain', '--', relativePath);
      const status = this.parseGitStatus(statusOutput, relativePath);
      
      if (status.status === 'modified' && this.config.enableSemanticDiff) {
        const diff = await this.getUnstagedDiff(filePath);
        status.diffSummary = {
          added: diff.added.length,
          removed: diff.removed.length,
          modified: diff.modified.length,
          moved: diff.moved.length,
        };
      }

      return status;
    } catch (error) {
      return {
        filePath,
        status: 'untracked',
        staged: false,
        hasConflicts: false,
      };
    }
  }

  /**
   * Get status of all HoloScript files in the repo
   */
  async getAllHoloScriptStatus(): Promise<HoloScriptGitStatus[]> {
    try {
      const status = await this.execGit('status', '--porcelain');
      const lines = status.split('\n').filter(Boolean);
      const results: HoloScriptGitStatus[] = [];

      for (const line of lines) {
        const filePath = line.slice(3).trim();
        if (filePath.endsWith('.holo') || filePath.endsWith('.hs')) {
          const fullPath = this.getAbsolutePath(filePath);
          const fileStatus = await this.getFileStatus(fullPath);
          results.push(fileStatus);
        }
      }

      return results;
    } catch (error) {
      this.log(`Error getting status: ${error}`);
      return [];
    }
  }

  /**
   * Stage file after semantic validation
   */
  async stageFile(filePath: string, validate: boolean = true): Promise<void> {
    const relativePath = this.getRelativePath(filePath);

    if (validate && this.config.validateOnCommit) {
      const errors = await this.validateHoloScript(filePath);
      if (errors.length > 0) {
        throw new Error(`Validation failed:\n${errors.join('\n')}`);
      }
    }

    if (this.config.formatOnCommit) {
      await this.formatHoloScript(filePath);
    }

    await this.execGit('add', '--', relativePath);
    this.log(`Staged: ${relativePath}`);
  }

  /**
   * Create a commit with semantic message
   */
  async commit(
    message: string,
    files?: string[],
    generateSemanticMessage: boolean = false
  ): Promise<string> {
    if (files) {
      for (const file of files) {
        await this.stageFile(file);
      }
    }

    let finalMessage = message;
    if (generateSemanticMessage) {
      const semanticPart = await this.generateSemanticCommitMessage();
      finalMessage = `${message}\n\n${semanticPart}`;
    }

    const result = await this.execGit('commit', '-m', finalMessage);
    const sha = await this.execGit('rev-parse', 'HEAD');
    
    this.log(`Committed: ${sha.trim()}`);
    return sha.trim();
  }

  /**
   * Generate semantic commit message from staged changes
   */
  async generateSemanticCommitMessage(): Promise<string> {
    const stagedFiles = await this.getStagedHoloScriptFiles();
    const parts: string[] = [];

    for (const file of stagedFiles) {
      const diff = await this.getStagedDiff(file);
      const relativePath = this.getRelativePath(file);
      
      const changes: string[] = [];
      if (diff.added.length > 0) {
        changes.push(`+${diff.added.length} object${diff.added.length !== 1 ? 's' : ''}`);
      }
      if (diff.removed.length > 0) {
        changes.push(`-${diff.removed.length} object${diff.removed.length !== 1 ? 's' : ''}`);
      }
      if (diff.modified.length > 0) {
        changes.push(`~${diff.modified.length} modified`);
      }
      if (diff.moved.length > 0) {
        changes.push(`→${diff.moved.length} moved`);
      }
      if (diff.renamed.length > 0) {
        changes.push(`⟳${diff.renamed.length} renamed`);
      }

      if (changes.length > 0) {
        parts.push(`${relativePath}: ${changes.join(', ')}`);
      }
    }

    return parts.join('\n');
  }

  /**
   * Show diff in VS Code editor
   */
  async showDiff(
    filePath: string,
    revision: string = 'HEAD',
    mode: 'unified' | 'split' | '3d-preview' = 'split'
  ): Promise<void> {
    const relativePath = this.getRelativePath(filePath);
    const uri1 = this.createGitUri(filePath, revision);
    const uri2 = vscode.Uri.file(filePath);

    const title = `${relativePath} (${revision}) ↔ Working Tree`;

    if (mode === '3d-preview') {
      await this.show3DDiffPreview(filePath, revision);
    } else {
      await vscode.commands.executeCommand('vscode.diff', uri1, uri2, title);
    }
  }

  /**
   * Show 3D diff preview in webview
   */
  async show3DDiffPreview(filePath: string, revision: string = 'HEAD'): Promise<void> {
    const visual = await this.getVisualDiff(filePath, revision);
    
    const panel = vscode.window.createWebviewPanel(
      'holoscript3DDiff',
      `3D Diff: ${this.getRelativePath(filePath)}`,
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    panel.webview.html = this.create3DDiffHTML(visual);
  }

  /**
   * Blame a specific line
   */
  async blameLine(filePath: string, line: number): Promise<{
    commit: string;
    author: string;
    date: string;
    message: string;
  } | null> {
    try {
      const relativePath = this.getRelativePath(filePath);
      const output = await this.execGit(
        'blame',
        '-L', `${line},${line}`,
        '--line-porcelain',
        '--',
        relativePath
      );

      const lines = output.split('\n');
      const commit = lines[0]?.split(' ')[0] || '';
      
      let author = '';
      let date = '';
      
      for (const line of lines) {
        if (line.startsWith('author ')) {
          author = line.slice(7);
        } else if (line.startsWith('author-time ')) {
          date = new Date(parseInt(line.slice(12)) * 1000).toISOString();
        }
      }

      const message = await this.getCommitMessage(commit);

      return { commit, author, date, message };
    } catch {
      return null;
    }
  }

  /**
   * Get file history
   */
  async getFileHistory(filePath: string, limit: number = 50): Promise<{
    sha: string;
    message: string;
    author: string;
    date: string;
  }[]> {
    const relativePath = this.getRelativePath(filePath);
    const output = await this.execGit(
      'log',
      `--max-count=${limit}`,
      '--format=%H|%s|%an|%aI',
      '--',
      relativePath
    );

    return output
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [sha, message, author, date] = line.split('|');
        return { sha, message, author, date };
      });
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.outputChannel.dispose();
    this.statusBarItem.dispose();
    this.diffCache.clear();
  }

  // =========================================================================
  // PRIVATE HELPERS
  // =========================================================================

  private async execGit(...args: string[]): Promise<string> {
    const { stdout } = await execAsync(`git ${args.join(' ')}`, {
      cwd: this.workspaceRoot,
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });
    return stdout;
  }

  private async getFileAtRevision(filePath: string, revision: string): Promise<string> {
    const relativePath = this.getRelativePath(filePath);
    return this.execGit('show', `${revision}:${relativePath}`);
  }

  private async getCurrentContent(filePath: string): Promise<string> {
    const doc = vscode.workspace.textDocuments.find(
      (d) => d.uri.fsPath === filePath
    );
    if (doc) {
      return doc.getText();
    }
    
    const uri = vscode.Uri.file(filePath);
    const bytes = await vscode.workspace.fs.readFile(uri);
    return Buffer.from(bytes).toString('utf-8');
  }

  private async parseHoloScript(content: string): Promise<ASTNode> {
    // Use HoloScript parser from core
    // For now, return a simple parsed structure
    // In production, import from @holoscript/core
    try {
      // Placeholder - would use actual parser
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
    // Simple extraction of objects from HoloScript
    // Real implementation would use full parser
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
      props[key] = value.trim();
    }
    
    return props;
  }

  private async diffASTs(ast1: ASTNode, ast2: ASTNode): Promise<SemanticDiffResult> {
    // Use core SemanticDiff engine
    // For now, implement basic diff logic
    const changes: DiffChange[] = [];
    
    const nodes1 = ast1.children || [];
    const nodes2 = ast2.children || [];
    
    const names1 = new Set(nodes1.map((n) => n.name));
    const names2 = new Set(nodes2.map((n) => n.name));
    
    // Added
    for (const node of nodes2) {
      if (node.name && !names1.has(node.name)) {
        changes.push({
          type: 'added',
          path: node.name,
          description: `Added ${node.type} "${node.name}"`,
          newValue: node,
          newLine: node.line,
        });
      }
    }
    
    // Removed
    for (const node of nodes1) {
      if (node.name && !names2.has(node.name)) {
        changes.push({
          type: 'removed',
          path: node.name,
          description: `Removed ${node.type} "${node.name}"`,
          oldValue: node,
          oldLine: node.line,
        });
      }
    }
    
    // Modified
    for (const node1 of nodes1) {
      if (!node1.name) continue;
      const node2 = nodes2.find((n) => n.name === node1.name);
      if (node2) {
        const propChanges = this.compareNodeProperties(node1, node2);
        if (propChanges.length > 0) {
          changes.push({
            type: 'modified',
            path: node1.name,
            description: `Modified ${node1.type} "${node1.name}"`,
            oldValue: node1,
            newValue: node2,
            oldLine: node1.line,
            newLine: node2.line,
          });
        }
      }
    }
    
    return {
      equivalent: changes.length === 0,
      changeCount: changes.length,
      changes,
      summary: this.summarizeChanges(changes),
    };
  }

  private compareNodeProperties(node1: ASTNode, node2: ASTNode): PropertyChange[] {
    const changes: PropertyChange[] = [];
    const props1 = node1.properties as Record<string, unknown> || {};
    const props2 = node2.properties as Record<string, unknown> || {};
    
    const allKeys = new Set([...Object.keys(props1), ...Object.keys(props2)]);
    
    for (const key of allKeys) {
      const val1 = props1[key];
      const val2 = props2[key];
      
      if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        changes.push({
          path: key,
          oldValue: val1,
          newValue: val2,
          significant: true,
        });
      }
    }
    
    // Check position
    if (JSON.stringify(node1.position) !== JSON.stringify(node2.position)) {
      changes.push({
        path: 'position',
        oldValue: node1.position,
        newValue: node2.position,
        significant: true,
      });
    }
    
    return changes;
  }

  private summarizeChanges(changes: DiffChange[]): Record<string, number> {
    const summary: Record<string, number> = {
      added: 0,
      removed: 0,
      modified: 0,
      renamed: 0,
      moved: 0,
      unchanged: 0,
    };
    
    for (const change of changes) {
      summary[change.type]++;
    }
    
    return summary;
  }

  private convertToSceneDiff(
    result: SemanticDiffResult,
    ast1: ASTNode,
    ast2: ASTNode
  ): SceneDiff {
    const added: SceneNode[] = [];
    const removed: SceneNode[] = [];
    const modified: SceneDiff['modified'] = [];
    const moved: SceneDiff['moved'] = [];
    const renamed: SceneDiff['renamed'] = [];

    for (const change of result.changes) {
      switch (change.type) {
        case 'added':
          added.push(this.astToSceneNode(change.newValue as ASTNode));
          break;
        case 'removed':
          removed.push(this.astToSceneNode(change.oldValue as ASTNode));
          break;
        case 'modified':
          modified.push({
            before: this.astToSceneNode(change.oldValue as ASTNode),
            after: this.astToSceneNode(change.newValue as ASTNode),
            changes: this.compareNodeProperties(
              change.oldValue as ASTNode,
              change.newValue as ASTNode
            ),
          });
          break;
        case 'moved':
          moved.push({
            node: this.astToSceneNode(change.newValue as ASTNode),
            from: this.extractTransform(change.oldValue as ASTNode),
            to: this.extractTransform(change.newValue as ASTNode),
            parentChanged: false,
          });
          break;
        case 'renamed':
          renamed.push({
            oldId: change.oldName || '',
            newId: change.newName || '',
            node: this.astToSceneNode(change.newValue as ASTNode),
          });
          break;
      }
    }

    return {
      added,
      removed,
      modified,
      moved,
      renamed,
      totalChanges: result.changeCount,
      equivalent: result.equivalent,
    };
  }

  private astToSceneNode(ast: ASTNode): SceneNode {
    return {
      type: ast.type,
      id: ast.name || '',
      name: ast.name,
      position: ast.position as [number, number, number] | undefined,
      properties: ast.properties as Record<string, unknown> | undefined,
      sourceRange: ast.line
        ? { startLine: ast.line, endLine: ast.line, startColumn: 0, endColumn: 0 }
        : undefined,
    };
  }

  private extractTransform(ast: ASTNode): { position: [number, number, number]; rotation: [number, number, number]; scale: [number, number, number] } {
    const pos = (ast.position as [number, number, number]) || [0, 0, 0];
    return {
      position: pos,
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    };
  }

  private async getSceneNodes(filePath: string, revision?: string): Promise<SceneNode[]> {
    const content = revision
      ? await this.getFileAtRevision(filePath, revision)
      : await this.getCurrentContent(filePath);
    
    const ast = await this.parseHoloScript(content);
    return (ast.children || []).map((n) => this.astToSceneNode(n));
  }

  private createHighlights(diff: SceneDiff): DiffHighlight[] {
    const highlights: DiffHighlight[] = [];

    for (const node of diff.added) {
      highlights.push({
        type: 'added',
        nodeId: node.id,
        color: DIFF_COLORS.added,
        label: 'Added',
        tooltip: `Added: ${node.type} "${node.name}"`,
      });
    }

    for (const node of diff.removed) {
      highlights.push({
        type: 'removed',
        nodeId: node.id,
        color: DIFF_COLORS.removed,
        label: 'Removed',
        tooltip: `Removed: ${node.type} "${node.name}"`,
      });
    }

    for (const mod of diff.modified) {
      highlights.push({
        type: 'modified',
        nodeId: mod.after.id,
        color: DIFF_COLORS.modified,
        label: 'Modified',
        tooltip: `Modified: ${mod.changes.length} property changes`,
      });
    }

    for (const move of diff.moved) {
      highlights.push({
        type: 'moved',
        nodeId: move.node.id,
        color: DIFF_COLORS.moved,
        label: 'Moved',
        tooltip: `Moved from (${move.from.position.join(', ')}) to (${move.to.position.join(', ')})`,
      });
    }

    return highlights;
  }

  private formatSummary(diff: SceneDiff): string {
    const parts: string[] = [];
    
    if (diff.added.length > 0) parts.push(`+${diff.added.length} added`);
    if (diff.removed.length > 0) parts.push(`-${diff.removed.length} removed`);
    if (diff.modified.length > 0) parts.push(`~${diff.modified.length} modified`);
    if (diff.moved.length > 0) parts.push(`→${diff.moved.length} moved`);
    if (diff.renamed.length > 0) parts.push(`⟳${diff.renamed.length} renamed`);
    
    return parts.join(', ') || 'No changes';
  }

  private createChangeList(diff: SceneDiff): DiffVisualization['changeList'] {
    const list: DiffVisualization['changeList'] = [];

    for (const node of diff.added) {
      list.push({
        type: 'added',
        description: `Added ${node.type} "${node.name}"`,
        nodeId: node.id,
        sourceLine: node.sourceRange?.startLine,
      });
    }

    for (const node of diff.removed) {
      list.push({
        type: 'removed',
        description: `Removed ${node.type} "${node.name}"`,
        nodeId: node.id,
        sourceLine: node.sourceRange?.startLine,
      });
    }

    for (const mod of diff.modified) {
      list.push({
        type: 'modified',
        description: `Modified ${mod.after.type} "${mod.after.name}": ${mod.changes.map((c) => c.path).join(', ')}`,
        nodeId: mod.after.id,
        sourceLine: mod.after.sourceRange?.startLine,
      });
    }

    return list;
  }

  private parseGitStatus(output: string, relativePath: string): HoloScriptGitStatus {
    const line = output.split('\n').find((l) => l.includes(relativePath));
    
    if (!line) {
      return {
        filePath: relativePath,
        status: 'untracked',
        staged: false,
        hasConflicts: false,
      };
    }

    const indexStatus = line[0];
    const workingStatus = line[1];
    
    let status: HoloScriptGitStatus['status'] = 'untracked';
    let staged = false;
    let hasConflicts = false;

    if (indexStatus === 'U' || workingStatus === 'U') {
      status = 'conflict';
      hasConflicts = true;
    } else if (indexStatus === 'A' || workingStatus === 'A') {
      status = 'added';
      staged = indexStatus === 'A';
    } else if (indexStatus === 'D' || workingStatus === 'D') {
      status = 'deleted';
      staged = indexStatus === 'D';
    } else if (indexStatus === 'R' || workingStatus === 'R') {
      status = 'renamed';
      staged = indexStatus === 'R';
    } else if (indexStatus === 'M' || workingStatus === 'M') {
      status = 'modified';
      staged = indexStatus === 'M';
    } else if (indexStatus === '?' && workingStatus === '?') {
      status = 'untracked';
    }

    return {
      filePath: relativePath,
      status,
      staged,
      hasConflicts,
    };
  }

  private async getStagedHoloScriptFiles(): Promise<string[]> {
    const output = await this.execGit('diff', '--cached', '--name-only');
    return output
      .split('\n')
      .filter((f) => f.endsWith('.holo') || f.endsWith('.hs'))
      .map((f) => this.getAbsolutePath(f));
  }

  private async validateHoloScript(_filePath: string): Promise<string[]> {
    // Placeholder - would use actual validator
    return [];
  }

  private async formatHoloScript(_filePath: string): Promise<void> {
    // Placeholder - would use actual formatter
  }

  private async getCommitMessage(sha: string): Promise<string> {
    return this.execGit('log', '-1', '--format=%s', sha);
  }

  private createGitUri(filePath: string, revision: string): vscode.Uri {
    const relativePath = this.getRelativePath(filePath);
    return vscode.Uri.parse(
      `git:${relativePath}?${encodeURIComponent(JSON.stringify({ ref: revision, path: relativePath }))}`
    );
  }

  private getRelativePath(filePath: string): string {
    if (filePath.startsWith(this.workspaceRoot)) {
      return filePath.slice(this.workspaceRoot.length + 1).replace(/\\/g, '/');
    }
    return filePath.replace(/\\/g, '/');
  }

  private getAbsolutePath(relativePath: string): string {
    const path = require('path');
    return path.join(this.workspaceRoot, relativePath);
  }

  private log(message: string): void {
    this.outputChannel.appendLine(`[HoloScript Git] ${message}`);
  }

  private create3DDiffHTML(visual: DiffVisualization): string {
    return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: system-ui; margin: 0; padding: 20px; background: #1e1e1e; color: #fff; }
    .container { display: flex; gap: 20px; }
    .panel { flex: 1; background: #2d2d2d; border-radius: 8px; padding: 16px; }
    h3 { margin-top: 0; color: #569cd6; }
    .summary { background: #3c3c3c; padding: 12px; border-radius: 4px; margin-bottom: 16px; }
    .change { padding: 8px; margin: 4px 0; border-radius: 4px; }
    .added { background: rgba(76, 175, 80, 0.2); border-left: 3px solid #4caf50; }
    .removed { background: rgba(244, 67, 54, 0.2); border-left: 3px solid #f44336; }
    .modified { background: rgba(255, 152, 0, 0.2); border-left: 3px solid #ff9800; }
    .moved { background: rgba(33, 150, 243, 0.2); border-left: 3px solid #2196f3; }
    .scene-preview { height: 300px; background: #1a1a1a; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
  </style>
</head>
<body>
  <div class="summary">
    <strong>Summary:</strong> ${visual.summary}
  </div>
  <div class="container">
    <div class="panel">
      <h3>Before (${visual.beforeScene.length} objects)</h3>
      <div class="scene-preview">3D Preview Placeholder</div>
    </div>
    <div class="panel">
      <h3>After (${visual.afterScene.length} objects)</h3>
      <div class="scene-preview">3D Preview Placeholder</div>
    </div>
  </div>
  <div class="panel" style="margin-top: 20px;">
    <h3>Changes</h3>
    ${visual.changeList
      .map(
        (c) => `<div class="change ${c.type}">
      <strong>${c.type.toUpperCase()}</strong> ${c.description}
      ${c.sourceLine ? `<em>(line ${c.sourceLine})</em>` : ''}
    </div>`
      )
      .join('')}
  </div>
</body>
</html>`;
  }
}
