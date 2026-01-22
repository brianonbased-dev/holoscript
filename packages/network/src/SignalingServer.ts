/**
 * Simple Signaling Server for HoloScript Networking
 *
 * A minimal Node.js WebSocket server for signaling and relay.
 * Can be used standalone or integrated into existing servers.
 *
 * This is a reference implementation for development/testing.
 * Production deployments should use proper infrastructure.
 */

import type { PeerId, RoomId } from './types';

/**
 * Message from client
 */
interface ClientMessage {
  type: string;
  senderId?: PeerId;
  targetId?: PeerId;
  roomId?: RoomId;
  [key: string]: unknown;
}

/**
 * Client connection info
 */
interface ClientInfo {
  peerId: PeerId;
  roomId: RoomId | null;
  // WebSocket instance (any to avoid Node.js type dependency)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ws: any;
}

/**
 * Room info
 */
interface RoomInfo {
  roomId: RoomId;
  peers: Set<PeerId>;
  hostId: PeerId;
  createdAt: number;
}

/**
 * Signaling server options
 */
export interface SignalingServerOptions {
  /** Maximum peers per room */
  maxPeersPerRoom?: number;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Create a signaling server
 *
 * @example
 * ```typescript
 * import { createSignalingServer } from '@holoscript/network';
 * import { WebSocketServer } from 'ws';
 *
 * const wss = new WebSocketServer({ port: 8080 });
 * const server = createSignalingServer({ debug: true });
 *
 * wss.on('connection', (ws) => {
 *   server.handleConnection(ws);
 * });
 * ```
 */
export function createSignalingServer(options: SignalingServerOptions = {}) {
  const { maxPeersPerRoom = 16, debug = false } = options;

  const clients: Map<PeerId, ClientInfo> = new Map();
  const rooms: Map<RoomId, RoomInfo> = new Map();
  let peerCounter = 0;

  /**
   * Generate unique peer ID
   */
  function generatePeerId(): PeerId {
    return `peer_${Date.now().toString(36)}_${(++peerCounter).toString(36)}`;
  }

  /**
   * Generate room ID if not provided
   */
  function generateRoomId(): RoomId {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  }

  /**
   * Send message to a specific client
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function send(ws: any, message: unknown): void {
    if (ws.readyState === 1) {
      // WebSocket.OPEN
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast message to all peers in a room except sender
   */
  function broadcastToRoom(roomId: RoomId, message: unknown, excludePeerId?: PeerId): void {
    const room = rooms.get(roomId);
    if (!room) return;

    for (const peerId of room.peers) {
      if (peerId !== excludePeerId) {
        const client = clients.get(peerId);
        if (client) {
          send(client.ws, message);
        }
      }
    }
  }

  /**
   * Handle client connection
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleConnection(ws: any): void {
    const peerId = generatePeerId();
    const client: ClientInfo = { peerId, roomId: null, ws };
    clients.set(peerId, client);

    if (debug) {
      console.log(`[SignalingServer] Client connected: ${peerId}`);
    }

    // Send welcome message with peer ID
    send(ws, { type: 'welcome', peerId });

    // Handle messages
    ws.on('message', (data: Buffer | string) => {
      try {
        const message = JSON.parse(data.toString()) as ClientMessage;
        handleMessage(client, message);
      } catch (err) {
        console.error('[SignalingServer] Failed to parse message:', err);
      }
    });

    // Handle disconnect
    ws.on('close', () => {
      handleDisconnect(client);
    });

    ws.on('error', (err: Error) => {
      console.error(`[SignalingServer] WebSocket error for ${peerId}:`, err);
    });
  }

  /**
   * Handle incoming message
   */
  function handleMessage(client: ClientInfo, message: ClientMessage): void {
    switch (message.type) {
      case 'join':
        handleJoin(client, message.roomId as RoomId | undefined);
        break;

      case 'leave':
        handleLeave(client);
        break;

      case 'ping':
        send(client.ws, { type: 'pong', timestamp: Date.now() });
        break;

      case 'offer':
      case 'answer':
      case 'ice-candidate':
        // Forward WebRTC signaling to target peer
        if (message.targetId) {
          const target = clients.get(message.targetId);
          if (target) {
            send(target.ws, { ...message, senderId: client.peerId });
          }
        }
        break;

      case 'relay':
      case 'sync':
      case 'spawn':
      case 'despawn':
      case 'ownership':
      case 'rpc':
      case 'state':
        // Relay to all peers in room
        if (client.roomId) {
          broadcastToRoom(client.roomId, { ...message, senderId: client.peerId }, client.peerId);
        }
        break;

      default:
        if (debug) {
          console.log(`[SignalingServer] Unknown message type: ${message.type}`);
        }
    }
  }

  /**
   * Handle client joining a room
   */
  function handleJoin(client: ClientInfo, requestedRoomId?: RoomId): void {
    // Leave current room if in one
    if (client.roomId) {
      handleLeave(client);
    }

    const roomId = requestedRoomId || generateRoomId();

    // Get or create room
    let room = rooms.get(roomId);
    if (!room) {
      room = {
        roomId,
        peers: new Set(),
        hostId: client.peerId,
        createdAt: Date.now(),
      };
      rooms.set(roomId, room);

      if (debug) {
        console.log(`[SignalingServer] Room created: ${roomId}`);
      }
    }

    // Check room capacity
    if (room.peers.size >= maxPeersPerRoom) {
      send(client.ws, {
        type: 'error',
        code: 'ROOM_FULL',
        message: `Room ${roomId} is full`,
      });
      return;
    }

    // Add client to room
    room.peers.add(client.peerId);
    client.roomId = roomId;

    // Send existing peers list to new client
    const existingPeers = Array.from(room.peers).filter((p) => p !== client.peerId);
    send(client.ws, {
      type: 'existing-peers',
      roomId,
      peers: existingPeers,
      hostId: room.hostId,
    });

    // Notify other peers
    broadcastToRoom(
      roomId,
      {
        type: 'peer-joined',
        peerId: client.peerId,
        roomId,
      },
      client.peerId
    );

    if (debug) {
      console.log(`[SignalingServer] ${client.peerId} joined room ${roomId}`);
    }
  }

  /**
   * Handle client leaving room
   */
  function handleLeave(client: ClientInfo): void {
    if (!client.roomId) return;

    const room = rooms.get(client.roomId);
    if (room) {
      room.peers.delete(client.peerId);

      // Notify other peers
      broadcastToRoom(client.roomId, {
        type: 'peer-left',
        peerId: client.peerId,
      });

      // Handle host migration
      if (room.hostId === client.peerId && room.peers.size > 0) {
        room.hostId = Array.from(room.peers)[0];
        broadcastToRoom(client.roomId, {
          type: 'host-changed',
          newHostId: room.hostId,
        });
      }

      // Delete empty room
      if (room.peers.size === 0) {
        rooms.delete(client.roomId);
        if (debug) {
          console.log(`[SignalingServer] Room deleted: ${client.roomId}`);
        }
      }
    }

    if (debug) {
      console.log(`[SignalingServer] ${client.peerId} left room ${client.roomId}`);
    }

    client.roomId = null;
  }

  /**
   * Handle client disconnect
   */
  function handleDisconnect(client: ClientInfo): void {
    handleLeave(client);
    clients.delete(client.peerId);

    if (debug) {
      console.log(`[SignalingServer] Client disconnected: ${client.peerId}`);
    }
  }

  /**
   * Get server stats
   */
  function getStats() {
    return {
      totalClients: clients.size,
      totalRooms: rooms.size,
      rooms: Array.from(rooms.values()).map((r) => ({
        roomId: r.roomId,
        peerCount: r.peers.size,
        hostId: r.hostId,
        createdAt: r.createdAt,
      })),
    };
  }

  return {
    handleConnection,
    getStats,
  };
}

/**
 * Export type for server instance
 */
export type SignalingServer = ReturnType<typeof createSignalingServer>;
