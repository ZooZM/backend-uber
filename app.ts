import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import { globalErrorHandler } from './controllers/errorController';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use('/api/v1/auth', authRoutes);

app.get('/', (_, res) => {
  res.send('Uber Backend with TypeScript 🚗');
});

app.use(globalErrorHandler);

mongoose.connect(process.env.MONGO_URI!)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(port, () => {
      console.log(`🚀 Server running at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });

export default app;
