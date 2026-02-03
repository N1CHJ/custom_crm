import { Hono } from 'hono';
import type { Env, Activity } from '../types';
import { generateId, parseQueryParams, buildPaginatedResponse, getCurrentTimestamp } from '../utils/helpers';

export const activitiesRoutes = new Hono<{ Bindings: Env }>();

// Get all activities with filters
activitiesRoutes.get('/', async (c) => {
  const url = new URL(c.req.url);
  const { page, limit, sortOrder, offset } = parseQueryParams(url);
  const type = url.searchParams.get('type');
  const status = url.searchParams.get('status');
  const userId = url.searchParams.get('userId');
  const leadId = url.searchParams.get('leadId');
  const contactId = url.searchParams.get('contactId');
  const dealId = url.searchParams.get('dealId');
  const upcoming = url.searchParams.get('upcoming');
  const overdue = url.searchParams.get('overdue');

  let whereClause = '1=1';
  const params: any[] = [];

  if (type) {
    whereClause += ' AND a.type = ?';
    params.push(type);
  }

  if (status) {
    whereClause += ' AND a.status = ?';
    params.push(status);
  }

  if (userId) {
    whereClause += ' AND a.user_id = ?';
    params.push(userId);
  }

  if (leadId) {
    whereClause += ' AND a.lead_id = ?';
    params.push(leadId);
  }

  if (contactId) {
    whereClause += ' AND a.contact_id = ?';
    params.push(contactId);
  }

  if (dealId) {
    whereClause += ' AND a.deal_id = ?';
    params.push(dealId);
  }

  if (upcoming === 'true') {
    whereClause += ' AND a.status = "pending" AND a.due_date >= datetime("now")';
  }

  if (overdue === 'true') {
    whereClause += ' AND a.status = "pending" AND a.due_date < datetime("now")';
  }

  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM activities a WHERE ${whereClause}`
  ).bind(...params).first<{ total: number }>();

  const activities = await c.env.DB.prepare(`
    SELECT a.*,
      l.name as lead_name,
      c.first_name as contact_first_name, c.last_name as contact_last_name,
      d.name as deal_name,
      u.name as user_name
    FROM activities a
    LEFT JOIN leads l ON a.lead_id = l.id
    LEFT JOIN contacts c ON a.contact_id = c.id
    LEFT JOIN deals d ON a.deal_id = d.id
    LEFT JOIN users u ON a.user_id = u.id
    WHERE ${whereClause}
    ORDER BY a.due_date ${sortOrder}, a.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(...params, limit, offset).all();

  return c.json(buildPaginatedResponse(activities.results, countResult?.total || 0, page, limit));
});

// Get single activity
activitiesRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');

  const activity = await c.env.DB.prepare(`
    SELECT a.*,
      l.name as lead_name,
      c.first_name as contact_first_name, c.last_name as contact_last_name,
      d.name as deal_name,
      u.name as user_name
    FROM activities a
    LEFT JOIN leads l ON a.lead_id = l.id
    LEFT JOIN contacts c ON a.contact_id = c.id
    LEFT JOIN deals d ON a.deal_id = d.id
    LEFT JOIN users u ON a.user_id = u.id
    WHERE a.id = ?
  `).bind(id).first();

  if (!activity) {
    return c.json({ error: 'Not Found', message: 'Activity not found' }, 404);
  }

  return c.json(activity);
});

// Create activity
activitiesRoutes.post('/', async (c) => {
  const body = await c.req.json();
  const id = generateId('activity');
  const now = getCurrentTimestamp();

  await c.env.DB.prepare(`
    INSERT INTO activities (id, type, subject, description, status, priority, due_date, duration_minutes, outcome, lead_id, contact_id, deal_id, company_id, user_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    body.type,
    body.subject || null,
    body.description || null,
    body.status || 'pending',
    body.priority || 'medium',
    body.due_date || null,
    body.duration_minutes || null,
    body.outcome || null,
    body.lead_id || null,
    body.contact_id || null,
    body.deal_id || null,
    body.company_id || null,
    body.user_id || null,
    now,
    now
  ).run();

  const activity = await c.env.DB.prepare('SELECT * FROM activities WHERE id = ?').bind(id).first();
  return c.json(activity, 201);
});

// Update activity
activitiesRoutes.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const now = getCurrentTimestamp();

  const existing = await c.env.DB.prepare('SELECT * FROM activities WHERE id = ?').bind(id).first<Activity>();
  if (!existing) {
    return c.json({ error: 'Not Found', message: 'Activity not found' }, 404);
  }

  await c.env.DB.prepare(`
    UPDATE activities SET
      type = ?, subject = ?, description = ?, status = ?, priority = ?,
      due_date = ?, duration_minutes = ?, outcome = ?, updated_at = ?
    WHERE id = ?
  `).bind(
    body.type ?? existing.type,
    body.subject ?? existing.subject,
    body.description ?? existing.description,
    body.status ?? existing.status,
    body.priority ?? existing.priority,
    body.due_date ?? existing.due_date,
    body.duration_minutes ?? existing.duration_minutes,
    body.outcome ?? existing.outcome,
    now,
    id
  ).run();

  const activity = await c.env.DB.prepare('SELECT * FROM activities WHERE id = ?').bind(id).first();
  return c.json(activity);
});

// Mark activity as complete
activitiesRoutes.patch('/:id/complete', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const now = getCurrentTimestamp();

  const existing = await c.env.DB.prepare('SELECT * FROM activities WHERE id = ?').bind(id).first();
  if (!existing) {
    return c.json({ error: 'Not Found', message: 'Activity not found' }, 404);
  }

  await c.env.DB.prepare(`
    UPDATE activities SET status = 'completed', completed_at = ?, outcome = ?, updated_at = ?
    WHERE id = ?
  `).bind(now, body.outcome || null, now, id).run();

  const activity = await c.env.DB.prepare('SELECT * FROM activities WHERE id = ?').bind(id).first();
  return c.json(activity);
});

// Delete activity
activitiesRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');

  const existing = await c.env.DB.prepare('SELECT * FROM activities WHERE id = ?').bind(id).first();
  if (!existing) {
    return c.json({ error: 'Not Found', message: 'Activity not found' }, 404);
  }

  await c.env.DB.prepare('DELETE FROM activities WHERE id = ?').bind(id).run();
  return c.json({ message: 'Activity deleted successfully' });
});
