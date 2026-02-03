import { Hono } from 'hono';
import type { Env } from '../types';

export const dashboardRoutes = new Hono<{ Bindings: Env }>();

// Get dashboard stats
dashboardRoutes.get('/stats', async (c) => {
  // Total counts
  const totalLeads = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM leads WHERE status != "converted"'
  ).first<{ count: number }>();

  const totalContacts = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM contacts'
  ).first<{ count: number }>();

  const totalCompanies = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM companies'
  ).first<{ count: number }>();

  const totalDeals = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM deals WHERE status = "open"'
  ).first<{ count: number }>();

  const totalValue = await c.env.DB.prepare(
    'SELECT SUM(value) as total FROM deals WHERE status = "open"'
  ).first<{ total: number }>();

  // Won deals
  const wonDeals = await c.env.DB.prepare(
    'SELECT COUNT(*) as count, SUM(value) as total FROM deals WHERE status = "won"'
  ).first<{ count: number; total: number }>();

  // Deals by stage
  const dealsByStage = await c.env.DB.prepare(`
    SELECT ps.name as stage, ps.color, COUNT(d.id) as count, COALESCE(SUM(d.value), 0) as value
    FROM pipeline_stages ps
    LEFT JOIN deals d ON ps.id = d.stage_id AND d.status = 'open'
    GROUP BY ps.id, ps.name, ps.color
    ORDER BY ps.position
  `).all();

  // Activities stats
  const pendingActivities = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM activities WHERE status = "pending"'
  ).first<{ count: number }>();

  const overdueActivities = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM activities WHERE status = "pending" AND due_date < datetime("now")'
  ).first<{ count: number }>();

  // Recent activities
  const recentActivities = await c.env.DB.prepare(`
    SELECT a.*,
      l.name as lead_name,
      c.first_name as contact_first_name, c.last_name as contact_last_name,
      d.name as deal_name
    FROM activities a
    LEFT JOIN leads l ON a.lead_id = l.id
    LEFT JOIN contacts c ON a.contact_id = c.id
    LEFT JOIN deals d ON a.deal_id = d.id
    ORDER BY a.created_at DESC
    LIMIT 10
  `).all();

  // Leads by status
  const leadsByStatus = await c.env.DB.prepare(`
    SELECT status, COUNT(*) as count
    FROM leads
    GROUP BY status
  `).all();

  // Upcoming activities
  const upcomingActivities = await c.env.DB.prepare(`
    SELECT a.*,
      l.name as lead_name,
      c.first_name as contact_first_name, c.last_name as contact_last_name,
      d.name as deal_name
    FROM activities a
    LEFT JOIN leads l ON a.lead_id = l.id
    LEFT JOIN contacts c ON a.contact_id = c.id
    LEFT JOIN deals d ON a.deal_id = d.id
    WHERE a.status = 'pending' AND a.due_date >= datetime('now')
    ORDER BY a.due_date ASC
    LIMIT 5
  `).all();

  return c.json({
    totalLeads: totalLeads?.count || 0,
    totalContacts: totalContacts?.count || 0,
    totalCompanies: totalCompanies?.count || 0,
    totalDeals: totalDeals?.count || 0,
    totalValue: totalValue?.total || 0,
    wonDeals: wonDeals?.count || 0,
    wonValue: wonDeals?.total || 0,
    pendingActivities: pendingActivities?.count || 0,
    overdueActivities: overdueActivities?.count || 0,
    dealsByStage: dealsByStage.results,
    leadsByStatus: leadsByStatus.results,
    recentActivities: recentActivities.results,
    upcomingActivities: upcomingActivities.results,
  });
});

// Get sales metrics
dashboardRoutes.get('/metrics', async (c) => {
  const url = new URL(c.req.url);
  const period = url.searchParams.get('period') || '30'; // days

  // Deals closed in period
  const closedDeals = await c.env.DB.prepare(`
    SELECT 
      COUNT(CASE WHEN status = 'won' THEN 1 END) as won_count,
      COUNT(CASE WHEN status = 'lost' THEN 1 END) as lost_count,
      SUM(CASE WHEN status = 'won' THEN value ELSE 0 END) as won_value,
      SUM(CASE WHEN status = 'lost' THEN value ELSE 0 END) as lost_value
    FROM deals
    WHERE actual_close_date >= date('now', '-${period} days')
  `).first();

  // Conversion rate
  const totalClosed = (closedDeals as any)?.won_count + (closedDeals as any)?.lost_count || 0;
  const conversionRate = totalClosed > 0 
    ? ((closedDeals as any)?.won_count / totalClosed * 100).toFixed(1) 
    : 0;

  // Average deal value
  const avgDealValue = await c.env.DB.prepare(
    'SELECT AVG(value) as avg FROM deals WHERE status = "won"'
  ).first<{ avg: number }>();

  // Sales velocity (average days to close)
  const avgDaysToClose = await c.env.DB.prepare(`
    SELECT AVG(julianday(actual_close_date) - julianday(created_at)) as avg_days
    FROM deals
    WHERE status = 'won' AND actual_close_date IS NOT NULL
  `).first<{ avg_days: number }>();

  return c.json({
    period: parseInt(period),
    closedDeals: {
      won: (closedDeals as any)?.won_count || 0,
      lost: (closedDeals as any)?.lost_count || 0,
      wonValue: (closedDeals as any)?.won_value || 0,
      lostValue: (closedDeals as any)?.lost_value || 0,
    },
    conversionRate: parseFloat(conversionRate as string),
    avgDealValue: avgDealValue?.avg || 0,
    avgDaysToClose: Math.round(avgDaysToClose?.avg_days || 0),
  });
});
