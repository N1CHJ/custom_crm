import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { Env } from './types';

// Import routes
import { leadsRoutes } from './routes/leads';
import { contactsRoutes } from './routes/contacts';
import { companiesRoutes } from './routes/companies';
import { dealsRoutes } from './routes/deals';
import { activitiesRoutes } from './routes/activities';
import { dashboardRoutes } from './routes/dashboard';
import { pipelineRoutes } from './routes/pipeline';

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Health check
app.get('/', (c) => {
  return c.json({ 
    message: "Zane's CRM API", 
    version: '1.0.0',
    status: 'healthy' 
  });
});

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routes
app.route('/api/leads', leadsRoutes);
app.route('/api/contacts', contactsRoutes);
app.route('/api/companies', companiesRoutes);
app.route('/api/deals', dealsRoutes);
app.route('/api/activities', activitiesRoutes);
app.route('/api/dashboard', dashboardRoutes);
app.route('/api/pipeline', pipelineRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found', message: 'The requested resource was not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ 
    error: 'Internal Server Error', 
    message: err.message 
  }, 500);
});

export default app;
