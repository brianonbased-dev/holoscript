/**
 * @holoscript/network
 *
 * Multiplayer networking for HoloScript
 *
 * Provides WebSocket and WebRTC transports for synchronizing
 * @networked entities across clients.
 *
 * @example
 * ```typescript
 * import { createNetworkManager } from '@holoscript/network';
 *
 * const network = createNetworkManager();
 *
 * // Connect to a room
 * const roomId = await network.connect({
 *   serverUrl: 'wss://your-server.com',
 *   transport: 'websocket',
 *   syncRate: 20,
 * });
 *
 * // Register a networked entity
 * const networkId = network.registerEntity(mesh, 'player', {
 *   sync: 'owner',
 *   properties: ['position', 'rotation'],
 * });
 *
 * // Update entity state (will sync to other peers)
 * network.updateEntity(networkId, {
 *   position: [1, 0, 0],
 *   rotation: [0, 45, 0],
 * });
 *
 * // Listen for events
 * network.on('peerJoined', (event) => {
 *   console.log('Peer joined:', event.peer.peerId);
 * });
 *
 * network.on('entitySpawned', (event) => {
 *   console.log('Remote entity spawned:', event.entity.networkId);
 * });
 * ```
 */

// Main exports
export { NetworkManager, createNetworkManager } from './NetworkManager';

// Transports
export { WebSocketTransport } from './WebSocketTransport';
export { WebRTCTransport } from './WebRTCTransport';

// Signaling server (for Node.js environments)
export { createSignalingServer } from './SignalingServer';
export type { SignalingServer, SignalingServerOptions } from './SignalingServer';

// Types
export type {
  // Identifiers
  NetworkId,
  PeerId,
  RoomId,
  // States
  ConnectionState,
  TransportType,
  SyncMode,
  // Messages
  MessageType,
  NetworkMessage,
  // Entities
  EntityState,
  // Room
  RoomState,
  PeerInfo,
  // Configuration
  NetworkConfig,
  NetworkedTraitConfig,
  RPCDefinition,
  // Events
  NetworkEvents,
  NetworkEventCallback,
  // Transport interface
  NetworkTransport,
} from './types';
