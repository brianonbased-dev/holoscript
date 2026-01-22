/**
 * Tests for NetworkManager
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NetworkManager } from '../NetworkManager';
import type { NetworkMessage, EntityState } from '../types';

// Mock WebSocket
class MockWebSocket {
  static OPEN = 1;
  readyState = MockWebSocket.OPEN;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: ((error: unknown) => void) | null = null;

  send = vi.fn();
  close = vi.fn();

  // Simulate connection open
  simulateOpen() {
    this.onopen?.();
  }

  // Simulate receiving a message
  simulateMessage(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }

  // Simulate close
  simulateClose() {
    this.readyState = 3; // CLOSED
    this.onclose?.();
  }
}

// Replace global WebSocket
const originalWebSocket = global.WebSocket;
let mockWs: MockWebSocket;

beforeEach(() => {
  mockWs = new MockWebSocket();
  // Create a mock WebSocket constructor with static OPEN property
  const MockWSConstructor = vi.fn(() => mockWs);
  (MockWSConstructor as unknown as { OPEN: number }).OPEN = 1;
  // @ts-expect-error - mocking WebSocket
  global.WebSocket = MockWSConstructor;
});

afterEach(() => {
  // @ts-expect-error - restoring WebSocket
  global.WebSocket = originalWebSocket;
  vi.clearAllMocks();
});

describe('NetworkManager', () => {
  it('should create a network manager instance', () => {
    const manager = new NetworkManager();
    expect(manager).toBeDefined();
    expect(manager.getConnectionState()).toBe('disconnected');
    expect(manager.getPeerId()).toBeNull();
  });

  it('should connect to server via WebSocket', async () => {
    const manager = new NetworkManager();

    const connectPromise = manager.connect({
      serverUrl: 'ws://localhost:8080',
      roomId: 'test-room',
    });

    // Simulate WebSocket connection
    mockWs.simulateOpen();
    mockWs.simulateMessage({ type: 'welcome', peerId: 'peer-123' });

    const roomId = await connectPromise;

    expect(roomId).toBe('test-room');
    expect(manager.getPeerId()).toBe('peer-123');
    expect(manager.getConnectionState()).toBe('connected');
  });

  it('should generate room ID if not provided', async () => {
    const manager = new NetworkManager();

    const connectPromise = manager.connect({
      serverUrl: 'ws://localhost:8080',
    });

    mockWs.simulateOpen();
    mockWs.simulateMessage({ type: 'welcome', peerId: 'peer-456' });

    const roomId = await connectPromise;

    expect(roomId).toBeDefined();
    expect(roomId.length).toBeGreaterThan(0);
  });

  it('should disconnect properly', async () => {
    const manager = new NetworkManager();

    const connectPromise = manager.connect({
      serverUrl: 'ws://localhost:8080',
    });

    mockWs.simulateOpen();
    mockWs.simulateMessage({ type: 'welcome', peerId: 'peer-789' });
    await connectPromise;

    manager.disconnect();

    expect(manager.getConnectionState()).toBe('disconnected');
    expect(manager.getPeerId()).toBeNull();
    expect(mockWs.close).toHaveBeenCalled();
  });

  it('should register and unregister entities', async () => {
    const manager = new NetworkManager();

    const connectPromise = manager.connect({
      serverUrl: 'ws://localhost:8080',
    });

    mockWs.simulateOpen();
    mockWs.simulateMessage({ type: 'welcome', peerId: 'peer-abc' });
    await connectPromise;

    // Register entity
    const entity = { userData: {} };
    const networkId = manager.registerEntity(entity, 'player', {
      sync: 'owner',
    });

    expect(networkId).toBeDefined();
    expect(manager.getEntity(networkId)).toBeDefined();
    expect(manager.getEntity(networkId)?.entityType).toBe('player');
    expect(manager.getEntity(networkId)?.ownerId).toBe('peer-abc');

    // Unregister entity
    manager.unregisterEntity(networkId);
    expect(manager.getEntity(networkId)).toBeUndefined();
  });

  it('should update entity state', async () => {
    const manager = new NetworkManager();

    const connectPromise = manager.connect({
      serverUrl: 'ws://localhost:8080',
    });

    mockWs.simulateOpen();
    mockWs.simulateMessage({ type: 'welcome', peerId: 'peer-def' });
    await connectPromise;

    const entity = { userData: {} };
    const networkId = manager.registerEntity(entity, 'cube');

    manager.updateEntity(networkId, {
      position: [1, 2, 3],
      rotation: [0, 90, 0],
    });

    const state = manager.getEntity(networkId);
    expect(state?.position).toEqual([1, 2, 3]);
    expect(state?.rotation).toEqual([0, 90, 0]);
  });

  it('should emit events for entity lifecycle', async () => {
    const manager = new NetworkManager();

    const connectPromise = manager.connect({
      serverUrl: 'ws://localhost:8080',
    });

    mockWs.simulateOpen();
    mockWs.simulateMessage({ type: 'welcome', peerId: 'peer-ghi' });
    await connectPromise;

    const spawnedEvents: EntityState[] = [];
    const despawnedEvents: string[] = [];

    manager.on('entitySpawned', (event) => {
      spawnedEvents.push(event.entity);
    });

    manager.on('entityDespawned', (event) => {
      despawnedEvents.push(event.networkId);
    });

    const entity = { userData: {} };
    const networkId = manager.registerEntity(entity, 'sphere');

    expect(spawnedEvents.length).toBe(1);
    expect(spawnedEvents[0].entityType).toBe('sphere');

    manager.unregisterEntity(networkId);

    expect(despawnedEvents.length).toBe(1);
    expect(despawnedEvents[0]).toBe(networkId);
  });

  it('should handle remote entity spawns', async () => {
    const manager = new NetworkManager();

    const connectPromise = manager.connect({
      serverUrl: 'ws://localhost:8080',
    });

    mockWs.simulateOpen();
    mockWs.simulateMessage({ type: 'welcome', peerId: 'peer-jkl' });
    await connectPromise;

    const spawnedEvents: EntityState[] = [];
    manager.on('entitySpawned', (event) => {
      spawnedEvents.push(event.entity);
    });

    // Simulate remote spawn
    mockWs.simulateMessage({
      type: 'spawn',
      senderId: 'remote-peer',
      timestamp: Date.now(),
      payload: {
        networkId: 'remote-entity-1',
        ownerId: 'remote-peer',
        entityType: 'avatar',
        position: [0, 0, 5],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        lastUpdated: Date.now(),
      },
    });

    expect(spawnedEvents.length).toBe(1);
    expect(spawnedEvents[0].entityType).toBe('avatar');
    expect(spawnedEvents[0].ownerId).toBe('remote-peer');
    expect(manager.getEntity('remote-entity-1')).toBeDefined();
  });

  it('should handle remote entity sync updates', async () => {
    const manager = new NetworkManager();

    const connectPromise = manager.connect({
      serverUrl: 'ws://localhost:8080',
    });

    mockWs.simulateOpen();
    mockWs.simulateMessage({ type: 'welcome', peerId: 'peer-mno' });
    await connectPromise;

    // First spawn the remote entity
    mockWs.simulateMessage({
      type: 'spawn',
      senderId: 'remote-peer-2',
      timestamp: Date.now(),
      payload: {
        networkId: 'remote-entity-2',
        ownerId: 'remote-peer-2',
        entityType: 'box',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        lastUpdated: Date.now() - 1000,
      },
    });

    // Then update it
    mockWs.simulateMessage({
      type: 'sync',
      senderId: 'remote-peer-2',
      timestamp: Date.now(),
      payload: [
        {
          networkId: 'remote-entity-2',
          ownerId: 'remote-peer-2',
          entityType: 'box',
          position: [5, 0, 10],
          rotation: [0, 45, 0],
          scale: [2, 2, 2],
          lastUpdated: Date.now(),
        },
      ],
    });

    const entity = manager.getEntity('remote-entity-2');
    expect(entity?.position).toEqual([5, 0, 10]);
    expect(entity?.rotation).toEqual([0, 45, 0]);
  });

  it('should return all entities', async () => {
    const manager = new NetworkManager();

    const connectPromise = manager.connect({
      serverUrl: 'ws://localhost:8080',
    });

    mockWs.simulateOpen();
    mockWs.simulateMessage({ type: 'welcome', peerId: 'peer-pqr' });
    await connectPromise;

    manager.registerEntity({}, 'entity1');
    manager.registerEntity({}, 'entity2');
    manager.registerEntity({}, 'entity3');

    const entities = manager.getAllEntities();
    expect(entities.length).toBe(3);
  });

  it('should send RPC messages', async () => {
    const manager = new NetworkManager();

    const connectPromise = manager.connect({
      serverUrl: 'ws://localhost:8080',
    });

    mockWs.simulateOpen();
    mockWs.simulateMessage({ type: 'welcome', peerId: 'peer-stu' });
    await connectPromise;

    manager.sendRPC('testMethod', 'all', ['arg1', 'arg2']);

    // Check that a message was sent
    expect(mockWs.send).toHaveBeenCalled();
    const sentData = JSON.parse(mockWs.send.mock.calls.at(-1)[0]);
    expect(sentData.type).toBe('rpc');
    expect(sentData.payload.name).toBe('testMethod');
    expect(sentData.payload.args).toEqual(['arg1', 'arg2']);
  });

  it('should handle peer join events', async () => {
    const manager = new NetworkManager();

    const connectPromise = manager.connect({
      serverUrl: 'ws://localhost:8080',
    });

    mockWs.simulateOpen();
    mockWs.simulateMessage({ type: 'welcome', peerId: 'peer-vwx' });
    await connectPromise;

    const joinEvents: unknown[] = [];
    manager.on('peerJoined', (event) => {
      joinEvents.push(event);
    });

    mockWs.simulateMessage({
      type: 'join',
      senderId: 'new-peer',
      timestamp: Date.now(),
      payload: {
        peerId: 'new-peer',
        joinedAt: Date.now(),
        isHost: false,
      },
    });

    expect(joinEvents.length).toBe(1);
    expect(manager.getPeers().length).toBe(2); // Self + new peer
  });

  it('should handle peer leave events', async () => {
    const manager = new NetworkManager();

    const connectPromise = manager.connect({
      serverUrl: 'ws://localhost:8080',
    });

    mockWs.simulateOpen();
    mockWs.simulateMessage({ type: 'welcome', peerId: 'peer-yz' });
    await connectPromise;

    // Add peer
    mockWs.simulateMessage({
      type: 'join',
      senderId: 'leaving-peer',
      timestamp: Date.now(),
      payload: {
        peerId: 'leaving-peer',
        joinedAt: Date.now(),
        isHost: false,
      },
    });

    expect(manager.getPeers().length).toBe(2);

    const leaveEvents: unknown[] = [];
    manager.on('peerLeft', (event) => {
      leaveEvents.push(event);
    });

    // Peer leaves
    mockWs.simulateMessage({
      type: 'leave',
      senderId: 'leaving-peer',
      timestamp: Date.now(),
      payload: {
        peerId: 'leaving-peer',
      },
    });

    expect(leaveEvents.length).toBe(1);
    expect(manager.getPeers().length).toBe(1); // Only self
  });

  it('should be host when first to connect', async () => {
    const manager = new NetworkManager();

    const connectPromise = manager.connect({
      serverUrl: 'ws://localhost:8080',
    });

    mockWs.simulateOpen();
    mockWs.simulateMessage({ type: 'welcome', peerId: 'peer-host' });
    await connectPromise;

    expect(manager.getIsHost()).toBe(true);
  });
});
