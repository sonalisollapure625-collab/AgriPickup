import { describe, it, expect, beforeAll } from 'vitest';

const API_BASE = 'http://localhost:5000/api';

describe('AgriPickup Authentication & Password Reset Flow', () => {
  const testEmail = `testuser_${Date.now()}@agripickup.example.com`;
  const initialPassword = 'OriginalPassword123!';
  const updatedPassword = 'NewSecretPassword456!';
  let resetToken = '';

  // 1. Sign up new user
  it('registers a new user successfully', async () => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Farmer',
        email: testEmail,
        password: initialPassword,
        role: 'CUSTOMER',
      }),
    });

    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.user.email).toBe(testEmail.toLowerCase());
  });

  // 2. Reject duplicate email with informative message
  it('rejects duplicate email registration and indicates user should log in', async () => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Farmer Duplicate',
        email: testEmail,
        password: initialPassword,
        role: 'CUSTOMER',
      }),
    });

    const data = await res.json();
    expect(res.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.code).toBe('EMAIL_ALREADY_REGISTERED');
    expect(data.message).toContain('already registered');
  });

  // 3. Login with correct password
  it('logs in successfully with correct credentials', async () => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: initialPassword,
      }),
    });

    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.token).toBeDefined();
    expect(data.user.role).toBe('CUSTOMER');
  });

  // 4. Reject incorrect password
  it('rejects login with incorrect password', async () => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword!',
      }),
    });

    const data = await res.json();
    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
  });

  // 5. Forgot password request (generic privacy-preserving response)
  it('accepts forgot-password request without revealing existence', async () => {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
      }),
    });

    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('If an account exists');
  });

  // 6. Verify token validation and password reset execution
  it('validates reset token and updates password successfully', async () => {
    // In test environment, fetch hashed token from db to extract test token
    const { prisma } = await import('../src/config/prisma.js');
    const crypto = await import('crypto');

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');

    await prisma.user.update({
      where: { email: testEmail },
      data: {
        resetPasswordToken: hashed,
        resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    // Verify token endpoint
    const verifyRes = await fetch(
      `${API_BASE}/auth/verify-reset-token?token=${rawToken}&email=${encodeURIComponent(testEmail)}`
    );
    const verifyData = await verifyRes.json();
    expect(verifyRes.status).toBe(200);
    expect(verifyData.valid).toBe(true);

    // Reset password endpoint
    const resetRes = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: rawToken,
        email: testEmail,
        password: updatedPassword,
      }),
    });
    const resetData = await resetRes.json();
    expect(resetRes.status).toBe(200);
    expect(resetData.success).toBe(true);

    // 7. Token must be invalidated immediately
    const reusedRes = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: rawToken,
        email: testEmail,
        password: 'AnotherPassword123!',
      }),
    });
    expect(reusedRes.status).toBe(400);

    // 8. New password must work for login
    const loginNewRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: updatedPassword,
      }),
    });
    expect(loginNewRes.status).toBe(200);

    // 9. Old password must no longer work
    const loginOldRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: initialPassword,
      }),
    });
    expect(loginOldRes.status).toBe(401);

    // Cleanup test record
    await prisma.user.deleteMany({ where: { email: testEmail } });
  });
});
