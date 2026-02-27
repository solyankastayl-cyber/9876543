/**
 * FOMO AI WebSocket Hook
 * 
 * Provides real-time decision updates via WebSocket
 * Connects to /ws endpoint and subscribes to signals category
 */

import { useEffect, useRef, useState, useCallback } from 'react';

const WS_RECONNECT_DELAY = 3000;
const WS_PING_INTERVAL = 25000; // Slightly less than server's 30s

export function useFomoAiWs(symbol, onUpdate) {
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const isUnmountedRef = useRef(false);

  const connect = useCallback(() => {
    if (isUnmountedRef.current) return;
    
    // Get WebSocket URL from backend URL - use /api/ws prefix for Kubernetes routing
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    const wsUrl = backendUrl
      .replace('https://', 'wss://')
      .replace('http://', 'ws://') + '/api/ws';

    console.log('[FOMO WS] Connecting to:', wsUrl);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (isUnmountedRef.current) {
          ws.close();
          return;
        }
        
        console.log('[FOMO WS] Connected');
        setConnected(true);

        // Subscribe to signals category (for decision updates)
        ws.send(JSON.stringify({
          type: 'hello',
          subscriptions: ['signals', 'alerts', 'attribution'],
        }));
        console.log('[FOMO WS] Subscribed to signals, alerts, attribution');

        // Start ping interval to keep connection alive
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, WS_PING_INTERVAL);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle different event types
          if (data.type === 'connected') {
            console.log('[FOMO WS] Received welcome, clientId:', data.clientId);
          } else if (data.type === 'pong') {
            // Ping response, connection is alive
          } else if (data.type?.startsWith('signal.') || data.type === 'decision_update') {
            // Decision/signal update
            const payload = data.payload || data;
            if (payload && (payload.symbol === symbol || !payload.symbol)) {
              console.log('[FOMO WS] Signal update:', payload.action || data.type, payload.confidence);
              setLastUpdate(new Date());
              
              if (onUpdate && payload.action) {
                onUpdate(payload);
              }
            }
          } else if (data.type?.startsWith('alert.')) {
            // Alert update
            console.log('[FOMO WS] Alert:', data.type, data.payload?.severity);
          }
        } catch (err) {
          console.error('[FOMO WS] Parse error:', err);
        }
      };

      ws.onclose = (event) => {
        console.log('[FOMO WS] Disconnected:', event.code, event.reason);
        setConnected(false);
        
        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Reconnect after delay (unless unmounted)
        if (!isUnmountedRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('[FOMO WS] Reconnecting...');
            connect();
          }, WS_RECONNECT_DELAY);
        }
      };

      ws.onerror = (error) => {
        console.error('[FOMO WS] Error:', error);
      };

    } catch (err) {
      console.error('[FOMO WS] Connection failed:', err);
      
      // Retry connection (unless unmounted)
      if (!isUnmountedRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, WS_RECONNECT_DELAY);
      }
    }
  }, [symbol, onUpdate]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    isUnmountedRef.current = false;
    connect();

    return () => {
      isUnmountedRef.current = true;
      disconnect();
    };
  }, [symbol]); // Reconnect when symbol changes

  return {
    connected,
    lastUpdate,
    reconnect: connect,
    disconnect,
  };
}
