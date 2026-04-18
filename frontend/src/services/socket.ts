import { Client, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { QueueEntry, Ambulance, AppNotification } from '../types';

type QueueUpdateCallback = (queue: QueueEntry[]) => void;
type StatsUpdateCallback = (stats: import('../types').QueueStats) => void;
type AmbulanceUpdateCallback = (ambulances: Ambulance[]) => void;
type NotificationCallback = (notification: AppNotification) => void;

let stompClient: Client | null = null;
let ambulanceSub: StompSubscription | null = null;
let notificationSub: StompSubscription | null = null;

export const connectWebSocket = (
  onQueueUpdate: QueueUpdateCallback,
  onStatsUpdate: StatsUpdateCallback,
  onNotification?: NotificationCallback
): Client => {
  const client = new Client({
    webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
    reconnectDelay: 3000,
    onConnect: () => {
      console.log('[WS] Connected to MediFlowIQ');
      
      // Subscribe to queue changes
      client.subscribe('/topic/queue', (message) => {
        try {
          const queue: QueueEntry[] = JSON.parse(message.body);
          onQueueUpdate(queue);
        } catch (err) {
          console.error('[WS] Failed to parse queue update', err);
        }
      });

      // Subscribe to intelligence stats
      client.subscribe('/topic/stats', (message) => {
        try {
          const stats = JSON.parse(message.body);
          onStatsUpdate(stats);
        } catch (err) {
          console.error('[WS] Failed to parse stats update', err);
        }
      });

      // Phase 5 — Subscribe to real-time notifications
      if (onNotification) {
        notificationSub = client.subscribe('/topic/notifications', (message) => {
          try {
            const notification: AppNotification = JSON.parse(message.body);
            onNotification(notification);
          } catch (err) {
            console.error('[WS] Failed to parse notification', err);
          }
        });
      }
    },
    onDisconnect: () => {
      console.log('[WS] Disconnected');
    },
    onStompError: (frame) => {
      console.error('[WS] STOMP error', frame);
    },
  });

  client.activate();
  stompClient = client;
  return client;
};

export const subscribeAmbulance = (onUpdate: AmbulanceUpdateCallback): void => {
  if (!stompClient?.connected) {
    console.warn('[WS] Cannot subscribe to ambulance — STOMP not connected yet');
    return;
  }
  ambulanceSub = stompClient.subscribe('/topic/ambulance', (message) => {
    try {
      const ambulances: Ambulance[] = JSON.parse(message.body);
      onUpdate(ambulances);
    } catch (err) {
      console.error('[WS] Failed to parse ambulance update', err);
    }
  });
};

export const unsubscribeAmbulance = (): void => {
  ambulanceSub?.unsubscribe();
  ambulanceSub = null;
};

export const unsubscribeNotifications = (): void => {
  notificationSub?.unsubscribe();
  notificationSub = null;
};

export const disconnectWebSocket = (): void => {
  if (stompClient?.active) {
    stompClient.deactivate();
    stompClient = null;
  }
};


