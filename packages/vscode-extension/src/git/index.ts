/**
 * @fileoverview Git integration module exports for HoloScript
 * @module git
 */

export * from './GitTypes';
export { SemanticGit } from './SemanticGit';
export { 
  DiffVisualizationProvider, 
  DiffDecorationProvider, 
  createDiffHoverProvider 
} from './DiffVisualization';
export { 
  MergeDriver, 
  HoloScriptGitHooks, 
  MergeConflictResolver 
} from './MergeDriver';
export { 
  registerGitCommands, 
  createGitStatusBarItem, 
  updateGitStatusBar 
} from './GitCommands';
