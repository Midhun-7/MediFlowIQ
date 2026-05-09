import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

type NotificationHandler = (payload: any) => void;

/**
 * Subscribes to the patient's personal WebSocket channel:
 *   /topic/patient/{patientId}
 * Calls onMessage whenever the server pushes an event.
 */
export const usePatientWebSocket = (patientId: number | null, onMessage: NotificationHandler) => {
  const clientRef = useRef<Client | null>(null);
  const stableOnMessage = useRef(onMessage);
  stableOnMessage.current = onMessage;

  useEffect(() => {
    if (!patientId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log(`[WS] Patient ${patientId} connected`);
        client.subscribe(`/topic/patient/${patientId}`, (msg) => {
          try {
            const payload = JSON.parse(msg.body);
            stableOnMessage.current(payload);
          } catch {
            console.warn('[WS] Failed to parse message:', msg.body);
          }
        });
      },
      onDisconnect: () => console.log('[WS] Patient disconnected'),
    });

    client.activate();
    clientRef.current = client;

    return () => { client.deactivate(); };
  }, [patientId]);
};
