/**
 * @fileoverview CRDT-based collaborative document using Yjs
 * @module collaboration/CollaborativeDocument
 */

import { EventEmitter } from 'events';
import type { TextDocument, TextEdit, Position, Range } from 'vscode';
import type {
  CollaborationConfig,
  CursorPosition,
  SelectionRange,
  AwarenessState,
  ConnectionStatus,
  CollaborationError,
  Participant,
  TextOperation,
} from './CollaborationTypes';
import { DEFAULT_AWARENESS_INTERVAL, getParticipantColor } from './CollaborationTypes';

// Yjs types (will be available when yjs is installed)
interface YDoc {
  getText(name: string): YText;
  on(event: string, callback: (...args: unknown[]) => void): void;
  off(event: string, callback: (...args: unknown[]) => void): void;
  destroy(): void;
}

interface YText {
  toString(): string;
  insert(index: number, text: string): void;
  delete(index: number, length: number): void;
  observe(callback: (event: YTextEvent) => void): void;
  unobserve(callback: (event: YTextEvent) => void): void;
}

interface YTextEvent {
  target: YText;
  delta: Array<{ insert?: string; delete?: number; retain?: number }>;
}

interface WebsocketProvider {
  awareness: Awareness;
  wsconnected: boolean;
  on(event: string, callback: (...args: unknown[]) => void): void;
  off(event: string, callback: (...args: unknown[]) => void): void;
  connect(): void;
  disconnect(): void;
  destroy(): void;
}

interface Awareness {
  clientID: number;
  getLocalState(): AwarenessState | null;
  setLocalState(state: AwarenessState | null): void;
  setLocalStateField(field: string, value: unknown): void;
  getStates(): Map<number, AwarenessState>;
  on(event: string, callback: (...args: unknown[]) => void): void;
  off(event: string, callback: (...args: unknown[]) => void): void;
}

/**
 * CollaborativeDocument manages real-time document synchronization
 * using Yjs CRDT for conflict-free concurrent editing.
 */
export class CollaborativeDocument extends EventEmitter {
  private yDoc: YDoc | null = null;
  private yText: YText | null = null;
  private provider: WebsocketProvider | null = null;
  private config: CollaborationConfig;
  private connectionStatus: ConnectionStatus = 'disconnected';
  private awarenessUpdateTimer: NodeJS.Timeout | null = null;
  private pendingOperations: TextOperation[] = [];
  private isApplyingRemote = false;
  private documentVersion = 0;

  /**
   * Create a new CollaborativeDocument
   */
  constructor(config: CollaborationConfig) {
    super();
    this.config = config;
  }

  /**
   * Initialize the Yjs document and connect to the collaboration server
   */
  async connect(initialContent?: string): Promise<void> {
    try {
      this.setConnectionStatus('connecting');

      // Dynamic import of Yjs modules
      const Y = await import('yjs');
      const { WebsocketProvider } = await import('y-websocket');

      // Create Yjs document
      this.yDoc = new Y.Doc() as unknown as YDoc;
      this.yText = this.yDoc.getText('content');

      // Initialize with content if provided and document is empty
      if (initialContent && this.yText.toString() === '') {
        this.yText.insert(0, initialContent);
      }

      // Create WebSocket provider
      this.provider = new WebsocketProvider(
        this.config.serverUrl,
        this.config.roomId,
        this.yDoc as unknown as Y.Doc,
        {
          connect: true,
          params: {
            userId: this.config.user.id,
            userName: this.config.user.name,
          },
        }
      ) as unknown as WebsocketProvider;

      // Set up event listeners
      this.setupProviderEvents();
      this.setupTextObserver();
      this.setupAwareness();

      // Start awareness update timer
      this.startAwarenessTimer();

      this.setConnectionStatus('connected');
      this.emit('connected');
    } catch (error) {
      this.handleError(
        'CONNECTION_FAILED',
        'Failed to connect to collaboration server',
        error as Error,
        false
      );
      throw error;
    }
  }

