import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { QueueEntry } from '../types';

type QueueUpdateCallback = (queue: QueueEntry[]) => void;

let stompClient: Client | null = null;

export const connectWebSocket = (onQueueUpdate: QueueUpdateCallback): Client => {
  const client = new Client({
    webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
    reconnectDelay: 3000,
    onConnect: () => {
      console.log('[WS] Connected to MediFlowIQ');
      client.subscribe('/topic/queue', (message) => {
        try {
          const queue: QueueEntry[] = JSON.parse(message.body);
          onQueueUpdate(queue);
        } catch (err) {
          console.error('[WS] Failed to parse queue update', err);
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

export const disconnectWebSocket = (): void => {
  if (stompClient?.active) {
    stompClient.deactivate();
    stompClient = null;
  }
};
