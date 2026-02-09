/**
 * @fileoverview Collaboration type definitions for real-time multi-user editing
 * @module collaboration/types
 */

import type { Position, Range, Selection, TextDocumentContentChangeEvent } from 'vscode';

/**
 * Unique identifier for a collaboration participant
 */
export type ParticipantId = string;

/**
 * Unique identifier for a collaboration session
 */
export type SessionId = string;

/**
 * Participant in a collaboration session
 */
export interface Participant {
  /** Unique identifier */
  id: ParticipantId;
  /** Display name */
  name: string;
  /** Avatar URL (optional) */
  avatar?: string;
  /** Assigned color for cursor/selection highlighting */
  color: string;
  /** Current cursor position */
  cursor?: CursorPosition;
  /** Current selection(s) */
  selections?: SelectionRange[];
  /** Connection status */
  status: 'connected' | 'disconnected' | 'idle';
  /** Last activity timestamp */
  lastActivity: number;
}

/**
 * Cursor position with line and character
 */
export interface CursorPosition {
  /** Line number (0-based) */
  line: number;
  /** Character offset (0-based) */
  character: number;
}

/**
 * Selection range with start and end positions
 */
export interface SelectionRange {
  /** Start position */
  start: CursorPosition;
  /** End position */
  end: CursorPosition;
  /** Whether the selection is reversed (anchor after active) */
  isReversed: boolean;
}

/**
 * Collaboration session configuration
 */
export interface CollaborationConfig {
  /** WebSocket server URL */
  serverUrl: string;
  /** Room/session identifier */
  roomId: string;
  /** Current user information */
  user: UserInfo;
  /** Reconnection settings */
  reconnect?: ReconnectConfig;
  /** Awareness update interval (ms) */
  awarenessUpdateInterval?: number;
}

/**
 * User information for session participants
 */
export interface UserInfo {
  /** User ID (typically from auth system) */
  id: string;
  /** Display name */
  name: string;
  /** Avatar URL */
  avatar?: string;
  /** Email (optional, for gravatar fallback) */
  email?: string;
}

/**
 * Reconnection configuration
 */
export interface ReconnectConfig {
  /** Maximum reconnection attempts */
  maxAttempts: number;
  /** Base delay between attempts (ms) */
  baseDelay: number;
  /** Maximum delay between attempts (ms) */
  maxDelay: number;
  /** Exponential backoff factor */
  backoffFactor: number;
}

/**
 * Session metadata
 */
export interface SessionInfo {
  /** Session ID */
  id: SessionId;
  /** Document URI being edited */
  documentUri: string;
  /** Session creation timestamp */
  createdAt: number;
  /** Current participants */
  participants: Participant[];
  /** Session permissions */
  permissions: SessionPermissions;
}

/**
 * Session permission levels
 */
export interface SessionPermissions {
  /** Can edit the document */
  canEdit: boolean;
  /** Can view the document */
  canView: boolean;
  /** Can add comments */
  canComment: boolean;
  /** Can invite others */
  canInvite: boolean;
  /** Is session owner */
  isOwner: boolean;
}

/**
 * Permission level enum
 */
export type PermissionLevel = 'owner' | 'edit' | 'comment' | 'view';

/**
 * Awareness state for a participant
 */
export interface AwarenessState {
  /** Participant info */
  user: Participant;
  /** Current cursor position */
  cursor: CursorPosition | null;
  /** Current selections */
  selections: SelectionRange[];
  /** Currently editing range (for section locking) */
  editingRange?: SelectionRange;
  /** Timestamp of last update */
  timestamp: number;
}

/**
 * Operation types for conflict resolution
 */
export type OperationType = 'insert' | 'delete' | 'retain';

/**
 * Text operation for OT/CRDT
 */
export interface TextOperation {
  /** Operation type */
  type: OperationType;
  /** Position where operation applies */
  position: number;
  /** Text content (for insert) */
  text?: string;
  /** Length (for delete/retain) */
  length?: number;
  /** Operation metadata */
  metadata?: OperationMetadata;
}

