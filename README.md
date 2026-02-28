# PrintME — Custom Printing E-Commerce Platform

A full-stack printing e-commerce MVP built with **Node.js**, **Express**, **Prisma**, **React**, and **Stripe**.

## 🏗️ Architecture

| Layer | Tech | 
|-------|------|
| **Frontend** | React 18 + Vite + Zustand + Axios |
| **API** | Express.js + Zod validation |
| **Database** | PostgreSQL (prod) / SQLite (dev) via Prisma |
| **Payments** | Stripe (PaymentIntent API) |
| **Auth** | JWT + httpOnly cookie refresh tokens |
| **Queue** | In-memory (dev) / AWS SQS (prod) |

## 🚀 Quick Start (Local Dev)

```bash
# Install all workspaces
cd printme
npm install

# Start API (Terminal 1)
npm run dev:api

# Start Frontend (Terminal 2)  
npm run dev:web
```

API runs on `http://localhost:4000`, Frontend on `http://localhost:5173`.

### Seed Database
```bash
cd api && npm run db:seed
```
Creates admin user (`admin@printme.com` / `Admin1234`) + sample products.

## 📦 API Endpoints (36 total)

| Module | Endpoints |
|--------|-----------|
| Auth | 9 (register, login, refresh, logout, me, change-password, Google OAuth) |
| Catalogue | 12 (products, SKUs, templates — public + admin CRUD) |
| Designs | 5 (CRUD with max-5 limit per user) |
| Orders | 4 (create with idempotency, list, detail, cancel) |
| Payments | 2 (create PaymentIntent, Stripe webhook) |
| Admin | 4 (dashboard, order list, detail, status update) |

## 🌐 Deploy

### API → Render
1. Push to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. **New → Blueprint** → connect this repo
4. Render reads `render.yaml` and sets up API + PostgreSQL automatically

### Frontend → Vercel
1. Go to [Vercel](https://vercel.com)
2. Import this repo
3. Set **Root Directory** to `web`
4. Add env var: `VITE_API_URL` = `https://your-render-api.onrender.com/api`
5. Deploy

## 🔐 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Access token secret |
| `JWT_REFRESH_SECRET` | ✅ | Refresh token secret |
| `STRIPE_SECRET_KEY` | For payments | Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | For payments | Stripe webhook signing secret |
| `CLIENT_URL` | ✅ | Frontend URL (for CORS) |
| `VITE_API_URL` | Frontend | API base URL |

## 📁 Project Structure

```
printme/
├── api/                 # Express API server
│   ├── prisma/          # Schema + seed
│   └── src/
│       ├── config/      # JWT utils
│       ├── lib/         # Prisma, S3, Stripe, Queue
│       ├── middleware/   # Auth, validation, error handling
│       └── modules/     # auth, catalogue, designs, orders, payments, admin
├── worker/              # Background job processor
│   └── src/handlers/    # Render, notifications
├── web/                 # React SPA (Vite)
│   └── src/
│       ├── components/  # Navbar
│       ├── lib/         # API client
│       ├── pages/       # 7 page components
│       └── stores/      # Zustand (auth, cart)
├── render.yaml          # Render deploy config
└── vercel.json          # Vercel deploy config
```
