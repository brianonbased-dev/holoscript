/**
 * @fileoverview Collaboration module exports
 * @module collaboration
 */

// Types
export * from './CollaborationTypes';

// Core classes
export { CollaborativeDocument, createCollaborativeDocument } from './CollaborativeDocument';
export { PresenceProvider, getPresenceProvider, disposePresenceProvider } from './PresenceProvider';
export {
  CollaborationSession,
  getCollaborationSession,
  disposeCollaborationSession,
} from './CollaborationSession';
export type { SessionState } from './CollaborationSession';

// Commands registration
export {
  registerCollaborationCommands,
  disposeCollaborationCommands,
} from './CollaborationCommands';
