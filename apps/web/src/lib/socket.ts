import { io, Socket } from 'socket.io-client';
import { getApiBaseUrl } from './config';

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    const apiUrl = getApiBaseUrl();
    socket = io(apiUrl, { withCredentials: true });
  }
  return socket;
};