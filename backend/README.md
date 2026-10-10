# AgriPickup Backend

Node.js, Express.js REST API with Prisma ORM, PostgreSQL database, and integrated Plant Doctor AI.

## Getting Started
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Configure your PostgreSQL credentials in `DATABASE_URL`.
3. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```
4. Run migrations:
   ```bash
   npm run prisma:migrate
   ```
5. Seed database:
   ```bash
   npm run prisma:seed
   ```
6. Start dev server:
   ```bash
   npm run dev
   ```
