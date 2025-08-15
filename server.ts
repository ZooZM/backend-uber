import mongoose from 'mongoose';
import http from 'http';
import dotenv from 'dotenv';
import app from './app';
import { Server } from 'socket.io';
import { initIO, initSocket } from './socket/socketHandler';

if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
  // dotenv.config();
}
console.log("All env vars:", process.env);

console.log("NODE_ENV =", process.env.NODE_ENV);
console.log("MONGO_URI =", process.env.MONGO_URI);

const port = process.env.PORT || 5000;

const server =  http.createServer(app);

const io = initIO(server);

initSocket(io);

mongoose.connect(process.env.MONGO_URI!)
  .then(() => {
    console.log('✅ MongoDB connected');

    server.listen(port, () => {
      console.log(`🚀 Server running at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });
