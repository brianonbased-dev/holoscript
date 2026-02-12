/**
 * @fileoverview Presence provider for cursor and selection awareness in VS Code
 * @module collaboration/PresenceProvider
 */

import * as vscode from 'vscode';
import type {
  Participant,
  CursorPosition,
  SelectionRange,
  ConnectionStatus,
} from './CollaborationTypes';
import { PARTICIPANT_COLORS } from './CollaborationTypes';
import { CollaborativeDocument } from './CollaborativeDocument';

/**
 * Decoration types for each participant's cursor and selection
 */
interface ParticipantDecorations {
  cursorDecoration: vscode.TextEditorDecorationType;
  selectionDecoration: vscode.TextEditorDecorationType;
  labelDecoration: vscode.TextEditorDecorationType;
}

/**
 * PresenceProvider manages visual representation of remote participants
 * in VS Code editors, including cursors, selections, and name labels.
 */
export class PresenceProvider implements vscode.Disposable {
  private decorationsByParticipant: Map<string, ParticipantDecorations> = new Map();
  private participants: Map<string, Participant> = new Map();
  private collaborativeDoc: CollaborativeDocument | null = null;
  private disposables: vscode.Disposable[] = [];
  private activeEditor: vscode.TextEditor | undefined;
  private updateDebounceTimer: NodeJS.Timeout | null = null;
  private statusBarItem: vscode.StatusBarItem;

