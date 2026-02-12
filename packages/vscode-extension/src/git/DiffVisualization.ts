/**
 * @fileoverview 3D Diff Visualization Webview for HoloScript
 * @module git/DiffVisualization
 */

import * as vscode from 'vscode';
import { SceneNode, SceneDiff, DiffHighlight, DiffVisualization, DIFF_COLORS } from './GitTypes';

/**
 * Webview provider for 3D diff visualization
 */
export class DiffVisualizationProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'holoscript.diffVisualization';

  private _view?: vscode.WebviewView;
  private currentDiff?: DiffVisualization;

  constructor(private readonly extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    webviewView.webview.html = this.getInitialHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((message) => {
      switch (message.command) {
        case 'selectNode':
          this.handleNodeSelection(message.nodeId, message.side);
          break;
        case 'toggleHighlight':
          this.handleToggleHighlight(message.type);
          break;
        case 'syncCamera':
          this.handleCameraSync(message.position, message.target);
          break;
      }
    });
  }

  /**
   * Show diff visualization for given data
   */
  public showDiff(diff: DiffVisualization): void {
    this.currentDiff = diff;

    if (this._view) {
      this._view.webview.postMessage({
        command: 'showDiff',
        diff: this.serializeDiff(diff),
      });
    }
  }

  /**
   * Update highlights
   */
  public updateHighlights(highlights: DiffHighlight[]): void {
    if (this._view) {
      this._view.webview.postMessage({
        command: 'updateHighlights',
        highlights,
      });
    }
  }

  /**
   * Focus on a specific node
   */
  public focusNode(nodeId: string, side: 'before' | 'after'): void {
    if (this._view) {
      this._view.webview.postMessage({
        command: 'focusNode',
        nodeId,
        side,
      });
    }
  }

  /**
   * Clear the visualization
   */
  public clear(): void {
    this.currentDiff = undefined;
    if (this._view) {
      this._view.webview.postMessage({ command: 'clear' });
    }
  }

  private handleNodeSelection(nodeId: string, side: 'before' | 'after'): void {
    if (!this.currentDiff) return;

    // Find corresponding change
    const change = this.findChangeForNode(nodeId);
    if (change) {
      vscode.commands.executeCommand('holoscript.goToChange', change);
    }
  }

  private handleToggleHighlight(type: string): void {
    if (this._view) {
      this._view.webview.postMessage({
        command: 'toggleHighlightType',
        type,
      });
    }
  }

  private handleCameraSync(
    _position: [number, number, number],
    _target: [number, number, number]
  ): void {
    // Sync camera between before/after views
  }

  private findChangeForNode(nodeId: string): DiffVisualization['changeList'][0] | undefined {
    return this.currentDiff?.changeList.find((c) => c.nodeId === nodeId);
  }

  private serializeDiff(diff: DiffVisualization): object {
    return {
      beforeScene: diff.beforeScene,
      afterScene: diff.afterScene,
      highlights: diff.highlights,
      summary: diff.summary,
      changeList: diff.changeList,
    };
  }

  private getInitialHtml(webview: vscode.Webview): string {
    const nonce = this.getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <title>HoloScript Diff</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: var(--vscode-font-family);
      background: var(--vscode-editor-background);
      color: var(--vscode-foreground);
      padding: 12px;
      height: 100vh;
      overflow: hidden;
    }

    .container {
      display: flex;
      flex-direction: column;
      height: 100%;
      gap: 12px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: var(--vscode-sideBar-background);
      border-radius: 4px;
    }

    .summary {
      font-size: 13px;
    }

    .filters {
      display: flex;
      gap: 8px;
    }

    .filter-btn {
      padding: 4px 8px;
      font-size: 11px;
      border: none;
      border-radius: 3px;
      cursor: pointer;
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }

    .filter-btn.active {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }

    .filter-btn.added { border-left: 3px solid ${DIFF_COLORS.added}; }
    .filter-btn.removed { border-left: 3px solid ${DIFF_COLORS.removed}; }
    .filter-btn.modified { border-left: 3px solid ${DIFF_COLORS.modified}; }
    .filter-btn.moved { border-left: 3px solid ${DIFF_COLORS.moved}; }

    .preview-container {
      display: flex;
      flex: 1;
      gap: 12px;
      min-height: 0;
    }

    .preview-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: var(--vscode-panel-background);
      border-radius: 4px;
      overflow: hidden;
    }

    .preview-header {
      padding: 8px 12px;
      background: var(--vscode-tab-activeBackground);
      border-bottom: 1px solid var(--vscode-panel-border);
      font-weight: 500;
      font-size: 12px;
    }

    .preview-header.before { color: ${DIFF_COLORS.removed}; }
    .preview-header.after { color: ${DIFF_COLORS.added}; }

    .preview-canvas {
      flex: 1;
      position: relative;
      background: var(--vscode-editor-background);
      min-height: 200px;
    }

    .canvas-placeholder {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      color: var(--vscode-descriptionForeground);
    }

    .canvas-placeholder svg {
      width: 48px;
      height: 48px;
      margin-bottom: 8px;
      opacity: 0.5;
    }

    .change-list {
      max-height: 35%;
      overflow-y: auto;
      background: var(--vscode-sideBar-background);
      border-radius: 4px;
    }

    .change-list-header {
      position: sticky;
      top: 0;
      padding: 8px 12px;
      background: var(--vscode-sideBarSectionHeader-background);
      font-weight: 500;
      font-size: 12px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }

    .change-item {
      padding: 8px 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 1px solid var(--vscode-panel-border);
      font-size: 12px;
    }

    .change-item:hover {
      background: var(--vscode-list-hoverBackground);
    }

    .change-item:last-child {
      border-bottom: none;
    }

    .change-badge {
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .change-badge.added { background: ${DIFF_COLORS.added}20; color: ${DIFF_COLORS.added}; }
    .change-badge.removed { background: ${DIFF_COLORS.removed}20; color: ${DIFF_COLORS.removed}; }
    .change-badge.modified { background: ${DIFF_COLORS.modified}20; color: ${DIFF_COLORS.modified}; }
    .change-badge.moved { background: ${DIFF_COLORS.moved}20; color: ${DIFF_COLORS.moved}; }
    .change-badge.renamed { background: ${DIFF_COLORS.renamed}20; color: ${DIFF_COLORS.renamed}; }

    .change-desc {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .change-line {
      color: var(--vscode-descriptionForeground);
      font-size: 11px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--vscode-descriptionForeground);
    }

    .empty-state svg {
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      opacity: 0.4;
    }

    /* Scene graph visualization */
    .scene-node {
      position: absolute;
      width: 40px;
      height: 40px;
      border-radius: 4px;
      background: var(--vscode-badge-background);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .scene-node:hover {
      transform: scale(1.1);
      box-shadow: 0 0 12px rgba(255,255,255,0.2);
    }

    .scene-node.highlighted-added { box-shadow: 0 0 0 2px ${DIFF_COLORS.added}; }
    .scene-node.highlighted-removed { box-shadow: 0 0 0 2px ${DIFF_COLORS.removed}; }
    .scene-node.highlighted-modified { box-shadow: 0 0 0 2px ${DIFF_COLORS.modified}; }
    .scene-node.highlighted-moved { box-shadow: 0 0 0 2px ${DIFF_COLORS.moved}; }
  </style>
</head>
<body>
  <div class="container" id="container">
    <div class="empty-state" id="emptyState">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
      <p>Select a HoloScript file to view diff</p>
    </div>

    <div class="content" id="content" style="display: none;">
      <div class="header">
        <div class="summary" id="summary"></div>
        <div class="filters">
          <button class="filter-btn added active" data-type="added">Added</button>
          <button class="filter-btn removed active" data-type="removed">Removed</button>
          <button class="filter-btn modified active" data-type="modified">Modified</button>
          <button class="filter-btn moved active" data-type="moved">Moved</button>
        </div>
      </div>

      <div class="preview-container">
        <div class="preview-panel">
          <div class="preview-header before">Before (HEAD)</div>
          <div class="preview-canvas" id="beforeCanvas">
            <div class="canvas-placeholder">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 9h18"/>
                <path d="M9 21V9"/>
              </svg>
              <p>3D Preview</p>
            </div>
          </div>
        </div>

        <div class="preview-panel">
          <div class="preview-header after">After (Working)</div>
          <div class="preview-canvas" id="afterCanvas">
            <div class="canvas-placeholder">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 9h18"/>
                <path d="M9 21V9"/>
              </svg>
              <p>3D Preview</p>
            </div>
          </div>
        </div>
      </div>

      <div class="change-list" id="changeList">
        <div class="change-list-header">Changes</div>
      </div>
    </div>
  </div>

  <script nonce="${nonce}">
    (function() {
      const vscode = acquireVsCodeApi();
      
      let currentDiff = null;
      let activeFilters = new Set(['added', 'removed', 'modified', 'moved']);

      // Elements
      const emptyState = document.getElementById('emptyState');
      const content = document.getElementById('content');
      const summary = document.getElementById('summary');
      const beforeCanvas = document.getElementById('beforeCanvas');
      const afterCanvas = document.getElementById('afterCanvas');
      const changeList = document.getElementById('changeList');
      const filterBtns = document.querySelectorAll('.filter-btn');

      // Filter button handlers
      filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const type = btn.dataset.type;
          btn.classList.toggle('active');
          
          if (activeFilters.has(type)) {
            activeFilters.delete(type);
          } else {
            activeFilters.add(type);
          }
          
          vscode.postMessage({ command: 'toggleHighlight', type });
          updateChangeList();
        });
      });

      // Message handler
      window.addEventListener('message', event => {
        const message = event.data;
        
        switch (message.command) {
          case 'showDiff':
            showDiff(message.diff);
            break;
          case 'updateHighlights':
            updateHighlights(message.highlights);
            break;
          case 'focusNode':
            focusNode(message.nodeId, message.side);
            break;
          case 'clear':
            clear();
            break;
        }
      });

      function showDiff(diff) {
        currentDiff = diff;
        emptyState.style.display = 'none';
        content.style.display = 'flex';
        content.style.flexDirection = 'column';
        content.style.height = '100%';
        content.style.gap = '12px';
        
        summary.textContent = diff.summary;
        
        renderScene(beforeCanvas, diff.beforeScene, diff.highlights, 'before');
        renderScene(afterCanvas, diff.afterScene, diff.highlights, 'after');
        updateChangeList();
      }

      function renderScene(canvas, nodes, highlights, side) {
        // Clear existing nodes
        const placeholder = canvas.querySelector('.canvas-placeholder');
        const existingNodes = canvas.querySelectorAll('.scene-node');
        existingNodes.forEach(n => n.remove());

        if (nodes.length === 0) {
          if (placeholder) placeholder.style.display = '';
          return;
        }

        if (placeholder) placeholder.style.display = 'none';

        // Simple 2D layout based on position
        const canvasRect = canvas.getBoundingClientRect();
        const padding = 20;
        const w = canvasRect.width - padding * 2;
        const h = canvasRect.height - padding * 2;

        nodes.forEach((node, i) => {
          const elem = document.createElement('div');
          elem.className = 'scene-node';
          elem.textContent = node.type[0];
          elem.title = node.name || node.id;
          elem.dataset.nodeId = node.id;

          // Get highlight
          const highlight = highlights.find(h => h.nodeId === node.id);
          if (highlight) {
            elem.classList.add('highlighted-' + highlight.type);
          }

          // Position based on 3D coords or grid
          let x, y;
          if (node.position) {
            x = padding + (node.position[0] + 10) / 20 * w;
            y = padding + h - (node.position[2] + 10) / 20 * h;
          } else {
            const cols = Math.ceil(Math.sqrt(nodes.length));
            x = padding + (i % cols) * (w / cols) + 20;
            y = padding + Math.floor(i / cols) * 50 + 20;
          }

          elem.style.left = Math.max(padding, Math.min(w - 40, x)) + 'px';
          elem.style.top = Math.max(padding, Math.min(h - 40, y)) + 'px';

          elem.addEventListener('click', () => {
            vscode.postMessage({ 
              command: 'selectNode', 
              nodeId: node.id, 
              side 
            });
          });

          canvas.appendChild(elem);
        });
      }

      function updateChangeList() {
        // Keep header
        const header = changeList.querySelector('.change-list-header');
        changeList.innerHTML = '';
        changeList.appendChild(header);

        if (!currentDiff) return;

        const filteredChanges = currentDiff.changeList.filter(c => activeFilters.has(c.type));

        filteredChanges.forEach(change => {
          const item = document.createElement('div');
          item.className = 'change-item';
          item.innerHTML = \`
            <span class="change-badge \${change.type}">\${change.type}</span>
            <span class="change-desc">\${change.description}</span>
            \${change.sourceLine ? \`<span class="change-line">:\${change.sourceLine}</span>\` : ''}
          \`;

          item.addEventListener('click', () => {
            if (change.nodeId) {
              focusNode(change.nodeId, 'after');
            }
          });

          changeList.appendChild(item);
        });
      }

      function updateHighlights(highlights) {
        if (!currentDiff) return;
        currentDiff.highlights = highlights;
        renderScene(beforeCanvas, currentDiff.beforeScene, highlights, 'before');
        renderScene(afterCanvas, currentDiff.afterScene, highlights, 'after');
      }

      function focusNode(nodeId, side) {
        const canvas = side === 'before' ? beforeCanvas : afterCanvas;
        const node = canvas.querySelector(\`[data-node-id="\${nodeId}"]\`);
        
        if (node) {
          node.scrollIntoView({ behavior: 'smooth', block: 'center' });
          node.style.animation = 'pulse 0.5s ease-in-out';
          setTimeout(() => {
            node.style.animation = '';
          }, 500);
        }
      }

      function clear() {
        currentDiff = null;
        emptyState.style.display = '';
        content.style.display = 'none';
      }
    })();
  </script>
</body>
</html>`;
  }

  private getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}

/**
 * Creates inline diff decorations for the editor
 */
export class DiffDecorationProvider {
  private addedDecor: vscode.TextEditorDecorationType;
  private removedDecor: vscode.TextEditorDecorationType;
  private modifiedDecor: vscode.TextEditorDecorationType;
  private movedDecor: vscode.TextEditorDecorationType;

  constructor() {
    this.addedDecor = vscode.window.createTextEditorDecorationType({
      backgroundColor: 'rgba(76, 175, 80, 0.15)',
      isWholeLine: true,
      overviewRulerColor: DIFF_COLORS.added,
      overviewRulerLane: vscode.OverviewRulerLane.Left,
    });

    this.removedDecor = vscode.window.createTextEditorDecorationType({
      backgroundColor: 'rgba(244, 67, 54, 0.15)',
      isWholeLine: true,
      overviewRulerColor: DIFF_COLORS.removed,
      overviewRulerLane: vscode.OverviewRulerLane.Left,
    });

    this.modifiedDecor = vscode.window.createTextEditorDecorationType({
      backgroundColor: 'rgba(255, 152, 0, 0.15)',
      isWholeLine: true,
      overviewRulerColor: DIFF_COLORS.modified,
      overviewRulerLane: vscode.OverviewRulerLane.Left,
    });

    this.movedDecor = vscode.window.createTextEditorDecorationType({
      backgroundColor: 'rgba(33, 150, 243, 0.15)',
      isWholeLine: true,
      overviewRulerColor: DIFF_COLORS.moved,
      overviewRulerLane: vscode.OverviewRulerLane.Left,
    });
  }

  /**
   * Apply diff decorations to editor
   */
  applyDecorations(editor: vscode.TextEditor, diff: SceneDiff): void {
    const addedRanges: vscode.DecorationOptions[] = [];
    const removedRanges: vscode.DecorationOptions[] = [];
    const modifiedRanges: vscode.DecorationOptions[] = [];
    const movedRanges: vscode.DecorationOptions[] = [];

    for (const node of diff.added) {
      if (node.sourceRange) {
        addedRanges.push({
          range: new vscode.Range(
            node.sourceRange.startLine - 1,
            0,
            node.sourceRange.endLine - 1,
            Number.MAX_VALUE
          ),
          hoverMessage: `Added: ${node.type} "${node.name}"`,
        });
      }
    }

    for (const mod of diff.modified) {
      if (mod.after.sourceRange) {
        modifiedRanges.push({
          range: new vscode.Range(
            mod.after.sourceRange.startLine - 1,
            0,
            mod.after.sourceRange.endLine - 1,
            Number.MAX_VALUE
          ),
          hoverMessage: `Modified: ${mod.changes.map((c) => c.path).join(', ')}`,
        });
      }
    }

    for (const move of diff.moved) {
      if (move.node.sourceRange) {
        movedRanges.push({
          range: new vscode.Range(
            move.node.sourceRange.startLine - 1,
            0,
            move.node.sourceRange.endLine - 1,
            Number.MAX_VALUE
          ),
          hoverMessage: `Moved from (${move.from.position.join(', ')})`,
        });
      }
    }

    editor.setDecorations(this.addedDecor, addedRanges);
    editor.setDecorations(this.removedDecor, removedRanges);
    editor.setDecorations(this.modifiedDecor, modifiedRanges);
    editor.setDecorations(this.movedDecor, movedRanges);
  }

  /**
   * Clear all decorations
   */
  clearDecorations(editor: vscode.TextEditor): void {
    editor.setDecorations(this.addedDecor, []);
    editor.setDecorations(this.removedDecor, []);
    editor.setDecorations(this.modifiedDecor, []);
    editor.setDecorations(this.movedDecor, []);
  }

  /**
   * Dispose decoration types
   */
  dispose(): void {
    this.addedDecor.dispose();
    this.removedDecor.dispose();
    this.modifiedDecor.dispose();
    this.movedDecor.dispose();
  }
}

/**
 * Create diff summary hover provider
 */
export function createDiffHoverProvider(): vscode.HoverProvider {
  return {
    provideHover(
      document: vscode.TextDocument,
      position: vscode.Position,
      _token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Hover> {
      // This would be enhanced to show semantic diff info
      // For now, return undefined to let other providers handle it
      return undefined;
    },
  };
}
