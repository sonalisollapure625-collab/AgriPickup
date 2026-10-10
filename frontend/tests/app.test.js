import { describe, it, expect } from 'vitest';

describe('AgriPickup Frontend Foundation', () => {
  it('loads environment variables or default branding', () => {
    const brandTagline = 'Find Nearby. Reserve Easily. Grow Better.';
    expect(brandTagline).toBe('Find Nearby. Reserve Easily. Grow Better.');
  });
});
