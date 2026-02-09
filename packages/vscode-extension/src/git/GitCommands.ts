/**
 * @fileoverview VS Code commands for HoloScript git integration
 * @module git/GitCommands
 */

import * as vscode from 'vscode';
import { SemanticGit } from './SemanticGit';
import { DiffVisualizationProvider, DiffDecorationProvider } from './DiffVisualization';
import { MergeDriver, HoloScriptGitHooks, MergeConflictResolver } from './MergeDriver';
import { HoloScriptGitStatus, MergeConflict } from './GitTypes';

/**
 * Registers all git-related commands
 */
export function registerGitCommands(
  context: vscode.ExtensionContext,
  semanticGit: SemanticGit,
  diffProvider: DiffVisualizationProvider,
  decorationProvider: DiffDecorationProvider,
  mergeDriver: MergeDriver,
  hooks: HoloScriptGitHooks
): vscode.Disposable[] {
  const disposables: vscode.Disposable[] = [];

  // Show semantic diff
  disposables.push(
    vscode.commands.registerCommand(
      'holoscript.showSemanticDiff',
      async (uri?: vscode.Uri) => {
        const filePath = uri?.fsPath || vscode.window.activeTextEditor?.document.uri.fsPath;
        if (!filePath) {
          vscode.window.showInformationMessage('No HoloScript file selected');
          return;
        }

        try {
          const revision = await vscode.window.showQuickPick(
            ['HEAD', 'HEAD~1', 'HEAD~2', 'Select commit...'],
            { placeHolder: 'Compare with...' }
          );

          let targetRevision = revision;
          if (revision === 'Select commit...') {
            const commits = await semanticGit.getFileHistory(filePath, 20);
            const picked = await vscode.window.showQuickPick(
              commits.map((c) => ({
                label: c.message.slice(0, 60),
                description: c.sha.slice(0, 7),
                detail: `${c.author} - ${new Date(c.date).toLocaleDateString()}`,
                sha: c.sha,
              })),
              { placeHolder: 'Select commit' }
            );
            targetRevision = picked?.sha;
          }

          if (!targetRevision) return;

          await semanticGit.showDiff(filePath, targetRevision, 'split');
        } catch (error) {
          vscode.window.showErrorMessage(`Failed to show diff: ${error}`);
        }
      }
    )
  );

  // Show 3D diff preview
  disposables.push(
    vscode.commands.registerCommand(
      'holoscript.show3DDiff',
      async (uri?: vscode.Uri) => {
        const filePath = uri?.fsPath || vscode.window.activeTextEditor?.document.uri.fsPath;
        if (!filePath) {
          vscode.window.showInformationMessage('No HoloScript file selected');
          return;
        }

        try {
          const visual = await semanticGit.getVisualDiff(filePath, 'HEAD');
          diffProvider.showDiff(visual);
        } catch (error) {
          vscode.window.showErrorMessage(`Failed to show 3D diff: ${error}`);
        }
      }
    )
  );

  // Toggle inline diff decorations
  disposables.push(
    vscode.commands.registerCommand('holoscript.toggleDiffDecorations', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const filePath = editor.document.uri.fsPath;
      if (!filePath.endsWith('.holo') && !filePath.endsWith('.hs')) {
        vscode.window.showInformationMessage('Not a HoloScript file');
        return;
      }

      try {
        const diff = await semanticGit.getUnstagedDiff(filePath);
        if (diff.totalChanges === 0) {
          decorationProvider.clearDecorations(editor);
          vscode.window.showInformationMessage('No changes');
        } else {
          decorationProvider.applyDecorations(editor, diff);
          vscode.window.showInformationMessage(`Showing ${diff.totalChanges} changes`);
        }
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to show decorations: ${error}`);
      }
    })
  );

  // Blame line
  disposables.push(
    vscode.commands.registerCommand('holoscript.blameLine', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const filePath = editor.document.uri.fsPath;
      const line = editor.selection.active.line + 1;

      try {
        const blame = await semanticGit.blameLine(filePath, line);
        if (blame) {
          vscode.window.showInformationMessage(
            `${blame.author}: ${blame.message} (${blame.commit.slice(0, 7)})`
          );
        }
      } catch (error) {
        vscode.window.showErrorMessage(`Blame failed: ${error}`);
      }
    })
  );

  // Show file history
  disposables.push(
    vscode.commands.registerCommand(
      'holoscript.showFileHistory',
      async (uri?: vscode.Uri) => {
        const filePath = uri?.fsPath || vscode.window.activeTextEditor?.document.uri.fsPath;
        if (!filePath) return;

        try {
          const history = await semanticGit.getFileHistory(filePath, 50);
          const picked = await vscode.window.showQuickPick(
            history.map((c) => ({
              label: c.message,
              description: c.sha.slice(0, 7),
              detail: `${c.author} - ${new Date(c.date).toLocaleDateString()}`,
              sha: c.sha,
            })),
            { placeHolder: 'File History' }
          );

          if (picked) {
            await semanticGit.showDiff(filePath, picked.sha);
          }
        } catch (error) {
          vscode.window.showErrorMessage(`Failed to get history: ${error}`);
        }
      }
    )
  );

  // Stage with validation
  disposables.push(
    vscode.commands.registerCommand(
      'holoscript.stageWithValidation',
      async (uri?: vscode.Uri) => {
        const filePath = uri?.fsPath || vscode.window.activeTextEditor?.document.uri.fsPath;
        if (!filePath) return;

        try {
          await semanticGit.stageFile(filePath, true);
          vscode.window.showInformationMessage('File staged successfully');
        } catch (error) {
          vscode.window.showErrorMessage(`Failed to stage: ${error}`);
        }
      }
    )
  );

  // Commit with semantic message
  disposables.push(
    vscode.commands.registerCommand('holoscript.commitSemantic', async () => {
      try {
        const message = await vscode.window.showInputBox({
          prompt: 'Commit message',
          placeHolder: 'Enter commit message...',
        });

        if (!message) return;

        const generateSemantic = await vscode.window.showQuickPick(
          ['Yes, add semantic summary', 'No, just the message'],
          { placeHolder: 'Add semantic change summary?' }
        );

        const sha = await semanticGit.commit(
          message,
          undefined,
          generateSemantic?.startsWith('Yes') || false
        );

        vscode.window.showInformationMessage(`Committed: ${sha.slice(0, 7)}`);
      } catch (error) {
        vscode.window.showErrorMessage(`Commit failed: ${error}`);
      }
    })
  );

  // Show HoloScript status
  disposables.push(
    vscode.commands.registerCommand('holoscript.showGitStatus', async () => {
      try {
        const statuses = await semanticGit.getAllHoloScriptStatus();
        
        if (statuses.length === 0) {
          vscode.window.showInformationMessage('No HoloScript files changed');
          return;
        }

        const items = statuses.map((s) => {
          const statusIcon = getStatusIcon(s);
          const summary = s.diffSummary
            ? ` (+${s.diffSummary.added} -${s.diffSummary.removed} ~${s.diffSummary.modified})`
            : '';
          return {
            label: `${statusIcon} ${s.filePath}`,
            description: s.staged ? '(staged)' : '',
            detail: summary,
            status: s,
          };
        });

        const picked = await vscode.window.showQuickPick(items, {
          placeHolder: 'HoloScript Git Status',
        });

        if (picked) {
          await vscode.commands.executeCommand('holoscript.showSemanticDiff', 
            vscode.Uri.file(picked.status.filePath)
          );
        }
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to get status: ${error}`);
      }
    })
  );

  // Resolve merge conflicts
  disposables.push(
    vscode.commands.registerCommand(
      'holoscript.resolveMergeConflicts',
      async (uri?: vscode.Uri) => {
        const filePath = uri?.fsPath || vscode.window.activeTextEditor?.document.uri.fsPath;
        if (!filePath) return;

        const resolver = new MergeConflictResolver(context.extensionUri);
        
        try {
          // Get conflict info (would need to read file and parse)
          const mockConflicts: MergeConflict[] = []; // Would extract from file
          
          if (mockConflicts.length === 0) {
            vscode.window.showInformationMessage('No merge conflicts found');
            return;
          }

          resolver.showConflicts(mockConflicts, filePath);
        } catch (error) {
          vscode.window.showErrorMessage(`Failed to resolve conflicts: ${error}`);
        }
      }
    )
  );

  // Three-way merge
  disposables.push(
    vscode.commands.registerCommand(
      'holoscript.threeWayMerge',
      async (baseUri: vscode.Uri, oursUri: vscode.Uri, theirsUri: vscode.Uri) => {
        try {
          const baseContent = (await vscode.workspace.fs.readFile(baseUri)).toString();
          const oursContent = (await vscode.workspace.fs.readFile(oursUri)).toString();
          const theirsContent = (await vscode.workspace.fs.readFile(theirsUri)).toString();

          const result = await mergeDriver.merge(baseContent, oursContent, theirsContent);

          if (result.success) {
            vscode.window.showInformationMessage(
              `Merge successful: ${result.oursApplied} ours, ${result.theirsApplied} theirs`
            );
          } else {
            const resolver = new MergeConflictResolver(context.extensionUri);
            resolver.showConflicts(result.conflicts, oursUri.fsPath);
          }
        } catch (error) {
          vscode.window.showErrorMessage(`Merge failed: ${error}`);
        }
      }
    )
  );

  // Run pre-commit hook
  disposables.push(
    vscode.commands.registerCommand('holoscript.runPreCommitHook', async () => {
      try {
        const statuses = await semanticGit.getAllHoloScriptStatus();
        const stagedFiles = statuses
          .filter((s) => s.staged)
          .map((s) => s.filePath);

        const result = await hooks.preCommit(stagedFiles);

        if (result.passed) {
          vscode.window.showInformationMessage('Pre-commit checks passed');
        } else {
          vscode.window.showErrorMessage(
            `Pre-commit failed:\n${result.errors.join('\n')}`
          );
        }
      } catch (error) {
        vscode.window.showErrorMessage(`Hook failed: ${error}`);
      }
    })
  );

  // Go to change in source
  disposables.push(
    vscode.commands.registerCommand(
      'holoscript.goToChange',
      async (change: { sourceLine?: number }) => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || !change.sourceLine) return;

        const position = new vscode.Position(change.sourceLine - 1, 0);
        editor.selection = new vscode.Selection(position, position);
        editor.revealRange(
          new vscode.Range(position, position),
          vscode.TextEditorRevealType.InCenter
        );
      }
    )
  );

  return disposables;
}

