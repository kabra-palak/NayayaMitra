import { io } from 'socket.io-client';

let socket = null;

export function initSocket() {
  if (socket) return socket;

  const backend = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  const token = localStorage.getItem("token");

  socket = io(backend, {
    autoConnect: false,
    transports: ['websocket'],
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    auth: { token },
  });

  socket.on('connect_error', (err) =>
    console.warn('socket connect_error', err)
  );

  socket.on('reconnect_attempt', (count) =>
    console.debug('socket reconnect attempt', count)
  );

  return socket;
}

export function connectSocket() {
  if (socket && !socket.connected) {
    socket.connect();
  }
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}