  /**
   * Disconnect from the collaboration server
   */
  disconnect(): void {
    this.stopAwarenessTimer();

    if (this.provider) {
      this.provider.disconnect();
      this.provider.destroy();
      this.provider = null;
    }

    if (this.yDoc) {
      this.yDoc.destroy();
      this.yDoc = null;
      this.yText = null;
    }

    this.setConnectionStatus('disconnected');
    this.emit('disconnected');
  }

  /**
   * Get the current document content
   */
  getContent(): string {
    if (!this.yText) {
      return '';
    }
    return this.yText.toString();
  }

  /**
   * Apply a text edit to the document
   */
  applyEdit(edit: TextEdit): void {
    if (!this.yText || this.isApplyingRemote) {
      return;
    }

    const content = this.getContent();
    const startOffset = this.positionToOffset(content, edit.range.start);
    const endOffset = this.positionToOffset(content, edit.range.end);
    const deleteLength = endOffset - startOffset;

    // Delete existing content in range
    if (deleteLength > 0) {
      this.yText.delete(startOffset, deleteLength);
    }

    // Insert new content
    if (edit.newText.length > 0) {
      this.yText.insert(startOffset, edit.newText);
    }

    this.documentVersion++;
    this.emit('localEdit', edit);
  }

  /**
   * Apply multiple text edits atomically
   */
  applyEdits(edits: TextEdit[]): void {
    // Sort edits in reverse order to apply from end to start
    const sortedEdits = [...edits].sort((a, b) => {
      const lineCompare = b.range.start.line - a.range.start.line;
      if (lineCompare !== 0) return lineCompare;
      return b.range.start.character - a.range.start.character;
    });

    for (const edit of sortedEdits) {
      this.applyEdit(edit);
    }
  }

  /**
   * Update local cursor position
   */
  updateCursor(position: CursorPosition): void {
    this.updateAwarenessField('cursor', position);
  }

  /**
   * Update local selection
   */
  updateSelection(selections: SelectionRange[]): void {
    this.updateAwarenessField('selections', selections);
  }

  /**
   * Get all current participants with their awareness states
   */
  getParticipants(): Participant[] {
    if (!this.provider?.awareness) {
      return [];
    }

    const states = this.provider.awareness.getStates();
    const participants: Participant[] = [];
    let colorIndex = 0;

    states.forEach((state: AwarenessState, clientId: number) => {
      if (clientId !== this.provider?.awareness.clientID && state.user) {
        participants.push({
          ...state.user,
          color: state.user.color || getParticipantColor(colorIndex++),
          cursor: state.cursor ?? undefined,
          selections: state.selections,
        });
      }
    });

    return participants;
  }

  /**
   * Get the current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Get the document version (increments on each change)
   */
  getVersion(): number {
    return this.documentVersion;
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.connectionStatus === 'connected' && this.provider?.wsconnected === true;
  }

  // Private methods

  private setupProviderEvents(): void {
    if (!this.provider) return;

    this.provider.on('status', ({ status }: { status: string }) => {
      if (status === 'connected') {
        this.setConnectionStatus('connected');
      } else if (status === 'disconnected') {
        this.setConnectionStatus('reconnecting');
      }
    });

    this.provider.on('sync', (isSynced: boolean) => {
      if (isSynced) {
        this.emit('synced');
      }
    });

    this.provider.on('connection-error', (error: Error) => {
      this.handleError('CONNECTION_ERROR', 'WebSocket connection error', error, true);
    });

    this.provider.on('connection-close', () => {
      if (this.connectionStatus === 'connected') {
        this.setConnectionStatus('reconnecting');
      }
    });
  }

