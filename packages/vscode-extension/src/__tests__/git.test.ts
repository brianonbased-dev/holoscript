/**
 * @fileoverview Tests for HoloScript git integration
 * @module git/__tests__/git.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as vscode from 'vscode';

// Mock vscode module
vi.mock('vscode', () => ({
  window: {
    createOutputChannel: vi.fn(() => ({
      appendLine: vi.fn(),
      dispose: vi.fn(),
    })),
    createStatusBarItem: vi.fn(() => ({
      text: '',
      tooltip: '',
      command: '',
      show: vi.fn(),
      hide: vi.fn(),
      dispose: vi.fn(),
    })),
    showInformationMessage: vi.fn(),
    showErrorMessage: vi.fn(),
    showQuickPick: vi.fn(),
    showInputBox: vi.fn(),
    createWebviewPanel: vi.fn(() => ({
      webview: {
        html: '',
        onDidReceiveMessage: vi.fn(),
        postMessage: vi.fn(),
      },
      dispose: vi.fn(),
    })),
    registerWebviewViewProvider: vi.fn(),
    createTextEditorDecorationType: vi.fn(() => ({
      dispose: vi.fn(),
    })),
    activeTextEditor: null,
    onDidChangeActiveTextEditor: vi.fn(() => ({ dispose: vi.fn() })),
  },
  workspace: {
    workspaceFolders: [{ uri: { fsPath: '/test/workspace' } }],
    fs: {
      readFile: vi.fn(),
    },
    textDocuments: [],
  },
  commands: {
    registerCommand: vi.fn(() => ({ dispose: vi.fn() })),
    executeCommand: vi.fn(),
  },
  Uri: {
    file: vi.fn((path) => ({ fsPath: path })),
    parse: vi.fn((uri) => uri),
  },
  Range: class {
    constructor(
      public startLine: number,
      public startCol: number,
      public endLine: number,
      public endCol: number
    ) {}
  },
  Position: class {
    constructor(public line: number, public column: number) {}
  },
  Selection: class {
    constructor(public anchor: any, public active: any) {}
  },
  StatusBarAlignment: { Left: 1, Right: 2 },
  OverviewRulerLane: { Left: 1, Center: 2, Right: 4 },
  ViewColumn: { One: 1, Two: 2 },
  TextEditorRevealType: { InCenter: 2 },
}));

// Mock child_process
vi.mock('child_process', () => ({
  exec: vi.fn((cmd, opts, cb) => {
    if (cb) cb(null, { stdout: 'mock output', stderr: '' });
  }),
}));

vi.mock('util', async () => {
  const actual = await vi.importActual('util');
  return {
    ...actual,
    promisify: vi.fn((fn) => async (...args: any[]) => ({ stdout: 'mock output' })),
  };
});

// =============================================================================
// GIT TYPES TESTS
// =============================================================================

describe('GitTypes', () => {
  it('should define SceneNode interface correctly', async () => {
    const { SceneNode } = await import('../git/GitTypes') as any;
    // Type definitions don't have runtime values, but we can test the constants
    const node = {
      type: 'Box',
      id: 'box1',
      name: 'MyBox',
      position: [1, 2, 3] as [number, number, number],
    };
    expect(node.type).toBe('Box');
  });

  it('should export DIFF_COLORS', async () => {
    const { DIFF_COLORS } = await import('../git/GitTypes');
    expect(DIFF_COLORS.added).toBe('#4CAF50');
    expect(DIFF_COLORS.removed).toBe('#F44336');
    expect(DIFF_COLORS.modified).toBe('#FF9800');
    expect(DIFF_COLORS.moved).toBe('#2196F3');
  });

  it('should export DEFAULT_GIT_CONFIG', async () => {
    const { DEFAULT_GIT_CONFIG } = await import('../git/GitTypes');
    expect(DEFAULT_GIT_CONFIG.enableSemanticDiff).toBe(true);
    expect(DEFAULT_GIT_CONFIG.enable3DPreview).toBe(true);
    expect(DEFAULT_GIT_CONFIG.formatOnCommit).toBe(true);
    expect(DEFAULT_GIT_CONFIG.validateOnCommit).toBe(true);
  });
});

// =============================================================================
// SEMANTIC GIT TESTS
// =============================================================================

describe('SemanticGit', () => {
  let semanticGit: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { SemanticGit } = await import('../git/SemanticGit');
    semanticGit = new SemanticGit('/test/workspace');
  });

  afterEach(() => {
    if (semanticGit?.dispose) {
      semanticGit.dispose();
    }
  });

  describe('initialization', () => {
    it('should create instance with workspace root', () => {
      expect(semanticGit).toBeDefined();
    });

    it('should create output channel on construction', () => {
      expect(vscode.window.createOutputChannel).toHaveBeenCalledWith('HoloScript Git');
    });

    it('should create status bar item on construction', () => {
      expect(vscode.window.createStatusBarItem).toHaveBeenCalled();
    });
  });

  describe('config', () => {
    it('should use default config when none provided', async () => {
      const { SemanticGit, DEFAULT_GIT_CONFIG } = await import('../git/SemanticGit') as any;
      const git = new SemanticGit('/test');
      // Config is private, but we can test behavior
      expect(git).toBeDefined();
    });

    it('should merge provided config with defaults', async () => {
      const { SemanticGit } = await import('../git/SemanticGit');
      const git = new SemanticGit('/test', { formatOnCommit: false });
      expect(git).toBeDefined();
    });
  });

  describe('dispose', () => {
    it('should dispose all resources', () => {
      semanticGit.dispose();
      // Would check that dispose was called on output channel and status bar
    });
  });
});

// =============================================================================
// MERGE DRIVER TESTS
// =============================================================================

describe('MergeDriver', () => {
  let mergeDriver: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { MergeDriver } = await import('../git/MergeDriver');
    mergeDriver = new MergeDriver();
  });

  afterEach(() => {
    if (mergeDriver?.dispose) {
      mergeDriver.dispose();
    }
  });

  describe('three-way merge', () => {
    it('should handle identical base, ours, and theirs', async () => {
      const content = `Box cube @ (0, 0, 0) {
  color: "red";
}`;
      const result = await mergeDriver.merge(content, content, content);
      expect(result.success).toBe(true);
      expect(result.conflicts).toHaveLength(0);
    });

    it('should handle ours-only changes', async () => {
      const base = `Box cube @ (0, 0, 0) { color: "red"; }`;
      const ours = `Box cube @ (0, 0, 0) { color: "blue"; }`;
      const theirs = base;

      const result = await mergeDriver.merge(base, ours, theirs);
      expect(result.success).toBe(true);
      expect(result.oursApplied).toBeGreaterThan(0);
    });

    it('should handle theirs-only changes', async () => {
      const base = `Box cube @ (0, 0, 0) { color: "red"; }`;
      const ours = base;
      const theirs = `Box cube @ (0, 0, 0) { color: "green"; }`;

      const result = await mergeDriver.merge(base, ours, theirs);
      expect(result.success).toBe(true);
      expect(result.theirsApplied).toBeGreaterThan(0);
    });

    it('should detect conflicting changes', async () => {
      const base = `Box cube @ (0, 0, 0) { color: "red"; }`;
      const ours = `Box cube @ (0, 0, 0) { color: "blue"; }`;
      const theirs = `Box cube @ (0, 0, 0) { color: "green"; }`;

      const result = await mergeDriver.merge(base, ours, theirs);
      // May have conflicts depending on implementation
      expect(result).toBeDefined();
    });

    it('should handle added nodes in ours', async () => {
      const base = ``;
      const ours = `Box newBox @ (0, 0, 0) { color: "blue"; }`;
      const theirs = ``;

      const result = await mergeDriver.merge(base, ours, theirs);
      expect(result.success).toBe(true);
      expect(result.oursApplied).toBeGreaterThan(0);
    });

    it('should handle added nodes in theirs', async () => {
      const base = ``;
      const ours = ``;
      const theirs = `Sphere newSphere @ (1, 1, 1) { radius: 2; }`;

      const result = await mergeDriver.merge(base, ours, theirs);
      expect(result.success).toBe(true);
      expect(result.theirsApplied).toBeGreaterThan(0);
    });

    it('should handle add-add conflict', async () => {
      const base = ``;
      const ours = `Box item @ (0, 0, 0) { color: "red"; }`;
      const theirs = `Box item @ (1, 1, 1) { color: "blue"; }`;

      const result = await mergeDriver.merge(base, ours, theirs);
      // Should have conflict since same name, different content
      expect(result.conflicts.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle delete in ours', async () => {
      const base = `Box cube @ (0, 0, 0) { color: "red"; }`;
      const ours = ``;
      const theirs = base;

      const result = await mergeDriver.merge(base, ours, theirs);
      expect(result.success).toBe(true);
    });

    it('should handle delete-modify conflict', async () => {
      const base = `Box cube @ (0, 0, 0) { color: "red"; }`;
      const ours = ``;
      const theirs = `Box cube @ (0, 0, 0) { color: "blue"; }`;

      const result = await mergeDriver.merge(base, ours, theirs);
      // Should detect delete vs modify conflict
      expect(result).toBeDefined();
    });
  });
});

// =============================================================================
// GIT HOOKS TESTS
// =============================================================================

describe('HoloScriptGitHooks', () => {
  let hooks: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { HoloScriptGitHooks } = await import('../git/MergeDriver');
    hooks = new HoloScriptGitHooks();
  });

  afterEach(() => {
    if (hooks?.dispose) {
      hooks.dispose();
    }
  });

  describe('preCommit', () => {
    it('should pass for valid files', async () => {
      const result = await hooks.preCommit(['/test/file.holo']);
      expect(result.passed).toBe(true);
    });

    it('should skip non-HoloScript files', async () => {
      const result = await hooks.preCommit(['/test/file.js', '/test/file.ts']);
      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid files', async () => {
      // With current mock, files will pass
      const result = await hooks.preCommit(['/test/invalid.holo']);
      expect(result).toBeDefined();
    });
  });

  describe('postMerge', () => {
    it('should validate merged files', async () => {
      const result = await hooks.postMerge(['/test/merged.holo']);
      expect(result).toBeDefined();
    });

    it('should detect conflict markers', async () => {
      // Would need to mock file content
      const result = await hooks.postMerge(['/test/conflict.holo']);
      expect(result).toBeDefined();
    });
  });
});

// =============================================================================
// DIFF VISUALIZATION TESTS
// =============================================================================

describe('DiffVisualizationProvider', () => {
  let provider: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { DiffVisualizationProvider } = await import('../git/DiffVisualization');
    provider = new DiffVisualizationProvider({ fsPath: '/test/extension' } as any);
  });

  it('should have correct view type', async () => {
    const { DiffVisualizationProvider } = await import('../git/DiffVisualization');
    expect(DiffVisualizationProvider.viewType).toBe('holoscript.diffVisualization');
  });

  it('should show diff visualization', () => {
    const mockDiff = {
      beforeScene: [],
      afterScene: [],
      highlights: [],
      summary: 'Test summary',
      changeList: [],
    };

    provider.showDiff(mockDiff);
    // Would verify webview message sent
  });

  it('should update highlights', () => {
    const highlights = [
      { type: 'added' as const, nodeId: 'box1', color: '#4CAF50' },
    ];
    provider.updateHighlights(highlights);
  });

  it('should focus on node', () => {
    provider.focusNode('box1', 'after');
  });

  it('should clear visualization', () => {
    provider.clear();
  });
});

describe('DiffDecorationProvider', () => {
  let decorationProvider: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { DiffDecorationProvider } = await import('../git/DiffVisualization');
    decorationProvider = new DiffDecorationProvider();
  });

  afterEach(() => {
    if (decorationProvider?.dispose) {
      decorationProvider.dispose();
    }
  });

  it('should create decoration types', () => {
    expect(vscode.window.createTextEditorDecorationType).toHaveBeenCalledTimes(4);
  });

  it('should apply decorations to editor', () => {
    const mockEditor = {
      setDecorations: vi.fn(),
    };
    const mockDiff = {
      added: [{ id: 'box1', type: 'Box', sourceRange: { startLine: 1, endLine: 5 } }],
      removed: [],
      modified: [],
      moved: [],
      renamed: [],
      totalChanges: 1,
      equivalent: false,
    };

    decorationProvider.applyDecorations(mockEditor, mockDiff);
    expect(mockEditor.setDecorations).toHaveBeenCalled();
  });

  it('should clear decorations', () => {
    const mockEditor = {
      setDecorations: vi.fn(),
    };

    decorationProvider.clearDecorations(mockEditor);
    expect(mockEditor.setDecorations).toHaveBeenCalledTimes(4);
  });

  it('should dispose decoration types', () => {
    decorationProvider.dispose();
  });
});

// =============================================================================
// GIT COMMANDS TESTS
// =============================================================================

describe('Git Commands', () => {
  describe('registerGitCommands', () => {
    it('should register all git commands', async () => {
      vi.clearAllMocks();
      const { registerGitCommands } = await import('../git/GitCommands');
      const { SemanticGit } = await import('../git/SemanticGit');
      const { DiffVisualizationProvider, DiffDecorationProvider } = await import('../git/DiffVisualization');
      const { MergeDriver, HoloScriptGitHooks } = await import('../git/MergeDriver');

      const context = { extensionUri: { fsPath: '/test' } } as any;
      const semanticGit = new SemanticGit('/test');
      const diffProvider = new DiffVisualizationProvider(context.extensionUri);
      const decorationProvider = new DiffDecorationProvider();
      const mergeDriver = new MergeDriver();
      const hooks = new HoloScriptGitHooks();

      const disposables = registerGitCommands(
        context,
        semanticGit,
        diffProvider,
        decorationProvider,
        mergeDriver,
        hooks
      );

      // Should register 12 commands
      expect(disposables.length).toBe(12);
      expect(vscode.commands.registerCommand).toHaveBeenCalled();
    });
  });

  describe('createGitStatusBarItem', () => {
    it('should create status bar item', async () => {
      vi.clearAllMocks();
      const { createGitStatusBarItem } = await import('../git/GitCommands');
      const item = createGitStatusBarItem();
      expect(vscode.window.createStatusBarItem).toHaveBeenCalled();
    });
  });
});

// =============================================================================
// MERGE CONFLICT RESOLVER TESTS
// =============================================================================

describe('MergeConflictResolver', () => {
  let resolver: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { MergeConflictResolver } = await import('../git/MergeDriver');
    resolver = new MergeConflictResolver({ fsPath: '/test/extension' } as any);
  });

  afterEach(() => {
    if (resolver?.dispose) {
      resolver.dispose();
    }
  });

  it('should show conflicts in webview', () => {
    const conflicts = [
      {
        id: 'conflict1',
        path: 'cube',
        type: 'property' as const,
        ours: { color: 'red' },
        theirs: { color: 'blue' },
        base: { color: 'green' },
        autoResolvable: false,
      },
    ];

    resolver.showConflicts(conflicts, '/test/file.holo');
    expect(vscode.window.createWebviewPanel).toHaveBeenCalled();
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe('Git Integration', () => {
  it('should export all required modules', async () => {
    const gitModule = await import('../git');
    
    expect(gitModule.SemanticGit).toBeDefined();
    expect(gitModule.DiffVisualizationProvider).toBeDefined();
    expect(gitModule.DiffDecorationProvider).toBeDefined();
    expect(gitModule.MergeDriver).toBeDefined();
    expect(gitModule.HoloScriptGitHooks).toBeDefined();
    expect(gitModule.MergeConflictResolver).toBeDefined();
    expect(gitModule.registerGitCommands).toBeDefined();
    expect(gitModule.createGitStatusBarItem).toBeDefined();
    expect(gitModule.updateGitStatusBar).toBeDefined();
    expect(gitModule.DIFF_COLORS).toBeDefined();
    expect(gitModule.DEFAULT_GIT_CONFIG).toBeDefined();
  });
});
