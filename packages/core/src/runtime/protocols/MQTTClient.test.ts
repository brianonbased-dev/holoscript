/**
 * MQTT Client Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  MQTTClient,
  createMQTTClient,
  registerMQTTClient,
  getMQTTClient,
  unregisterMQTTClient,
  type MQTTMessage,
} from './MQTTClient';

describe('MQTTClient', () => {
  let client: MQTTClient;

  beforeEach(() => {
    client = createMQTTClient({
      broker: 'mqtt://localhost:1883',
      clientId: 'test-client',
    });
  });

  describe('connection management', () => {
    it('should start in disconnected state', () => {
      expect(client.getState()).toBe('disconnected');
      expect(client.isConnected()).toBe(false);
    });

    it('should connect to broker', async () => {
      await client.connect();
      expect(client.getState()).toBe('connected');
      expect(client.isConnected()).toBe(true);
    });

    it('should emit connect event on connection', async () => {
      const connectHandler = vi.fn();
      client.on('connect', connectHandler);

      await client.connect();

      expect(connectHandler).toHaveBeenCalled();
    });

    it('should disconnect from broker', async () => {
      await client.connect();
      await client.disconnect();

      expect(client.getState()).toBe('closed');
      expect(client.isConnected()).toBe(false);
    });

    it('should emit disconnect event on disconnection', async () => {
      await client.connect();

      const disconnectHandler = vi.fn();
      client.on('disconnect', disconnectHandler);

      await client.disconnect();

      expect(disconnectHandler).toHaveBeenCalledWith('client_disconnect');
    });
  });

  describe('publish / subscribe', () => {
    beforeEach(async () => {
      await client.connect();
    });

    it('should subscribe to a topic', async () => {
      const handler = vi.fn();
      await client.subscribe('test/topic', handler);

      expect(client.getSubscriptions()).toContain('test/topic');
    });

    it('should receive messages on subscribed topic', async () => {
      const handler = vi.fn();
      await client.subscribe('test/topic', handler);

      // Inject a test message
      client._injectMessage('test/topic', 'hello');

      expect(handler).toHaveBeenCalled();
      const message = handler.mock.calls[0][0] as MQTTMessage;
      expect(message.topic).toBe('test/topic');
      expect(message.payload).toBe('hello');
    });

    it('should unsubscribe from a topic', async () => {
      const handler = vi.fn();
      await client.subscribe('test/topic', handler);
      await client.unsubscribe('test/topic');

      expect(client.getSubscriptions()).not.toContain('test/topic');
    });

    it('should publish messages', async () => {
      await client.publish('test/topic', 'hello world');
      // Message is published (no error thrown)
    });

    it('should publish JSON objects', async () => {
      await client.publish('test/topic', { value: 42, name: 'test' });
    });

    it('should queue messages when disconnected', async () => {
      const disconnectedClient = createMQTTClient({ broker: 'mqtt://localhost:1883' });
      // This should not throw, message is queued
      await disconnectedClient.publish('test/topic', 'queued message');
    });
  });

  describe('topic matching', () => {
    it('should match exact topics', () => {
      expect(MQTTClient.matchTopic('sensors/temp', 'sensors/temp')).toBe(true);
      expect(MQTTClient.matchTopic('sensors/temp', 'sensors/humidity')).toBe(false);
    });

    it('should match single-level wildcard (+)', () => {
      expect(MQTTClient.matchTopic('sensors/+/data', 'sensors/temp/data')).toBe(true);
      expect(MQTTClient.matchTopic('sensors/+/data', 'sensors/humidity/data')).toBe(true);
      expect(MQTTClient.matchTopic('sensors/+/data', 'sensors/temp/value')).toBe(false);
    });

    it('should match multi-level wildcard (#)', () => {
      expect(MQTTClient.matchTopic('sensors/#', 'sensors/temp')).toBe(true);
      expect(MQTTClient.matchTopic('sensors/#', 'sensors/temp/data')).toBe(true);
      expect(MQTTClient.matchTopic('sensors/#', 'sensors/zone1/temp/data')).toBe(true);
    });

    it('should handle complex patterns', () => {
      expect(MQTTClient.matchTopic('+/sensors/+', 'home/sensors/temp')).toBe(true);
      expect(MQTTClient.matchTopic('+/sensors/+', 'office/sensors/humidity')).toBe(true);
      expect(MQTTClient.matchTopic('+/sensors/+', 'home/sensors/zone1/temp')).toBe(false);
    });

    it('should not match shorter topics than pattern', () => {
      expect(MQTTClient.matchTopic('sensors/temp/data', 'sensors/temp')).toBe(false);
    });
  });

  describe('payload parsing', () => {
    it('should parse JSON payloads', () => {
      const message: MQTTMessage = {
        topic: 'test',
        payload: '{"value": 42, "name": "test"}',
        qos: 0,
        retain: false,
      };

      const parsed = MQTTClient.parsePayload(message);
      expect(parsed).toEqual({ value: 42, name: 'test' });
    });

    it('should parse JSON arrays', () => {
      const message: MQTTMessage = {
        topic: 'test',
        payload: '[1, 2, 3]',
        qos: 0,
        retain: false,
      };

      const parsed = MQTTClient.parsePayload(message);
      expect(parsed).toEqual([1, 2, 3]);
    });

    it('should parse numbers', () => {
      const message: MQTTMessage = {
        topic: 'test',
        payload: '42.5',
        qos: 0,
        retain: false,
      };

      const parsed = MQTTClient.parsePayload(message);
      expect(parsed).toBe(42.5);
    });

    it('should return strings for non-JSON, non-numeric payloads', () => {
      const message: MQTTMessage = {
        topic: 'test',
        payload: 'hello world',
        qos: 0,
        retain: false,
      };

      const parsed = MQTTClient.parsePayload(message);
      expect(parsed).toBe('hello world');
    });

    it('should handle Buffer payloads', () => {
      const message: MQTTMessage = {
        topic: 'test',
        payload: Buffer.from('{"value": 123}'),
        qos: 0,
        retain: false,
      };

      const parsed = MQTTClient.parsePayload(message);
      expect(parsed).toEqual({ value: 123 });
    });
  });

  describe('wildcard subscriptions', () => {
    beforeEach(async () => {
      await client.connect();
    });

    it('should receive messages matching single-level wildcard', async () => {
      const handler = vi.fn();
      await client.subscribe('sensors/+/data', handler);

      client._injectMessage('sensors/temp/data', '25');
      client._injectMessage('sensors/humidity/data', '60');

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should receive messages matching multi-level wildcard', async () => {
      const handler = vi.fn();
      await client.subscribe('sensors/#', handler);

      client._injectMessage('sensors/temp', '25');
      client._injectMessage('sensors/temp/data', '25');
      client._injectMessage('sensors/zone1/temp/data', '25');

      expect(handler).toHaveBeenCalledTimes(3);
    });
  });

  describe('event handling', () => {
    it('should emit message events', async () => {
      await client.connect();

      const messageHandler = vi.fn();
      client.on('message', messageHandler);

      await client.subscribe('test/topic', () => {});
      client._injectMessage('test/topic', 'hello');

      expect(messageHandler).toHaveBeenCalledWith('test/topic', expect.any(Object));
    });

    it('should remove event handlers with off()', async () => {
      const handler = vi.fn();
      client.on('connect', handler);
      client.off('connect', handler);

      await client.connect();

      expect(handler).not.toHaveBeenCalled();
    });
  });
});

describe('MQTT Client Registry', () => {
  beforeEach(() => {
    // Clear any existing clients
    unregisterMQTTClient('test-client');
  });

  it('should register and retrieve clients', () => {
    const client = createMQTTClient({ broker: 'mqtt://localhost:1883' });
    registerMQTTClient('test-client', client);

    expect(getMQTTClient('test-client')).toBe(client);
  });

  it('should return undefined for non-existent clients', () => {
    expect(getMQTTClient('non-existent')).toBeUndefined();
  });

  it('should unregister clients', async () => {
    const client = createMQTTClient({ broker: 'mqtt://localhost:1883' });
    await client.connect();
    registerMQTTClient('test-client', client);

    unregisterMQTTClient('test-client');

    expect(getMQTTClient('test-client')).toBeUndefined();
    expect(client.getState()).toBe('closed');
  });
});
