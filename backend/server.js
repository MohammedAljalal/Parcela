// server.js 
'use strict';

// ─── Core Packages 
import http from 'http';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';    




// ─── Config 
import connectDB from './src/config/database.js';
import env from './src/config/env.js';

// ─── Middleware 
import { notFound } from './src/middleware/errorHandler.js';

// ─── Middleware ────────────────────────────────────────────
import {errorHandler} from './src/middleware/errorHandler.js'; 

// ─── Utils ─────────────────────────────────────────────────
import { sendError, sendSuccess } from './src/utils/response.js';

// ─── Routes ────────────────────────────────────────────────
import authRoutes from './src/routes/auth.routes.js';

// ─── Create Express App ────────────────────────────────────
const app = express();

// ─── Connect Database ──────────────────────────────────────
connectDB();

// ─── Security Middleware ───────────────────────────────────
app.use(helmet());

app.use(
  cors({
    origin: env.CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  })
);

// ─── Body Parsers ──────────────────────────────────────────
app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

// ─── HTTP Logger ───────────────────────────────────────────
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Health Check ──────────────────────────────────────────
app.get('/health', (req, res) => {
  sendSuccess(
    res,
    {
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    },
    'Server is running normally'
  );
});

// ─── API Routes ────────────────────────────────────────────
app.use('/api/auth', authRoutes);

// ─── 404 Handler ───────────────────────────────────────────
app.use(notFound);

// ─── Global Error Handler ──────────────────────────────────
app.use(errorHandler);

// ─── Create HTTP Server ────────────────────────────────────
const server = http.createServer(app);

// ─── Start Server ──────────────────────────────────────────
server.listen(env.PORT, () => {
  console.log(` Server running on port ${env.PORT}`);
  console.log(` Environment: ${env.NODE_ENV}`);
  console.log(` http://localhost:${env.PORT}/health`);
});

// ─── Handle Unhandled Promise Rejections ───────────────────
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);

  server.close(() => {
    process.exit(1);
  });
});

// ─── Handle Uncaught Exceptions ────────────────────────────
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);

  server.close(() => {
    process.exit(1);
  });
});