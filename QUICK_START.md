# 🚀 Quick Start Guide

Get the Client Facing Server running in 5 minutes!

## Prerequisites

- Docker & Docker Compose installed

OR

- Node.js 20+
- PostgreSQL 14+

## Method 1: Docker (Easiest) ⭐

### Step 1: Clone & Navigate

```bash
git clone <your-repo-url>
cd stageDiverCFS
```

### Step 2: Start Everything

```bash
docker-compose up -d
```

That's it! The API is now running at `http://localhost:4000`

### Step 3: Verify

```bash
# Check health
curl http://localhost:4000/health

# Login
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cfs.local","password":"admin123"}'
```

## Method 2: Local Development

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Setup Database

```bash
# Create PostgreSQL database
createdb client_facing_server

# Or using psql
psql -U postgres -c "CREATE DATABASE client_facing_server;"
```

### Step 3: Configure Environment

```bash
cp env.example .env
```

Edit `.env`:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/client_facing_server?schema=public
JWT_SECRET=your-secret-key-change-in-production
```

### Step 4: Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed data
npm run seed
```

### Step 5: Start Server

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

Server runs at `http://localhost:4000`

## 🔑 Default Login

```
Email: admin@cfs.local
Password: admin123
```

## 🧪 Test the API

### 1. Login

```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cfs.local",
    "password": "admin123"
  }'
```

Save the returned token!

### 2. Get Your Profile

```bash
curl http://localhost:4000/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Create a Project

```bash
curl -X POST http://localhost:4000/projects \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"name": "My First Project"}'
```

### 4. Create a Rider

```bash
curl -X POST http://localhost:4000/riders \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Rider",
    "description": "My first rider",
    "data": "{\"key\": \"value\"}"
  }'
```

### 5. Add a Comment

```bash
curl -X POST http://localhost:4000/riders/1/comments \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Great work!",
    "title": "Feedback"
  }'
```

## 📊 View Database (Optional)

```bash
npx prisma studio
```

Opens GUI at `http://localhost:5555`

## 🔄 Reset Database

```bash
# Docker
docker-compose down -v
docker-compose up -d

# Local
npx prisma db push --force-reset
npm run seed
```

## 🐛 Troubleshooting

### Port Already in Use

Change port in `.env`:
```env
PORT=4001
```

### Database Connection Error

Check your DATABASE_URL in `.env` matches your PostgreSQL setup.

### Stripe Integration

For testing Stripe (optional):
1. Get test keys from Stripe Dashboard
2. Add to `.env`:
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
3. Use Stripe CLI for webhooks:
   ```bash
   stripe listen --forward-to localhost:4000/webhook/stripe
   ```

## ✅ Next Steps

- Import Postman collection (`CFS_API.postman_collection.json`)
- Read full API documentation
- Configure Stripe for subscriptions
- Set up BDS sync if using Business Data Server

## 📚 Additional Resources

- Full API Endpoints: See README.md
- Permission System: See PERMISSIONS_GUIDE.md
- Stripe Setup: See STRIPE_INTEGRATION.md
- Testing: See TESTING_GUIDE.md

---

**You're all set!** 🎉

Start building with the CFS API!