/**
 * Metadata attached to operations
 */
export interface OperationMetadata {
  /** User who performed the operation */
  userId: ParticipantId;
  /** Timestamp of operation */
  timestamp: number;
  /** Client-side operation ID */
  clientId: string;
}

/**
 * Merge result from conflict resolution
 */
export interface MergeResult {
  /** Merged content */
  content: string;
  /** Whether there were conflicts */
  hasConflicts: boolean;
  /** Conflict markers (if any) */
  conflicts: ConflictMarker[];
}

/**
 * Conflict marker for unresolved conflicts
 */
export interface ConflictMarker {
  /** Start line of conflict */
  startLine: number;
  /** End line of conflict */
  endLine: number;
  /** Local version */
  local: string;
  /** Remote version */
  remote: string;
  /** Base version (if available) */
  base?: string;
}

/**
 * Inline comment attached to code
 */
export interface InlineComment {
  /** Comment ID */
  id: string;
  /** Author */
  author: UserInfo;
  /** Comment text */
  text: string;
  /** Position in document */
  range: SelectionRange;
  /** Creation timestamp */
  createdAt: number;
  /** Last update timestamp */
  updatedAt: number;
  /** Replies to this comment */
  replies: CommentReply[];
  /** Resolved status */
  resolved: boolean;
}

/**
 * Reply to an inline comment
 */
export interface CommentReply {
  /** Reply ID */
  id: string;
  /** Author */
  author: UserInfo;
  /** Reply text */
  text: string;
  /** Creation timestamp */
  createdAt: number;
}

/**
 * Section lock for exclusive editing
 */
export interface SectionLock {
  /** Lock ID */
  id: string;
  /** User holding the lock */
  userId: ParticipantId;
  /** Locked range */
  range: SelectionRange;
  /** Lock expiration timestamp */
  expiresAt: number;
  /** Lock reason (optional) */
  reason?: string;
}

/**
 * Events emitted by collaboration system
 */
export interface CollaborationEvents {
  /** Session joined */
  'session:joined': (session: SessionInfo) => void;
  /** Session left */
  'session:left': (reason: string) => void;
  /** Participant joined */
  'participant:joined': (participant: Participant) => void;
  /** Participant left */
  'participant:left': (participant: Participant) => void;
  /** Participant updated cursor/selection */
  'participant:updated': (participant: Participant) => void;
  /** Document content changed */
  'document:changed': (changes: TextDocumentContentChangeEvent[]) => void;
  /** Document synced from remote */
  'document:synced': () => void;
  /** Comment added */
  'comment:added': (comment: InlineComment) => void;
  /** Comment updated */
  'comment:updated': (comment: InlineComment) => void;
  /** Comment resolved */
  'comment:resolved': (commentId: string) => void;
  /** Section locked */
  'lock:acquired': (lock: SectionLock) => void;
  /** Section unlocked */
  'lock:released': (lockId: string) => void;
  /** Connection status changed */
  'connection:status': (status: ConnectionStatus) => void;
  /** Error occurred */
  'error': (error: CollaborationError) => void;
}

/**
 * Connection status
 */
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

/**
 * Collaboration error
 */
export interface CollaborationError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Original error (if any) */
  cause?: Error;
  /** Whether the error is recoverable */
  recoverable: boolean;
}

/**
 * Predefined participant colors for visual distinction
 */
export const PARTICIPANT_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Gold
  '#BB8FCE', // Purple
  '#85C1E9', // Light Blue
] as const;

/**
 * Get a color for a participant based on their index
 */
export function getParticipantColor(index: number): string {
  return PARTICIPANT_COLORS[index % PARTICIPANT_COLORS.length];
}

/**
 * Default reconnection configuration
 */
export const DEFAULT_RECONNECT_CONFIG: ReconnectConfig = {
  maxAttempts: 10,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 1.5,
};

/**
 * Default awareness update interval (ms)
 */
export const DEFAULT_AWARENESS_INTERVAL = 100;
