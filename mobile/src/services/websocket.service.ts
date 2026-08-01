// WebSocket Service for Real-Time Updates (Mobile)
// Connects to backend WebSocket for instant alert notifications

import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, STORAGE_KEYS } from '../constants/config';

interface WebSocketMessage {
  type: 'alert' | 'incident' | 'sos' | 'badge_update' | 'notification';
  data: any;
}

type MessageHandler = (data: any) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private lastStatusLog = 0;

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    if (this.socket?.connected || this.isConnecting) {
      console.log('🔌 [WebSocket] Already connected or connecting');
      console.log('   Status:', {
        connected: this.socket?.connected,
        isConnecting: this.isConnecting,
      });
      return;
    }

    this.isConnecting = true;
    console.log('🔌 [WebSocket] Starting connection process...');

    try {
      // Get auth token
      let token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (!token) {
        console.warn('⚠️ [WebSocket] No auth token found, skipping connection');
        console.log('   Checked key:', STORAGE_KEYS.ACCESS_TOKEN);
        this.isConnecting = false;
        return;
      }

      // Clean token - remove quotes and whitespace
      token = token.replace(/^["']|["']$/g, '').trim();

      console.log('✅ [WebSocket] Auth token found and cleaned:', token.substring(0, 20) + '...');

      // Extract base URL (remove /api/v1)
      const wsUrl = API_CONFIG.BASE_URL.replace('/api/v1', '');
      
      console.log('🔌 [WebSocket] Connection Details:');
      console.log('   API URL:', API_CONFIG.BASE_URL);
      console.log('   WebSocket URL:', wsUrl);
      console.log('   Path: /ws');
      console.log('   Transports: websocket, polling');

      // Create socket connection
      this.socket = io(wsUrl, {
        path: '/ws',
        auth: {
          token: token  // Pass token in auth object for Socket.IO v3+
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        timeout: 10000,
      });

      console.log('🔌 [WebSocket] Socket instance created, setting up handlers...');

      this.setupEventHandlers();

      // Connection event handlers
      this.socket.on('connect', () => {
        console.log('✅ [WebSocket] CONNECTED SUCCESSFULLY!');
        console.log('   Socket ID:', this.socket?.id);
        console.log('   Transport:', this.socket?.io.engine.transport.name);
        this.reconnectAttempts = 0;
        this.isConnecting = false;
      });

      this.socket.on('authenticated', (data: any) => {
        console.log('✅ [WebSocket] AUTHENTICATED SUCCESSFULLY!');
        console.log('   User ID:', data.userId);
        console.log('   User:', data.user);
        console.log('🎉 [WebSocket] Ready to receive real-time updates!');
      });

      this.socket.on('auth_error', (error: any) => {
        console.error('❌ [WebSocket] Authentication failed:', error);
        this.disconnect();
      });

    } catch (error) {
      console.error('❌ [WebSocket] Connection error:', error);
      this.isConnecting = false;
    }
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    console.log('🔧 [WebSocket] Setting up event handlers...');

    // Connection events
    this.socket.on('disconnect', (reason: string) => {
      console.log('🔌 [WebSocket] DISCONNECTED');
      console.log('   Reason:', reason);
      this.isConnecting = false;
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('❌ [WebSocket] Connection error:', error.message);
      console.log('   Details:', error);
    });

    this.socket.on('reconnect_attempt', (attempt: number) => {
      console.log(`🔄 [WebSocket] Reconnect attempt ${attempt}/${this.maxReconnectAttempts}`);
      this.reconnectAttempts = attempt;
    });

    this.socket.on('reconnect', (attempt: number) => {
      console.log(`✅ [WebSocket] Reconnected after ${attempt} attempts`);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ [WebSocket] Reconnection failed after max attempts');
      this.isConnecting = false;
    });

    // Message events
    this.socket.on('new_alert', (data: any) => {
      console.log('📢 [WebSocket] NEW ALERT RECEIVED!');
      console.log('   Alert:', data);
      this.notifyHandlers('new_alert', data);
    });

    this.socket.on('alert_updated', (data: any) => {
      console.log('📢 [WebSocket] ALERT UPDATED!');
      console.log('   Alert:', data);
      this.notifyHandlers('alert_updated', data);
    });

    this.socket.on('new_incident', (data: any) => {
      console.log('📢 [WebSocket] NEW INCIDENT RECEIVED!');
      console.log('   Incident:', data);
      this.notifyHandlers('new_incident', data);
    });

    this.socket.on('new_sos', (data: any) => {
      console.log('📢 [WebSocket] NEW SOS RECEIVED!');
      console.log('   SOS:', data);
      this.notifyHandlers('new_sos', data);
    });

    this.socket.on('badge_update', (data: any) => {
      console.log('📢 [WebSocket] BADGE UPDATE RECEIVED!');
      console.log('   Badges:', data);
      this.notifyHandlers('badge_update', data);
    });

    this.socket.on('notification', (data: any) => {
      console.log('📢 [WebSocket] NOTIFICATION RECEIVED!');
      console.log('   Notification:', data);
      this.notifyHandlers('notification', data);
    });

    this.socket.on('capacity_updated', (data: any) => {
      console.log('📢 [WebSocket] CAPACITY UPDATE RECEIVED!');
      console.log('   Center:', data.data?.centerId);
      console.log('   Available Slots:', data.data?.availableSlots);
      console.log('   Status:', data.data?.statusLevel);
      this.notifyHandlers('capacity_updated', data);
    });

    // Ping/pong for connection health
    this.socket.on('pong', () => {
      console.log('🏓 [WebSocket] Pong received - connection alive');
    });

    console.log('✅ [WebSocket] Event handlers setup complete');
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      console.log('🔌 [WebSocket] Disconnecting...');
      this.socket.disconnect();
      this.socket = null;
      console.log('✅ [WebSocket] Disconnected');
    }
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  /**
   * Subscribe to message type
   */
  on(event: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, new Set());
    }
    this.messageHandlers.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(event);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  /**
   * Notify all handlers for an event
   */
  private notifyHandlers(event: string, data: any): void {
    const handlers = this.messageHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in ${event} handler:`, error);
        }
      });
    }
  }

  /**
   * Send ping to check connection
   */
  ping(): void {
    if (this.socket?.connected) {
      console.log('🏓 [WebSocket] Sending ping...');
      this.socket.emit('ping');
    } else {
      console.log('⚠️ [WebSocket] Cannot ping - not connected');
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get connection status
   */
  getStatus(): {
    connected: boolean;
    reconnectAttempts: number;
    isConnecting: boolean;
  } {
    const status = {
      connected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      isConnecting: this.isConnecting,
    };
    
    // Log status every 10 seconds (to avoid spam)
    const now = Date.now();
    if (!this.lastStatusLog || now - this.lastStatusLog > 10000) {
      console.log('📊 [WebSocket] Status:', status);
      this.lastStatusLog = now;
    }
    
    return status;
  }
}

export const websocketService = new WebSocketService();
export default websocketService;
