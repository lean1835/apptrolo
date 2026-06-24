import express, { Express } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { trimRequest } from './common/middlewares/trim.middleware';
import { errorHandler } from './common/middlewares/error.middleware';
import routes from './common/routes';

const app: Express = express();

// Global Middlewares
app.use(compression() as any);
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(trimRequest);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Mounting main api routes
app.use('/api', routes);

// Global Error Handler
app.use(errorHandler);

export default app;
