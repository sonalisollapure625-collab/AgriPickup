import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting AgriPickup Database Seeding...');

  // Create Admin
  const adminPassword = await bcrypt.hash('Admin@AgriPickup2026', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@agripickup.com' },
    update: {},
    create: {
      email: 'admin@agripickup.com',
      passwordHash: adminPassword,
      name: 'AgriPickup Super Admin',
      phone: '+91 99000 11223',
      role: 'ADMIN',
    },
  });

  // Create Categories
  const categories = [
    { name: 'Flowering Plants', slug: 'flowering-plants', description: 'Vibrant blooming plants, perennials and fragrant hybrids' },
    { name: 'Fruit Saplings', slug: 'fruit-saplings', description: 'Grafted and hybrid fruit trees, mango, guava, citrus' },
    { name: 'Organic Fertilizers', slug: 'organic-fertilizers', description: 'Vermicompost, neem cake, bone meal, bio-enzymes' },
    { name: 'Bio-Pesticides & Fungicides', slug: 'bio-pesticides', description: 'Cold pressed neem oil, Trichoderma viride, organic protection' },
    { name: 'Seeds & Seedlings', slug: 'seeds-seedlings', description: 'Desi and hybrid vegetable seeds, paddy, millets' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  console.log('✅ AgriPickup Seed Finished Successfully');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
