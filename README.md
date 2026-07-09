# KepWix Backend

## Setup

```bash
cd backend
cp .env.example .env
npm install
npm start
# OR for dev with auto-reload:
npm run dev
```

## .env file

```
PORT=5000
ADMIN_EMAIL=admin@kepwix.com
ADMIN_PASSWORD=Admin@123
FRONTEND_URL=http://localhost:3000
```

## API Endpoints

### User
- `POST /api/users/sync` — sync Firebase user to backend (called on every login)
- `GET  /api/users/me?uid=xxx` — get user profile
- `PUT  /api/users/me` — update user profile

### Admin (requires `x-admin-token` header)
- `POST /api/admin/login` — admin login, returns token
- `GET  /api/admin/stats` — dashboard stats
- `GET  /api/admin/users` — all users
- `GET  /api/admin/users/search?q=xxx` — search users
- `PUT  /api/admin/users/:uid/status` — ban/unban user
- `DELETE /api/admin/users/:uid` — delete user

## Data Storage
User data is stored in `data/users.json` — no database required.

## Frontend Connection
Add to frontend `.env`:
```
REACT_APP_API_URL=http://localhost:5000
```
