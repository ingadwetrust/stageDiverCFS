# 📮 Postman Testing Guide - Client Facing Server

## Quick Start

### 1. Import Collection

1. Open Postman
2. Click **Import** button (top left)
3. Select `Client_Facing_Server.postman_collection.json`
4. Collection will appear in your workspace

### 2. Collection Variables

The collection includes these pre-configured variables:

| Variable | Value | Auto-saved |
|----------|-------|------------|
| `baseUrl` | `http://localhost:4000` | No |
| `authToken` | (empty) | ✅ Yes (on login/register) |
| `userId` | (empty) | ✅ Yes (on login/register) |
| `projectId` | (empty) | ✅ Yes (on project create) |
| `riderId` | (empty) | ✅ Yes (on rider create) |
| `commentId` | (empty) | ✅ Yes (on comment create) |
| `favoriteId` | (empty) | ✅ Yes (on favorite create) |
| `projectPermissionId` | (empty) | ✅ Yes (on permission create) |
| `riderPermissionId` | (empty) | ✅ Yes (on permission create) |

## 🚀 Testing Workflow

### Step 1: Login

1. Open **Authentication → Login**
2. Default credentials are pre-filled:
   ```json
   {
     "email": "admin@cfs.local",
     "password": "admin123"
   }
   ```
3. Click **Send**
4. Token automatically saved to `{{authToken}}`
5. All authenticated requests now work!

### Step 2: Check Subscription

1. **Subscriptions → Get My Subscription**
2. See your current plan (default: Pro with 50 riders)

### Step 3: Create Project

1. **Projects → Create Project**
2. Project ID automatically saved
3. Use for organizing riders

### Step 4: Create Rider

1. **Riders → Create Rider**
2. Note: Subscription limits enforced!
3. Rider ID automatically saved

### Step 5: Add Comment

1. **Comments → Add Comment**
2. Collaborate on riders
3. Comment ID automatically saved

## 📁 Collection Structure

```
Client Facing Server API
├── Authentication (4)
│   ├── Register (auto-saves token)
│   ├── Login (auto-saves token)
│   ├── Get My Profile
│   └── Logout
├── Projects (8)
│   ├── List My Projects
│   ├── Get Project by ID
│   ├── Create Project (auto-saves ID)
│   ├── Update Project
│   ├── Delete Project
│   ├── Add Project Permission (auto-saves ID)
│   ├── Update Project Permission
│   └── Delete Project Permission
├── Riders (9)
│   ├── List All Riders
│   ├── List Riders by Project
│   ├── Get Rider by ID
│   ├── Create Rider (auto-saves ID, checks limits)
│   ├── Update Rider
│   ├── Delete Rider
│   ├── Add Rider Permission (auto-saves ID)
│   ├── Update Rider Permission
│   └── Delete Rider Permission
├── Comments (4)
│   ├── List Comments on Rider
│   ├── Add Comment (auto-saves ID)
│   ├── Update Comment
│   └── Delete Comment
├── Subscriptions (5)
│   ├── List Subscription Types (public)
│   ├── Get My Subscription
│   ├── Create Checkout Session (Stripe)
│   ├── List My Transactions
│   └── Get Transaction by ID
├── User Activities & Favorites (4)
│   ├── Get My Activity Log
│   ├── List My Favorites
│   ├── Add Favorite (auto-saves ID)
│   └── Delete Favorite
├── BDS Sync (1)
│   └── Manual Refresh
└── System (2)
    ├── Health Check (public)
    └── API Info (public)
```

**Total: 37 Requests**

## 🎯 Common Workflows

### Complete User Journey

1. **Register** → Saves token
2. **Get My Profile** → See subscription (Free by default)
3. **Create Project** → Organize work
4. **Create Rider** → Add content (limit: 1 for Free)
5. **Add Comment** → Collaborate
6. **Get Activity Log** → See history

### Collaboration Flow

1. **Create Project**
2. **Add Project Permission** → `collaborator@example.com` with `comment`
3. **Create Rider** in project
4. Collaborator can now comment!

### Subscription Upgrade

1. **List Subscription Types** → See available plans
2. **Create Checkout Session** → Get Stripe URL
3. Complete payment (use Stripe test cards)
4. **Get My Subscription** → Verify upgrade
5. **List Transactions** → See payment history

### Permission Testing

**Project-level:**
1. Create project
2. Add permission: `read` / `comment` / `edit`
3. Create riders in project
4. Permissions inherited by riders

**Rider-level:**
1. Create rider
2. Add specific permission: `comment` / `edit`
3. Overrides project permission

## 🔐 Permission Levels

### Project Permissions
- **read** - View project and riders
- **comment** - Add comments to riders
- **edit** - Full edit access to riders

