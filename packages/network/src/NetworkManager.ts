/**
 * Network Manager for HoloScript Multiplayer
 *
 * Central manager for networked entities, synchronization,
 * and peer coordination.
 */

import type {
  NetworkConfig,
  NetworkTransport,
  NetworkMessage,
  NetworkId,
  PeerId,
  RoomId,
  EntityState,
  RoomState,
  PeerInfo,
  NetworkedTraitConfig,
  NetworkEvents,
  NetworkEventCallback,
  ConnectionState,
} from './types';
import { WebSocketTransport } from './WebSocketTransport';
import { WebRTCTransport } from './WebRTCTransport';

/**
 * Generate a unique network ID
 */
function generateNetworkId(): NetworkId {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a unique room ID
 */
function generateRoomId(): RoomId {
  return Math.random().toString(36).substr(2, 8).toUpperCase();
}

/**
 * Network Manager
 *
 * Handles multiplayer networking for HoloScript worlds.
 */
export class NetworkManager {
  private transport: NetworkTransport | null = null;
  private config: NetworkConfig | null = null;
  private entities: Map<NetworkId, EntityState> = new Map();
  private localEntities: Set<NetworkId> = new Set();
  private peers: Map<PeerId, PeerInfo> = new Map();
  private eventListeners: Map<keyof NetworkEvents, Set<NetworkEventCallback<keyof NetworkEvents>>> =
    new Map();
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private interpolationBuffer: Map<NetworkId, EntityState[]> = new Map();
  private roomState: RoomState | null = null;
  private isHost = false;
  private debug = false;

  /**
   * Connect to a multiplayer session
   */
  async connect(config: NetworkConfig): Promise<RoomId> {
    this.config = {
      transport: 'websocket',
      syncRate: 20,
      interpolation: true,
      interpolationDelay: 100,
      prediction: true,
      maxPeers: 16,
      ...config,
    };

    this.debug = config.debug ?? false;

    // Create transport based on config
    switch (this.config.transport) {
      case 'webrtc':
        this.transport = new WebRTCTransport();
        break;
      case 'websocket':
      default:
        this.transport = new WebSocketTransport();
        break;
    }

    // Set up message handler
    this.transport.onMessage(this.handleMessage.bind(this));

    // Connect to server
    await this.transport.connect(this.config);

    const peerId = this.transport.getPeerId();
    if (!peerId) {
      throw new Error('Failed to get peer ID');
    }

    // Generate or use provided room ID
    const roomId = this.config.roomId ?? generateRoomId();

    // Initialize room state
    this.roomState = {
      roomId,
      peers: [],
      entities: this.entities,
      hostId: peerId, // First to connect is host
      createdAt: Date.now(),
    };

    // Add self to peers
    const selfInfo: PeerInfo = {
      peerId,
      joinedAt: Date.now(),
      isHost: true,
    };
    this.peers.set(peerId, selfInfo);
    this.isHost = true;

    // Start sync loop
    this.startSyncLoop();

    // Emit connected event
    this.emit('connected', { peerId });

    if (this.debug) {
      console.log(`[NetworkManager] Connected to room ${roomId} as ${peerId}`);
    }

    return roomId;
  }

  /**
   * Disconnect from the session
   */
  disconnect(): void {
    this.stopSyncLoop();

    if (this.transport) {
      this.transport.disconnect();
      this.transport = null;
    }

    // Clean up local state
    this.entities.clear();
    this.localEntities.clear();
    this.peers.clear();
    this.interpolationBuffer.clear();
    this.roomState = null;
    this.isHost = false;

    this.emit('disconnected', { reason: 'Client disconnected' });
  }

  /**
   * Register a networked entity
   */
  registerEntity(
    entityRef: unknown,
    entityType: string,
    config: NetworkedTraitConfig = {}
  ): NetworkId {
    const networkId = config.networkId ?? generateNetworkId();
    const peerId = this.transport?.getPeerId();

    if (!peerId) {
      throw new Error('Not connected to network');
    }

    const entityState: EntityState = {
      networkId,
      ownerId: peerId,
      entityType,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      properties: {},
      lastUpdated: Date.now(),
    };

    this.entities.set(networkId, entityState);
    this.localEntities.add(networkId);

    // Store reference in userData
    if (entityRef && typeof entityRef === 'object') {
      (entityRef as Record<string, unknown>).userData = {
        ...(entityRef as Record<string, unknown>).userData as object,
        networkId,
        networkedConfig: config,
      };
    }

    // Broadcast spawn to other peers
    this.broadcast({
      type: 'spawn',
      senderId: peerId,
      timestamp: Date.now(),
      payload: entityState,
    });

    this.emit('entitySpawned', { entity: entityState });

    if (this.debug) {
      console.log(`[NetworkManager] Registered entity ${networkId} (${entityType})`);
    }

    return networkId;
  }

  /**
   * Unregister a networked entity
   */
  unregisterEntity(networkId: NetworkId): void {
    const entity = this.entities.get(networkId);
    if (!entity) return;

    const peerId = this.transport?.getPeerId();

    // Only owner can unregister
    if (entity.ownerId !== peerId) {
      console.warn(`[NetworkManager] Cannot unregister entity ${networkId}: not owner`);
      return;
    }

    this.entities.delete(networkId);
    this.localEntities.delete(networkId);
    this.interpolationBuffer.delete(networkId);

    // Broadcast despawn
    if (peerId) {
      this.broadcast({
        type: 'despawn',
        senderId: peerId,
        timestamp: Date.now(),
        payload: { networkId },
      });
    }

    this.emit('entityDespawned', { networkId });
  }

  /**
   * Update entity state locally
   */
  updateEntity(
    networkId: NetworkId,
    update: Partial<Omit<EntityState, 'networkId' | 'ownerId'>>
  ): void {
    const entity = this.entities.get(networkId);
    if (!entity) return;

    // Merge update
    Object.assign(entity, update, { lastUpdated: Date.now() });
  }

  /**
   * Get entity state
   */
  getEntity(networkId: NetworkId): EntityState | undefined {
    return this.entities.get(networkId);
  }

  /**
   * Get all entities
   */
  getAllEntities(): EntityState[] {
    return Array.from(this.entities.values());
  }

  /**
   * Get entities owned by a specific peer
   */
  getEntitiesByOwner(ownerId: PeerId): EntityState[] {
    return Array.from(this.entities.values()).filter((e) => e.ownerId === ownerId);
  }

  /**
   * Request ownership of an entity
   */
  requestOwnership(networkId: NetworkId): void {
    const peerId = this.transport?.getPeerId();
    if (!peerId) return;

    const entity = this.entities.get(networkId);
    if (!entity) return;

    // Send ownership request
    this.broadcast({
      type: 'ownership',
      senderId: peerId,
      timestamp: Date.now(),
      payload: {
        networkId,
        requesterId: peerId,
        currentOwnerId: entity.ownerId,
      },
    });
  }

  /**
   * Send an RPC (Remote Procedure Call)
   */
  sendRPC(name: string, target: 'all' | 'server' | PeerId, args: unknown[] = []): void {
    const peerId = this.transport?.getPeerId();
    if (!peerId) return;

    this.broadcast({
      type: 'rpc',
      senderId: peerId,
      timestamp: Date.now(),
      payload: {
        name,
        target,
        args,
      },
    });

    if (this.debug) {
      console.log(`[NetworkManager] Sent RPC "${name}" to ${target}`);
    }
  }

  /**
   * Get interpolated state for an entity
   */
  getInterpolatedState(
    networkId: NetworkId,
    currentTime: number
  ): EntityState | undefined {
    if (!this.config?.interpolation) {
      return this.entities.get(networkId);
    }

    const buffer = this.interpolationBuffer.get(networkId);
    if (!buffer || buffer.length < 2) {
      return this.entities.get(networkId);
    }

    const renderTime = currentTime - (this.config.interpolationDelay ?? 100);

    // Find two states to interpolate between
    let older: EntityState | null = null;
    let newer: EntityState | null = null;

    for (let i = buffer.length - 1; i >= 0; i--) {
      if (buffer[i].lastUpdated <= renderTime) {
        older = buffer[i];
        newer = buffer[i + 1] ?? buffer[i];
        break;
      }
    }

    if (!older || !newer || older === newer) {
      return buffer[buffer.length - 1];
    }

    // Calculate interpolation factor
    const totalTime = newer.lastUpdated - older.lastUpdated;
    const elapsed = renderTime - older.lastUpdated;
    const t = Math.max(0, Math.min(1, elapsed / totalTime));

    // Interpolate position
    const interpolated: EntityState = { ...newer };

    if (older.position && newer.position) {
      interpolated.position = [
        older.position[0] + (newer.position[0] - older.position[0]) * t,
        older.position[1] + (newer.position[1] - older.position[1]) * t,
        older.position[2] + (newer.position[2] - older.position[2]) * t,
      ];
    }

    // Interpolate rotation (simple linear - could use quaternion slerp)
    if (older.rotation && newer.rotation) {
      interpolated.rotation = [
        older.rotation[0] + (newer.rotation[0] - older.rotation[0]) * t,
        older.rotation[1] + (newer.rotation[1] - older.rotation[1]) * t,
        older.rotation[2] + (newer.rotation[2] - older.rotation[2]) * t,
      ];
    }

    return interpolated;
  }

  /**
   * Add event listener
   */
  on<T extends keyof NetworkEvents>(event: T, callback: NetworkEventCallback<T>): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback as NetworkEventCallback<keyof NetworkEvents>);

    return () => {
      this.eventListeners.get(event)?.delete(callback as NetworkEventCallback<keyof NetworkEvents>);
    };
  }

  /**
   * Get connection state
   */
  getConnectionState(): ConnectionState {
    return this.transport?.getState() ?? 'disconnected';
  }

  /**
   * Get local peer ID
   */
  getPeerId(): PeerId | null {
    return this.transport?.getPeerId() ?? null;
  }

  /**
   * Get all peers in the room
   */
  getPeers(): PeerInfo[] {
    return Array.from(this.peers.values());
  }

  /**
   * Get room state
   */
  getRoomState(): RoomState | null {
    return this.roomState;
  }

  /**
   * Check if local peer is host
   */
  getIsHost(): boolean {
    return this.isHost;
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  /**
   * Handle incoming network message
   */
  private handleMessage(message: NetworkMessage): void {
    const peerId = this.transport?.getPeerId();
    if (!peerId || message.senderId === peerId) return;

    switch (message.type) {
      case 'sync':
        this.handleSyncMessage(message);
        break;

      case 'spawn':
        this.handleSpawnMessage(message);
        break;

      case 'despawn':
        this.handleDespawnMessage(message);
        break;

      case 'join':
        this.handleJoinMessage(message);
        break;

      case 'leave':
        this.handleLeaveMessage(message);
        break;

      case 'ownership':
        this.handleOwnershipMessage(message);
        break;

      case 'rpc':
        this.handleRPCMessage(message);
        break;

      case 'state':
        this.handleStateMessage(message);
        break;
    }
  }

  /**
   * Handle sync message
   */
  private handleSyncMessage(message: NetworkMessage): void {
    const states = message.payload as EntityState[];

    for (const state of states) {
      // Skip local entities
      if (this.localEntities.has(state.networkId)) continue;

      // Update or add entity
      const existing = this.entities.get(state.networkId);
      if (existing) {
        // Only update if newer
        if (state.lastUpdated > existing.lastUpdated) {
          Object.assign(existing, state);

          // Add to interpolation buffer
          if (this.config?.interpolation) {
            this.addToInterpolationBuffer(state);
          }

          this.emit('entityUpdated', { entity: existing });
        }
      } else {
        // New entity from remote
        this.entities.set(state.networkId, state);
        this.emit('entitySpawned', { entity: state });
      }
    }
  }

  /**
   * Handle spawn message
   */
  private handleSpawnMessage(message: NetworkMessage): void {
    const entity = message.payload as EntityState;

    if (!this.entities.has(entity.networkId)) {
      this.entities.set(entity.networkId, entity);
      this.emit('entitySpawned', { entity });

      if (this.debug) {
        console.log(`[NetworkManager] Remote entity spawned: ${entity.networkId}`);
      }
    }
  }

  /**
   * Handle despawn message
   */
  private handleDespawnMessage(message: NetworkMessage): void {
    const { networkId } = message.payload as { networkId: NetworkId };

    if (this.entities.has(networkId)) {
      this.entities.delete(networkId);
      this.interpolationBuffer.delete(networkId);
      this.emit('entityDespawned', { networkId });

      if (this.debug) {
        console.log(`[NetworkManager] Remote entity despawned: ${networkId}`);
      }
    }
  }

  /**
   * Handle join message
   */
  private handleJoinMessage(message: NetworkMessage): void {
    const peerInfo = message.payload as PeerInfo;

    this.peers.set(peerInfo.peerId, peerInfo);
    this.emit('peerJoined', { peer: peerInfo });

    // If we're host, send current state to new peer
    if (this.isHost) {
      this.sendStateToPeer(peerInfo.peerId);
    }

    if (this.debug) {
      console.log(`[NetworkManager] Peer joined: ${peerInfo.peerId}`);
    }
  }

  /**
   * Handle leave message
   */
  private handleLeaveMessage(message: NetworkMessage): void {
    const { peerId } = message.payload as { peerId: PeerId };

    this.peers.delete(peerId);

    // Remove entities owned by leaving peer (unless persistent)
    const ownedEntities = this.getEntitiesByOwner(peerId);
    for (const entity of ownedEntities) {
      const config = (entity as unknown as { networkedConfig?: NetworkedTraitConfig })
        .networkedConfig;
      if (!config?.persistent) {
        this.entities.delete(entity.networkId);
        this.interpolationBuffer.delete(entity.networkId);
        this.emit('entityDespawned', { networkId: entity.networkId });
      }
    }

    this.emit('peerLeft', { peerId });

    // Handle host migration
    if (this.roomState && peerId === this.roomState.hostId) {
      this.handleHostMigration();
    }

    if (this.debug) {
      console.log(`[NetworkManager] Peer left: ${peerId}`);
    }
  }

  /**
   * Handle ownership message
   */
  private handleOwnershipMessage(message: NetworkMessage): void {
    const { networkId, requesterId } = message.payload as {
      networkId: NetworkId;
      requesterId: PeerId;
    };

    const entity = this.entities.get(networkId);
    if (!entity) return;

    const myPeerId = this.transport?.getPeerId();

    // If we're the current owner, transfer ownership
    if (entity.ownerId === myPeerId) {
      entity.ownerId = requesterId;
      this.localEntities.delete(networkId);

      // Broadcast ownership change
      this.broadcast({
        type: 'ownership',
        senderId: myPeerId!,
        timestamp: Date.now(),
        payload: {
          networkId,
          newOwnerId: requesterId,
          granted: true,
        },
      });
    }

    // If ownership was granted to someone else or us
    const granted = (message.payload as { granted?: boolean }).granted;
    if (granted) {
      const newOwnerId = (message.payload as { newOwnerId?: PeerId }).newOwnerId;
      if (newOwnerId) {
        entity.ownerId = newOwnerId;
        if (newOwnerId === myPeerId) {
          this.localEntities.add(networkId);
        }
        this.emit('ownershipChanged', { networkId, newOwnerId });
      }
    }
  }

  /**
   * Handle RPC message
   */
  private handleRPCMessage(message: NetworkMessage): void {
    const { name, args } = message.payload as { name: string; args: unknown[] };

    this.emit('rpc', {
      name,
      senderId: message.senderId,
      args,
    });
  }

  /**
   * Handle state message (full state sync from host)
   */
  private handleStateMessage(message: NetworkMessage): void {
    const state = message.payload as {
      entities: EntityState[];
      peers: PeerInfo[];
      hostId: PeerId;
    };

    // Update entities
    for (const entity of state.entities) {
      if (!this.localEntities.has(entity.networkId)) {
        this.entities.set(entity.networkId, entity);
      }
    }

    // Update peers
    for (const peer of state.peers) {
      this.peers.set(peer.peerId, peer);
    }

    // Update host
    if (this.roomState) {
      this.roomState.hostId = state.hostId;
    }

    this.isHost = state.hostId === this.transport?.getPeerId();

    this.emit('roomStateChanged', { state: this.roomState! });
  }

  /**
   * Add state to interpolation buffer
   */
  private addToInterpolationBuffer(state: EntityState): void {
    if (!this.interpolationBuffer.has(state.networkId)) {
      this.interpolationBuffer.set(state.networkId, []);
    }

    const buffer = this.interpolationBuffer.get(state.networkId)!;
    buffer.push({ ...state });

    // Keep buffer size limited (last 1 second of states)
    const maxSize = Math.ceil((this.config?.syncRate ?? 20) * 1.5);
    while (buffer.length > maxSize) {
      buffer.shift();
    }
  }

  /**
   * Send full state to a specific peer
   */
  private sendStateToPeer(peerId: PeerId): void {
    const myPeerId = this.transport?.getPeerId();
    if (!myPeerId) return;

    this.broadcast({
      type: 'state',
      senderId: myPeerId,
      timestamp: Date.now(),
      payload: {
        entities: Array.from(this.entities.values()),
        peers: Array.from(this.peers.values()),
        hostId: this.roomState?.hostId,
      },
    });
  }

  /**
   * Handle host migration when current host leaves
   */
  private handleHostMigration(): void {
    // Find peer with lowest peer ID (deterministic)
    const sortedPeers = Array.from(this.peers.keys()).sort();
    const newHostId = sortedPeers[0];

    if (this.roomState) {
      this.roomState.hostId = newHostId;
    }

    this.isHost = newHostId === this.transport?.getPeerId();

    if (this.debug) {
      console.log(`[NetworkManager] Host migrated to: ${newHostId}`);
    }
  }

  /**
   * Start the sync loop
   */
  private startSyncLoop(): void {
    const syncRate = this.config?.syncRate ?? 20;
    const interval = 1000 / syncRate;

    this.syncInterval = setInterval(() => {
      this.syncLocalEntities();
    }, interval);
  }

  /**
   * Stop the sync loop
   */
  private stopSyncLoop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Sync local entities to other peers
   */
  private syncLocalEntities(): void {
    if (this.localEntities.size === 0) return;

    const peerId = this.transport?.getPeerId();
    if (!peerId) return;

    const states: EntityState[] = [];

    for (const networkId of this.localEntities) {
      const entity = this.entities.get(networkId);
      if (entity) {
        states.push(entity);
      }
    }

    if (states.length > 0) {
      this.broadcast({
        type: 'sync',
        senderId: peerId,
        timestamp: Date.now(),
        payload: states,
      });
    }
  }

  /**
   * Broadcast message to all peers
   */
  private broadcast(message: NetworkMessage): void {
    this.transport?.send(message);
  }

  /**
   * Emit event to listeners
   */
  private emit<T extends keyof NetworkEvents>(event: T, data: NetworkEvents[T]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          (callback as NetworkEventCallback<T>)(data);
        } catch (err) {
          console.error(`[NetworkManager] Event listener error:`, err);
        }
      });
    }
  }
}

/**
 * Create a network manager instance
 */
export function createNetworkManager(): NetworkManager {
  return new NetworkManager();
}
