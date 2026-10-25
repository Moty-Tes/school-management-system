import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { env } from '../config/env.js';

let io: Server;

export function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.WEB_BASE_URL || 'http://localhost:3000',
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // When a user logs in, they join a "room" based on their User ID
    socket.on('join_room', (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined their real-time room.`);
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
      io.to(data.receiverId).emit('user_typing', data.senderId);
    });

    socket.on('stop_typing', (data) => {
      io.to(data.receiverId).emit('user_stop_typing', data.senderId);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
}