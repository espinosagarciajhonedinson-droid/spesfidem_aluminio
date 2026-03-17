const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Unirse a una sala específica
  socket.on('join-room', (roomId, cb) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
    
    // Notificar a otros en la sala
    socket.to(roomId).emit('user-connected', socket.id);
    if(cb) cb();
  });

  // ========== WebRTC Signaling ==========
  socket.on('offer', (payload) => {
    socket.to(payload.target).emit('offer', {
      caller: socket.id,
      sdp: payload.sdp
    });
  });

  socket.on('answer', (payload) => {
    socket.to(payload.target).emit('answer', {
      callee: socket.id,
      sdp: payload.sdp
    });
  });

  socket.on('ice-candidate', (payload) => {
    socket.to(payload.target).emit('ice-candidate', {
      sender: socket.id,
      candidate: payload.candidate
    });
  });

  // ========== Sincronización de Estado Colaborativo ==========
  socket.on('update-state', (payload) => {
    // payload: { roomId, key, value }
    // Emitir a todos en la sala excepto al que envía
    socket.to(payload.roomId).emit('state-updated', payload);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // Socket.io maneja la salida de las salas automáticamente
    // pero podemos notificar al resto de la sala si tuviéramos mapeado el socket a una sala.
    // Dado que el socket ya no existe, usamos broadcasts si llevamos registro.
    io.emit('user-disconnected', socket.id);
  });
});

const PORT = 3001;
server.listen(PORT, () => console.log(`Backend de Consultoría corriendo en puerto ${PORT}`));
