import { Hono } from 'hono';
import type { Env, Contact } from '../types';
import { generateId, parseQueryParams, buildPaginatedResponse, getCurrentTimestamp } from '../utils/helpers';

export const contactsRoutes = new Hono<{ Bindings: Env }>();

// Get all contacts with pagination
contactsRoutes.get('/', async (c) => {
  const url = new URL(c.req.url);
  const { page, limit, search, sortBy, sortOrder, offset } = parseQueryParams(url);
  const companyId = url.searchParams.get('companyId');

  let whereClause = '1=1';
  const params: any[] = [];

  if (search) {
    whereClause += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (companyId) {
    whereClause += ' AND company_id = ?';
    params.push(companyId);
  }

  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM contacts WHERE ${whereClause}`
  ).bind(...params).first<{ total: number }>();

  const contacts = await c.env.DB.prepare(`
    SELECT c.*, comp.name as company_name
    FROM contacts c
    LEFT JOIN companies comp ON c.company_id = comp.id
    WHERE ${whereClause.replace(/first_name/g, 'c.first_name').replace(/last_name/g, 'c.last_name').replace(/email/g, 'c.email').replace(/company_id/g, 'c.company_id')}
    ORDER BY c.${sortBy} ${sortOrder}
    LIMIT ? OFFSET ?
  `).bind(...params, limit, offset).all();

  return c.json(buildPaginatedResponse(contacts.results, countResult?.total || 0, page, limit));
});

// Get single contact with activities
contactsRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');

  const contact = await c.env.DB.prepare(`
    SELECT c.*, comp.name as company_name
    FROM contacts c
    LEFT JOIN companies comp ON c.company_id = comp.id
    WHERE c.id = ?
  `).bind(id).first();

  if (!contact) {
    return c.json({ error: 'Not Found', message: 'Contact not found' }, 404);
  }

  // Get activities
  const activities = await c.env.DB.prepare(
    'SELECT * FROM activities WHERE contact_id = ? ORDER BY created_at DESC LIMIT 20'
  ).bind(id).all();

  // Get deals
  const deals = await c.env.DB.prepare(
    'SELECT * FROM deals WHERE contact_id = ? ORDER BY created_at DESC'
  ).bind(id).all();

  return c.json({ ...contact, activities: activities.results, deals: deals.results });
});

// Create contact
contactsRoutes.post('/', async (c) => {
  const body = await c.req.json();
  const id = generateId('contact');
  const now = getCurrentTimestamp();

  await c.env.DB.prepare(`
    INSERT INTO contacts (id, first_name, last_name, email, phone, mobile, company_id, title, department, linkedin_url, notes, tags, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    body.first_name,
    body.last_name,
    body.email || null,
    body.phone || null,
    body.mobile || null,
    body.company_id || null,
    body.title || null,
    body.department || null,
    body.linkedin_url || null,
    body.notes || null,
    body.tags ? JSON.stringify(body.tags) : null,
    now,
    now
  ).run();

  const contact = await c.env.DB.prepare('SELECT * FROM contacts WHERE id = ?').bind(id).first();
  return c.json(contact, 201);
});

// Update contact
contactsRoutes.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const now = getCurrentTimestamp();

  const existing = await c.env.DB.prepare('SELECT * FROM contacts WHERE id = ?').bind(id).first<Contact>();
  if (!existing) {
    return c.json({ error: 'Not Found', message: 'Contact not found' }, 404);
  }

  await c.env.DB.prepare(`
    UPDATE contacts SET
      first_name = ?, last_name = ?, email = ?, phone = ?, mobile = ?,
      company_id = ?, title = ?, department = ?, linkedin_url = ?, notes = ?, tags = ?, updated_at = ?
    WHERE id = ?
  `).bind(
    body.first_name ?? existing.first_name,
    body.last_name ?? existing.last_name,
    body.email ?? existing.email,
    body.phone ?? existing.phone,
    body.mobile ?? existing.mobile,
    body.company_id ?? existing.company_id,
    body.title ?? existing.title,
    body.department ?? existing.department,
    body.linkedin_url ?? existing.linkedin_url,
    body.notes ?? existing.notes,
    body.tags ? JSON.stringify(body.tags) : existing.tags,
    now,
    id
  ).run();

  const contact = await c.env.DB.prepare('SELECT * FROM contacts WHERE id = ?').bind(id).first();
  return c.json(contact);
});

// Delete contact
contactsRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');

  const existing = await c.env.DB.prepare('SELECT * FROM contacts WHERE id = ?').bind(id).first();
  if (!existing) {
    return c.json({ error: 'Not Found', message: 'Contact not found' }, 404);
  }

  await c.env.DB.prepare('DELETE FROM contacts WHERE id = ?').bind(id).run();
  return c.json({ message: 'Contact deleted successfully' });
});