  /**
   * Create a new PresenceProvider
   */
  constructor() {
    // Create status bar item for connection status
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.statusBarItem.command = 'holoscript.collaboration.showParticipants';
    this.disposables.push(this.statusBarItem);

    // Listen for active editor changes
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        this.activeEditor = editor;
        this.refreshDecorations();
      })
    );

    // Listen for selection changes to update local awareness
    this.disposables.push(
      vscode.window.onDidChangeTextEditorSelection((event) => {
        this.onLocalSelectionChange(event);
      })
    );

    this.activeEditor = vscode.window.activeTextEditor;
  }

  /**
   * Connect to a collaborative document and start presence tracking
   */
  attachToDocument(collaborativeDoc: CollaborativeDocument): void {
    this.collaborativeDoc = collaborativeDoc;

    // Listen for participant events
    collaborativeDoc.on('participantJoined', (participant: Participant) => {
      this.handleParticipantJoined(participant);
    });

    collaborativeDoc.on('participantUpdated', (participant: Participant) => {
      this.handleParticipantUpdated(participant);
    });

    collaborativeDoc.on('participantLeft', (participant: { id: string }) => {
      this.handleParticipantLeft(participant.id);
    });

    collaborativeDoc.on('connectionStatus', (status: ConnectionStatus) => {
      this.updateStatusBar(status);
    });

    // Initial status
    this.updateStatusBar(collaborativeDoc.getConnectionStatus());
    this.statusBarItem.show();
  }

  /**
   * Disconnect from the collaborative document
   */
  detachFromDocument(): void {
    if (this.collaborativeDoc) {
      this.collaborativeDoc.removeAllListeners('participantJoined');
      this.collaborativeDoc.removeAllListeners('participantUpdated');
      this.collaborativeDoc.removeAllListeners('participantLeft');
      this.collaborativeDoc.removeAllListeners('connectionStatus');
      this.collaborativeDoc = null;
    }

    // Clear all decorations
    this.clearAllDecorations();
    this.participants.clear();
    this.statusBarItem.hide();
  }

  /**
   * Get all current participants
   */
  getParticipants(): Participant[] {
    return Array.from(this.participants.values());
  }

  /**
   * Show a quick pick with all participants
   */
  async showParticipantsQuickPick(): Promise<void> {
    const participants = this.getParticipants();

    if (participants.length === 0) {
      vscode.window.showInformationMessage('No other participants in this session');
      return;
    }

    const items = participants.map((p) => ({
      label: `$(person) ${p.name}`,
      description: p.status,
      detail: p.cursor
        ? `Line ${p.cursor.line + 1}, Column ${p.cursor.character + 1}`
        : 'No cursor position',
      participant: p,
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a participant to follow',
      title: 'Session Participants',
    });

    if (selected && selected.participant.cursor && this.activeEditor) {
      // Jump to participant's cursor position
      const position = new vscode.Position(
        selected.participant.cursor.line,
        selected.participant.cursor.character
      );
      this.activeEditor.selection = new vscode.Selection(position, position);
      this.activeEditor.revealRange(
        new vscode.Range(position, position),
        vscode.TextEditorRevealType.InCenter
      );
    }
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.detachFromDocument();

    if (this.updateDebounceTimer) {
      clearTimeout(this.updateDebounceTimer);
    }

    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];
  }

  // Private methods

  private handleParticipantJoined(participant: Participant): void {
    this.participants.set(participant.id, participant);
    this.createDecorationsForParticipant(participant);
    this.refreshDecorations();

    vscode.window
      .showInformationMessage(`${participant.name} joined the session`, 'Follow')
      .then((action) => {
        if (action === 'Follow' && participant.cursor) {
          this.followParticipant(participant.id);
        }
      });
  }

  private handleParticipantUpdated(participant: Participant): void {
    const existing = this.participants.get(participant.id);
    if (existing) {
      // Merge updates
      this.participants.set(participant.id, {
        ...existing,
        ...participant,
      });
    } else {
      this.participants.set(participant.id, participant);
      this.createDecorationsForParticipant(participant);
    }

    this.scheduleDecorationsUpdate();
  }

  private handleParticipantLeft(participantId: string): void {
    const participant = this.participants.get(participantId);
    if (participant) {
      vscode.window.showInformationMessage(`${participant.name} left the session`);
    }

    this.participants.delete(participantId);
    this.disposeDecorationsForParticipant(participantId);
    this.refreshDecorations();
  }

  private createDecorationsForParticipant(participant: Participant): void {
    // Dispose existing decorations if any
    this.disposeDecorationsForParticipant(participant.id);

    const color = participant.color;

    // Cursor decoration (vertical line)
    const cursorDecoration = vscode.window.createTextEditorDecorationType({
      borderWidth: '2px',
      borderStyle: 'solid',
      borderColor: color,
      backgroundColor: `${color}20`,
    });

    // Selection decoration (highlighted background)
    const selectionDecoration = vscode.window.createTextEditorDecorationType({
      backgroundColor: `${color}30`,
      borderRadius: '2px',
    });

    // Label decoration (participant name above cursor)
    const labelDecoration = vscode.window.createTextEditorDecorationType({
      after: {
        contentText: ` ${participant.name}`,
        color: color,
        fontWeight: 'bold',
        fontSize: '10px',
        margin: '0 0 0 4px',
      },
    });

    this.decorationsByParticipant.set(participant.id, {
      cursorDecoration,
      selectionDecoration,
      labelDecoration,
    });
  }

  private disposeDecorationsForParticipant(participantId: string): void {
    const decorations = this.decorationsByParticipant.get(participantId);
    if (decorations) {
      decorations.cursorDecoration.dispose();
      decorations.selectionDecoration.dispose();
      decorations.labelDecoration.dispose();
      this.decorationsByParticipant.delete(participantId);
    }
  }

  private clearAllDecorations(): void {
    for (const [participantId] of this.decorationsByParticipant) {
      this.disposeDecorationsForParticipant(participantId);
    }
  }

  private scheduleDecorationsUpdate(): void {
    if (this.updateDebounceTimer) {
      clearTimeout(this.updateDebounceTimer);
    }

    this.updateDebounceTimer = setTimeout(() => {
      this.refreshDecorations();
    }, 50);
  }

  private refreshDecorations(): void {
    if (!this.activeEditor) return;

    for (const [participantId, participant] of this.participants) {
      const decorations = this.decorationsByParticipant.get(participantId);
      if (!decorations) continue;

      const cursorRanges: vscode.Range[] = [];
      const selectionRanges: vscode.Range[] = [];
      const labelRanges: vscode.Range[] = [];

      // Add cursor decoration
      if (participant.cursor) {
        const position = new vscode.Position(participant.cursor.line, participant.cursor.character);
        cursorRanges.push(new vscode.Range(position, position));
        labelRanges.push(new vscode.Range(position, position));
      }

      // Add selection decorations
      if (participant.selections) {
        for (const selection of participant.selections) {
          const startPos = new vscode.Position(selection.start.line, selection.start.character);
          const endPos = new vscode.Position(selection.end.line, selection.end.character);
          selectionRanges.push(new vscode.Range(startPos, endPos));
        }
      }

      // Apply decorations
      this.activeEditor.setDecorations(decorations.cursorDecoration, cursorRanges);
      this.activeEditor.setDecorations(decorations.selectionDecoration, selectionRanges);
      this.activeEditor.setDecorations(decorations.labelDecoration, labelRanges);
    }
  }

  private onLocalSelectionChange(event: vscode.TextEditorSelectionChangeEvent): void {
    if (!this.collaborativeDoc || event.textEditor !== this.activeEditor) return;

    // Update cursor position
    const cursor = event.selections[0]?.active;
    if (cursor) {
      this.collaborativeDoc.updateCursor({
        line: cursor.line,
        character: cursor.character,
      });
    }

    // Update selections
    const selections: SelectionRange[] = event.selections.map((sel) => ({
      start: { line: sel.start.line, character: sel.start.character },
      end: { line: sel.end.line, character: sel.end.character },
      isReversed: sel.isReversed,
    }));
    this.collaborativeDoc.updateSelection(selections);
  }

  private updateStatusBar(status: ConnectionStatus): void {
    const participantCount = this.participants.size;

    switch (status) {
      case 'connected':
        this.statusBarItem.text = `$(broadcast) ${participantCount + 1} collaborators`;
        this.statusBarItem.backgroundColor = undefined;
        this.statusBarItem.tooltip = 'Click to see all participants';
        break;

      case 'connecting':
        this.statusBarItem.text = '$(sync~spin) Connecting...';
        this.statusBarItem.backgroundColor = new vscode.ThemeColor(
          'statusBarItem.warningBackground'
        );
        this.statusBarItem.tooltip = 'Connecting to collaboration server';
        break;

      case 'reconnecting':
        this.statusBarItem.text = '$(sync~spin) Reconnecting...';
        this.statusBarItem.backgroundColor = new vscode.ThemeColor(
          'statusBarItem.warningBackground'
        );
        this.statusBarItem.tooltip = 'Reconnecting to collaboration server';
        break;

      case 'disconnected':
        this.statusBarItem.text = '$(debug-disconnect) Disconnected';
        this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        this.statusBarItem.tooltip = 'Disconnected from collaboration server';
        break;
    }
  }

  private followParticipant(participantId: string): void {
    const participant = this.participants.get(participantId);
    if (!participant?.cursor || !this.activeEditor) return;

    const position = new vscode.Position(participant.cursor.line, participant.cursor.character);

    this.activeEditor.selection = new vscode.Selection(position, position);
    this.activeEditor.revealRange(
      new vscode.Range(position, position),
      vscode.TextEditorRevealType.InCenter
    );
  }
}

/**
 * Singleton instance of PresenceProvider
 */
let presenceProviderInstance: PresenceProvider | null = null;

/**
 * Get or create the PresenceProvider singleton
 */
export function getPresenceProvider(): PresenceProvider {
  if (!presenceProviderInstance) {
    presenceProviderInstance = new PresenceProvider();
  }
  return presenceProviderInstance;
}

/**
 * Dispose of the PresenceProvider singleton
 */
export function disposePresenceProvider(): void {
  if (presenceProviderInstance) {
    presenceProviderInstance.dispose();
    presenceProviderInstance = null;
  }
}
