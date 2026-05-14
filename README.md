# Smart Study Planner

Smart Study Planner is a React + Express + MySQL study management app.

## Tech Stack

- Frontend: React, Vite, Tailwind CSS
- Backend: Express, MySQL, JWT Auth
- AI: Groq API with demo fallback when no key is configured

## Local Setup

### 1. Database

Create a MySQL database and import `database.sql`.

```bash
mysql -u root -p smart_study_planner < database.sql
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Required backend env:

```env
JWT_SECRET=change_this_secret
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=smart_study_planner
DB_SSL=false
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173
GROQ_API_KEY=
```

### 3. Frontend

```bash
npm install
cp .env.example .env
npm run dev
```

Frontend env:

```env
VITE_API_URL=http://localhost:5000/api
```

## Deploy Backend on Render

Use the included `render.yaml`, or create a Render Web Service manually:

- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`
- Health Check Path: `/health`

Set these env vars in Render:

```env
NODE_ENV=production
JWT_SECRET=your_secret
FRONTEND_URL=https://your-vercel-app.vercel.app
CORS_ORIGINS=https://your-vercel-app.vercel.app
DATABASE_URL=mysql://user:password@host:3306/database
DB_SSL=true
GROQ_API_KEY=optional_key
```

Render does not provide MySQL by default. Use a hosted MySQL provider such as Railway, Aiven, PlanetScale-compatible MySQL, or any MySQL server that exposes a connection URL.

## Deploy Frontend on Vercel

- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

Set this env var in Vercel:

```env
VITE_API_URL=https://your-render-api.onrender.com/api
```

## Demo Account

If seeded locally:

```txt
Email: demo@smartstudy.com
Password: 123456
```

## Verification

```bash
npm run lint
npm run build
```
