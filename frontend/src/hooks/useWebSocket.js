import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:5000';

export function useWebSocket(userId, onMessage) {
  // Keep the latest handler in a ref so a new callback never tears down the socket.
  const handlerRef = useRef(onMessage);
  useEffect(() => {
    handlerRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!userId) return undefined;

    const socket = io(WS_URL, { query: { userId } });

    // Re-subscribe on every (re)connect: rooms are lost when the connection drops.
    socket.on('connect', () => socket.emit('subscribe', userId));
    socket.on('imageStatus', (data) => handlerRef.current(data));

    return () => {
      socket.disconnect();
    };
  }, [userId]);
}
