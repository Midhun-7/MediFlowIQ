import { Client, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { QueueEntry, Ambulance } from '../types';

type QueueUpdateCallback = (queue: QueueEntry[]) => void;
type StatsUpdateCallback = (stats: import('../types').QueueStats) => void;
type AmbulanceUpdateCallback = (ambulances: Ambulance[]) => void;

let stompClient: Client | null = null;
let ambulanceSub: StompSubscription | null = null;

export const connectWebSocket = (
  onQueueUpdate: QueueUpdateCallback,
  onStatsUpdate: StatsUpdateCallback
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

export const disconnectWebSocket = (): void => {
  if (stompClient?.active) {
    stompClient.deactivate();
    stompClient = null;
  }
};

