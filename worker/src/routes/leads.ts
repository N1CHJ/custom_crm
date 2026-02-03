import { Hono } from 'hono';
import type { Env, Lead } from '../types';
import { generateId, parseQueryParams, buildPaginatedResponse, getCurrentTimestamp } from '../utils/helpers';

export const leadsRoutes = new Hono<{ Bindings: Env }>();

// Get all leads with pagination and filtering
leadsRoutes.get('/', async (c) => {
  const url = new URL(c.req.url);
  const { page, limit, search, sortBy, sortOrder, offset } = parseQueryParams(url);
  const status = url.searchParams.get('status');
  const source = url.searchParams.get('source');
  const assignedTo = url.searchParams.get('assignedTo');

  let whereClause = '1=1';
  const params: any[] = [];

  if (search) {
    whereClause += ' AND (name LIKE ? OR email LIKE ? OR company_name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (status) {
    whereClause += ' AND status = ?';
    params.push(status);
  }

  if (source) {
    whereClause += ' AND source = ?';
    params.push(source);
  }

  if (assignedTo) {
    whereClause += ' AND assigned_to = ?';
    params.push(assignedTo);
  }

  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM leads WHERE ${whereClause}`
  ).bind(...params).first<{ total: number }>();

  const leads = await c.env.DB.prepare(
    `SELECT * FROM leads WHERE ${whereClause} ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all<Lead>();

  return c.json(buildPaginatedResponse(leads.results, countResult?.total || 0, page, limit));
});

// Get single lead
leadsRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  
  const lead = await c.env.DB.prepare(
    'SELECT * FROM leads WHERE id = ?'
  ).bind(id).first<Lead>();

  if (!lead) {
    return c.json({ error: 'Not Found', message: 'Lead not found' }, 404);
  }

  // Get related activities
  const activities = await c.env.DB.prepare(
    'SELECT * FROM activities WHERE lead_id = ? ORDER BY created_at DESC LIMIT 10'
  ).bind(id).all();

  return c.json({ ...lead, activities: activities.results });
});

// Create lead
leadsRoutes.post('/', async (c) => {
  const body = await c.req.json();
  const id = generateId('lead');
  const now = getCurrentTimestamp();

  const result = await c.env.DB.prepare(`
    INSERT INTO leads (id, name, email, phone, company_name, title, status, source, score, assigned_to, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    body.name,
    body.email || null,
    body.phone || null,
    body.company_name || null,
    body.title || null,
    body.status || 'new',
    body.source || null,
    body.score || 0,
    body.assigned_to || null,
    body.notes || null,
    now,
    now
  ).run();

  if (!result.success) {
    return c.json({ error: 'Failed to create lead' }, 500);
  }

  const lead = await c.env.DB.prepare('SELECT * FROM leads WHERE id = ?').bind(id).first<Lead>();
  return c.json(lead, 201);
});

// Update lead
leadsRoutes.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const now = getCurrentTimestamp();

  const existing = await c.env.DB.prepare('SELECT * FROM leads WHERE id = ?').bind(id).first<Lead>();
  if (!existing) {
    return c.json({ error: 'Not Found', message: 'Lead not found' }, 404);
  }

  await c.env.DB.prepare(`
    UPDATE leads SET
      name = ?, email = ?, phone = ?, company_name = ?, title = ?,
      status = ?, source = ?, score = ?, assigned_to = ?, notes = ?, updated_at = ?
    WHERE id = ?
  `).bind(
    body.name ?? existing.name,
    body.email ?? existing.email,
    body.phone ?? existing.phone,
    body.company_name ?? existing.company_name,
    body.title ?? existing.title,
    body.status ?? existing.status,
    body.source ?? existing.source,
    body.score ?? existing.score,
    body.assigned_to ?? existing.assigned_to,
    body.notes ?? existing.notes,
    now,
    id
  ).run();

  const lead = await c.env.DB.prepare('SELECT * FROM leads WHERE id = ?').bind(id).first<Lead>();
  return c.json(lead);
});

// Delete lead
leadsRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');

  const existing = await c.env.DB.prepare('SELECT * FROM leads WHERE id = ?').bind(id).first();
  if (!existing) {
    return c.json({ error: 'Not Found', message: 'Lead not found' }, 404);
  }

  await c.env.DB.prepare('DELETE FROM leads WHERE id = ?').bind(id).run();
  return c.json({ message: 'Lead deleted successfully' });
});

// Convert lead to contact
leadsRoutes.post('/:id/convert', async (c) => {
  const id = c.req.param('id');
  const now = getCurrentTimestamp();

  const lead = await c.env.DB.prepare('SELECT * FROM leads WHERE id = ?').bind(id).first<Lead>();
  if (!lead) {
    return c.json({ error: 'Not Found', message: 'Lead not found' }, 404);
  }

  if (lead.status === 'converted') {
    return c.json({ error: 'Bad Request', message: 'Lead already converted' }, 400);
  }

  // Create contact from lead
  const contactId = generateId('contact');
  const nameParts = lead.name.split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ') || '';

  await c.env.DB.prepare(`
    INSERT INTO contacts (id, first_name, last_name, email, phone, title, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    contactId,
    firstName,
    lastName,
    lead.email,
    lead.phone,
    lead.title,
    lead.notes,
    now,
    now
  ).run();

  // Update lead status
  await c.env.DB.prepare(`
    UPDATE leads SET status = 'converted', converted_contact_id = ?, converted_at = ?, updated_at = ?
    WHERE id = ?
  `).bind(contactId, now, now, id).run();

  const contact = await c.env.DB.prepare('SELECT * FROM contacts WHERE id = ?').bind(contactId).first();
  return c.json({ message: 'Lead converted successfully', contact });
});
