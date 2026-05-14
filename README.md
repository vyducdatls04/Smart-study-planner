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
RESEND_API_KEY=re_xxx
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=Smart Study <youremail@gmail.com>
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
RESEND_API_KEY=re_xxx
RESEND_API_KEY=re_xxx
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=Smart Study <youremail@gmail.com>
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

## Password Reset

Before using forgot password, update the users table:

```sql
ALTER TABLE users
  ADD COLUMN reset_token TEXT DEFAULT NULL,
  ADD COLUMN reset_token_expire BIGINT DEFAULT NULL;
```

For Gmail SMTP, enable 2-Step Verification and create an App Password. Use that app password as `EMAIL_PASS`.

### Email on Render

If Gmail SMTP times out on Render, use Resend instead:

```env
RESEND_API_KEY=re_xxx
EMAIL_FROM=Smart Study <noreply@your-verified-domain.com>
```

`RESEND_API_KEY` is preferred by the backend. Gmail SMTP is only used when `RESEND_API_KEY` is not set.