  private setupTextObserver(): void {
    if (!this.yText) return;

    this.yText.observe((event: YTextEvent) => {
      if (this.isApplyingRemote) return;

      // Convert Yjs delta to VS Code changes
      const changes: TextEdit[] = [];
      let offset = 0;

      for (const delta of event.delta) {
        if (delta.retain !== undefined) {
          offset += delta.retain;
        } else if (delta.delete !== undefined) {
          const content = this.getContent();
          const start = this.offsetToPosition(content, offset);
          const end = this.offsetToPosition(content, offset + delta.delete);
          changes.push({
            range: { start, end } as Range,
            newText: '',
          });
        } else if (delta.insert !== undefined) {
          const content = this.getContent();
          const position = this.offsetToPosition(content, offset);
          changes.push({
            range: { start: position, end: position } as Range,
            newText: delta.insert as string,
          });
          offset += (delta.insert as string).length;
        }
      }

      if (changes.length > 0) {
        this.documentVersion++;
        this.emit('remoteChanges', changes);
      }
    });
  }

  private setupAwareness(): void {
    if (!this.provider?.awareness) return;

    // Set initial local state
    this.provider.awareness.setLocalState({
      user: {
        id: this.config.user.id,
        name: this.config.user.name,
        avatar: this.config.user.avatar,
        color: getParticipantColor(this.provider.awareness.clientID % 10),
        status: 'connected',
        lastActivity: Date.now(),
      },
      cursor: null,
      selections: [],
      timestamp: Date.now(),
    } as AwarenessState);

    // Listen for awareness changes
    this.provider.awareness.on(
      'change',
      ({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] }) => {
        const states = this.provider?.awareness.getStates();
        if (!states) return;

        for (const clientId of added) {
          const state = states.get(clientId);
          if (state?.user && clientId !== this.provider?.awareness.clientID) {
            this.emit('participantJoined', state.user);
          }
        }

        for (const clientId of updated) {
          const state = states.get(clientId);
          if (state?.user && clientId !== this.provider?.awareness.clientID) {
            this.emit('participantUpdated', state.user);
          }
        }

        for (const clientId of removed) {
          this.emit('participantLeft', { id: String(clientId) });
        }
      }
    );
  }

  private updateAwarenessField(field: string, value: unknown): void {
    if (!this.provider?.awareness) return;

    this.provider.awareness.setLocalStateField(field, value);
    this.provider.awareness.setLocalStateField('timestamp', Date.now());
  }

  private startAwarenessTimer(): void {
    const interval = this.config.awarenessUpdateInterval || DEFAULT_AWARENESS_INTERVAL;
    this.awarenessUpdateTimer = setInterval(() => {
      if (this.provider?.awareness) {
        this.provider.awareness.setLocalStateField('lastActivity', Date.now());
      }
    }, interval * 10); // Update activity every 10 intervals
  }

  private stopAwarenessTimer(): void {
    if (this.awarenessUpdateTimer) {
      clearInterval(this.awarenessUpdateTimer);
      this.awarenessUpdateTimer = null;
    }
  }

  private setConnectionStatus(status: ConnectionStatus): void {
    if (this.connectionStatus !== status) {
      this.connectionStatus = status;
      this.emit('connectionStatus', status);
    }
  }

  private handleError(code: string, message: string, cause: Error, recoverable: boolean): void {
    const error: CollaborationError = {
      code,
      message,
      cause,
      recoverable,
    };
    this.emit('error', error);
  }

  private positionToOffset(content: string, position: Position | CursorPosition): number {
    const lines = content.split('\n');
    let offset = 0;

    for (let i = 0; i < position.line && i < lines.length; i++) {
      offset += lines[i].length + 1; // +1 for newline
    }

    offset += Math.min(position.character, lines[position.line]?.length || 0);
    return offset;
  }

  private offsetToPosition(content: string, offset: number): Position {
    const lines = content.split('\n');
    let currentOffset = 0;

    for (let line = 0; line < lines.length; line++) {
      const lineLength = lines[line].length + 1; // +1 for newline
      if (currentOffset + lineLength > offset) {
        return { line, character: offset - currentOffset } as Position;
      }
      currentOffset += lineLength;
    }

    // End of document
    return { line: lines.length - 1, character: lines[lines.length - 1].length } as Position;
  }
}

/**
 * Factory function to create a CollaborativeDocument
 */
export function createCollaborativeDocument(config: CollaborationConfig): CollaborativeDocument {
  return new CollaborativeDocument(config);
}
