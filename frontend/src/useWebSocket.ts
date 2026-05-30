import { useEffect, useRef, useCallback } from 'react';
import { useAppDispatch } from './hooks/index';

// WebSocket hook - connects to real backend when available
// No simulation - only real server messages

export const useWebSocket = (enabled: boolean = true) => {
  const ws = useRef<WebSocket | null>(null);
  const dispatch = useAppDispatch();
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!enabled) return;

    try {
      const socket = new WebSocket('ws://localhost:8080/ws');
      ws.current = socket;

      socket.onopen = () => {
        console.log('[WS] Connected');
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          dispatch({ type: 'toast/addToast', payload: {
            id: Date.now(),
            message: data.message,
            type: data.type || 'info',
          }});
        } catch (e) {
          console.error('[WS] Parse error:', e);
        }
      };

      socket.onerror = () => {
        // Backend not ready yet - silent fail
      };

      socket.onclose = () => {
        // Try reconnect in 10s
        reconnectTimer.current = setTimeout(connect, 10000);
      };
    } catch (e) {
      // WebSocket not available - silent fail
    }
  }, [enabled, dispatch]);

  useEffect(() => {
    connect();
    return () => {
      if (ws.current) ws.current.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [connect]);

  const sendMessage = useCallback((msg: object) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(msg));
    }
  }, []);

  return { sendMessage };
};
