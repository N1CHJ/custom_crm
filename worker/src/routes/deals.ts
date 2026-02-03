import { Hono } from 'hono';
import type { Env, Deal } from '../types';
import { generateId, parseQueryParams, buildPaginatedResponse, getCurrentTimestamp } from '../utils/helpers';

export const dealsRoutes = new Hono<{ Bindings: Env }>();

// Get all deals (optionally grouped by stage for pipeline view)
dealsRoutes.get('/', async (c) => {
  const url = new URL(c.req.url);
  const { page, limit, search, sortBy, sortOrder, offset } = parseQueryParams(url);
  const stageId = url.searchParams.get('stageId');
  const status = url.searchParams.get('status');
  const assignedTo = url.searchParams.get('assignedTo');
  const view = url.searchParams.get('view'); // 'pipeline' or 'list'

  let whereClause = '1=1';
  const params: any[] = [];

  if (search) {
    whereClause += ' AND (d.name LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ? OR comp.name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (stageId) {
    whereClause += ' AND d.stage_id = ?';
    params.push(stageId);
  }

  if (status) {
    whereClause += ' AND d.status = ?';
    params.push(status);
  }

  if (assignedTo) {
    whereClause += ' AND d.assigned_to = ?';
    params.push(assignedTo);
  }

  if (view === 'pipeline') {
    // Get deals grouped by stage
    const stages = await c.env.DB.prepare(
      'SELECT * FROM pipeline_stages ORDER BY position'
    ).all();

    const deals = await c.env.DB.prepare(`
      SELECT d.*, 
        c.first_name as contact_first_name, c.last_name as contact_last_name,
        comp.name as company_name,
        ps.name as stage_name, ps.color as stage_color
      FROM deals d
      LEFT JOIN contacts c ON d.contact_id = c.id
      LEFT JOIN companies comp ON d.company_id = comp.id
      LEFT JOIN pipeline_stages ps ON d.stage_id = ps.id
      WHERE ${whereClause}
      ORDER BY d.created_at DESC
    `).bind(...params).all();

    // Group deals by stage
    const pipeline = stages.results.map((stage: any) => ({
      ...stage,
      deals: deals.results.filter((deal: any) => deal.stage_id === stage.id),
      totalValue: deals.results
        .filter((deal: any) => deal.stage_id === stage.id)
        .reduce((sum: number, deal: any) => sum + (deal.value || 0), 0)
    }));

    return c.json({ pipeline });
  }

  // List view
  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM deals d
     LEFT JOIN contacts c ON d.contact_id = c.id
     LEFT JOIN companies comp ON d.company_id = comp.id
     WHERE ${whereClause}`
  ).bind(...params).first<{ total: number }>();

  const deals = await c.env.DB.prepare(`
    SELECT d.*, 
      c.first_name as contact_first_name, c.last_name as contact_last_name,
      comp.name as company_name,
      ps.name as stage_name, ps.color as stage_color
    FROM deals d
    LEFT JOIN contacts c ON d.contact_id = c.id
    LEFT JOIN companies comp ON d.company_id = comp.id
    LEFT JOIN pipeline_stages ps ON d.stage_id = ps.id
    WHERE ${whereClause}
    ORDER BY d.${sortBy} ${sortOrder}
    LIMIT ? OFFSET ?
  `).bind(...params, limit, offset).all();

  return c.json(buildPaginatedResponse(deals.results, countResult?.total || 0, page, limit));
});

// Get single deal
dealsRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');

  const deal = await c.env.DB.prepare(`
    SELECT d.*, 
      c.first_name as contact_first_name, c.last_name as contact_last_name, c.email as contact_email,
      comp.name as company_name,
      ps.name as stage_name, ps.color as stage_color
    FROM deals d
    LEFT JOIN contacts c ON d.contact_id = c.id
    LEFT JOIN companies comp ON d.company_id = comp.id
    LEFT JOIN pipeline_stages ps ON d.stage_id = ps.id
    WHERE d.id = ?
  `).bind(id).first();

  if (!deal) {
    return c.json({ error: 'Not Found', message: 'Deal not found' }, 404);
  }

  const activities = await c.env.DB.prepare(
    'SELECT * FROM activities WHERE deal_id = ? ORDER BY created_at DESC'
  ).bind(id).all();

  return c.json({ ...deal, activities: activities.results });
});

// Create deal
dealsRoutes.post('/', async (c) => {
  const body = await c.req.json();
  const id = generateId('deal');
  const now = getCurrentTimestamp();

  await c.env.DB.prepare(`
    INSERT INTO deals (id, name, value, currency, stage_id, probability, expected_close_date, contact_id, company_id, assigned_to, status, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    body.name,
    body.value || 0,
    body.currency || 'USD',
    body.stage_id || 'stage_1',
    body.probability || 0,
    body.expected_close_date || null,
    body.contact_id || null,
    body.company_id || null,
    body.assigned_to || null,
    body.status || 'open',
    body.notes || null,
    now,
    now
  ).run();

  const deal = await c.env.DB.prepare('SELECT * FROM deals WHERE id = ?').bind(id).first();
  return c.json(deal, 201);
});

