import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('AgriPickup Backend Foundations', () => {
  it('GET /api/health should return 200 with service details', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.app).toBe('AgriPickup API');
    expect(res.body.tagline).toBe('Find Nearby. Reserve Easily. Grow Better.');
  });

  it('GET /api/unknown-endpoint should return 404', async () => {
    const res = await request(app).get('/api/non-existent-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
