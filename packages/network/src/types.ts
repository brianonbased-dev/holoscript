/**
 * Network Types for HoloScript Multiplayer
 */

/**
 * Unique identifier for network entities
 */
export type NetworkId = string;

/**
 * Unique identifier for peers/clients
 */
export type PeerId = string;

/**
 * Room/session identifier
 */
export type RoomId = string;

/**
 * Connection state
 */
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

/**
 * Network transport type
 */
export type TransportType = 'websocket' | 'webrtc' | 'hybrid';

/**
 * Sync mode for networked entities
 */
export type SyncMode = 'owner' | 'server' | 'shared';

/**
 * Message types for network protocol
 */
export type MessageType =
  | 'join'
  | 'leave'
  | 'sync'
  | 'spawn'
  | 'despawn'
  | 'rpc'
  | 'ownership'
  | 'ping'
  | 'pong'
  | 'state';

/**
 * Network message structure
 */
export interface NetworkMessage {
  type: MessageType;
  senderId: PeerId;
  timestamp: number;
  payload: unknown;
}

/**
 * Entity state for synchronization
 */
export interface EntityState {
  networkId: NetworkId;
  ownerId: PeerId;
  entityType: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number] | number;
  velocity?: [number, number, number];
  properties?: Record<string, unknown>;
  lastUpdated: number;
}

/**
 * Room state
 */
export interface RoomState {
  roomId: RoomId;
  peers: PeerInfo[];
  entities: Map<NetworkId, EntityState>;
  hostId: PeerId;
  createdAt: number;
}

/**
 * Peer information
 */
export interface PeerInfo {
  peerId: PeerId;
  displayName?: string;
  avatarUrl?: string;
  joinedAt: number;
  isHost: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

/**
 * Network configuration
 */
export interface NetworkConfig {
  /** Server URL for WebSocket connection */
  serverUrl?: string;
  /** Transport type to use */
  transport?: TransportType;
  /** Room ID to join (auto-generated if not provided) */
  roomId?: RoomId;
  /** Maximum number of peers in a room */
  maxPeers?: number;
  /** Sync rate in Hz (default: 20) */
  syncRate?: number;
  /** Enable interpolation for smooth movement */
  interpolation?: boolean;
  /** Interpolation delay in ms */
  interpolationDelay?: number;
  /** Enable prediction for local player */
  prediction?: boolean;
  /** ICE servers for WebRTC */
  iceServers?: RTCIceServer[];
  /** Debug mode */
  debug?: boolean;
}

/**
 * Networked entity configuration from @networked trait
 */
export interface NetworkedTraitConfig {
  /** Sync mode: owner (default), server, or shared */
  sync?: SyncMode;
  /** Properties to sync (default: position, rotation, scale) */
  properties?: string[];
  /** Sync rate override for this entity */
  syncRate?: number;
  /** Whether this entity persists when owner leaves */
  persistent?: boolean;
  /** Custom network ID (auto-generated if not provided) */
  networkId?: NetworkId;
}

/**
 * RPC (Remote Procedure Call) definition
 */
export interface RPCDefinition {
  name: string;
  target: 'server' | 'all' | 'owner' | PeerId;
  args?: unknown[];
}

/**
 * Network event types
 */
export interface NetworkEvents {
  connected: { peerId: PeerId };
  disconnected: { reason: string };
  peerJoined: { peer: PeerInfo };
  peerLeft: { peerId: PeerId };
  entitySpawned: { entity: EntityState };
  entityDespawned: { networkId: NetworkId };
  entityUpdated: { entity: EntityState };
  ownershipChanged: { networkId: NetworkId; newOwnerId: PeerId };
  rpc: { name: string; senderId: PeerId; args: unknown[] };
  error: { code: string; message: string };
  roomStateChanged: { state: RoomState };
}

/**
 * Network event callback
 */
export type NetworkEventCallback<T extends keyof NetworkEvents> = (
  event: NetworkEvents[T]
) => void;

/**
 * Transport interface for network implementations
 */
export interface NetworkTransport {
  connect(config: NetworkConfig): Promise<void>;
  disconnect(): void;
  send(message: NetworkMessage): void;
  onMessage(callback: (message: NetworkMessage) => void): void;
  getState(): ConnectionState;
  getPeerId(): PeerId | null;
}
