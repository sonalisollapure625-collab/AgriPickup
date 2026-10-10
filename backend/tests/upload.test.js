import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:5000/api';

describe('AgriPickup Photo Upload and Persistence Pipeline', () => {
  let sellerToken = '';
  let categoryId = '';
  let createdProductId = '';
  let uploadedImageUrl = '';

  it('authenticates a seller to test photo upload', async () => {
    // Register or login a test seller
    const sellerEmail = `test_seller_${Date.now()}@agripickup.example.com`;
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jyotibha Nursery Owner',
        email: sellerEmail,
        password: 'Password123!',
        phone: '9845012345',
        role: 'SELLER',
        businessName: 'Jyotibha Eco Nursery',
        ownerName: 'Jyotibha Patil',
      }),
    });

    const data = await res.json();
    expect(res.status).toBe(201);
    sellerToken = data.token;
    expect(sellerToken).toBeDefined();

    // Get an existing category
    const catRes = await fetch(`${API_BASE}/categories`);
    const catData = await catRes.json();
    expect(catData.categories?.length).toBeGreaterThan(0);
    categoryId = catData.categories[0].id;
  });

  it('uploads a genuine plant photo and saves reference in database', async () => {
    // Read an existing real image from backend uploads
    const sampleImagePath = path.resolve('uploads/plant-1791627523271-530428732.jpeg');
    const imageBuffer = fs.readFileSync(sampleImagePath);

    const formData = new FormData();
    formData.append('name', 'Organic Tomato Sapling');
    formData.append('categoryId', categoryId);
    formData.append('variety', 'Pusa Ruby');
    formData.append('description', 'Healthy disease-free tomato seedlings ready for transplanting.');
    formData.append('price', '25');
    formData.append('stockQuantity', '150');
    formData.append('unit', 'plant');

    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
    formData.append('images', blob, 'test-tomato.jpeg');

    const uploadRes = await fetch(`${API_BASE}/sellers/products`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sellerToken}`,
      },
      body: formData,
    });

    const uploadData = await uploadRes.json();
    expect(uploadRes.status).toBe(201);
    expect(uploadData.success).toBe(true);
    expect(uploadData.product).toBeDefined();
    expect(uploadData.product.images?.length).toBe(1);

    createdProductId = uploadData.product.id;
    uploadedImageUrl = uploadData.product.images[0].url;
    expect(uploadedImageUrl).toMatch(/^\/uploads\/plant-.*\.jpeg$/);

    // Verify file actually exists on server filesystem
    const diskFileName = uploadedImageUrl.replace('/uploads/', '');
    const diskFilePath = path.resolve('uploads', diskFileName);
    expect(fs.existsSync(diskFilePath)).toBe(true);
    expect(fs.statSync(diskFilePath).size).toBeGreaterThan(0);
  });

  it('serves the newly uploaded image via HTTP 200 with image/jpeg header', async () => {
    const imgRes = await fetch(`http://localhost:5000${uploadedImageUrl}`);
    expect(imgRes.status).toBe(200);
    expect(imgRes.headers.get('content-type')).toContain('image/jpeg');
    expect(imgRes.headers.get('cross-origin-resource-policy')).toBe('cross-origin');
  });

  it('serves the uploaded plant image via customer public product API', async () => {
    const pubRes = await fetch(`${API_BASE}/products`);
    const pubData = await pubRes.json();
    expect(pubRes.status).toBe(200);

    const foundProd = pubData.products.find((p) => p.id === createdProductId);
    expect(foundProd).toBeDefined();
    expect(foundProd.images?.length).toBe(1);
    expect(foundProd.images[0].url).toBe(uploadedImageUrl);
  });
});
