import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import mongoSanitize from 'xss-clean';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// ============ MIDDLEWARE ============

// Security
app.use(helmet());
app.use(mongoSanitize());

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  }),
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============ ROUTES ============

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API version
app.get('/api/v1', (req: Request, res: Response) => {
  res.json({
    version: '1.0.0',
    name: 'FloodWeb API',
    status: 'operational',
    timestamp: new Date().toISOString(),
  });
});

// Authentication routes (stub)
app.post('/api/v1/auth/register', (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

app.post('/api/v1/auth/login', (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

// User profile routes (stub)
app.get('/api/v1/profile', (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

// Safety profile routes (stub)
app.get('/api/v1/safety-profile', (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

// Risk routes (stub)
app.get('/api/v1/risk/current', (req: Request, res: Response) => {
  res.json({
    riskLevel: 'medium',
    severity: 3,
    affectedAreas: ['Zone A', 'Zone B'],
    timestamp: new Date().toISOString(),
  });
});

// Alerts routes (stub)
app.get('/api/v1/alerts', (req: Request, res: Response) => {
  res.json({
    alerts: [
      {
        alertId: '1',
        type: 'flood',
        priority: 4,
        message: 'Heavy rainfall warning in Zone A',
        area: 'District 1',
        createdAt: new Date().toISOString(),
        status: 'new',
      },
    ],
    total: 1,
  });
});

// Community reports routes (stub)
app.get('/api/v1/reports', (req: Request, res: Response) => {
  res.json({
    reports: [],
    total: 0,
  });
});

// Evacuation routes (stub)
app.get('/api/v1/evacuation/routes', (req: Request, res: Response) => {
  res.json({
    routes: [],
  });
});

// Learning topics (stub)
app.get('/api/v1/learn/topics', (req: Request, res: Response) => {
  res.json({
    topics: [],
  });
});

// Admin routes (stub)
app.get('/api/v1/admin/analytics/dashboard', (req: Request, res: Response) => {
  res.json({
    totalUsers: 0,
    activeUsers24h: 0,
    alertsToday: 0,
    reportsToday: 0,
  });
});

// ============ ERROR HANDLING ============

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    },
  });
});

// ============ SERVER START ============

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║                                          ║
║     🌊 FloodWeb API Server Started       ║
║                                          ║
║     Port: ${PORT}                    
║     Environment: ${process.env.NODE_ENV || 'development'}
║     URL: http://localhost:${PORT}       
║                                          ║
║  📚 API Docs: /api/v1               
║  ❤️  Health: /health                  
║                                          ║
╚══════════════════════════════════════════╝
  `);
});

export default app;
