import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb, getDbStatus } from './config/db.js';
import { initSocket } from './socket.js';

// Route imports
import ownerRoutes from './routes/ownerRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import billRoutes from './routes/billRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
  }
});
initSocket(io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check and system diagnostic
app.get('/', (req, res) => {
  const dbStatus = getDbStatus();
  res.json({
    name: 'Luxe Dine REST & WebSocket API',
    version: '1.0.0',
    status: 'ONLINE',
    database: dbStatus,
    timestamp: new Date()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    database: getDbStatus(),
    uptime: process.uptime()
  });
});

// Mount Routes
app.use('/api/owner', ownerRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/reports', reportRoutes);

// Global 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]:', err.stack);
  res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
});

// Initialize database & Start HTTP + WebSocket Server
const startServer = async () => {
  await initDb();
  server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Luxe Dine Backend API running on http://localhost:${PORT}`);
    console.log(`📡 WebSocket server initialized for real-time KDS ticketing`);
    console.log(`🗄️ Database: PostgreSQL (with resilient mock fallback)`);
    console.log(`======================================================\n`);
  });
};

startServer();
