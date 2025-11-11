# Client Facing Server (CFS)

A complete subscription-based REST API with Stripe billing integration, project management, collaborative riders, and role-based permissions.

## 🚀 Features

- **User Authentication** - JWT-based auth with bcrypt password hashing
- **Subscription Management** - Multiple tiers with Stripe integration
- **Projects** - Organize riders into projects with permissions
- **Riders** - Structured data objects with subscription-based limits
- **Comments** - Collaborative commenting system
- **Permissions** - Granular project and rider-level access control
- **Activity Logging** - Track user actions
- **Favorites** - Save frequently used items
- **BDS Sync** - Periodic sync with Business Data Server
- **Rate Limiting** - Protection against abuse
- **Dockerized** - Easy deployment with Docker Compose

## 📋 Tech Stack

- **Runtime:** Node.js 20 LTS
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Auth:** JWT + bcrypt
- **Billing:** Stripe
- **Testing:** Jest + Supertest
- **Deployment:** Docker

## 🏃 Quick Start

### Prerequisites

- Docker & Docker Compose installed
- (or) Node.js 20+ and PostgreSQL installed locally

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone <your-repo-url>
cd stageDiverCFS

# Set up environment variables (optional - has defaults)
cp env.example .env

# Start services
docker-compose up -d

# View logs
docker-compose logs -f api
```

API available at: `http://localhost:4000`

### Option 2: Local Development

```bash
# Install dependencies
npm install

# Set up environment
cp env.example .env
# Edit .env with your DATABASE_URL and other settings

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Seed database
npm run seed

# Start development server
npm run dev
```

## 🔑 Default Credentials

After seeding:
- **Email:** `admin@cfs.local`
- **Password:** `admin123`

## 📚 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `GET /auth/me` - Get current user
- `POST /auth/logout` - Logout

### Projects
- `GET /projects` - List projects
- `POST /projects` - Create project
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project
- `POST /projects/:id/permissions` - Add permission
- `PUT /projects/:id/permissions/:pid` - Update permission
- `DELETE /projects/:id/permissions/:pid` - Remove permission

### Riders
- `GET /riders` - List riders (supports ?project_id filter)
- `GET /riders/:id` - Get rider details
- `POST /riders` - Create rider (enforces subscription limits)
- `PUT /riders/:id` - Update rider
- `DELETE /riders/:id` - Delete rider
- `POST /riders/:id/permissions` - Add permission
- `PUT /riders/:id/permissions/:pid` - Update permission
- `DELETE /riders/:id/permissions/:pid` - Remove permission

### Comments
- `GET /riders/:id/comments` - List comments on rider
- `POST /riders/:id/comments` - Add comment
- `PUT /riders/:id/comments/:cid` - Update comment
- `DELETE /riders/:id/comments/:cid` - Delete comment

### Subscriptions
- `GET /subscriptions/types` - List subscription types
- `GET /subscriptions/my-subscription` - Get active subscription
- `POST /subscriptions/checkout` - Create Stripe checkout session
- `GET /subscriptions/transactions` - List transactions
- `GET /subscriptions/transactions/:id` - Get transaction details

### User Activities & Favorites
- `GET /user/activities` - List activity log
- `GET /user/favorites` - List favorites
- `POST /user/favorites` - Add favorite
- `DELETE /user/favorites/:id` - Remove favorite

### BDS Sync
- `POST /sync/refresh` - Manually trigger BDS sync

### Webhooks
- `POST /webhook/stripe` - Stripe webhook endpoint

## 🔐 Subscription Types

| Type | Max Riders | Abilities |
|------|------------|-----------|
| **Free** | 1 | View, Comment |
| **Basic** | 10 | View, Comment, Edit, Projects |
| **Pro** | 50 | All Basic + Export PDF, Collaboration |
| **Enterprise** | Unlimited | All Pro + Priority Support |

## 🔒 Permission System

### Project Permissions
- **read** - View project and riders
- **comment** - Comment on riders
- **edit** - Edit riders and project

### Rider Permissions
- **comment** - Add/view comments
- **edit** - Edit rider data

**Resolution:** Rider permissions override project permissions. Owner always has full access.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm run test:watch
```

## 🐳 Docker Commands

```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f api

# Stop services
docker-compose down

# Stop and remove volumes (fresh start)
docker-compose down -v

# Rebuild without cache
docker-compose build --no-cache
docker-compose up -d
```

## 🔧 Environment Variables

See `env.example` for all available environment variables.

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT signing
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret

**Optional:**
- `PORT` - Server port (default: 4000)
- `BDS_API_URL` - Business Data Server URL
- `BDS_SYNC_ENABLED` - Enable BDS sync (default: false)
- `BDS_SYNC_CRON` - Cron schedule for sync (default: daily)
- `RATE_LIMIT_WINDOW_MS` - Rate limit window (default: 15 min)
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window (default: 100)

## 🚢 Production Deployment

1. **Set secure environment variables:**
   ```bash
   JWT_SECRET=<strong-random-secret>
   STRIPE_SECRET_KEY=<your-live-stripe-key>
   STRIPE_WEBHOOK_SECRET=<your-webhook-secret>
   ```

2. **Configure Stripe webhooks:**
   - Add webhook endpoint: `https://your-domain.com/webhook/stripe`
   - Select events: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`

3. **Deploy:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

4. **Setup reverse proxy** (nginx/caddy) with SSL

5. **Configure monitoring** and health checks (`/health`)

## 📖 Documentation

- `API_EXAMPLES.md` - Detailed API examples
- `STRIPE_INTEGRATION.md` - Stripe setup guide
- `PERMISSIONS_GUIDE.md` - Permission system details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

MIT License - See LICENSE file for details

## 🆘 Support

For issues and questions:
- Open an issue on GitHub
- Check documentation
- Review API examples

---

**Built with ❤️ for collaborative project management**

