/**
 * @fileoverview Tests for collaboration module
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type {
  Participant,
  CursorPosition,
  SelectionRange,
  CollaborationConfig,
  SessionInfo,
  AwarenessState,
  InlineComment,
  SectionLock,
  MergeResult,
  TextOperation,
} from '../collaboration/CollaborationTypes';
import {
  PARTICIPANT_COLORS,
  getParticipantColor,
  DEFAULT_RECONNECT_CONFIG,
  DEFAULT_AWARENESS_INTERVAL,
} from '../collaboration/CollaborationTypes';

// Mock vscode module
vi.mock('vscode', () => ({
  window: {
    createOutputChannel: vi.fn(() => ({
      appendLine: vi.fn(),
      dispose: vi.fn(),
    })),
    createStatusBarItem: vi.fn(() => ({
      text: '',
      show: vi.fn(),
      hide: vi.fn(),
      dispose: vi.fn(),
    })),
    onDidChangeActiveTextEditor: vi.fn(() => ({ dispose: vi.fn() })),
    onDidChangeTextEditorSelection: vi.fn(() => ({ dispose: vi.fn() })),
    activeTextEditor: undefined,
    showInformationMessage: vi.fn().mockResolvedValue(undefined),
    showWarningMessage: vi.fn().mockResolvedValue(undefined),
    showErrorMessage: vi.fn().mockResolvedValue(undefined),
    showInputBox: vi.fn().mockResolvedValue(undefined),
    showQuickPick: vi.fn().mockResolvedValue(undefined),
  },
  workspace: {
    onDidChangeTextDocument: vi.fn(() => ({ dispose: vi.fn() })),
    openTextDocument: vi.fn(),
    getConfiguration: vi.fn(() => ({
      get: vi.fn(),
    })),
  },
  commands: {
    registerCommand: vi.fn(() => ({ dispose: vi.fn() })),
    executeCommand: vi.fn(),
  },
  authentication: {
    getSession: vi.fn().mockResolvedValue(null),
  },
  env: {
    clipboard: {
      writeText: vi.fn().mockResolvedValue(undefined),
    },
  },
  Position: class {
    constructor(public line: number, public character: number) {}
  },
  Range: class {
    constructor(public start: { line: number; character: number }, public end: { line: number; character: number }) {}
  },
  Selection: class {
    constructor(
      public anchor: { line: number; character: number },
      public active: { line: number; character: number }
    ) {}
    get start() { return this.anchor; }
    get end() { return this.active; }
    get isReversed() { return false; }
  },
  StatusBarAlignment: { Right: 2 },
  ThemeColor: class { constructor(public id: string) {} },
  EventEmitter: class {
    private handlers = new Map();
    event = (handler: Function) => {
      return { dispose: vi.fn() };
    };
    fire() {}
    dispose() {}
  },
}));

// Mock yjs
vi.mock('yjs', () => ({
  Doc: class {
    getText() {
      return {
        toString: () => '',
        insert: vi.fn(),
        delete: vi.fn(),
        observe: vi.fn(),
        unobserve: vi.fn(),
      };
    }
    on() {}
    off() {}
    destroy() {}
  },
}));

// Mock y-websocket
vi.mock('y-websocket', () => ({
  WebsocketProvider: class {
    awareness = {
      clientID: 1,
      getLocalState: () => null,
      setLocalState: vi.fn(),
      setLocalStateField: vi.fn(),
      getStates: () => new Map(),
      on: vi.fn(),
      off: vi.fn(),
    };
    wsconnected = true;
    on() {}
    off() {}
    connect() {}
    disconnect() {}
    destroy() {}
  },
}));

describe('CollaborationTypes', () => {
  describe('PARTICIPANT_COLORS', () => {
    it('should have 10 predefined colors', () => {
      expect(PARTICIPANT_COLORS).toHaveLength(10);
    });

    it('should contain valid hex color codes', () => {
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
      for (const color of PARTICIPANT_COLORS) {
        expect(color).toMatch(hexColorRegex);
      }
    });
  });

  describe('getParticipantColor', () => {
    it('should return colors based on index', () => {
      expect(getParticipantColor(0)).toBe(PARTICIPANT_COLORS[0]);
      expect(getParticipantColor(5)).toBe(PARTICIPANT_COLORS[5]);
    });

    it('should wrap around when index exceeds array length', () => {
      expect(getParticipantColor(10)).toBe(PARTICIPANT_COLORS[0]);
      expect(getParticipantColor(15)).toBe(PARTICIPANT_COLORS[5]);
    });
  });

  describe('DEFAULT_RECONNECT_CONFIG', () => {
    it('should have reasonable default values', () => {
      expect(DEFAULT_RECONNECT_CONFIG.maxAttempts).toBe(10);
      expect(DEFAULT_RECONNECT_CONFIG.baseDelay).toBe(1000);
      expect(DEFAULT_RECONNECT_CONFIG.maxDelay).toBe(30000);
      expect(DEFAULT_RECONNECT_CONFIG.backoffFactor).toBe(1.5);
    });
  });

  describe('DEFAULT_AWARENESS_INTERVAL', () => {
    it('should be 100ms', () => {
      expect(DEFAULT_AWARENESS_INTERVAL).toBe(100);
    });
  });
});

describe('CollaborativeDocument', () => {
  let CollaborativeDocument: typeof import('../collaboration/CollaborativeDocument').CollaborativeDocument;
  let createCollaborativeDocument: typeof import('../collaboration/CollaborativeDocument').createCollaborativeDocument;

  beforeEach(async () => {
    const module = await import('../collaboration/CollaborativeDocument');
    CollaborativeDocument = module.CollaborativeDocument;
    createCollaborativeDocument = module.createCollaborativeDocument;
  });

  describe('constructor', () => {
    it('should create an instance with config', () => {
      const config: CollaborationConfig = {
        serverUrl: 'wss://test.server.com',
        roomId: 'test-room',
        user: { id: 'user1', name: 'Test User' },
      };

      const doc = createCollaborativeDocument(config);
      expect(doc).toBeInstanceOf(CollaborativeDocument);
      expect(doc.getConnectionStatus()).toBe('disconnected');
    });
  });

  describe('getContent', () => {
    it('should return empty string when not connected', () => {
      const config: CollaborationConfig = {
        serverUrl: 'wss://test.server.com',
        roomId: 'test-room',
        user: { id: 'user1', name: 'Test User' },
      };

      const doc = createCollaborativeDocument(config);
      expect(doc.getContent()).toBe('');
    });
  });

  describe('getVersion', () => {
    it('should start at 0', () => {
      const config: CollaborationConfig = {
        serverUrl: 'wss://test.server.com',
        roomId: 'test-room',
        user: { id: 'user1', name: 'Test User' },
      };

      const doc = createCollaborativeDocument(config);
      expect(doc.getVersion()).toBe(0);
    });
  });

  describe('isConnected', () => {
    it('should return false when not connected', () => {
      const config: CollaborationConfig = {
        serverUrl: 'wss://test.server.com',
        roomId: 'test-room',
        user: { id: 'user1', name: 'Test User' },
      };

      const doc = createCollaborativeDocument(config);
      expect(doc.isConnected()).toBe(false);
    });
  });

  describe('getParticipants', () => {
    it('should return empty array when not connected', () => {
      const config: CollaborationConfig = {
        serverUrl: 'wss://test.server.com',
        roomId: 'test-room',
        user: { id: 'user1', name: 'Test User' },
      };

      const doc = createCollaborativeDocument(config);
      expect(doc.getParticipants()).toEqual([]);
    });
  });
});

describe('PresenceProvider', () => {
  let PresenceProvider: typeof import('../collaboration/PresenceProvider').PresenceProvider;
  let getPresenceProvider: typeof import('../collaboration/PresenceProvider').getPresenceProvider;
  let disposePresenceProvider: typeof import('../collaboration/PresenceProvider').disposePresenceProvider;

  beforeEach(async () => {
    const module = await import('../collaboration/PresenceProvider');
    PresenceProvider = module.PresenceProvider;
    getPresenceProvider = module.getPresenceProvider;
    disposePresenceProvider = module.disposePresenceProvider;
    
    // Reset singleton
    disposePresenceProvider();
  });

  afterEach(() => {
    disposePresenceProvider();
  });

  describe('constructor', () => {
    it('should create an instance', () => {
      const provider = new PresenceProvider();
      expect(provider).toBeInstanceOf(PresenceProvider);
      provider.dispose();
    });
  });

  describe('getPresenceProvider', () => {
    it('should return singleton instance', () => {
      const provider1 = getPresenceProvider();
      const provider2 = getPresenceProvider();
      expect(provider1).toBe(provider2);
    });
  });

  describe('getParticipants', () => {
    it('should return empty array initially', () => {
      const provider = new PresenceProvider();
      expect(provider.getParticipants()).toEqual([]);
      provider.dispose();
    });
  });
});

describe('CollaborationSession', () => {
  let CollaborationSession: typeof import('../collaboration/CollaborationSession').CollaborationSession;
  let getCollaborationSession: typeof import('../collaboration/CollaborationSession').getCollaborationSession;
  let disposeCollaborationSession: typeof import('../collaboration/CollaborationSession').disposeCollaborationSession;

  beforeEach(async () => {
    const module = await import('../collaboration/CollaborationSession');
    CollaborationSession = module.CollaborationSession;
    getCollaborationSession = module.getCollaborationSession;
    disposeCollaborationSession = module.disposeCollaborationSession;
    
    // Reset singleton
    disposeCollaborationSession();
  });

  afterEach(() => {
    disposeCollaborationSession();
  });

  describe('constructor', () => {
    it('should create a session with inactive state', () => {
      const session = new CollaborationSession();
      expect(session.isActive()).toBe(false);
      expect(session.getState().isActive).toBe(false);
      expect(session.getState().sessionId).toBeNull();
      session.dispose();
    });
  });

  describe('getCollaborationSession', () => {
    it('should return singleton instance', () => {
      const session1 = getCollaborationSession();
      const session2 = getCollaborationSession();
      expect(session1).toBe(session2);
    });
  });

  describe('getShareUrl', () => {
    it('should return null when no session active', () => {
      const session = new CollaborationSession();
      expect(session.getShareUrl()).toBeNull();
      session.dispose();
    });
  });

  describe('endSession', () => {
    it('should do nothing if no session active', async () => {
      const session = new CollaborationSession();
      await session.endSession(); // Should not throw
      expect(session.isActive()).toBe(false);
      session.dispose();
    });
  });
});

describe('Participant Type', () => {
  it('should have all required fields', () => {
    const participant: Participant = {
      id: 'test-id',
      name: 'Test User',
      color: '#FF6B6B',
      status: 'connected',
      lastActivity: Date.now(),
    };

    expect(participant.id).toBe('test-id');
    expect(participant.name).toBe('Test User');
    expect(participant.color).toBe('#FF6B6B');
    expect(participant.status).toBe('connected');
    expect(typeof participant.lastActivity).toBe('number');
  });

  it('should support optional fields', () => {
    const participant: Participant = {
      id: 'test-id',
      name: 'Test User',
      avatar: 'https://example.com/avatar.png',
      color: '#FF6B6B',
      cursor: { line: 10, character: 5 },
      selections: [
        { start: { line: 10, character: 0 }, end: { line: 10, character: 10 }, isReversed: false },
      ],
      status: 'connected',
      lastActivity: Date.now(),
    };

    expect(participant.avatar).toBe('https://example.com/avatar.png');
    expect(participant.cursor?.line).toBe(10);
    expect(participant.cursor?.character).toBe(5);
    expect(participant.selections).toHaveLength(1);
  });
});

describe('CursorPosition Type', () => {
  it('should represent a position in the document', () => {
    const cursor: CursorPosition = {
      line: 42,
      character: 15,
    };

    expect(cursor.line).toBe(42);
    expect(cursor.character).toBe(15);
  });
});

describe('SelectionRange Type', () => {
  it('should represent a selection in the document', () => {
    const selection: SelectionRange = {
      start: { line: 10, character: 0 },
      end: { line: 15, character: 20 },
      isReversed: false,
    };

    expect(selection.start.line).toBe(10);
    expect(selection.end.line).toBe(15);
    expect(selection.isReversed).toBe(false);
  });

  it('should support reversed selections', () => {
    const selection: SelectionRange = {
      start: { line: 10, character: 0 },
      end: { line: 5, character: 20 },
      isReversed: true,
    };

    expect(selection.isReversed).toBe(true);
  });
});

describe('InlineComment Type', () => {
  it('should represent a comment on code', () => {
    const comment: InlineComment = {
      id: 'comment-1',
      author: { id: 'user1', name: 'Alice' },
      text: 'Should we refactor this?',
      range: {
        start: { line: 10, character: 0 },
        end: { line: 12, character: 0 },
        isReversed: false,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      replies: [],
      resolved: false,
    };

    expect(comment.id).toBe('comment-1');
    expect(comment.author.name).toBe('Alice');
    expect(comment.text).toBe('Should we refactor this?');
    expect(comment.resolved).toBe(false);
    expect(comment.replies).toHaveLength(0);
  });
});

describe('SectionLock Type', () => {
  it('should represent a locked section', () => {
    const lock: SectionLock = {
      id: 'lock-1',
      userId: 'user1',
      range: {
        start: { line: 20, character: 0 },
        end: { line: 30, character: 0 },
        isReversed: false,
      },
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      reason: 'Refactoring this section',
    };

    expect(lock.id).toBe('lock-1');
    expect(lock.userId).toBe('user1');
    expect(lock.reason).toBe('Refactoring this section');
    expect(lock.expiresAt).toBeGreaterThan(Date.now());
  });
});

describe('TextOperation Type', () => {
  it('should represent an insert operation', () => {
    const op: TextOperation = {
      type: 'insert',
      position: 100,
      text: 'Hello, World!',
    };

    expect(op.type).toBe('insert');
    expect(op.position).toBe(100);
    expect(op.text).toBe('Hello, World!');
  });

  it('should represent a delete operation', () => {
    const op: TextOperation = {
      type: 'delete',
      position: 50,
      length: 10,
    };

    expect(op.type).toBe('delete');
    expect(op.position).toBe(50);
    expect(op.length).toBe(10);
  });

  it('should represent a retain operation', () => {
    const op: TextOperation = {
      type: 'retain',
      position: 0,
      length: 100,
    };

    expect(op.type).toBe('retain');
    expect(op.length).toBe(100);
  });
});

describe('MergeResult Type', () => {
  it('should represent a successful merge', () => {
    const result: MergeResult = {
      content: 'Merged content here',
      hasConflicts: false,
      conflicts: [],
    };

    expect(result.hasConflicts).toBe(false);
    expect(result.conflicts).toHaveLength(0);
  });

  it('should represent a merge with conflicts', () => {
    const result: MergeResult = {
      content: '<<<<<<\nlocal\n======\nremote\n>>>>>>',
      hasConflicts: true,
      conflicts: [
        {
          startLine: 10,
          endLine: 14,
          local: 'local version',
          remote: 'remote version',
          base: 'base version',
        },
      ],
    };

    expect(result.hasConflicts).toBe(true);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].local).toBe('local version');
    expect(result.conflicts[0].remote).toBe('remote version');
  });
});
