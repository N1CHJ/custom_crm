import { Hono } from 'hono';
import type { Env, Company } from '../types';
import { generateId, parseQueryParams, buildPaginatedResponse, getCurrentTimestamp } from '../utils/helpers';

export const companiesRoutes = new Hono<{ Bindings: Env }>();

// Get all companies
companiesRoutes.get('/', async (c) => {
  const url = new URL(c.req.url);
  const { page, limit, search, sortBy, sortOrder, offset } = parseQueryParams(url);
  const industry = url.searchParams.get('industry');
  const size = url.searchParams.get('size');

  let whereClause = '1=1';
  const params: any[] = [];

  if (search) {
    whereClause += ' AND (name LIKE ? OR domain LIKE ? OR city LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (industry) {
    whereClause += ' AND industry = ?';
    params.push(industry);
  }

  if (size) {
    whereClause += ' AND size = ?';
    params.push(size);
  }

  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM companies WHERE ${whereClause}`
  ).bind(...params).first<{ total: number }>();

  const companies = await c.env.DB.prepare(
    `SELECT * FROM companies WHERE ${whereClause} ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all();

  return c.json(buildPaginatedResponse(companies.results, countResult?.total || 0, page, limit));
});

// Get single company with contacts and deals
companiesRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');

  const company = await c.env.DB.prepare('SELECT * FROM companies WHERE id = ?').bind(id).first();

  if (!company) {
    return c.json({ error: 'Not Found', message: 'Company not found' }, 404);
  }

  const contacts = await c.env.DB.prepare(
    'SELECT * FROM contacts WHERE company_id = ? ORDER BY first_name'
  ).bind(id).all();

  const deals = await c.env.DB.prepare(
    'SELECT * FROM deals WHERE company_id = ? ORDER BY created_at DESC'
  ).bind(id).all();

  const activities = await c.env.DB.prepare(
    'SELECT * FROM activities WHERE company_id = ? ORDER BY created_at DESC LIMIT 20'
  ).bind(id).all();

  return c.json({ 
    ...company, 
    contacts: contacts.results, 
    deals: deals.results,
    activities: activities.results
  });
});

// Create company
companiesRoutes.post('/', async (c) => {
  const body = await c.req.json();
  const id = generateId('company');
  const now = getCurrentTimestamp();

  await c.env.DB.prepare(`
    INSERT INTO companies (id, name, domain, industry, size, address, city, state, country, phone, website, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    body.name,
    body.domain || null,
    body.industry || null,
    body.size || null,
    body.address || null,
    body.city || null,
    body.state || null,
    body.country || null,
    body.phone || null,
    body.website || null,
    body.notes || null,
    now,
    now
  ).run();

  const company = await c.env.DB.prepare('SELECT * FROM companies WHERE id = ?').bind(id).first();
  return c.json(company, 201);
});

// Update company
companiesRoutes.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const now = getCurrentTimestamp();

  const existing = await c.env.DB.prepare('SELECT * FROM companies WHERE id = ?').bind(id).first<Company>();
  if (!existing) {
    return c.json({ error: 'Not Found', message: 'Company not found' }, 404);
  }

  await c.env.DB.prepare(`
    UPDATE companies SET
      name = ?, domain = ?, industry = ?, size = ?, address = ?,
      city = ?, state = ?, country = ?, phone = ?, website = ?, notes = ?, updated_at = ?
    WHERE id = ?
  `).bind(
    body.name ?? existing.name,
    body.domain ?? existing.domain,
    body.industry ?? existing.industry,
    body.size ?? existing.size,
    body.address ?? existing.address,
    body.city ?? existing.city,
    body.state ?? existing.state,
    body.country ?? existing.country,
    body.phone ?? existing.phone,
    body.website ?? existing.website,
    body.notes ?? existing.notes,
    now,
    id
  ).run();

  const company = await c.env.DB.prepare('SELECT * FROM companies WHERE id = ?').bind(id).first();
  return c.json(company);
});

// Delete company
companiesRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');

  const existing = await c.env.DB.prepare('SELECT * FROM companies WHERE id = ?').bind(id).first();
  if (!existing) {
    return c.json({ error: 'Not Found', message: 'Company not found' }, 404);
  }

  await c.env.DB.prepare('DELETE FROM companies WHERE id = ?').bind(id).run();
  return c.json({ message: 'Company deleted successfully' });
});
