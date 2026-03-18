import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import http from 'http';
import connectDB from './config/database.js';
import { initializeSocket } from './sockets/index.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import groupRoutes from './routes/groups.js';
import expenseRoutes from './routes/expenses.js';
import settlementRoutes from './routes/settlements.js';
import dashboardRoutes from './routes/dashboard.js';
import personalExpenseRoutes from './routes/personal-expenses.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import mongoose from 'mongoose';

// Load environment variables - MUST be first
dotenv.config();

// Debug: Verify environment variables are loaded
console.log('🔍 Environment Check:');
console.log('  PORT:', process.env.PORT || '5000 (default)');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('  MONGO_URI:', !!process.env.MONGO_URI ? '✓ Set' : '✗ Missing');
console.log('  CLIENT_URL:', process.env.CLIENT_URL || 'http://localhost:5173');
console.log('');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB (don't wait for it)
connectDB().catch(err => {
  console.error('⚠️  Database connection error handled');
});
console.log('');

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Initialize Socket.io handlers
initializeSocket(io);

// Make io accessible to routes
app.set('io', io);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enhanced health check endpoint
app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'connected' : 'disconnected';
  
  res.status(200).json({
    status: 'OK',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()) + 's'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/personal-expenses', personalExpenseRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
server.listen(PORT, () => {
  const dbReady = mongoose.connection.readyState === 1;
  console.log('🚀 Server running on port', PORT);
  console.log('📊 Environment:', process.env.NODE_ENV || 'development');
  console.log('🔗 Health:', `http://localhost:${PORT}/health`);
  console.log(`📦 Database: ${mongoose.connection.name || 'optisplit'} (${dbReady ? '✅ Connected' : '⏳ Connecting...'})`);
});

export default app;