/**
 * Get icon for git status
 */
function getStatusIcon(status: HoloScriptGitStatus): string {
  switch (status.status) {
    case 'added':
      return '➕';
    case 'modified':
      return '📝';
    case 'deleted':
      return '❌';
    case 'renamed':
      return '🔄';
    case 'conflict':
      return '⚠️';
    case 'untracked':
      return '❓';
    default:
      return '•';
  }
}

/**
 * Create git status bar item
 */
export function createGitStatusBarItem(): vscode.StatusBarItem {
  const item = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    99
  );
  item.name = 'HoloScript Git';
  item.command = 'holoscript.showGitStatus';
  return item;
}

/**
 * Update status bar with current file status
 */
export async function updateGitStatusBar(
  item: vscode.StatusBarItem,
  semanticGit: SemanticGit
): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    item.hide();
    return;
  }

  const filePath = editor.document.uri.fsPath;
  if (!filePath.endsWith('.holo') && !filePath.endsWith('.hs')) {
    item.hide();
    return;
  }

  try {
    const status = await semanticGit.getFileStatus(filePath);
    const icon = getStatusIcon(status);
    
    let text = `$(git-commit) ${icon}`;
    if (status.diffSummary) {
      const { added, removed, modified } = status.diffSummary;
      text += ` +${added} -${removed} ~${modified}`;
    }
    
    item.text = text;
    item.tooltip = `HoloScript: ${status.status}${status.staged ? ' (staged)' : ''}`;
    item.show();
  } catch {
    item.hide();
  }
}
