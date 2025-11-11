import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimit';
import { syncFromBDS } from './services/bds-sync.service';

// Routes
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import riderRoutes from './routes/rider.routes';
import commentRoutes from './routes/comment.routes';
import subscriptionRoutes from './routes/subscription.routes';
import activityRoutes from './routes/activity.routes';
import webhookRoutes from './routes/webhook.routes';
import syncRoutes from './routes/sync.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Webhook route needs raw body - must be before JSON parser
app.use('/webhook', express.raw({ type: 'application/json' }), webhookRoutes);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(apiLimiter);

// Routes
app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);
app.use('/riders', riderRoutes);
app.use('/riders', commentRoutes); // Comments are under /riders/:id/comments
app.use('/subscriptions', subscriptionRoutes);
app.use('/user', activityRoutes); // /user/activities, /user/favorites
app.use('/sync', syncRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      message: 'Client Facing Server API',
      version: '1.0.0',
      endpoints: {
        auth: '/auth',
        projects: '/projects',
        riders: '/riders',
        subscriptions: '/subscriptions',
        user: '/user',
        sync: '/sync',
        health: '/health'
      }
    }
  });
});

// Error handling
app.use(errorHandler);

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Client Facing Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Setup BDS sync cron job if enabled
    if (process.env.BDS_SYNC_ENABLED === 'true') {
      const cronSchedule = process.env.BDS_SYNC_CRON || '0 0 * * *'; // Default: daily at midnight
      cron.schedule(cronSchedule, async () => {
        console.log('Running scheduled BDS sync...');
        try {
          await syncFromBDS();
          console.log('Scheduled BDS sync completed');
        } catch (error) {
          console.error('Scheduled BDS sync failed:', error);
        }
      });
      console.log(`📅 BDS sync scheduled: ${cronSchedule}`);
    }
  });
}

export default app;

