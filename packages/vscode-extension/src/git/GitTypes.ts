/**
 * @fileoverview Git integration type definitions for HoloScript
 * @module git/types
 */

import type { DiffChange, ChangeType } from '@holoscript/sdk';

/**
 * Represents a node in the scene graph for diffing
 */
export interface SceneNode {
  /** Node type (object, group, light, camera, etc.) */
  type: string;
  /** Node identifier */
  id: string;
  /** Node name */
  name?: string;
  /** Parent node ID */
  parentId?: string;
  /** Position in 3D space */
  position?: [number, number, number];
  /** Rotation (euler angles or quaternion) */
  rotation?: [number, number, number] | [number, number, number, number];
  /** Scale */
  scale?: [number, number, number];
  /** Applied traits */
  traits?: string[];
  /** Additional properties */
  properties?: Record<string, unknown>;
  /** Source location in file */
  sourceRange?: {
    startLine: number;
    endLine: number;
    startColumn: number;
    endColumn: number;
  };
}

/**
 * Transform information for moved nodes
 */
export interface Transform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

/**
 * A change in a scene property
 */
export interface PropertyChange {
  /** Property path (e.g., "position.x", "traits[0]") */
  path: string;
  /** Old value */
  oldValue: unknown;
  /** New value */
  newValue: unknown;
  /** Whether this is a significant change */
  significant: boolean;
}

/**
 * Scene-level diff result
 */
export interface SceneDiff {
  /** Nodes that were added */
  added: SceneNode[];
  /** Nodes that were removed */
  removed: SceneNode[];
  /** Nodes that were modified */
  modified: {
    before: SceneNode;
    after: SceneNode;
    changes: PropertyChange[];
  }[];
  /** Nodes that were moved/reparented */
  moved: {
    node: SceneNode;
    from: Transform;
    to: Transform;
    parentChanged: boolean;
  }[];
  /** Nodes that were renamed */
  renamed: {
    oldId: string;
    newId: string;
    node: SceneNode;
  }[];
  /** Total number of changes */
  totalChanges: number;
  /** Whether scenes are equivalent */
  equivalent: boolean;
}

/**
 * Highlight for diff visualization
 */
export interface DiffHighlight {
  /** Type of change */
  type: ChangeType;
  /** Node being highlighted */
  nodeId: string;
  /** Highlight color */
  color: string;
  /** Optional label */
  label?: string;
  /** Tooltip text */
  tooltip?: string;
}

/**
 * Visual diff representation
 */
export interface DiffVisualization {
  /** Scene for "before" state */
  beforeScene: SceneNode[];
  /** Scene for "after" state */
  afterScene: SceneNode[];
  /** Highlights showing changes */
  highlights: DiffHighlight[];
  /** Summary text */
  summary: string;
  /** Detailed change list */
  changeList: {
    type: ChangeType;
    description: string;
    nodeId?: string;
    sourceLine?: number;
  }[];
}

/**
 * Conflict in a merge
 */
export interface MergeConflict {
  /** Conflict ID */
  id: string;
  /** Path to conflicting element */
  path: string;
  /** Node ID involved */
  nodeId?: string;
  /** Our version */
  ours: unknown;
  /** Their version */
  theirs: unknown;
  /** Base version */
  base: unknown;
  /** Conflict type */
  type: 'property' | 'structure' | 'delete-modify' | 'add-add';
  /** Auto-resolution possible */
  autoResolvable: boolean;
  /** Suggested resolution */
  suggestedResolution?: unknown;
}

/**
 * Result of a three-way merge
 */
export interface MergeResult {
  /** Merged content (HoloScript source) */
  content: string;
  /** Merged scene (if no conflicts) */
  scene?: SceneNode[];
  /** Whether merge succeeded without conflicts */
  success: boolean;
  /** Conflicts that need manual resolution */
  conflicts: MergeConflict[];
  /** Changes from our side that were applied */
  oursApplied: number;
  /** Changes from their side that were applied */
  theirsApplied: number;
  /** Whether base was available */
  hasBase: boolean;
}

/**
 * Git hook result
 */
export interface HookResult {
  /** Whether hook passed */
  passed: boolean;
  /** Error messages (if failed) */
  errors: string[];
  /** Warning messages */
  warnings: string[];
  /** Files that were modified/fixed */
  modifiedFiles: string[];
}

/**
 * Commit information
 */
export interface Commit {
  /** Commit SHA */
  sha: string;
  /** Commit message */
  message: string;
  /** Author name */
  author: string;
  /** Author email */
  email: string;
  /** Commit timestamp */
  timestamp: number;
  /** Files changed */
  files: string[];
}

/**
 * Git status for a HoloScript file
 */
export interface HoloScriptGitStatus {
  /** File path */
  filePath: string;
  /** Git status (modified, added, deleted, etc.) */
  status: 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked' | 'conflict';
  /** Staged changes */
  staged: boolean;
  /** Has merge conflicts */
  hasConflicts: boolean;
  /** Semantic diff summary (if modified) */
  diffSummary?: {
    added: number;
    removed: number;
    modified: number;
    moved: number;
  };
}

/**
 * Diff view mode
 */
export type DiffViewMode = 'unified' | 'split' | '3d-preview' | 'side-by-side';

/**
 * Configuration for git integration
 */
export interface GitIntegrationConfig {
  /** Enable semantic diff */
  enableSemanticDiff: boolean;
  /** Enable 3D diff preview */
  enable3DPreview: boolean;
  /** Auto-format on commit */
  formatOnCommit: boolean;
  /** Validate on commit */
  validateOnCommit: boolean;
  /** Custom merge driver path */
  mergeDriverPath?: string;
  /** Ignore patterns for diff */
  ignorePatterns: string[];
}

/**
 * Default git integration config
 */
export const DEFAULT_GIT_CONFIG: GitIntegrationConfig = {
  enableSemanticDiff: true,
  enable3DPreview: true,
  formatOnCommit: true,
  validateOnCommit: true,
  ignorePatterns: ['*.holo.bak', '*.holo.tmp'],
};

/**
 * Colors for diff highlighting
 */
export const DIFF_COLORS = {
  added: '#4CAF50',
  removed: '#F44336',
  modified: '#FF9800',
  moved: '#2196F3',
  renamed: '#9C27B0',
  unchanged: '#9E9E9E',
} as const;
