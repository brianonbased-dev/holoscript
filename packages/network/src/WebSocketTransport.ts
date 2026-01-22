/**
 * WebSocket Transport for HoloScript Networking
 *
 * Provides reliable, ordered message delivery through
 * a WebSocket connection to a signaling/relay server.
 */

import type {
  NetworkTransport,
  NetworkConfig,
  NetworkMessage,
  ConnectionState,
  PeerId,
} from './types';

/**
 * WebSocket transport implementation
 */
export class WebSocketTransport implements NetworkTransport {
  private ws: WebSocket | null = null;
  private state: ConnectionState = 'disconnected';
  private peerId: PeerId | null = null;
  private messageHandler: ((message: NetworkMessage) => void) | null = null;
  private config: NetworkConfig | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private debug = false;

  /**
   * Connect to the WebSocket server
   */
  async connect(config: NetworkConfig): Promise<void> {
    if (!config.serverUrl) {
      throw new Error('WebSocket transport requires serverUrl in config');
    }

    this.config = config;
    this.debug = config.debug ?? false;

    return new Promise((resolve, reject) => {
      try {
        this.state = 'connecting';
        this.ws = new WebSocket(config.serverUrl!);

        this.ws.onopen = () => {
          this.state = 'connected';
          this.reconnectAttempts = 0;
          this.startPingInterval();

          // Request peer ID from server
          this.sendRaw({
            type: 'join',
            roomId: config.roomId,
          });

          if (this.debug) {
            console.log('[WebSocketTransport] Connected to server');
          }
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            // Handle internal messages
            if (data.type === 'welcome') {
              this.peerId = data.peerId;
              if (this.debug) {
                console.log('[WebSocketTransport] Assigned peer ID:', this.peerId);
              }
              resolve();
              return;
            }

            if (data.type === 'pong') {
              // Ping response received
              return;
            }

            // Forward to message handler
            if (this.messageHandler) {
              this.messageHandler(data as NetworkMessage);
            }
          } catch (err) {
            console.error('[WebSocketTransport] Failed to parse message:', err);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocketTransport] WebSocket error:', error);
          if (this.state === 'connecting') {
            reject(new Error('Failed to connect to server'));
          }
        };

        this.ws.onclose = (event) => {
          this.state = 'disconnected';
          this.stopPingInterval();

          if (this.debug) {
            console.log('[WebSocketTransport] Disconnected:', event.code, event.reason);
          }

          // Attempt reconnection if not intentional
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect();
          }
        };

        // Set timeout for connection
        setTimeout(() => {
          if (this.state === 'connecting') {
            this.ws?.close();
            reject(new Error('Connection timeout'));
          }
        }, 10000);
      } catch (err) {
        this.state = 'disconnected';
        reject(err);
      }
    });
  }

  /**
   * Disconnect from the server
   */
  disconnect(): void {
    this.stopPingInterval();

    if (this.ws) {
      // Send leave message before closing
      this.sendRaw({
        type: 'leave',
        peerId: this.peerId,
      });

      this.ws.close(1000, 'Client disconnected');
      this.ws = null;
    }

    this.state = 'disconnected';
    this.peerId = null;
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect
  }

  /**
   * Send a network message
   */
  send(message: NetworkMessage): void {
    if (this.state !== 'connected' || !this.ws) {
      console.warn('[WebSocketTransport] Cannot send message: not connected');
      return;
    }

    this.sendRaw(message);
  }

  /**
   * Set message handler
   */
  onMessage(callback: (message: NetworkMessage) => void): void {
    this.messageHandler = callback;
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * Get local peer ID
   */
  getPeerId(): PeerId | null {
    return this.peerId;
  }

  /**
   * Send raw data to server
   */
  private sendRaw(data: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  /**
   * Start ping interval to keep connection alive
   */
  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      if (this.state === 'connected') {
        this.sendRaw({ type: 'ping', timestamp: Date.now() });
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Stop ping interval
   */
  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Attempt to reconnect to server
   */
  private attemptReconnect(): void {
    if (!this.config) return;

    this.state = 'reconnecting';
    this.reconnectAttempts++;

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    if (this.debug) {
      console.log(
        `[WebSocketTransport] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );
    }

    setTimeout(() => {
      if (this.state === 'reconnecting') {
        this.connect(this.config!).catch((err) => {
          console.error('[WebSocketTransport] Reconnection failed:', err);
        });
      }
    }, delay);
  }
}