### Rider Permissions
- **comment** - Add/view comments
- **edit** - Edit rider data

**Resolution:**
- Owner always has full access
- Rider permission overrides project permission
- Project permission is fallback

## 💳 Testing Subscriptions

### Stripe Test Cards

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Auth Required: 4000 0027 6000 3184
```

### Subscription Limits

| Plan | Max Riders |
|------|------------|
| Free | 1 |
| Basic | 10 |
| Pro | 50 |
| Enterprise | Unlimited |

Test limit enforcement:
1. Login as Free user
2. Try creating 2nd rider
3. Should get: `RIDER_LIMIT_EXCEEDED`

## 🧪 Example Requests

### Register New User

```json
POST /auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "contactPhone": "+1234567890"
}
```

### Create Project

```json
POST /projects
{
  "name": "Website Redesign"
}
```

### Create Rider with Data

```json
POST /riders
{
  "name": "Homepage Layout",
  "description": "New homepage design concept",
  "data": "{\"layout\": \"grid\", \"colors\": [\"#FF0000\", \"#00FF00\"]}",
  "projectId": 1
}
```

### Add Comment with Position

```json
POST /riders/1/comments
{
  "title": "Layout Feedback",
  "content": "Consider making this section wider",
  "status": "open",
  "positionXY": "250,430"
}
```

### Share Project

```json
POST /projects/1/permissions
{
  "email": "designer@example.com",
  "permission": "edit"
}
```

### Add Favorite

```json
POST /user/favorites
{
  "name": "Important Rider",
  "data": "{\"riderId\": 5, \"type\": \"rider\", \"projectId\": 1}"
}
```

## 📊 Environment Setup (Optional)

Create environments for different stages:

**Development:**
```
baseUrl: http://localhost:4000
```

**Staging:**
```
baseUrl: https://staging-api.yourcompany.com
```

**Production:**
```
baseUrl: https://api.yourcompany.com
```

## 🎨 Response Examples

### Success Response

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "My Project",
    "userId": 1,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "RIDER_LIMIT_EXCEEDED",
    "message": "Rider limit exceeded. Your plan allows 1 rider(s)."
  }
}
```

## 🔄 Auto-Save Features

The collection automatically saves IDs for chained requests:

```javascript
// After login
pm.environment.set('authToken', response.data.token);

// After creating project
pm.environment.set('projectId', response.data.id);

// After creating rider
pm.environment.set('riderId', response.data.id);
```

Use saved variables:
- Update Project: `PUT /projects/{{projectId}}`
- Get Rider: `GET /riders/{{riderId}}`
- Add Comment: `POST /riders/{{riderId}}/comments`

## 🚨 Common Issues

### 401 Unauthorized

**Problem:** Token expired or missing

**Solution:**
1. Run **Authentication → Login** again
2. Check `{{authToken}}` is set
3. Verify Authorization header shows `Bearer {{authToken}}`

### 403 Forbidden

**Problem:** Insufficient permissions

**Solution:**
- Check subscription plan
- Verify owner or have permission
- Rider limits may be exceeded

### 404 Not Found

**Problem:** Resource doesn't exist

**Solution:**
- List resources first to get valid IDs
- Check `{{projectId}}` and `{{riderId}}` are set
- Verify you own the resource

### 400 Bad Request

**Problem:** Invalid data

**Solution:**
- Check JSON syntax
- Verify required fields
- Email format valid
- Permission values correct

## 🎯 Testing Checklist

### Authentication ✅
- [ ] Register new user
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (expect error)
- [ ] Get profile
- [ ] Logout

### Projects ✅
- [ ] Create project
- [ ] List projects
- [ ] Get project by ID
- [ ] Update project
- [ ] Delete project
- [ ] Add permission
- [ ] Update permission
- [ ] Delete permission

### Riders ✅
- [ ] Create rider
- [ ] List all riders
- [ ] Filter by project
- [ ] Get rider details
- [ ] Update rider
- [ ] Delete rider
- [ ] Test subscription limit
- [ ] Add rider permission
- [ ] Update rider permission
- [ ] Delete rider permission

### Comments ✅
- [ ] List comments
- [ ] Add comment
- [ ] Update comment
- [ ] Delete comment
- [ ] Test permission checks

### Subscriptions ✅
- [ ] List subscription types
- [ ] Get active subscription
- [ ] Create checkout session
- [ ] List transactions
- [ ] Get transaction details

### Activities ✅
- [ ] Get activity log
- [ ] List favorites
- [ ] Add favorite
- [ ] Delete favorite

## 📖 Additional Resources

- **README.md** - Full API documentation
- **QUICK_START.md** - Setup guide
- **PERMISSIONS_GUIDE.md** - Permission system details

---

**Happy Testing!** 🚀

Your Client Facing Server API is ready to use with Postman!

