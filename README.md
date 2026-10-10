# AgriPickup

> **Tagline:** *Find Nearby. Reserve Easily. Grow Better.*  
> **Brand Promise:** *Fresh Farm Needs, Just a Pickup Away!*

AgriPickup is a full-stack agricultural marketplace platform connecting farmers and gardeners with verified local nurseries and agricultural suppliers across Karnataka. It includes an integrated **Plant Doctor AI** multimodal diagnostic suite.

---

## 🛠️ Technology Stack

- **Frontend:** React 18, Vite, Tailwind CSS, React Router v6, Axios, Lucide React, Leaflet & React Leaflet, Vitest.
- **Backend:** Node.js, Express.js (ES Modules), Prisma ORM, JWT, bcryptjs, Helmet, CORS, Express Rate Limit, Zod, Multer, Supertest.
- **Database:** PostgreSQL via Prisma ORM (prepared schema with 16 entities).
- **Vision AI Engine:** Multimodal Google Gemini Vision API / Plant.id API.

---

## 🚀 Running the Project

### Current Running URLs
Both servers are currently running live:
- **Frontend App:** [http://localhost:5173](http://localhost:5173)
- **Backend API & Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

### Commands to Run Manually

In PowerShell:
```powershell
# Set Node.js path (if not in system PATH)
$env:PATH = "C:\Users\My\.gemini\antigravity-ide\scratch\node-runtime\node-v20.18.0-win-x64;" + $env:PATH

# Start backend
cd C:\Users\My\.gemini\antigravity-ide\scratch\AgriPickup\backend
npm run start
# or for live watch: npm run dev

# Start frontend (in a separate terminal)
cd C:\Users\My\.gemini\antigravity-ide\scratch\AgriPickup\frontend
npm run dev
```

---

## 🗄️ Database & Prisma Setup
1. Configure your PostgreSQL connection in `backend/.env`:
   ```env
   DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/agripickup_db?schema=public"
   ```
2. Generate client and run migrations:
   ```powershell
   cd backend
   npx prisma generate
   npx prisma migrate dev --name init
   npm run prisma:seed
   ```

---

## 🩺 Plant Doctor AI Configuration
To activate live multimodal disease detection, add your API key in `backend/.env`:
```env
PLANT_DOCTOR_AI_PROVIDER="GEMINI"
GEMINI_API_KEY="your-gemini-api-key"
```
If not yet supplied, the system alerts the user that real API configuration is required and will never invent diagnoses.
