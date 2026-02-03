import { Hono } from 'hono';
import type { Env, PipelineStage } from '../types';
import { generateId, getCurrentTimestamp } from '../utils/helpers';

export const pipelineRoutes = new Hono<{ Bindings: Env }>();

// Get all pipeline stages
pipelineRoutes.get('/stages', async (c) => {
  const stages = await c.env.DB.prepare(
    'SELECT * FROM pipeline_stages ORDER BY position'
  ).all();

  return c.json(stages.results);
});

// Create pipeline stage
pipelineRoutes.post('/stages', async (c) => {
  const body = await c.req.json();
  const id = generateId('stage');
  const now = getCurrentTimestamp();

  // Get next position
  const maxPosition = await c.env.DB.prepare(
    'SELECT MAX(position) as max FROM pipeline_stages'
  ).first<{ max: number }>();

  await c.env.DB.prepare(`
    INSERT INTO pipeline_stages (id, name, position, color, probability, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    body.name,
    (maxPosition?.max || 0) + 1,
    body.color || '#6366f1',
    body.probability || 0,
    now
  ).run();

  const stage = await c.env.DB.prepare('SELECT * FROM pipeline_stages WHERE id = ?').bind(id).first();
  return c.json(stage, 201);
});

// Update pipeline stage
pipelineRoutes.put('/stages/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  const existing = await c.env.DB.prepare('SELECT * FROM pipeline_stages WHERE id = ?').bind(id).first<PipelineStage>();
  if (!existing) {
    return c.json({ error: 'Not Found', message: 'Stage not found' }, 404);
  }

  await c.env.DB.prepare(`
    UPDATE pipeline_stages SET name = ?, color = ?, probability = ?
    WHERE id = ?
  `).bind(
    body.name ?? existing.name,
    body.color ?? existing.color,
    body.probability ?? existing.probability,
    id
  ).run();

  const stage = await c.env.DB.prepare('SELECT * FROM pipeline_stages WHERE id = ?').bind(id).first();
  return c.json(stage);
});

// Reorder pipeline stages
pipelineRoutes.post('/stages/reorder', async (c) => {
  const body = await c.req.json();
  const { stageIds } = body; // Array of stage IDs in new order

  if (!Array.isArray(stageIds)) {
    return c.json({ error: 'Bad Request', message: 'stageIds must be an array' }, 400);
  }

  // Update positions
  for (let i = 0; i < stageIds.length; i++) {
    await c.env.DB.prepare(
      'UPDATE pipeline_stages SET position = ? WHERE id = ?'
    ).bind(i + 1, stageIds[i]).run();
  }

  const stages = await c.env.DB.prepare(
    'SELECT * FROM pipeline_stages ORDER BY position'
  ).all();

  return c.json(stages.results);
});

// Delete pipeline stage
pipelineRoutes.delete('/stages/:id', async (c) => {
  const id = c.req.param('id');

  const existing = await c.env.DB.prepare('SELECT * FROM pipeline_stages WHERE id = ?').bind(id).first();
  if (!existing) {
    return c.json({ error: 'Not Found', message: 'Stage not found' }, 404);
  }

  // Check if there are deals in this stage
  const dealsInStage = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM deals WHERE stage_id = ?'
  ).bind(id).first<{ count: number }>();

  if (dealsInStage && dealsInStage.count > 0) {
    return c.json({ 
      error: 'Bad Request', 
      message: `Cannot delete stage with ${dealsInStage.count} deals. Move or delete deals first.` 
    }, 400);
  }

  await c.env.DB.prepare('DELETE FROM pipeline_stages WHERE id = ?').bind(id).run();
  return c.json({ message: 'Stage deleted successfully' });
});
