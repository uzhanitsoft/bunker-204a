// Socket.io hook for БУНКЕР 204-А

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useBunkerStore } from '../stores/gameStore';

const SOCKET_URL = import.meta.env.PROD
  ? window.location.origin
  : 'http://localhost:3204';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const store = useBunkerStore();

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Connected to server');
      store.setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      store.setConnected(false);
    });

    socket.on('game_state_update', (state) => {
      store.setGameState(state);
    });

    socket.on('ai_comment', (comment) => {
      store.addAIComment(comment);
    });

    socket.on('your_turn', (_data) => {
      store.setShowYourTurn(true);
      // Vibrate if supported
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      setTimeout(() => store.setShowYourTurn(false), 3000);
    });

    socket.on('game_paused', (_data) => {
      store.setIsPausedOverlay(true);
    });

    socket.on('game_resumed', () => {
      store.setIsPausedOverlay(false);
    });

    socket.on('game_over', (data) => {
      store.setScores(data.scores);
    });

    socket.on('card_revealed', (data) => {
      // Dispatch event for the big card overlay display
      window.dispatchEvent(new CustomEvent('card_revealed_display', {
        detail: {
          playerName: data.playerName,
          card: data.card,
        }
      }));
    });

    socket.on('voting_ended', () => {
      // Voting ended - state will be updated
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const emit = useCallback((event: string, data?: any): Promise<any> => {
    return new Promise((resolve) => {
      if (socketRef.current) {
        if (data !== undefined && data !== null) {
          socketRef.current.emit(event, data, (response: any) => {
            resolve(response);
          });
        } else {
          // No data — pass callback as first arg so Socket.io recognizes it
          socketRef.current.emit(event, (response: any) => {
            resolve(response);
          });
        }
      }
    });
  }, []);

  const getSocketId = useCallback(() => {
    return socketRef.current?.id || '';
  }, []);

  return { emit, getSocketId, socket: socketRef };
}
