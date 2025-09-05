import express from 'express';
import dotenv from 'dotenv';
import cors from "cors";
import authRoutes from './routes/authRoutes';
import tripRoutes from './routes/tripRoutes';
import { globalErrorHandler } from './controllers/errorController';
import driverRoutes from './routes/driverRoutes';


dotenv.config();

const app = express();
app.use(cors());

app.use(express.json());


app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/trip', tripRoutes);
app.use('/api/v1/driver',driverRoutes);


app.get('/', (_, res) => {
  res.send('Uber Backend with TypeScript 🚗');
});

app.use(globalErrorHandler);

export default app;