// Update deal
dealsRoutes.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const now = getCurrentTimestamp();

  const existing = await c.env.DB.prepare('SELECT * FROM deals WHERE id = ?').bind(id).first<Deal>();
  if (!existing) {
    return c.json({ error: 'Not Found', message: 'Deal not found' }, 404);
  }

  await c.env.DB.prepare(`
    UPDATE deals SET
      name = ?, value = ?, currency = ?, stage_id = ?, probability = ?,
      expected_close_date = ?, contact_id = ?, company_id = ?, assigned_to = ?,
      status = ?, loss_reason = ?, notes = ?, updated_at = ?
    WHERE id = ?
  `).bind(
    body.name ?? existing.name,
    body.value ?? existing.value,
    body.currency ?? existing.currency,
    body.stage_id ?? existing.stage_id,
    body.probability ?? existing.probability,
    body.expected_close_date ?? existing.expected_close_date,
    body.contact_id ?? existing.contact_id,
    body.company_id ?? existing.company_id,
    body.assigned_to ?? existing.assigned_to,
    body.status ?? existing.status,
    body.loss_reason ?? existing.loss_reason,
    body.notes ?? existing.notes,
    now,
    id
  ).run();

  const deal = await c.env.DB.prepare('SELECT * FROM deals WHERE id = ?').bind(id).first();
  return c.json(deal);
});

// Move deal to different stage (for drag and drop)
dealsRoutes.patch('/:id/stage', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const now = getCurrentTimestamp();

  const existing = await c.env.DB.prepare('SELECT * FROM deals WHERE id = ?').bind(id).first();
  if (!existing) {
    return c.json({ error: 'Not Found', message: 'Deal not found' }, 404);
  }

  // Get new stage probability
  const stage = await c.env.DB.prepare(
    'SELECT * FROM pipeline_stages WHERE id = ?'
  ).bind(body.stage_id).first<{ probability: number; name: string }>();

  let status = 'open';
  let actualCloseDate = null;

  if (stage?.name === 'Closed Won') {
    status = 'won';
    actualCloseDate = now;
  } else if (stage?.name === 'Closed Lost') {
    status = 'lost';
    actualCloseDate = now;
  }

  await c.env.DB.prepare(`
    UPDATE deals SET stage_id = ?, probability = ?, status = ?, actual_close_date = ?, updated_at = ?
    WHERE id = ?
  `).bind(body.stage_id, stage?.probability || 0, status, actualCloseDate, now, id).run();

  const deal = await c.env.DB.prepare('SELECT * FROM deals WHERE id = ?').bind(id).first();
  return c.json(deal);
});

// Delete deal
dealsRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');

  const existing = await c.env.DB.prepare('SELECT * FROM deals WHERE id = ?').bind(id).first();
  if (!existing) {
    return c.json({ error: 'Not Found', message: 'Deal not found' }, 404);
  }

  await c.env.DB.prepare('DELETE FROM deals WHERE id = ?').bind(id).run();
  return c.json({ message: 'Deal deleted successfully' });
});
