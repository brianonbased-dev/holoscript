/**
 * WebRTC Transport for HoloScript Networking
 *
 * Provides peer-to-peer communication with low latency.
 * Uses WebSocket for signaling, WebRTC DataChannels for data.
 */

import type {
  NetworkTransport,
  NetworkConfig,
  NetworkMessage,
  ConnectionState,
  PeerId,
} from './types';

interface PeerConnection {
  peerId: PeerId;
  connection: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;
  isConnected: boolean;
}

/**
 * Default ICE servers (public STUN servers)
 */
const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

/**
 * WebRTC transport implementation
 */
export class WebRTCTransport implements NetworkTransport {
  private signalingWs: WebSocket | null = null;
  private peers: Map<PeerId, PeerConnection> = new Map();
  private state: ConnectionState = 'disconnected';
  private peerId: PeerId | null = null;
  private messageHandler: ((message: NetworkMessage) => void) | null = null;
  private config: NetworkConfig | null = null;
  private debug = false;

  /**
   * Connect to the signaling server and establish peer connections
   */
  async connect(config: NetworkConfig): Promise<void> {
    if (!config.serverUrl) {
      throw new Error('WebRTC transport requires serverUrl for signaling');
    }

    this.config = config;
    this.debug = config.debug ?? false;

    return new Promise((resolve, reject) => {
      try {
        this.state = 'connecting';

        // Connect to signaling server via WebSocket
        this.signalingWs = new WebSocket(config.serverUrl!);

        this.signalingWs.onopen = () => {
          // Join room through signaling server
          this.sendSignaling({
            type: 'join',
            roomId: config.roomId,
            transport: 'webrtc',
          });
        };

        this.signalingWs.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);
            await this.handleSignalingMessage(data);

            // Resolve when we receive our peer ID
            if (data.type === 'welcome') {
              this.peerId = data.peerId;
              this.state = 'connected';

              if (this.debug) {
                console.log('[WebRTCTransport] Connected with peer ID:', this.peerId);
              }

              resolve();
            }
          } catch (err) {
            console.error('[WebRTCTransport] Signaling message error:', err);
          }
        };

        this.signalingWs.onerror = (error) => {
          console.error('[WebRTCTransport] Signaling error:', error);
          if (this.state === 'connecting') {
            reject(new Error('Failed to connect to signaling server'));
          }
        };

        this.signalingWs.onclose = () => {
          if (this.debug) {
            console.log('[WebRTCTransport] Signaling connection closed');
          }
        };

        // Connection timeout
        setTimeout(() => {
          if (this.state === 'connecting') {
            this.signalingWs?.close();
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
   * Disconnect from all peers and signaling server
   */
  disconnect(): void {
    // Close all peer connections
    this.peers.forEach((peer) => {
      peer.dataChannel?.close();
      peer.connection.close();
    });
    this.peers.clear();

    // Close signaling connection
    if (this.signalingWs) {
      this.sendSignaling({
        type: 'leave',
        peerId: this.peerId,
      });
      this.signalingWs.close(1000, 'Client disconnected');
      this.signalingWs = null;
    }

    this.state = 'disconnected';
    this.peerId = null;
  }

  /**
   * Send a network message to all connected peers
   */
  send(message: NetworkMessage): void {
    const data = JSON.stringify(message);

    // Send to all connected peers via DataChannels
    this.peers.forEach((peer) => {
      if (peer.isConnected && peer.dataChannel?.readyState === 'open') {
        try {
          peer.dataChannel.send(data);
        } catch (err) {
          console.error(`[WebRTCTransport] Failed to send to peer ${peer.peerId}:`, err);
        }
      }
    });

    // Also send through signaling server as fallback for peers not yet connected via WebRTC
    // Wrap the message in a relay envelope
    this.sendSignaling({
      type: 'relay',
      originalMessage: message,
    });
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
   * Handle signaling messages
   */
  private async handleSignalingMessage(data: Record<string, unknown>): Promise<void> {
    switch (data.type) {
      case 'peer-joined':
        // New peer joined - create offer
        await this.createPeerConnection(data.peerId as PeerId, true);
        break;

      case 'peer-left':
        // Peer left - clean up
        this.removePeer(data.peerId as PeerId);
        break;

      case 'offer':
        // Received offer - create answer
        await this.handleOffer(data.senderId as PeerId, data.offer as RTCSessionDescriptionInit);
        break;

      case 'answer':
        // Received answer - set remote description
        await this.handleAnswer(data.senderId as PeerId, data.answer as RTCSessionDescriptionInit);
        break;

      case 'ice-candidate':
        // Received ICE candidate
        await this.handleIceCandidate(
          data.senderId as PeerId,
          data.candidate as RTCIceCandidateInit
        );
        break;

      case 'relay':
        // Message relayed through signaling server - unwrap original message
        if (this.messageHandler && data.senderId !== this.peerId) {
          const originalMessage = data.originalMessage as NetworkMessage | undefined;
          if (originalMessage) {
            this.messageHandler(originalMessage);
          }
        }
        break;

      case 'existing-peers':
        // Connect to existing peers in room
        const existingPeers = data.peers as PeerId[];
        for (const peerId of existingPeers) {
          await this.createPeerConnection(peerId, true);
        }
        break;
    }
  }

  /**
   * Create a new peer connection
   */
  private async createPeerConnection(remotePeerId: PeerId, createOffer: boolean): Promise<void> {
    if (this.peers.has(remotePeerId)) {
      return; // Already connected
    }

    const iceServers = this.config?.iceServers ?? DEFAULT_ICE_SERVERS;
    const connection = new RTCPeerConnection({ iceServers });

    const peerConnection: PeerConnection = {
      peerId: remotePeerId,
      connection,
      dataChannel: null,
      isConnected: false,
    };

    this.peers.set(remotePeerId, peerConnection);

    // Handle ICE candidates
    connection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignaling({
          type: 'ice-candidate',
          targetId: remotePeerId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // Handle connection state changes
    connection.onconnectionstatechange = () => {
      if (this.debug) {
        console.log(
          `[WebRTCTransport] Connection state with ${remotePeerId}:`,
          connection.connectionState
        );
      }

      if (connection.connectionState === 'connected') {
        peerConnection.isConnected = true;
      } else if (
        connection.connectionState === 'disconnected' ||
        connection.connectionState === 'failed'
      ) {
        peerConnection.isConnected = false;
      }
    };

    // Handle incoming data channels
    connection.ondatachannel = (event) => {
      this.setupDataChannel(peerConnection, event.channel);
    };

    if (createOffer) {
      // Create data channel and offer
      const dataChannel = connection.createDataChannel('holoscript', {
        ordered: false, // Allow out-of-order for lower latency
        maxRetransmits: 3,
      });
      this.setupDataChannel(peerConnection, dataChannel);

      // Create and send offer
      const offer = await connection.createOffer();
      await connection.setLocalDescription(offer);

      this.sendSignaling({
        type: 'offer',
        targetId: remotePeerId,
        offer: connection.localDescription?.toJSON(),
      });
    }
  }

  /**
   * Set up data channel event handlers
   */
  private setupDataChannel(peerConnection: PeerConnection, dataChannel: RTCDataChannel): void {
    peerConnection.dataChannel = dataChannel;

    dataChannel.onopen = () => {
      if (this.debug) {
        console.log(`[WebRTCTransport] DataChannel open with ${peerConnection.peerId}`);
      }
      peerConnection.isConnected = true;
    };

    dataChannel.onclose = () => {
      if (this.debug) {
        console.log(`[WebRTCTransport] DataChannel closed with ${peerConnection.peerId}`);
      }
      peerConnection.isConnected = false;
    };

    dataChannel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as NetworkMessage;
        if (this.messageHandler) {
          this.messageHandler(message);
        }
      } catch (err) {
        console.error('[WebRTCTransport] Failed to parse data channel message:', err);
      }
    };

    dataChannel.onerror = (error) => {
      console.error(`[WebRTCTransport] DataChannel error with ${peerConnection.peerId}:`, error);
    };
  }

  /**
   * Handle incoming offer
   */
  private async handleOffer(
    senderId: PeerId,
    offer: RTCSessionDescriptionInit
  ): Promise<void> {
    // Create peer connection if it doesn't exist
    if (!this.peers.has(senderId)) {
      await this.createPeerConnection(senderId, false);
    }

    const peerConnection = this.peers.get(senderId);
    if (!peerConnection) return;

    await peerConnection.connection.setRemoteDescription(offer);

    // Create and send answer
    const answer = await peerConnection.connection.createAnswer();
    await peerConnection.connection.setLocalDescription(answer);

    this.sendSignaling({
      type: 'answer',
      targetId: senderId,
      answer: peerConnection.connection.localDescription?.toJSON(),
    });
  }

  /**
   * Handle incoming answer
   */
  private async handleAnswer(
    senderId: PeerId,
    answer: RTCSessionDescriptionInit
  ): Promise<void> {
    const peerConnection = this.peers.get(senderId);
    if (!peerConnection) return;

    await peerConnection.connection.setRemoteDescription(answer);
  }

  /**
   * Handle incoming ICE candidate
   */
  private async handleIceCandidate(
    senderId: PeerId,
    candidate: RTCIceCandidateInit
  ): Promise<void> {
    const peerConnection = this.peers.get(senderId);
    if (!peerConnection) return;

    try {
      await peerConnection.connection.addIceCandidate(candidate);
    } catch (err) {
      console.error('[WebRTCTransport] Failed to add ICE candidate:', err);
    }
  }

  /**
   * Remove a peer connection
   */
  private removePeer(peerId: PeerId): void {
    const peerConnection = this.peers.get(peerId);
    if (peerConnection) {
      peerConnection.dataChannel?.close();
      peerConnection.connection.close();
      this.peers.delete(peerId);

      if (this.debug) {
        console.log(`[WebRTCTransport] Removed peer ${peerId}`);
      }
    }
  }

  /**
   * Send message through signaling server
   */
  private sendSignaling(data: unknown): void {
    if (this.signalingWs && this.signalingWs.readyState === WebSocket.OPEN) {
      this.signalingWs.send(
        JSON.stringify({
          ...data as object,
          senderId: this.peerId,
        })
      );
    }
  }
}
